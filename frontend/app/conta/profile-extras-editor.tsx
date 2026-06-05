"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Pencil,
  Check,
  X,
  MapPin,
  Target,
  AtSign,
  Image as ImageIcon,
  Phone,
  Bell,
  BellOff,
} from "lucide-react";
import { SInput } from "@/components/atoms/s-input";
import { SButton } from "@/components/atoms/s-button";
import { useToast } from "@/components/molecules/dialog-provider";

type Props = {
  initialBio: string;
  initialInstagram: string;
  initialTiktok: string;
  initialCidade: string;
  initialMeta: number | null;
  initialWhatsapp: string;
  initialWhatsappOptIn: boolean;
};

/**
 * Formata "5511998002960" -> "(11) 99800-2960" pra exibir no input.
 * Aceita formato cru ou ja com 55 prefix.
 */
function formatWhatsappDisplay(raw: string): string {
  if (!raw) return "";
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw; // formato desconhecido, mostra como veio
}

function fmtBRL(v: number | null | undefined): string {
  if (v == null) return "Não definida";
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function ProfileExtrasEditor({
  initialBio,
  initialInstagram,
  initialTiktok,
  initialCidade,
  initialMeta,
  initialWhatsapp,
  initialWhatsappOptIn,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = React.useState(false);
  const [bio, setBio] = React.useState(initialBio);
  const [instagram, setInstagram] = React.useState(initialInstagram);
  const [tiktok, setTiktok] = React.useState(initialTiktok);
  const [cidade, setCidade] = React.useState(initialCidade);
  const [meta, setMeta] = React.useState<string>(
    initialMeta != null ? String(initialMeta) : "",
  );
  const [whatsapp, setWhatsapp] = React.useState(formatWhatsappDisplay(initialWhatsapp));
  const [whatsappOptIn, setWhatsappOptIn] = React.useState(initialWhatsappOptIn);
  const [saving, setSaving] = React.useState(false);

  const cancel = () => {
    setBio(initialBio);
    setInstagram(initialInstagram);
    setTiktok(initialTiktok);
    setCidade(initialCidade);
    setMeta(initialMeta != null ? String(initialMeta) : "");
    setWhatsapp(formatWhatsappDisplay(initialWhatsapp));
    setWhatsappOptIn(initialWhatsappOptIn);
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        bio,
        instagram_handle: instagram,
        tiktok_handle: tiktok,
        cidade_uf: cidade,
        meta_mensal_brl: meta.trim() === "" ? null : Number(meta),
        whatsapp: whatsapp.trim() === "" ? null : whatsapp,
        whatsapp_opt_in: whatsappOptIn,
      };
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Perfil atualizado 💕");
        setEditing(false);
        router.refresh();
      } else {
        const j = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        toast.error(j.message ?? j.error ?? "Falhou ao salvar");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    const hasAny = bio || instagram || tiktok || cidade || initialMeta || initialWhatsapp;
    return (
      <div className="bg-spark-surface rounded-spark-2xl border border-spark-hairline p-5 shadow-rest">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="text-eyebrow text-spark-brand">✦ sobre mim</div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Editar"
            className="w-9 h-9 rounded-full bg-spark-surface-sunken text-spark-ink-70 hover:text-spark-brand-deep hover:bg-spark-brand-soft active:scale-95 transition-all duration-300 ease-premium flex items-center justify-center shrink-0"
          >
            <Pencil size={14} strokeWidth={2.2} />
          </button>
        </div>

        {hasAny ? (
          <div className="space-y-3">
            {bio && (
              <p className="text-[14px] text-spark-ink leading-relaxed font-semibold">
                {bio}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-[12px] text-spark-ink-70">
              {cidade && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-surface-sunken font-semibold">
                  <MapPin size={11} strokeWidth={2.5} />
                  {cidade}
                </span>
              )}
              {instagram && (
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-surface-sunken hover:bg-spark-brand-soft hover:text-spark-brand-deep transition-colors font-semibold"
                >
                  <ImageIcon size={11} strokeWidth={2.5} />@{instagram}
                </a>
              )}
              {tiktok && (
                <a
                  href={`https://tiktok.com/@${tiktok}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-surface-sunken hover:bg-spark-brand-soft hover:text-spark-brand-deep transition-colors font-semibold"
                >
                  <AtSign size={11} strokeWidth={2.5} />
                  {tiktok}
                </a>
              )}
              {initialMeta != null && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-brand-soft text-spark-brand-deep font-extrabold">
                  <Target size={11} strokeWidth={2.5} />
                  Meta {fmtBRL(initialMeta)}
                </span>
              )}
              {initialWhatsapp && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-spark-surface-sunken font-semibold font-mono">
                  <Phone size={11} strokeWidth={2.5} />
                  {formatWhatsappDisplay(initialWhatsapp)}
                </span>
              )}
              {initialWhatsapp && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-extrabold text-[11.5px] ${
                    initialWhatsappOptIn
                      ? "bg-good/10 text-good"
                      : "bg-spark-ink-10 text-spark-ink-50"
                  }`}
                >
                  {initialWhatsappOptIn ? (
                    <Bell size={11} strokeWidth={2.5} />
                  ) : (
                    <BellOff size={11} strokeWidth={2.5} />
                  )}
                  {initialWhatsappOptIn ? "Mensagens ativas" : "Mensagens pausadas"}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-spark-ink-50 italic">
            Adiciona bio, redes, cidade e meta mensal pra completar seu perfil.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-spark-surface rounded-spark-2xl border border-spark-brand/30 p-5 shadow-lift-brand">
      <div className="text-eyebrow text-spark-brand mb-4">✦ editando sobre mim</div>

      <div className="space-y-4">
        <div>
          <div className="text-[11px] font-extrabold text-spark-ink-50 uppercase tracking-wider mb-1.5">
            Bio (até 240 caracteres)
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 240))}
            rows={3}
            placeholder="Conta um pouco sobre você..."
            className="w-full px-4 py-3 rounded-spark-xl bg-spark-bg border border-spark-hairline focus:border-spark-brand focus:ring-2 focus:ring-spark-brand/15 outline-none text-[14px] transition-all duration-200"
          />
          <div className="mt-1 text-[10.5px] text-spark-ink-50 font-mono text-right">
            {bio.length}/240
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] font-extrabold text-spark-ink-50 uppercase tracking-wider mb-1.5">
              Instagram (@)
            </div>
            <SInput
              value={instagram}
              onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
              placeholder="seuhandle"
              Icon={ImageIcon}
              maxLength={40}
            />
          </div>
          <div>
            <div className="text-[11px] font-extrabold text-spark-ink-50 uppercase tracking-wider mb-1.5">
              TikTok (@)
            </div>
            <SInput
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value.replace(/^@/, ""))}
              placeholder="seuhandle"
              Icon={AtSign}
              maxLength={40}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] font-extrabold text-spark-ink-50 uppercase tracking-wider mb-1.5">
              Cidade · UF
            </div>
            <SInput
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="São Paulo, SP"
              Icon={MapPin}
              maxLength={80}
            />
          </div>
          <div>
            <div className="text-[11px] font-extrabold text-spark-ink-50 uppercase tracking-wider mb-1.5">
              Meta de GMV mensal (R$)
            </div>
            <SInput
              type="number"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="3000"
              Icon={Target}
              min={0}
            />
          </div>
        </div>

        {/* WhatsApp + opt-in */}
        <div className="rounded-spark-xl bg-spark-brand-soft/50 border border-spark-brand/15 p-4 space-y-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-spark-brand-deep uppercase tracking-wider mb-1.5">
              <Phone size={11} strokeWidth={2.5} />
              WhatsApp (recebe dicas da Yara)
            </div>
            <SInput
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 99999-9999"
              Icon={Phone}
              maxLength={20}
            />
            <p className="mt-1.5 text-[10.5px] text-spark-ink-50 font-semibold leading-snug">
              Vamos te mandar mensagens motivacionais, lembretes de rotina e celebrar
              conquistas. Sem spam, prometido.
            </p>
          </div>

          {/* Toggle on/off */}
          <label className="flex items-center justify-between gap-3 p-3 rounded-spark-lg bg-spark-surface border border-spark-hairline cursor-pointer hover:border-spark-brand/30 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              {whatsappOptIn ? (
                <div className="w-8 h-8 rounded-full bg-good/10 text-good flex items-center justify-center shrink-0">
                  <Bell size={14} strokeWidth={2.5} />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-spark-ink-10 text-spark-ink-50 flex items-center justify-center shrink-0">
                  <BellOff size={14} strokeWidth={2.5} />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[13px] font-extrabold text-spark-ink">
                  {whatsappOptIn ? "Recebendo mensagens" : "Mensagens pausadas"}
                </div>
                <div className="text-[10.5px] text-spark-ink-50 font-semibold">
                  {whatsappOptIn
                    ? "Você recebe motivacional, lembretes e dicas"
                    : "Você não recebe nenhuma mensagem"}
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={(e) => setWhatsappOptIn(e.target.checked)}
              className="sr-only peer"
            />
            <span
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${
                whatsappOptIn ? "bg-brand-grad" : "bg-spark-ink-20"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${
                  whatsappOptIn ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </span>
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <SButton
            type="button"
            variant="primary"
            size="md"
            Icon={Check}
            onClick={save}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </SButton>
          <SButton
            type="button"
            variant="ghost"
            size="md"
            Icon={X}
            onClick={cancel}
            disabled={saving}
          >
            Cancelar
          </SButton>
        </div>
      </div>
    </div>
  );
}
