'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { STATUS_OPTIONS, YES_NO_OPTIONS } from '@/lib/students/types'
import { cn } from '@/lib/utils'

const STATUS_TONE: Record<string, string> = {
  'starting soon': 'bg-chart-3/15 text-chart-3 border-chart-3/30',
  'ready to start': 'bg-accent/15 text-accent border-accent/30',
  'prep call': 'bg-chart-3/15 text-chart-3 border-chart-3/30',
  'set up': 'bg-chart-2/15 text-chart-2 border-chart-2/30',
  active: 'bg-accent/15 text-accent border-accent/30',
  completed: 'bg-muted text-muted-foreground border-border',
  paused: 'bg-warning/15 text-warning border-warning/30',
  dropped: 'bg-destructive/10 text-destructive border-destructive/30',
}

function statusTone(status: string | null) {
  if (!status) return 'bg-secondary text-secondary-foreground border-border'
  return STATUS_TONE[status.trim().toLowerCase()] ?? 'bg-secondary text-secondary-foreground border-border'
}

/**
 * Shared inline cell editor: renders the current value as a compact
 * badge/trigger, opens a real <select> (never free text) on click, saves
 * immediately on change, shows a saving spinner, and reverts to the previous
 * value if the save (usually rejected by RLS) throws.
 */
function useInlineSave(
  value: string | null,
  onSave: (next: string) => Promise<void>,
) {
  const [pending, setPending] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function commit(next: string) {
    if (next === (value ?? '')) return
    setPending(next)
    setSaving(true)
    try {
      await onSave(next)
    } catch {
      // onSave is expected to toast the error; just snap back visually.
      setPending(null)
    } finally {
      setSaving(false)
      setPending(null)
    }
  }

  return { displayValue: pending ?? value ?? '', saving, commit }
}

export function InlineStatusSelect({
  value,
  onSave,
  disabled,
}: {
  value: string | null
  onSave: (next: string) => Promise<void>
  disabled?: boolean
}) {
  const { displayValue, saving, commit } = useInlineSave(value, onSave)

  return (
    <Select value={displayValue} onValueChange={(v) => commit(v as string)} disabled={disabled}>
      <SelectTrigger
        size="sm"
        className={cn(
          'h-6 w-fit gap-1 border px-2 py-0 text-xs font-normal shadow-none [&>svg]:size-3',
          statusTone(displayValue),
        )}
      >
        {saving ? (
          <span className="flex items-center gap-1">
            <Loader2 className="size-3 animate-spin" />
            {displayValue || 'Set status'}
          </span>
        ) : (
          <SelectValue placeholder="Set status">{displayValue || 'Set status'}</SelectValue>
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function InlineYesNoSelect({
  value,
  onSave,
  disabled,
}: {
  value: string | null
  onSave: (next: string) => Promise<void>
  disabled?: boolean
}) {
  const { displayValue, saving, commit } = useInlineSave(value, onSave)
  const normalized = displayValue ? displayValue.toUpperCase() : ''

  return (
    <Select value={normalized} onValueChange={(v) => commit(v as string)} disabled={disabled}>
      <SelectTrigger
        size="sm"
        className="h-6 w-[72px] gap-1 border-none bg-transparent px-1.5 py-0 text-xs shadow-none [&>svg]:size-3"
      >
        {saving ? (
          <Loader2 className="size-3 animate-spin" />
        ) : normalized ? (
          <Badge
            variant="outline"
            className={cn(
              'font-normal',
              normalized === 'YES'
                ? 'bg-accent/15 text-accent border-accent/30'
                : 'bg-muted text-muted-foreground border-border',
            )}
          >
            {normalized}
          </Badge>
        ) : (
          <SelectValue placeholder="—" />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {YES_NO_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
