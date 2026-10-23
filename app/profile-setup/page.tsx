'use client'

import { ProfileForm } from '@/components/you/ProfileForm'
import { BrandMark } from '@/components/ui/BrandMark'
import { useAuth } from '@/lib/auth'

/** First sign-in: a name is all that's required. The auth gate moves on once it's saved. */
export default function ProfileSetupPage() {
  const auth = useAuth()
  return (
    <main className="px-5 pb-12 pt-5">
      <ProfileForm
        header={<BrandMark />}
        title="Make it yours."
        lead="This is what your crew sees next to your check-ins."
        submitLabel="Save and continue"
        onSaved={() => auth.refresh()}
      />
    </main>
  )
}
