interface ChoiceButtonProps {
  label: string
  tone: number
  disabled: boolean
  onSelect: () => void
  isSelected: boolean
}

export function ChoiceButton({ label, tone, disabled, onSelect, isSelected }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      className={`choice-button choice-button--tone-${tone} ${isSelected ? 'choice-button--selected' : ''}`}
      onClick={onSelect}
      disabled={disabled}
    >
      {label}
    </button>
  )
}
