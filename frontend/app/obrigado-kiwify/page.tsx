"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Mail,
  KeyRound,
  Rocket,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Search,
  HelpCircle,
} from "lucide-react";
import { HeroBlob } from "@/components/atoms/hero-blob";
import { SparkleField } from "@/components/atoms/sparkle-field";
import { SectionReveal } from "@/components/atoms/section-reveal";
import { SparkWordmark } from "@/components/atoms/spark-wordmark";

/**
 * /obrigado-kiwify — thank-you page pos-checkout Kiwify.
 *
 * Configurar no painel Kiwify a URL de redirect pos-compra pra:
 * https://www.metodotts.app/obrigado-kiwify
 *
 * Rota publica (adicionada em ALWAYS_PUBLIC do proxy.ts + matcher exclusion)
 * porque aluna ainda nao tem sessao — comprou agora, esta aguardando email
 * com credenciais.
 */
export default function ObrigadoKiwifyPage() {
  return (
    <div className="min-h-dvh relative overflow-x-hidden bg-spark-bg">
      {/* Backdrop com blob + sparkles */}
      <HeroBlob
        color="rose"
        variant={1}
        className="-top-32 -left-32 w-[460px] h-[460px]"
      />
      <HeroBlob
        color="peach"
        variant={2}
        className="top-1/3 -right-32 w-[460px] h-[460px]"
      />
      <SparkleField count={16} seed={2026} className="opacity-40" />

      <div className="relative max-w-[720px] mx-auto px-5 pt-8 pb-16">
        {/* Wordmark topo */}
        <SectionReveal direction="down" durationMs={500}>
          <div className="flex justify-center mb-8">
            <SparkWordmark size={48} />
          </div>
        </SectionReveal>

        {/* Hero — confirmacao */}
        <SectionReveal direction="up" durationMs={700} delay={100}>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500 text-white shadow-lift-brand mb-5">
              <CheckCircle2 size={40} strokeWidth={2.4} />
            </div>
            <div className="text-eyebrow text-spark-brand-deep inline-flex items-center gap-1.5">
              <Sparkles size={11} strokeWidth={2.5} />
              compra confirmada
            </div>
            <h1
              className="mt-3 font-display lowercase tracking-tight text-spark-ink leading-[0.95]"
              style={{ fontSize: "clamp(2rem, 6vw, 3.25rem)" }}
            >
              bem-vinda,{" "}
              <span className="text-grad-brand">amiga</span> 💕
            </h1>
            <p className="mt-4 text-fluid-body text-spark-ink-70 leading-snug font-semibold max-w-[46ch] mx-auto">
              Sua compra foi confirmada. A partir de agora tu faz parte da
              turma do Método TTS. Vem que a jornada começa 👇
            </p>
          </div>
        </SectionReveal>

        {/* Passo a passo */}
        <SectionReveal direction="up" durationMs={700} delay={300}>
          <section className="mt-10">
            <div className="text-eyebrow text-spark-brand mb-4">
              ✦ como acessar (passo a passo)
            </div>
            <div className="space-y-3">
              <Step
                number={1}
                Icon={Mail}
                title="Confere o teu email agora"
                body={
                  <>
                    Em até <strong>2 minutos</strong> tu vai receber um email
                    com o assunto{" "}
                    <span className="font-mono text-[12.5px] bg-spark-surface-sunken/60 px-1.5 py-0.5 rounded">
                      Bem-vinda ao Método TTS
                    </span>
                    . Não achou? Olha na aba{" "}
                    <strong>Promoções</strong> ou no <strong>Spam</strong>.
                  </>
                }
              />
              <Step
                number={2}
                Icon={KeyRound}
                title="Pega teu email + senha temporária"
                body="O email traz seu login (o mesmo email da compra) e uma senha temporária. Anota ou deixa o email aberto pro próximo passo."
              />
              <Step
                number={3}
                Icon={Rocket}
                title="Acessa a plataforma"
                body={
                  <>
                    Vai em{" "}
                    <a
                      href="https://www.metodotts.app/login"
                      className="font-mono text-spark-brand-deep underline underline-offset-2"
                    >
                      metodotts.app/login
                    </a>{" "}
                    e loga com os dados do email. No primeiro login vai pedir
                    pra tu criar sua senha nova (mais segura).
                  </>
                }
              />
              <Step
                number={4}
                Icon={MessageCircle}
                title="Entra no grupo da turma no WhatsApp"
                body="Dentro do app tem o link do grupo oficial da Jornada 1. Comunidade da turma, atualizações, avisos e trocas com as outras alunas. Bora!"
              />
            </div>
          </section>
        </SectionReveal>

        {/* CTA principal */}
        <SectionReveal direction="up" durationMs={700} delay={500}>
          <div className="mt-10 rounded-spark-2xl bg-brand-grad-soft border-2 border-spark-brand/30 p-5 md:p-6 shadow-lift-brand">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-11 h-11 rounded-full bg-white border-2 border-spark-brand/30 flex items-center justify-center shadow-rest">
                <Mail size={18} className="text-spark-brand-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-[18px] text-spark-ink leading-tight">
                  Já pegou o email de acesso?
                </div>
                <p className="text-[13px] text-spark-ink-70 mt-1 leading-snug">
                  Bora entrar na plataforma agora e começar a Jornada 1.
                </p>
              </div>
            </div>
            <a
              href="https://www.metodotts.app/login"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-spark-brand text-white text-[14px] font-extrabold shadow-lift-brand active:scale-[0.99] transition-transform"
            >
              Acessar minha conta
              <ArrowRight size={16} strokeWidth={2.5} />
            </a>
          </div>
        </SectionReveal>

        {/* FAQ / Ajuda */}
        <SectionReveal direction="up" durationMs={700} delay={700}>
          <section className="mt-10">
            <div className="text-eyebrow text-spark-brand mb-4">
              ✦ ainda com dúvida?
            </div>
            <div className="space-y-3">
              <FaqItem
                Icon={Search}
                title="Não recebi o email de boas-vindas"
                body={
                  <>
                    <strong>1)</strong> Olha em{" "}
                    <em>Spam / Promoções / Lixeira</em>.<br />
                    <strong>2)</strong> Aguarda até 5 minutos.<br />
                    <strong>3)</strong> Confere se o email que tu digitou na
                    Kiwify tá certinho (pode ter erro de digitação).
                  </>
                }
              />
              <FaqItem
                Icon={KeyRound}
                title="Perdi a senha temporária"
                body={
                  <>
                    Vai em{" "}
                    <a
                      href="https://www.metodotts.app/forgot-password"
                      className="text-spark-brand-deep underline underline-offset-2 font-semibold"
                    >
                      metodotts.app/forgot-password
                    </a>{" "}
                    e usa o email da compra pra receber um novo link de acesso.
                  </>
                }
              />
              <FaqItem
                Icon={HelpCircle}
                title="Ainda tô com problema"
                body={
                  <>
                    Responde qualquer email do Método TTS que a gente
                    resolve rapidinho por lá 💕
                  </>
                }
              />
            </div>
          </section>
        </SectionReveal>

        {/* Sign-off */}
        <SectionReveal direction="up" durationMs={700} delay={900}>
          <div className="mt-12 text-center">
            <p className="text-[13px] text-spark-ink-50 font-semibold leading-snug max-w-[38ch] mx-auto">
              Chegou a tua vez de sair da estagnação e começar a vender no
              TikTok Shop de verdade. Te espero do outro lado ✨
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/"
                className="text-[12px] text-spark-ink-50 hover:text-spark-ink-70 font-extrabold uppercase tracking-[0.18em] transition-colors"
              >
                ← metodotts.app
              </Link>
            </div>
          </div>
        </SectionReveal>
      </div>
    </div>
  );
}

