import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useSignIn } from '@/hooks/useSignIn'
import { useSignUp } from '@/hooks/useSignUp'

export function AuthForm() {
  const signIn = useSignIn()
  const signUp = useSignUp()
  const [mode, setMode] = useState('signin')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [localSuccess, setLocalSuccess] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLocalError('')
    setLocalSuccess('')

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.')
        return
      }
      await signUp.mutateAsync({ username, email, password })
      setMode('signin')
      setLocalSuccess('Account created. Sign in with your username and password.')
      return
    }

    await signIn.mutateAsync({ username, password })
  }

  const activeError = localError || signIn.error?.message || signUp.error?.message
  const isPending = signIn.isPending || signUp.isPending

  return (
    <Card className="system-glitch border border-[#1E2530] bg-[#12161D]/90">
      <CardHeader>
        <CardTitle className="text-lg font-black tracking-[0.15em] text-[#7DD3FC] uppercase italic">
          System Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            className={`system-button w-full text-[10px] ${mode === 'signin' ? 'system-button-active' : ''}`}
            onClick={() => setMode('signin')}
          >
            Sign In
          </Button>
          <Button
            type="button"
            className={`system-button w-full text-[10px] ${mode === 'signup' ? 'system-button-active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </Button>
        </div>

        {activeError ? (
          <Alert variant="destructive" className="rounded-sm border border-[#FF4B4B] bg-[#FF4B4B]/8">
            <AlertCircle className="size-4" />
            <AlertTitle>Authentication failed</AlertTitle>
            <AlertDescription>{activeError}</AlertDescription>
          </Alert>
        ) : null}
        {localSuccess ? (
          <Alert className="rounded-sm border border-[#3B82F6] bg-[#3B82F6]/8">
            <AlertTitle>System notice</AlertTitle>
            <AlertDescription>{localSuccess}</AlertDescription>
          </Alert>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="username" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              required
              minLength={3}
              maxLength={24}
              pattern="[-a-zA-Z0-9._]+"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="shadowmonarch"
              className="h-10 rounded-[2px] border-[#1E2530] font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••••"
              className="h-10 rounded-[2px] border-[#1E2530] font-medium"
            />
          </div>

          {mode === 'signup' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@domain.com"
                  className="h-10 rounded-[2px] border-[#1E2530] font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="tracking-[0.1em] text-[#7DD3FC] uppercase">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••••••"
                  className="h-10 rounded-[2px] border-[#1E2530] font-medium"
                />
              </div>
            </div>
          ) : null}

          <Button type="submit" className="system-button w-full" disabled={isPending}>
            {isPending ? 'AUTHORIZING...' : mode === 'signin' ? 'ENTER SYSTEM' : 'CREATE HUNTER ACCOUNT'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}