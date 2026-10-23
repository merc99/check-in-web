'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { FormField, Input, Textarea } from '@/components/ui/FormField'
import { PageHead } from '@/components/ui/SectionTitle'
import { Swatches } from '@/components/ui/Swatches'
import { BackLink, TextButton } from '@/components/ui/TextButton'
import { useToast } from '@/components/ui/Toast'
import { AVATAR_COLORS, type BrandColor } from '@/lib/colors'
import { getMe, updateProfile } from '@/lib/data'

const PHOTO_MAX_BYTES = 5 * 1024 * 1024

export default function EditProfilePage() {
  const router = useRouter()
  const toast = useToast()
  const [ready, setReady] = useState(false)
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [color, setColor] = useState<BrandColor>('mint')
  const [photo, setPhoto] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  // Load once into a local draft; nothing saves until "Save changes".
  useEffect(() => {
    getMe().then(({ profile }) => {
      setName(profile.name ?? '')
      setHandle(profile.handle ? `@${profile.handle}` : '')
      setBio(profile.bio ?? '')
      setColor(profile.avatar_color ?? 'mint')
      setPhoto(profile.avatar_url)
      setReady(true)
    })
  }, [])

  const pickPhoto = (file: File | undefined) => {
    if (!file) return
    if (file.size > PHOTO_MAX_BYTES) {
      toast('That photo is over 5 MB. Try a smaller one.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPhoto(String(reader.result))
    reader.readAsDataURL(file)
  }

  const save = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      await updateProfile({ name, handle, bio, avatar_color: color, avatar_url: photo })
      router.push('/you')
      toast('Changes saved')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'That didn’t save. Try again.')
      setSaving(false)
    }
  }

  if (!ready) return <main className="min-h-dvh px-5" />

  return (
    <main className="px-5 pb-12">
      <BackLink href="/you" />
      <PageHead className="pt-4" title="Edit profile" lead="This is what your crew sees next to your check-ins." />

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center gap-5">
          <Avatar name={name} color={color} photoUrl={photo} size="xl" you className="-rotate-[4deg]" />
          <div className="flex flex-col items-start gap-3">
            <Button size="sm" onClick={() => fileInput.current?.click()}>
              Upload photo
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                pickPhoto(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            {photo && (
              <TextButton className="p-0" onClick={() => setPhoto(null)}>
                Remove photo
              </TextButton>
            )}
          </div>
        </div>

        <FormField label="Avatar color" as="group">
          <Swatches colors={AVATAR_COLORS} value={color} onChange={setColor} />
        </FormField>
        <FormField label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="What your crew calls you" />
        </FormField>
        <FormField label="Handle" optional>
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} maxLength={25} placeholder="@handle" autoCapitalize="none" />
        </FormField>
        <FormField label="Bio" optional>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={140} placeholder="One line about you" />
        </FormField>
        <Button variant="primary" block disabled={!name.trim() || saving} onClick={save}>
          Save changes
        </Button>
      </div>
    </main>
  )
}
