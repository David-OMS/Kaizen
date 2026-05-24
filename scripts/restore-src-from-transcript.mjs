/**
 * Replays ApplyPatch + Write operations from agent transcript onto workspace.
 * Usage: node scripts/restore-src-from-transcript.mjs [transcript.jsonl]
 */
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const transcriptPath =
  process.argv[2] ||
  path.resolve(
    process.env.USERPROFILE || '',
    '.cursor/projects/c-Users-user-Desktop-OMS-Solo-levelling/agent-transcripts/e669bf48-ab71-4e88-8fc9-04e42346bce3/e669bf48-ab71-4e88-8fc9-04e42346bce3.jsonl',
  )

const files = new Map()

function relPath(absPath) {
  const normalized = absPath.replace(/\//g, '\\')
  const root = ROOT.replace(/\//g, '\\').toLowerCase()
  const lower = normalized.toLowerCase()
  if (lower.startsWith(root)) {
    return normalized.slice(ROOT.length + 1).replace(/\\/g, '/')
  }
  const idx = lower.indexOf('oms solo levelling\\')
  if (idx >= 0) {
    return normalized.slice(idx + 'oms solo levelling\\'.length).replace(/\\/g, '/')
  }
  return normalized.replace(/\\/g, '/')
}

function parseAddContent(lines) {
  return lines
    .filter((l) => l.startsWith('+'))
    .map((l) => l.slice(1))
    .join('\n')
}

function applyHunk(content, hunkLines) {
  const original = content.split('\n')
  const oldLines = []
  const newLines = []

  for (const line of hunkLines) {
    if (!line.length) continue
    const tag = line[0]
    const body = line.slice(1)
    if (tag === ' ') {
      oldLines.push(body)
      newLines.push(body)
    } else if (tag === '-') {
      oldLines.push(body)
    } else if (tag === '+') {
      newLines.push(body)
    }
  }

  const oldBlock = oldLines.join('\n')
  const full = original.join('\n')

  if (oldLines.length === 0) {
    return newLines.join('\n')
  }

  const idx = full.indexOf(oldBlock)
  if (idx === -1) {
    throw new Error(`Hunk not found in file (${oldLines[0]?.slice(0, 40) ?? 'empty'}…)`)
  }

  return full.slice(0, idx) + newLines.join('\n') + full.slice(idx + oldBlock.length)
}

function applyUpdate(patchBody) {
  const fileMatch = patchBody.match(/^\*\*\* Update File: (.+)$/m)
  if (!fileMatch) return null
  const fileKey = relPath(fileMatch[1].trim())
  let content = files.get(fileKey) ?? ''

  const lines = patchBody.split('\n').slice(1)
  let hunk = []
  let inHunk = false

  for (const line of lines) {
    if (line.startsWith('@@')) {
      if (inHunk && hunk.length) {
        content = applyHunk(content, hunk)
        hunk = []
      }
      inHunk = true
      continue
    }
    if (line === '*** End Patch') break
    if (!inHunk) continue
    if (line.startsWith('***')) break
    hunk.push(line)
  }
  if (hunk.length) content = applyHunk(content, hunk)
  files.set(fileKey, content)
  return fileKey
}

function applyPatch(patchText) {
  if (!patchText.includes('*** Begin Patch')) return []

  const touched = []
  const blocks = patchText.split('*** Begin Patch').slice(1)

  for (const block of blocks) {
    const body = block.split('*** End Patch')[0]
    if (body.includes('*** Add File:')) {
      const m = body.match(/^\*\*\* Add File: (.+)$/m)
      if (!m) continue
      const fileKey = relPath(m[1].trim())
      const content = parseAddContent(body.split('\n').slice(1))
      files.set(fileKey, content)
      touched.push(fileKey)
    } else if (body.includes('*** Update File:')) {
      const key = applyUpdate(body)
      if (key) touched.push(key)
    } else if (body.includes('*** Delete File:')) {
      const m = body.match(/^\*\*\* Delete File: (.+)$/m)
      if (m) {
        const fileKey = relPath(m[1].trim())
        files.delete(fileKey)
        touched.push(fileKey)
      }
    }
  }
  return touched
}

function applyWrite(filePath, contents) {
  const fileKey = relPath(filePath)
  files.set(fileKey, contents)
  return fileKey
}

function extractToolOps(obj) {
  const ops = []
  const content = obj?.message?.content
  if (!Array.isArray(content)) return ops

  for (const item of content) {
    if (item.type === 'tool_use' && item.name === 'ApplyPatch' && item.input) {
      ops.push({ type: 'patch', input: item.input })
    }
    if (item.type === 'tool_use' && item.name === 'Write' && item.input?.path) {
      ops.push({ type: 'write', path: item.input.path, contents: item.input.contents ?? '' })
    }
  }
  return ops
}

async function main() {
  if (!fs.existsSync(transcriptPath)) {
    console.error('Transcript not found:', transcriptPath)
    process.exit(1)
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(transcriptPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  let patchCount = 0
  let writeCount = 0
  let errors = 0

  for await (const line of rl) {
    if (!line.trim()) continue
    let obj
    try {
      obj = JSON.parse(line)
    } catch {
      continue
    }
    if (obj.role !== 'assistant') continue

    for (const op of extractToolOps(obj)) {
      try {
        if (op.type === 'patch') {
          applyPatch(op.input)
          patchCount++
        } else if (op.type === 'write') {
          applyWrite(op.path, op.contents)
          writeCount++
        }
      } catch (e) {
        errors++
        if (errors <= 20) console.warn('Patch error:', e.message)
      }
    }
  }

  let written = 0
  const srcFiles = [...files.keys()].filter((k) => k.startsWith('src/'))
  const configFiles = [...files.keys()].filter(
    (k) =>
      k === 'vite.config.js' ||
      k === 'jsconfig.json' ||
      k === 'eslint.config.js' ||
      k.startsWith('supabase/functions/'),
  )

  for (const [fileKey, content] of files) {
    if (!fileKey.startsWith('src/') && !configFiles.includes(fileKey)) continue
    if (!fileKey.startsWith('src/') && fileKey !== 'vite.config.js' && fileKey !== 'jsconfig.json') {
      if (!fileKey.startsWith('supabase/functions/')) continue
    }

    const outPath = path.join(ROOT, fileKey.replace(/\//g, path.sep))
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, content, 'utf8')
    written++
  }

  console.log(JSON.stringify({ patchCount, writeCount, errors, written, srcFiles: srcFiles.length }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