// =================================================================
// COMPONENTS
// =================================================================

function Step({
  number,
  Icon,
  title,
  body,
}: {
  number: number;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline shadow-rest p-4 md:p-5 flex items-start gap-4 hover:shadow-lift transition-shadow">
      <div className="shrink-0 relative">
        <div className="w-12 h-12 rounded-full bg-spark-brand text-white flex items-center justify-center font-display text-[20px] shadow-lift-brand">
          {number}
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-spark-hairline flex items-center justify-center shadow-rest">
          <Icon size={12} strokeWidth={2.4} className="text-spark-brand-deep" />
        </div>
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="font-display text-[16px] text-spark-ink leading-tight">
          {title}
        </div>
        <div className="mt-1.5 text-[13px] text-spark-ink-70 leading-snug">
          {body}
        </div>
      </div>
    </div>
  );
}

function FaqItem({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="rounded-spark-xl bg-spark-surface-sunken/50 border border-spark-hairline p-4 flex items-start gap-3">
      <div className="shrink-0 w-9 h-9 rounded-full bg-spark-surface border border-spark-hairline flex items-center justify-center">
        <Icon size={15} strokeWidth={2.4} className="text-spark-ink-70" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-extrabold text-spark-ink text-[13.5px] leading-tight">
          {title}
        </div>
        <div className="mt-1 text-[12.5px] text-spark-ink-70 leading-snug">
          {body}
        </div>
      </div>
    </div>
  );
}
