'use client'

import { useState } from 'react'
import { BrandMark } from '@/components/ui/BrandMark'
import { Button } from '@/components/ui/Button'
import { FormField, Input } from '@/components/ui/FormField'
import { PageHead } from '@/components/ui/SectionTitle'
import { TextButton } from '@/components/ui/TextButton'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Email → 6-digit code. No passwords. The auth gate takes it from there. */
export function SignInForm({ onBack }: { onBack: () => void }) {
  const auth = useAuth()
  const toast = useToast()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async () => {
    if (!EMAIL.test(email.trim()) || busy) return
    setBusy(true)
    try {
      await auth.sendCode(email)
      setStep('code')
      setCode('')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'That didn’t send. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const verify = async () => {
    if (code.length !== 6 || busy) return
    setBusy(true)
    try {
      const { needsSetup } = await auth.verifyCode(email, code)
      if (!needsSetup) toast('Welcome back')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'That code didn’t work. Check it, or send a new one.')
      setBusy(false)
    }
  }

  return (
    <section className="flex min-h-dvh flex-col pb-6 pt-5">
      <BrandMark />
      {step === 'email' ? (
        <form
          className="mt-10 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <PageHead className="pb-2" title="Sign in" lead="We’ll email you a 6-digit code. No password needed." />
          <FormField label="Email">
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
            />
          </FormField>
          <Button type="submit" variant="primary" block disabled={!EMAIL.test(email.trim()) || busy}>
            Send code
          </Button>
          <TextButton className="mx-auto" onClick={onBack}>
            Back to the intro
          </TextButton>
        </form>
      ) : (
        <form
          className="mt-10 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            verify()
          }}
        >
          <PageHead className="pb-2" title="Check your email" lead={<>We sent a 6-digit code to <b className="text-ink">{email.trim()}</b>.</>} />
          <FormField label="Code">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              className="p-4 text-center font-display text-[30px] tracking-[.18em]"
              autoFocus
            />
          </FormField>
          <Button type="submit" variant="primary" block disabled={code.length !== 6 || busy}>
            Sign in
          </Button>
          <div className="flex flex-wrap justify-center gap-x-4">
            <TextButton onClick={send} disabled={busy}>
              Send a new code
            </TextButton>
            <TextButton onClick={() => setStep('email')}>Use a different email</TextButton>
          </div>
        </form>
      )}
    </section>
  )
}
