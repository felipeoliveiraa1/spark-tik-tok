"use client";

import * as React from "react";
import { X, Share, Plus, Smartphone, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/molecules/dialog-provider";
import { getDeferredPwaPrompt, clearDeferredPwaPrompt } from "@/lib/pwa-prompt";

/**
 * Modal de instalacao PWA — detecta plataforma e mostra instrucoes:
 *  - iOS Safari: passo a passo (Compartilhar → Adicionar a Tela de Inicio)
 *    + embed do video tutorial do YouTube
 *  - Android Chrome: botao que dispara o prompt nativo
 *    (precisa do evento beforeinstallprompt capturado antes)
 *  - Desktop Chrome/Edge: instrucao do icone na barra de URL
 *  - Outros: instrucao generica
 */

type Platform = "ios" | "android" | "desktop" | "other";

const YT_TUTORIAL_ID = "e_yDp2PQ11M";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) || (ua.includes("mac") && "ontouchend" in document);
  if (isIOS) return "ios";
  if (/android/.test(ua)) return "android";
  // Considera desktop se for chrome/edge no PC
  if (/windows|mac|linux/.test(ua) && !/mobile/.test(ua)) return "desktop";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// Tipagem do evento BeforeInstallPrompt
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPwaModal({ onClose }: { onClose: () => void }) {
  const [platform, setPlatform] = React.useState<Platform>("other");
  const [installed, setInstalled] = React.useState(false);
  const [installing, setInstalling] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const toast = useToast();

  React.useEffect(() => {
    setPlatform(detectPlatform());
    setInstalled(isStandalone());
    // Lê o prompt capturado globalmente no RootLayout (PwaPromptCapture).
    // O evento beforeinstallprompt do Chrome dispara 1x quando o app
    // carrega, por isso a captura precisa rodar antes do modal abrir.
    setDeferredPrompt(getDeferredPwaPrompt() as BeforeInstallPromptEvent | null);
  }, []);

  // Body scroll lock + ESC
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !installing) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, installing]);

  const triggerAndroidPrompt = async () => {
    if (!deferredPrompt) {
      toast.error(
        "Seu Chrome não ofereceu instalação ainda. Tenta abrir o menu (⋮) e clicar em 'Adicionar à tela inicial'.",
      );
      return;
    }
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        toast.success("App instalado 💕");
        setInstalled(true);
        setTimeout(onClose, 1200);
      }
      setDeferredPrompt(null);
      clearDeferredPwaPrompt();
    } catch {
      toast.error("Não consegui abrir o prompt — tenta pelo menu do Chrome");
    } finally {
      setInstalling(false);
    }
  };

  if (installed) {
    return (
      <Backdrop onClose={onClose}>
        <Card>
          <Header title="App já instalado 💕" onClose={onClose} />
          <div className="px-5 py-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-good/10 flex items-center justify-center text-good mb-4">
              <Check size={28} strokeWidth={2.5} />
            </div>
            <div className="text-[15px] font-extrabold text-spark-ink tracking-tight mb-1">
              Tudo certo!
            </div>
            <p className="text-[13px] text-spark-ink-70 leading-relaxed max-w-[34ch] mx-auto">
              Você já tá usando o Método TTS instalado no seu dispositivo. Bora gravar 🎬
            </p>
          </div>
        </Card>
      </Backdrop>
    );
  }

  return (
    <Backdrop onClose={onClose}>
      <Card>
        <Header title="Instalar o app" onClose={onClose} />

        {platform === "ios" && <IosInstructions />}
        {platform === "android" && (
          <AndroidInstructions
            onPrompt={triggerAndroidPrompt}
            installing={installing}
            canPrompt={!!deferredPrompt}
          />
        )}
        {platform === "desktop" && <DesktopInstructions />}
        {platform === "other" && <GenericInstructions />}
      </Card>
    </Backdrop>
  );
}

// =================================================================
// LAYOUT
// =================================================================

function Backdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Instalar o app"
      className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(20, 20, 40, 0.55)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full sm:max-w-[520px] bg-spark-surface rounded-t-spark-2xl sm:rounded-spark-2xl border-2 border-spark-brand/20 shadow-hero overflow-hidden flex flex-col max-h-[92dvh]"
      style={{ animation: "install-up 280ms cubic-bezier(0.2, 0.7, 0.2, 1) both" }}
    >
      {children}
      <style jsx>{`
        @keyframes install-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-spark-hairline">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-brand-grad-soft flex items-center justify-center text-spark-brand-deep">
          <Smartphone size={18} strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <div className="text-eyebrow text-spark-brand">✦ pwa</div>
          <h2 className="text-[15px] font-extrabold text-spark-ink tracking-tight leading-none mt-1">
            {title}
          </h2>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="w-9 h-9 rounded-full text-spark-ink-50 hover:text-spark-ink hover:bg-spark-surface-sunken flex items-center justify-center transition-colors"
      >
        <X size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// =================================================================
// iOS
// =================================================================

function IosInstructions() {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <p className="text-[13.5px] text-spark-ink-70 font-semibold leading-relaxed mb-4">
        No iPhone/iPad o ícone fica na sua tela inicial em 3 toques. Olha o vídeo
        ou segue o passo a passo:
      </p>

      <div className="aspect-[9/16] max-w-[260px] mx-auto rounded-spark-2xl overflow-hidden border border-spark-hairline shadow-rest mb-5">
        <iframe
          src={`https://www.youtube.com/embed/${YT_TUTORIAL_ID}?rel=0&modestbranding=1`}
          title="Como instalar o Método TTS no iPhone"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <Step n={1} icon={<Share size={16} strokeWidth={2.2} />}>
        Toca no botão <strong>Compartilhar</strong> (quadradinho com seta pra cima
        na barra inferior do Safari).
      </Step>
      <Step n={2} icon={<Plus size={16} strokeWidth={2.2} />}>
        Rola pra baixo até <strong>Adicionar à Tela de Início</strong> e toca.
      </Step>
      <Step n={3} icon={<Check size={16} strokeWidth={2.2} />}>
        Confirma em <strong>Adicionar</strong>. Pronto — o ícone do Método TTS
        aparece na sua tela inicial 💕
      </Step>

      <div className="mt-5 rounded-spark-xl bg-spark-surface-sunken/60 border border-spark-hairline px-4 py-3 text-[12px] text-spark-ink-50 leading-snug">
        <strong className="text-spark-ink-70">Importante:</strong> precisa estar
        no Safari. Chrome no iPhone não suporta instalação por limitação da
        Apple.
      </div>
    </div>
  );
}

