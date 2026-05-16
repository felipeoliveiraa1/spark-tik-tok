import * as React from "react";

type Attachment = { url: string; mime?: string };

type Props = {
  children: React.ReactNode;
  attachments?: Attachment[] | null;
};

export function UserBubble({ children, attachments }: Props) {
  const hasImages = attachments && attachments.length > 0;
  return (
    <div className="flex justify-end px-4 mb-3.5">
      <div className="max-w-[82%] flex flex-col items-end gap-1.5">
        {hasImages && (
          <div className="flex gap-1.5 justify-end flex-wrap">
            {attachments!.map((a, i) => (
              <a
                key={i}
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl overflow-hidden border border-spark-hairline shadow-[0_8px_22px_-12px_oklch(0.5_0.22_305/0.35)] hover:scale-[1.02] transition-transform"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt="anexo"
                  className="w-40 h-40 object-cover bg-spark-surface-sunken"
                />
              </a>
            ))}
          </div>
        )}
        {children && (
          <div className="bg-brand-grad text-white px-4 py-2.5 rounded-[20px] rounded-br-md text-[14.5px] leading-[1.45] tracking-[-0.005em] shadow-[0_8px_22px_-12px_oklch(0.55_0.24_340/0.55)] font-medium">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
