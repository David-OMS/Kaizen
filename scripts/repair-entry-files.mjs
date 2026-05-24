import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const transcriptPath = path.resolve(
  process.env.USERPROFILE || '',
  '.cursor/projects/c-Users-user-Desktop-OMS-Solo-levelling/agent-transcripts/e669bf48-ab71-4e88-8fc9-04e42346bce3/e669bf48-ab71-4e88-8fc9-04e42346bce3.jsonl',
)

const TARGETS = ['src/App.jsx', 'src/main.jsx', 'src/index.css', 'vite.config.js', 'index.html', 'jsconfig.json']

function rel(p) {
  const i = p.toLowerCase().indexOf('oms solo levelling')
  if (i < 0) return null
  return p
    .slice(i + 'oms solo levelling'.length)
    .replace(/^[/\\]+/, '')
    .replace(/\\/g, '/')
}

function parseAdd(lines) {
  return lines
    .filter((l) => l.startsWith('+'))
    .map((l) => l.slice(1))
    .join('\n')
}

function applyHunk(content, hunkLines) {
  const oldLines = []
  const newLines = []
  for (const line of hunkLines) {
    if (!line.length) continue
    const tag = line[0]
    const body = line.slice(1)
    if (tag === ' ') {
      oldLines.push(body)
      newLines.push(body)
    } else if (tag === '-') oldLines.push(body)
    else if (tag === '+') newLines.push(body)
  }
  const oldBlock = oldLines.join('\n')
  if (!oldLines.length) return newLines.join('\n')
  const idx = content.indexOf(oldBlock)
  if (idx === -1) throw new Error(`hunk miss: ${oldBlock.slice(0, 50)}`)
  return content.slice(0, idx) + newLines.join('\n') + content.slice(idx + oldBlock.length)
}

function applyPatchToFile(fileKey, patchText, files) {
  for (const block of patchText.split('*** Begin Patch').slice(1)) {
    const body = block.split('*** End Patch')[0]
    if (body.includes('*** Add File:')) {
      const m = body.match(/^\*\*\* Add File: (.+)$/m)
      if (!m || rel(m[1].trim()) !== fileKey) continue
      files.set(fileKey, parseAdd(body.split('\n').slice(1)))
    } else if (body.includes('*** Update File:')) {
      const m = body.match(/^\*\*\* Update File: (.+)$/m)
      if (!m || rel(m[1].trim()) !== fileKey) continue
      let content = files.get(fileKey) ?? ''
      let hunk = []
      let inHunk = false
      for (const line of body.split('\n').slice(1)) {
        if (line.startsWith('@@')) {
          if (inHunk && hunk.length) content = applyHunk(content, hunk)
          hunk = []
          inHunk = true
          continue
        }
        if (!inHunk || line.startsWith('***')) continue
        hunk.push(line)
      }
      if (hunk.length) content = applyHunk(content, hunk)
      files.set(fileKey, content)
    }
  }
}

async function main() {
  const files = new Map()
  for (const key of TARGETS) {
    const disk = path.join(ROOT, key)
    if (fs.existsSync(disk)) files.set(key, fs.readFileSync(disk, 'utf8'))
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(transcriptPath, { encoding: 'utf8' }),
  })

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line)
      if (obj.role !== 'assistant') continue
      for (const item of obj.message?.content ?? []) {
        if (item.name === 'ApplyPatch' && item.input) {
          for (const key of TARGETS) applyPatchToFile(key, item.input, files)
        }
        if (item.name === 'Write' && item.input?.path) {
          const key = rel(item.input.path)
          if (key && TARGETS.includes(key)) files.set(key, item.input.contents ?? '')
        }
      }
    } catch {
      /* skip */
    }
  }

  for (const key of TARGETS) {
    const content = files.get(key)
    if (!content) {
      console.warn('skip (missing):', key)
      continue
    }
    const out = path.join(ROOT, key)
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, content, 'utf8')
    console.log('wrote', key, content.length)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
