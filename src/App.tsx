import { useState } from 'react'
import { MonthLockModal, MonthLockItem, MonthLockMap } from './components/MonthLockModal'

export default function App() {
  const [open, setOpen] = useState(false)

  async function loadYear(year: number): Promise<MonthLockMap> {
    return Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, true])) as MonthLockMap
  }

  async function onSave(items: MonthLockItem[]) {
    console.log('payload ->', items)
  }

  return (
    <div className="flex h-full items-center justify-center">
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
      >
        Abrir modal
      </button>

      {open && (
        <MonthLockModal
          initialYear={new Date().getFullYear()}
          loadYear={loadYear}
          onSave={onSave}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
