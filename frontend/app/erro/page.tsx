import { RefreshCw, Home } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { SButton } from "@/components/atoms/s-button";

function ErrorCore({ desktop = false }: { desktop?: boolean }) {
  return (
    <div className={`flex flex-col flex-1 justify-between px-[22px] ${desktop ? "max-w-[560px] mx-auto py-12" : ""}`}>
      {!desktop && <div className="pt-[60px]" />}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className={desktop ? "text-[80px]" : "text-[64px]"}>😕</div>
        <div className={`mt-[18px] font-extrabold tracking-[-0.02em] ${desktop ? "text-[32px]" : "text-[24px]"}`}>
          Algo deu errado
        </div>
        <div className="mt-2 text-[14px] text-spark-ink-50 max-w-[320px] leading-[1.5]">
          A gente tá de olho no problema. Tenta de novo em alguns segundos.
        </div>
        <div className="mt-[18px] px-3 py-2 rounded-md bg-spark-surface-sunken font-mono text-[11px] text-spark-ink-50">
          err_id · 4f7a-2c
        </div>
      </div>
      <div className={`pb-[30px] flex flex-col gap-2 ${desktop ? "max-w-[400px] mx-auto w-full" : ""}`}>
        <SButton variant="primary" size="lg" full Icon={RefreshCw}>
          Tentar novamente
        </SButton>
        <SButton variant="ghost" full Icon={Home}>
          Voltar pra home
        </SButton>
      </div>
    </div>
  );
}

export default function ErroPage() {
  return <ResponsiveShell mobile={<ErrorCore />} desktop={<ErrorCore desktop />} fullBleed />;
}
