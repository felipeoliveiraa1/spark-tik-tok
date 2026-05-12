"use client";

type Props = {
  items: string[];
  onSelect?: (item: string) => void;
};

export function SuggestChips({ items, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5 px-4 -mt-1 mb-3.5">
      {items.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onSelect?.(t)}
          className="px-3 py-[7px] rounded-full bg-spark-surface border border-spark-hairline text-[12.5px] font-semibold text-spark-ink hover:border-spark-ink/30 active:scale-95 transition-all"
        >
          {t}
        </button>
      ))}
    </div>
  );
}
