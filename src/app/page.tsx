import { Suspense } from 'react'
import { Floor } from '@/components/floor/Floor'

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center text-[var(--mute)] text-[13px]">
          Connecting to the floor…
        </div>
      }
    >
      <Floor />
    </Suspense>
  )
}
