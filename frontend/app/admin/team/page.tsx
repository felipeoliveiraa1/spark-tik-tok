"use client";

import * as React from "react";
import { Plus, Trash2, ShieldCheck, Loader2, ExternalLink } from "lucide-react";
import { useConfirm, useToast } from "@/components/molecules/dialog-provider";
import { cn } from "@/lib/cn";

type Member = {
  id: string;
  name: string | null;
  email: string;
  role: "admin" | "crm_agent";
  created_at: string;
};

export default function AdminTeamPage() {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const refresh = React.useCallback(async () => {
    try {
      const r = await fetch("/api/admin/team", { cache: "no-store" });
      if (r.ok) {
        const j = (await r.json()) as { members: Member[] };
        setMembers(j.members);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleRoleChange = async (id: string, role: "admin" | "crm_agent" | "user") => {
    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        toast.success(role === "user" ? "Removido do time" : "Role atualizada");
        void refresh();
      } else {
        toast.error("Não consegui atualizar");
      }
    } catch {
      toast.error("Sem conexão");
    }
  };

  const handleDelete = async (member: Member) => {
    const ok = await confirm({
      title: `Apagar conta de ${member.name ?? member.email}?`,
      description:
        "Isso remove a conta inteira (login + dados). Pra só tirar do time, use 'Tornar usuária comum'.",
      confirmLabel: "Apagar conta",
      destructive: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/team/${member.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Conta removida");
        void refresh();
      } else {
        toast.error("Não consegui apagar");
      }
    } catch {
      toast.error("Sem conexão");
    }
  };

  return (
    <div className="space-y-6 max-w-[920px]">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-eyebrow text-spark-brand-deep">✦ time</div>
          <h1 className="font-display lowercase text-fluid-h2 leading-none tracking-tight mt-1">
            equipe interna
          </h1>
          <p className="mt-2 text-[13px] text-spark-ink-70 max-w-[60ch]">
            Admins e atendentes do CRM. Atendentes (crm_agent) só acessam{" "}
            <a
              href="/crm-metodotts"
              className="text-spark-brand-deep font-extrabold inline-flex items-center gap-0.5"
            >
              /crm-metodotts
              <ExternalLink size={11} strokeWidth={2.5} />
            </a>
            , não veem o resto do admin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-spark-ink text-white text-[12.5px] font-extrabold hover:bg-spark-brand-deep transition-colors"
        >
          <Plus size={13} strokeWidth={2.5} />
          Adicionar membro
        </button>
      </header>

      {showForm && (
        <AddMemberForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            void refresh();
          }}
        />
      )}

      {loading ? (
        <div className="text-spark-ink-50 inline-flex items-center gap-2">
          <Loader2 size={14} className="animate-spin" />
          carregando…
        </div>
      ) : members.length === 0 ? (
        <div className="text-spark-ink-50">Nenhum membro ainda</div>
      ) : (
        <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline divide-y divide-spark-hairline overflow-hidden">
          {members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              onRoleChange={(role) => handleRoleChange(m.id, role)}
              onDelete={() => handleDelete(m)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberRow({
  member,
  onRoleChange,
  onDelete,
}: {
  member: Member;
  onRoleChange: (role: "admin" | "crm_agent" | "user") => void;
  onDelete: () => void;
}) {
  return (
    <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold shrink-0",
          member.role === "admin"
            ? "bg-spark-brand"
            : "bg-gradient-to-br from-teal-500 to-cyan-400",
        )}
      >
        {(member.name?.[0] ?? member.email[0]).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-extrabold text-spark-ink truncate">
          {member.name ?? "—"}
        </div>
        <div className="text-[11.5px] text-spark-ink-50 font-mono truncate">
          {member.email}
        </div>
      </div>
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold",
          member.role === "admin"
            ? "bg-spark-brand/15 text-spark-brand-deep"
            : "bg-teal-500/15 text-teal-700",
        )}
      >
        <ShieldCheck size={11} strokeWidth={2.5} />
        {member.role === "admin" ? "Admin" : "Atendente CRM"}
      </span>
      <select
        value={member.role}
        onChange={(e) =>
          onRoleChange(e.target.value as "admin" | "crm_agent" | "user")
        }
        className="px-3 py-2 rounded-full bg-spark-bg border border-spark-hairline text-[12px] font-extrabold cursor-pointer"
      >
        <option value="admin">Admin</option>
        <option value="crm_agent">Atendente CRM</option>
        <option value="user">Tornar usuária comum</option>
      </select>
      <button
        type="button"
        onClick={onDelete}
        className="w-9 h-9 rounded-full text-spark-ink-50 hover:text-bad hover:bg-bad/10 flex items-center justify-center transition-colors"
        aria-label="Apagar conta"
        title="Apagar conta (definitivo)"
      >
        <Trash2 size={14} strokeWidth={2.2} />
      </button>
    </div>
  );
}

function AddMemberForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState<"admin" | "crm_agent">("crm_agent");
  const [saving, setSaving] = React.useState(false);
  const toast = useToast();

  const submit = async () => {
    if (!email.trim() || password.length < 8) {
      toast.error("Email e senha (mín. 8) obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, name, role }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        mode?: string;
        error?: string;
      };
      if (res.ok && j.ok) {
        toast.success(
          j.mode === "created" ? "Conta criada" : "Role atualizada (já existia)",
        );
        onSuccess();
      } else {
        toast.error(j.error ?? "Não consegui criar");
      }
    } catch {
      toast.error("Sem conexão");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-spark-2xl bg-spark-surface border border-spark-hairline p-5 space-y-3">
      <div className="text-[10px] uppercase tracking-widest font-extrabold text-spark-brand-deep">
        ✦ novo membro
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-spark-ink-50 mb-1.5">
            Nome
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-spark-lg bg-spark-bg border border-spark-hairline text-[13px] font-semibold outline-none focus:border-spark-brand"
            placeholder="Maria Silva"
          />
        </div>
        <div>
          <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-spark-ink-50 mb-1.5">
            Email
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full px-3 py-2.5 rounded-spark-lg bg-spark-bg border border-spark-hairline text-[13px] font-semibold outline-none focus:border-spark-brand"
            placeholder="maria@metodotts.app"
          />
        </div>
        <div>
          <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-spark-ink-50 mb-1.5">
            Senha (mín. 8)
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="text"
            className="w-full px-3 py-2.5 rounded-spark-lg bg-spark-bg border border-spark-hairline text-[13px] font-mono font-semibold outline-none focus:border-spark-brand"
            placeholder="senha123!"
          />
        </div>
        <div>
          <label className="block text-[10.5px] uppercase tracking-widest font-extrabold text-spark-ink-50 mb-1.5">
            Papel
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "crm_agent")}
            className="w-full px-3 py-2.5 rounded-spark-lg bg-spark-bg border border-spark-hairline text-[13px] font-extrabold cursor-pointer"
          >
            <option value="crm_agent">Atendente CRM (só leads)</option>
            <option value="admin">Admin (acesso total)</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving || !email.trim() || password.length < 8}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-spark-ink text-white text-[12.5px] font-extrabold disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : null}
          Criar conta
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2.5 rounded-full text-spark-ink-70 hover:text-spark-ink text-[12.5px] font-extrabold"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