// =================================================================
// ANDROID
// =================================================================

function AndroidInstructions({
  onPrompt,
  installing,
  canPrompt,
}: {
  onPrompt: () => void;
  installing: boolean;
  canPrompt: boolean;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
      <p className="text-[13.5px] text-spark-ink-70 font-semibold leading-relaxed">
        No Android é 1 clique. Toca no botão abaixo que o Chrome abre o popup
        nativo de instalação 💕
      </p>

      <button
        type="button"
        onClick={onPrompt}
        disabled={installing}
        className={cn(
          "w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-full text-[14.5px] font-extrabold transition-all duration-300 ease-premium",
          installing
            ? "bg-spark-surface text-spark-ink-50 border border-spark-hairline cursor-not-allowed"
            : "bg-brand-grad text-white shadow-lift-brand hover:-translate-y-0.5",
        )}
      >
        {installing ? (
          <>
            <Loader2 size={15} strokeWidth={2.5} className="animate-spin" />
            Abrindo prompt...
          </>
        ) : (
          <>
            <Plus size={15} strokeWidth={2.5} />
            Instalar Método TTS agora
          </>
        )}
      </button>

      {!canPrompt && (
        <div className="rounded-spark-xl bg-warn/5 border border-warn/20 px-4 py-3 text-[12.5px] text-warn leading-snug">
          <strong>Plano B:</strong> se o botão acima não funcionar, abre o menu
          do Chrome (3 pontinhos no canto superior) e toca em{" "}
          <strong>"Adicionar à tela inicial"</strong> ou{" "}
          <strong>"Instalar aplicativo"</strong>.
        </div>
      )}

      <div className="rounded-spark-xl bg-spark-surface-sunken/60 border border-spark-hairline px-4 py-3 text-[12px] text-spark-ink-50 leading-snug">
        <strong className="text-spark-ink-70">Funciona melhor no Chrome.</strong>{" "}
        Outros navegadores (Samsung Internet, Firefox) também suportam, mas pelo
        menu próprio de cada um.
      </div>
    </div>
  );
}

// =================================================================
// DESKTOP
// =================================================================

function DesktopInstructions() {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <p className="text-[13.5px] text-spark-ink-70 font-semibold leading-relaxed mb-4">
        No computador o Método TTS fica como app de verdade — abre em janela
        própria, sem barra de URL.
      </p>

      <Step n={1} icon={<Plus size={16} strokeWidth={2.2} />}>
        Procura o ícone <strong>"Instalar"</strong> (geralmente do lado direito
        da barra de URL — parece um monitor com seta pra baixo, ou um +).
      </Step>
      <Step n={2} icon={<Check size={16} strokeWidth={2.2} />}>
        Clica e confirma. O app abre em janela própria e ganha atalho na sua
        área de trabalho/dock.
      </Step>

      <div className="mt-5 rounded-spark-xl bg-spark-surface-sunken/60 border border-spark-hairline px-4 py-3 text-[12px] text-spark-ink-50 leading-snug">
        Funciona no Chrome, Edge e Brave. Safari no Mac tem a opção em{" "}
        <strong>Arquivo → Adicionar ao Dock</strong>.
      </div>
    </div>
  );
}

// =================================================================
// OUTROS
// =================================================================

function GenericInstructions() {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      <p className="text-[13.5px] text-spark-ink-70 font-semibold leading-relaxed mb-4">
        Pra instalar o Método TTS no seu dispositivo, procura no menu do seu
        navegador a opção <strong>"Adicionar à tela inicial"</strong> ou{" "}
        <strong>"Instalar app"</strong>.
      </p>
      <p className="text-[12.5px] text-spark-ink-50 leading-snug">
        Cada navegador tem nome um pouquinho diferente. Se não encontrar, manda
        uma mensagem reportando bug que a gente te ajuda 💕
      </p>
    </div>
  );
}

// =================================================================
// STEP
// =================================================================

function Step({
  n,
  icon,
  children,
}: {
  n: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 mb-3 last:mb-0">
      <div className="shrink-0 w-8 h-8 rounded-full bg-brand-grad text-white flex items-center justify-center text-[12px] font-extrabold shadow-lift-brand">
        {n}
      </div>
      <div className="flex-1 min-w-0 text-[13.5px] text-spark-ink-70 leading-relaxed pt-1">
        <span className="inline-flex items-center gap-1.5 text-spark-brand-deep mr-1.5">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}
