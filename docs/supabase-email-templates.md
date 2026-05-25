# Email templates do Supabase (Método TTS)

Templates HTML pra colar em **Supabase Dashboard → Authentication → Email Templates**.

Estilo igual ao email de boas-vindas (rose gradient, logo no topo). Variáveis
do Supabase (`{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .Token }}`) ficam
intactas — Supabase substitui na hora de mandar.

## Pré-requisito: SMTP custom (recomendado)

Por padrão emails saem do `noreply@mail.app.supabase.io`. Pra sair do nosso
domínio (`noreply@metodotts.app`), configure SMTP do Resend:

1. **Supabase Dashboard → Project Settings → Authentication → SMTP Settings**
2. Enable Custom SMTP: **ON**
3. Sender Name: `Método TTS`
4. Sender Email: `noreply@metodotts.app`
5. Host: `smtp.resend.com`
6. Port: `465`
7. Username: `resend`
8. Password: `<RESEND_API_KEY>` (a mesma do env Vercel)
9. Minimum interval between emails: `1` segundo (padrão Resend free tier)
10. **Save**

Depois disso TODOS os emails do Supabase Auth (reset, confirm signup, magic
link, invite, email change) saem do nosso domínio.

---

## 1) Reset Password (Recuperar senha)

**Subject:** `Redefinir sua senha 🔒 Método TTS`

**HTML:**

```html
<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#fce7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;line-height:1.5;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 24px -10px rgba(20,20,40,0.12);">
    <div style="padding:28px 28px 8px;background:#fff;text-align:center;">
      <div style="display:inline-block;font-weight:800;letter-spacing:-0.02em;line-height:1;">
        <span style="font-size:22px;font-weight:600;color:#1d1d1f;opacity:0.85;">método</span>
        <span style="font-size:30px;color:#db2777;margin-left:6px;">TTS</span>
      </div>
    </div>
    <div style="padding:8px 28px 24px;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;">
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;">Recuperação de senha</div>
      <h1 style="margin:6px 0 0;font-size:24px;font-weight:800;letter-spacing:-0.02em;">
        Vamos criar uma senha nova 💕
      </h1>
      <p style="margin:10px 0 0;font-size:14px;opacity:0.92;">
        Recebemos um pedido pra redefinir a senha da sua conta no <strong>Método TTS</strong>.
      </p>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 18px;font-size:14.5px;color:#3a3a3f;">
        Toca no botão abaixo pra criar sua senha nova. O link é válido por 1 hora.
      </p>

      <a href="{{ .ConfirmationURL }}" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 20px;border-radius:999px;margin:0 0 18px;">
        Redefinir minha senha →
      </a>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13px;color:#9a3412;margin:0 0 16px;">
        <strong>Não foi você?</strong> Pode ignorar esse email — sua senha continua a mesma.
      </div>

      <p style="margin:24px 0 0;font-size:12px;color:#86868b;line-height:1.5;">
        Se o botão não funcionar, copia e cola esse link no navegador:<br />
        <span style="word-break:break-all;color:#db2777;">{{ .ConfirmationURL }}</span>
      </p>

      <p style="margin:16px 0 0;font-size:13px;color:#86868b;">
        Beijos,<br />
        <strong>Equipe Método TTS 🌹</strong>
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 2) Confirm Signup (Confirmação de cadastro)

> Não usamos signup público hoje (contas criadas via Kiwify webhook), mas
> deixo aqui caso ative no futuro.

**Subject:** `Confirme seu email 💕 Método TTS`

```html
<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#fce7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;line-height:1.5;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 24px -10px rgba(20,20,40,0.12);">
    <div style="padding:28px 28px 8px;background:#fff;text-align:center;">
      <div style="display:inline-block;font-weight:800;letter-spacing:-0.02em;line-height:1;">
        <span style="font-size:22px;font-weight:600;color:#1d1d1f;opacity:0.85;">método</span>
        <span style="font-size:30px;color:#db2777;margin-left:6px;">TTS</span>
      </div>
    </div>
    <div style="padding:8px 28px 24px;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;">
      <div style="font-weight:600;opacity:0.85;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;">Confirmação de email</div>
      <h1 style="margin:6px 0 0;font-size:24px;font-weight:800;letter-spacing:-0.02em;">
        Bem-vinda! ✨
      </h1>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 18px;font-size:14.5px;">
        Tô animada de te receber no <strong>Método TTS</strong>. Confirma seu email pra começar:
      </p>

      <a href="{{ .ConfirmationURL }}" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 20px;border-radius:999px;margin:0 0 18px;">
        Confirmar email →
      </a>

      <p style="margin:24px 0 0;font-size:13px;color:#86868b;">
        Beijos,<br />
        <strong>Equipe Método TTS 🌹</strong>
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 3) Magic Link

