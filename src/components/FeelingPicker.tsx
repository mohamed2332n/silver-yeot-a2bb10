import { FEELINGS, type Feeling } from "@/types";
import { useLabels, FEELING_EMOJI } from "@/lib/labels";

export function FeelingPicker({
  value,
  onChange,
}: {
  value: Feeling | null;
  onChange: (f: Feeling) => void;
}) {
  const { feeling } = useLabels();
  return (
    <div className="flex flex-wrap gap-1.5">
      {FEELINGS.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onChange(f)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
            value === f
              ? f === "pain"
                ? "border-danger bg-danger/10 text-danger"
                : "border-primary bg-primary/10 text-primary"
              : "border-border bg-bg text-muted hover:bg-surface-2"
          }`}
        >
          <span>{FEELING_EMOJI[f]}</span>
          {feeling(f)}
        </button>
      ))}
    </div>
  );
}
