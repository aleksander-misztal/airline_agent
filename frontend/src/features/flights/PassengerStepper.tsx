type PassengerStepperProps = {
  label: string;
  hint: string;
  value: number;
  canDecrease: boolean;
  canIncrease: boolean;
  onChange: (value: number) => void;
};

const buttonClass =
  "flex size-9 cursor-pointer items-center justify-center rounded-full border border-brand text-brand transition-colors hover:bg-brand hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-300 disabled:hover:bg-transparent disabled:hover:text-neutral-300";

export function PassengerStepper({ label, hint, value, canDecrease, canIncrease, onChange }: PassengerStepperProps) {
  return (
    <div role="group" aria-label={label} className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-neutral-800">{label}</p>
        <p className="text-xs text-brand-gray">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`Mniej: ${label}`} disabled={!canDecrease} onClick={() => onChange(value - 1)} className={buttonClass}>
          <span aria-hidden="true">−</span>
        </button>
        <span aria-live="polite" className="w-5 text-center text-lg">
          {value}
        </span>
        <button type="button" aria-label={`Więcej: ${label}`} disabled={!canIncrease} onClick={() => onChange(value + 1)} className={buttonClass}>
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}
