import * as React from "react";

type Props = {
  children: React.ReactNode;
  attachment?: string;
};

export function UserBubble({ children, attachment }: Props) {
  return (
    <div className="flex justify-end px-4 mb-3.5">
      <div className="max-w-[82%]">
        <div className="bg-brand-grad text-white px-4 py-2.5 rounded-[20px] rounded-br-md text-[14.5px] leading-[1.45] tracking-[-0.005em] shadow-[0_8px_22px_-12px_oklch(0.5_0.22_305/0.55)] font-medium">
          {children}
        </div>
        {attachment && (
          <div className="mt-1.5 flex justify-end">
            <div className="flex items-center gap-2 bg-spark-surface-sunken px-2.5 py-1.5 rounded-xl text-[12px] text-spark-ink-70">
              <div
                className="w-7 h-7 rounded-md"
                style={{
                  background:
                    "repeating-linear-gradient(45deg, oklch(0.86 0.008 285) 0 6px, oklch(0.93 0.006 285) 6px 7px)",
                }}
              />
              {attachment}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
