"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";
import { ResponsiveShell } from "@/components/layout/responsive-shell";
import { MobileHeader } from "@/components/layout/mobile-header";
import { useToast } from "@/components/molecules/dialog-provider";

/**
 * Página de cadastro manual de roteiros.
 *
 * Aluna pega os roteiros que gerou no agente Scripts (no ChatGPT/Gemini)
 * e cadastra aqui. 1-5 roteiros, cada um com 4 blocos do método Yara:
 *   gancho (3s) → desenvolvimento → benefício → CTA
 *
 * Opcionalmente vincula com 1 produto do catálogo (dropdown).
 */

const STYLES = [
  { value: "fofoca", label: "Fofoca" },
  { value: "polemico", label: "Polêmico" },
  { value: "engracado", label: "Engraçado" },
  { value: "educativo", label: "Educativo" },
  { value: "storytelling", label: "Storytelling" },
  { value: "comparacao", label: "Comparação" },
  { value: "transformacao", label: "Transformação" },
];

type ScriptItem = {
  n: number;
  style: string;
  hook: string;
  development: string;
  benefit: string;
  cta: string;
};

type Product = { id: string; name: string };

const emptyScript = (n: number): ScriptItem => ({
  n,
  style: "fofoca",
  hook: "",
  development: "",
  benefit: "",
  cta: "",
});

