'use client'

import { useRouter } from 'next/navigation'
import { ProfileForm } from '@/components/you/ProfileForm'
import { BackLink } from '@/components/checkin/TextButton'
import { useToast } from '@/components/checkin/Toast'

export default function EditProfilePage() {
  const router = useRouter()
  const toast = useToast()
  return (
    <main className="px-5 pb-12">
      <ProfileForm
        header={<BackLink href="/you" />}
        title="Edit profile"
        lead="This is what your crew sees next to your check-ins."
        submitLabel="Save changes"
        onSaved={() => {
          router.push('/you')
          toast('Changes saved')
        }}
      />
    </main>
  )
}
