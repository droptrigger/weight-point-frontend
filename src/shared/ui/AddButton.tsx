import { Plus } from 'lucide-react'
import { Button } from './Button'

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button onClick={onClick}>
      <Plus className="icon" />
      {label}
    </Button>
  )
}
