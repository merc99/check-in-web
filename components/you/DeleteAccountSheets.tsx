'use client'

import { useState } from 'react'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { Input } from '@/components/ui/FormField'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/lib/auth'
import { deleteAccount } from '@/lib/data'

/** Two steps: what goes away, then type "delete" to confirm. */
export function DeleteAccountSheets({ open, onClose }: { open: boolean; onClose: () => void }) {
  const auth = useAuth()
  const toast = useToast()
  const [step, setStep] = useState<1 | 2>(1)
  const [typed, setTyped] = useState('')

  // Start at step 1 each time it opens.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setStep(1)
      setTyped('')
    }
  }

  const confirm = async () => {
    if (typed.trim().toLowerCase() !== 'delete') {
      toast('Type delete to confirm')
      return
    }
    try {
      await deleteAccount()
      onClose()
      await auth.signOut() // the auth gate takes them to the intro
      toast('Account deleted')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'That didn’t go through. Try again.')
    }
  }

  return (
    <>
      <ConfirmSheet
        open={open && step === 1}
        onClose={onClose}
        title="Delete your account?"
        body="Your check-ins, crews and profile go away. Your crews keep going without you."
        confirmLabel="Continue"
        onConfirm={() => setStep(2)}
      />
      <ConfirmSheet
        open={open && step === 2}
        onClose={onClose}
        title="Last check."
        body={
          <>
            Type <b className="text-ink">delete</b> to confirm. This can’t be undone.
          </>
        }
        confirmLabel="Delete my account"
        onConfirm={confirm}
      >
        <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" aria-label="Type delete to confirm" />
      </ConfirmSheet>
    </>
  )
}
