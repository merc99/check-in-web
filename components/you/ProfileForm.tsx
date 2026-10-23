'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Avatar } from '@/components/checkin/Avatar'
import { Button } from '@/components/checkin/Button'
import { FormField, Input, Textarea } from '@/components/checkin/FormField'
import { PageHead } from '@/components/checkin/SectionTitle'
import { Swatches } from '@/components/checkin/Swatches'
import { TextButton } from '@/components/checkin/TextButton'
import { useToast } from '@/components/checkin/Toast'
import { AVATAR_HUES, type Hue } from '@/lib/colors'
import { getMe, updateProfile } from '@/lib/data'

const PHOTO_MAX_BYTES = 5 * 1024 * 1024

/**
 * Name, handle, bio, avatar color and photo, with a live avatar preview. Loads the
 * current profile into a draft; nothing saves until the button. Used by profile
 * setup (first sign-in) and Edit profile.
 */
export function ProfileForm({
  title, lead, submitLabel, onSaved, header,
}: {
  title: string
  lead: string
  submitLabel: string
  onSaved: () => void
  /** Above the title (e.g. a back link). */
  header?: ReactNode
}) {
  const toast = useToast()
  const [ready, setReady] = useState(false)
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [bio, setBio] = useState('')
  const [color, setColor] = useState<Hue>('leaf')
  const [photo, setPhoto] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getMe().then(({ profile }) => {
      setName(profile.name ?? '')
      setHandle(profile.handle ? `@${profile.handle}` : '')
      setBio(profile.bio ?? '')
      setColor(profile.avatar_color ?? 'leaf')
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
      onSaved()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'That didn’t save. Try again.')
      setSaving(false)
    }
  }

  if (!ready) return <div className="min-h-dvh" />

  return (
    <>
      {header}
      <PageHead className="pt-4" title={title} lead={lead} />

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center gap-5">
          <Avatar name={name} color={color} photoUrl={photo} size="xl" you className="rotate-[-4deg]" />
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
          <Swatches colors={AVATAR_HUES} value={color} onChange={setColor} />
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
          {submitLabel}
        </Button>
      </div>
    </>
  )
}