function NovoScriptBody({ desktop = false }: { desktop?: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [title, setTitle] = React.useState("");
  const [productId, setProductId] = React.useState<string>("");
  const [scripts, setScripts] = React.useState<ScriptItem[]>([emptyScript(1)]);
  const [saving, setSaving] = React.useState(false);

  // Carrega produtos pro dropdown
  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/products", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data: { products: Product[] }) => {
        if (!cancelled) setProducts(data.products);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Quando seleciona produto, sugere título "N roteiros · Nome"
  React.useEffect(() => {
    if (productId && !title.trim()) {
      const p = products.find((x) => x.id === productId);
      if (p) setTitle(`${scripts.length} roteiros · ${p.name}`);
    }
  }, [productId, products, scripts.length, title]);

  const updateScript = <K extends keyof ScriptItem>(idx: number, key: K, value: ScriptItem[K]) => {
    setScripts((arr) => arr.map((s, i) => (i === idx ? { ...s, [key]: value } : s)));
  };

  const addScript = () => {
    if (scripts.length >= 5) return;
    setScripts((arr) => [...arr, emptyScript(arr.length + 1)]);
  };

  const removeScript = (idx: number) => {
    if (scripts.length <= 1) return;
    setScripts((arr) => arr.filter((_, i) => i !== idx).map((s, i) => ({ ...s, n: i + 1 })));
  };

  const handleSubmit = async () => {
    // Valida: cada roteiro tem que ter os 4 blocos preenchidos
    for (const s of scripts) {
      if (!s.hook.trim() || !s.development.trim() || !s.benefit.trim() || !s.cta.trim()) {
        toast.error(`Roteiro ${s.n} tá com bloco vazio. Preenche todos pra continuar 💕`);
        return;
      }
    }
    const cleanTitle =
      title.trim() ||
      `${scripts.length} roteiro${scripts.length > 1 ? "s" : ""}`;

    setSaving(true);
    try {
      const payload = {
        product_id: productId || null,
        title: cleanTitle,
        hooks: scripts,
      };
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!res.ok || !data?.id) {
        toast.error(data?.error ?? "Não consegui salvar agora.");
        return;
      }
      toast.success("Roteiros salvos 💕");
      router.push(`/scripts/${data.id}`);
    } catch {
      toast.error("Não consegui salvar agora.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`flex-1 overflow-auto ${desktop ? "py-8 px-12" : "pb-24"}`}>
      <div className={desktop ? "max-w-[720px]" : "px-4 pt-4"}>
        {desktop && (
          <>
            <div className="text-[12px] font-bold text-spark-brand tracking-[0.06em] uppercase">
              ✍️ Novo Conjunto de Roteiros
            </div>
            <h1 className="mt-1 font-extrabold tracking-tight leading-[1.1] text-[36px]">
              Cadastrar roteiros ✨
            </h1>
          </>
        )}
        <p
          className={`text-[13.5px] text-spark-ink-50 max-w-[560px] ${desktop ? "mt-1.5 mb-6" : "mb-5"}`}
        >
          Cola os roteiros que você gerou no agente Scripts do seu nicho. Cada um tem 4 blocos do
          método Yara: gancho, desenvolvimento, benefício e CTA 💕
        </p>

        {/* Meta */}
        <section className="mb-6 space-y-3">
          <Field label="Título do conjunto">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: 5 roteiros · Gel de Limpeza"
              maxLength={150}
              className="w-full px-3.5 py-2.5 rounded-xl border border-spark-hairline bg-white text-[14px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand"
            />
          </Field>
          <Field label="Produto relacionado">
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-spark-hairline bg-white text-[14px] text-spark-ink focus:outline-none focus:border-spark-brand"
            >
              <option value="">Nenhum (avulso)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </section>

        {/* Roteiros */}
        <section className="space-y-4">
          {scripts.map((s, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-spark-surface border border-spark-hairline p-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[14px] font-extrabold text-spark-ink">
                  Roteiro {s.n}
                </h3>
                {scripts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeScript(idx)}
                    aria-label="Remover roteiro"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-spark-ink-50 hover:text-bad hover:bg-bad/10 transition-colors"
                  >
                    <Trash2 size={13} strokeWidth={1.8} />
                  </button>
                )}
              </div>

              <Field label="Estilo">
                <select
                  value={s.style}
                  onChange={(e) => updateScript(idx, "style", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-spark-hairline bg-white text-[13.5px] text-spark-ink focus:outline-none focus:border-spark-brand"
                >
                  {STYLES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="🎣 Gancho (3s)">
                <textarea
                  value={s.hook}
                  onChange={(e) => updateScript(idx, "hook", e.target.value)}
                  placeholder="Frase curta que prende nos primeiros 3 segundos"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-spark-hairline bg-white text-[13.5px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand resize-none"
                />
              </Field>

              <Field label="💡 Desenvolvimento">
                <textarea
                  value={s.development}
                  onChange={(e) => updateScript(idx, "development", e.target.value)}
                  placeholder="Analogia ou explicação simples, conecta com situação real"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-spark-hairline bg-white text-[13.5px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand resize-none"
                />
              </Field>

              <Field label="✨ Benefício">
                <textarea
                  value={s.benefit}
                  onChange={(e) => updateScript(idx, "benefit", e.target.value)}
                  placeholder="O que o produto entrega de verdade — sem milagre"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-spark-hairline bg-white text-[13.5px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand resize-none"
                />
              </Field>

              <Field label="💕 CTA">
                <textarea
                  value={s.cta}
                  onChange={(e) => updateScript(idx, "cta", e.target.value)}
                  placeholder="Convite leve pra ação — 'link na bio', 'salva esse', etc"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-spark-hairline bg-white text-[13.5px] text-spark-ink placeholder:text-spark-ink-35 focus:outline-none focus:border-spark-brand resize-none"
                />
              </Field>
            </div>
          ))}

          {scripts.length < 5 && (
            <button
              type="button"
              onClick={addScript}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-spark-hairline text-spark-ink-70 text-[13px] font-bold hover:border-spark-brand hover:text-spark-brand transition-colors"
            >
              <Plus size={14} strokeWidth={2.5} />
              Adicionar mais um roteiro ({scripts.length}/5)
            </button>
          )}
        </section>

        {/* SAVE BAR */}
        <div className={`${desktop ? "mt-8" : "mt-6 sticky bottom-0 -mx-4 px-4 py-3 bg-white border-t border-spark-hairline"}`}>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-brand-grad text-white text-[14px] font-extrabold shadow-[0_8px_24px_-12px_oklch(0.55_0.24_340/0.5)] active:scale-95 transition-transform disabled:opacity-60 disabled:active:scale-100"
          >
            <Save size={15} strokeWidth={2.2} />
            {saving ? "Salvando..." : `Salvar ${scripts.length} roteiro${scripts.length > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12.5px] font-bold text-spark-ink mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function NovoScriptMobile() {
  return (
    <>
      <MobileHeader title="Novos Roteiros ✨" back={{ href: "/scripts" }} />
      <NovoScriptBody />
    </>
  );
}

function NovoScriptDesktop() {
  return <NovoScriptBody desktop />;
}

export default function NovoScriptPage() {
  return (
    <ResponsiveShell mobile={<NovoScriptMobile />} desktop={<NovoScriptDesktop />} active="scripts" />
  );
}