> Atualmente não usamos magic link. Deixo template caso ative.

**Subject:** `Seu link de acesso 🔮 Método TTS`

```html
<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#fce7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;line-height:1.5;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 24px -10px rgba(20,20,40,0.12);">
    <div style="padding:28px 28px 8px;background:#fff;text-align:center;">
      <div style="display:inline-block;font-weight:800;letter-spacing:-0.02em;line-height:1;">
        <span style="font-size:22px;font-weight:600;color:#1d1d1f;opacity:0.85;">método</span>
        <span style="font-size:30px;color:#db2777;margin-left:6px;">TTS</span>
      </div>
    </div>
    <div style="padding:8px 28px 24px;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;">
      <h1 style="margin:6px 0 0;font-size:24px;font-weight:800;letter-spacing:-0.02em;">
        Seu acesso chegou 💕
      </h1>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 18px;font-size:14.5px;">
        Toca no botão abaixo pra entrar no <strong>Método TTS</strong> sem digitar senha:
      </p>

      <a href="{{ .ConfirmationURL }}" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 20px;border-radius:999px;margin:0 0 18px;">
        Entrar no app →
      </a>

      <p style="margin:24px 0 0;font-size:13px;color:#86868b;">
        Beijos,<br />
        <strong>Equipe Método TTS 🌹</strong>
      </p>
    </div>
  </div>
</body>
</html>
```

---

## 4) Email Change (Trocar email)

**Subject:** `Confirme seu novo email 💌 Método TTS`

```html
<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#fce7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;line-height:1.5;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 24px -10px rgba(20,20,40,0.12);">
    <div style="padding:28px 28px 8px;background:#fff;text-align:center;">
      <div style="display:inline-block;font-weight:800;letter-spacing:-0.02em;line-height:1;">
        <span style="font-size:22px;font-weight:600;color:#1d1d1f;opacity:0.85;">método</span>
        <span style="font-size:30px;color:#db2777;margin-left:6px;">TTS</span>
      </div>
    </div>
    <div style="padding:8px 28px 24px;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;">
      <h1 style="margin:6px 0 0;font-size:24px;font-weight:800;letter-spacing:-0.02em;">
        Confirma o novo email 💌
      </h1>
    </div>

    <div style="padding:24px 28px;">
      <p style="margin:0 0 18px;font-size:14.5px;">
        Você pediu pra trocar o email da sua conta no <strong>Método TTS</strong>. Confirma pra ativar:
      </p>

      <a href="{{ .ConfirmationURL }}" style="display:block;width:100%;box-sizing:border-box;text-align:center;background:linear-gradient(135deg,#ec4899,#db2777);color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 20px;border-radius:999px;margin:0 0 18px;">
        Confirmar novo email →
      </a>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13px;color:#9a3412;margin:0 0 16px;">
        <strong>Não foi você?</strong> Ignora esse email — sua conta segue com o email antigo.
      </div>

      <p style="margin:16px 0 0;font-size:13px;color:#86868b;">
        Beijos,<br />
        <strong>Equipe Método TTS 🌹</strong>
      </p>
    </div>
  </div>
</body>
</html>
```

---

## Variáveis disponíveis

| Variável | O que é |
|---|---|
| `{{ .ConfirmationURL }}` | Link de ação (botão) — Supabase gera com token |
| `{{ .Email }}` | Email da aluna |
| `{{ .Token }}` | Código numérico (alternativa ao link) |
| `{{ .TokenHash }}` | Hash do token |
| `{{ .SiteURL }}` | URL configurada em Auth → URL Configuration |

## Observações

- Cor rose escolhida: `#ec4899` (rose-500) → `#db2777` (rose-600). Hex porque
  alguns clientes de email (Outlook, Gmail antigo) não renderizam oklch.
- Bg da página: `#fce7f3` (rose-100). Suave.
- Imagem logo: hardcoded `https://metodotts.app/tts-logo-horizontal.png`.
  Precisa que o domínio esteja apontando pra Vercel pra carregar.
- Botões com `display:block + width:100%` pra ficar bonito em mobile.
