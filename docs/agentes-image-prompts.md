# Prompts pras imagens dos Agentes Yara

Tamanho ideal: **1200×750 px** (relação ~16:10).
Quando exportar, salvar como `.webp` (mais leve) ou `.jpg` qualidade 85.

## Onde gerar

- **Gemini Imagen 3 / 4** — gratuito via `gemini.google.com` → "Criar imagem"
- **Midjourney** — Discord, mais artístico
- **DALL·E 3** — via ChatGPT Plus
- **Ideogram / Flux** — ideogram.ai (free tier)

Recomendo **Gemini Imagen** pra começar — grátis e tem ótima qualidade pra esse caso.

## Estilo geral (cole junto com qualquer prompt)

```
Style: soft modern editorial illustration, pastel palette, gentle gradient
background, subtle 3D depth, clean composition, no text, no logos,
no watermarks, Instagram aesthetic, brand-friendly, professional but
friendly, light feminine touch. Aspect ratio 16:10.
```

---

## 📊 1. Info — Análise de Produto

**Slug:** `info` · **Cor base:** rosa/coral
**Arquivo:** `info.webp`

```
A flat-lay overhead view of a clean desk with a smartphone displaying a
product analysis dashboard, surrounded by a magnifying glass, a small pink
notebook, a delicate fresh pink rose, and a coral-pink gradient background.
Minimalist, editorial photography style, soft natural lighting, pastel pink
and cream tones. No text, no logos. Aspect ratio 16:10.
```

---

## 💪 2. Suplementos

**Slug:** `scripts-suplementos` · **Cor base:** laranja/âmbar
**Arquivo:** `suplementos.webp`

```
A bright modern still life with a clear glass shaker containing protein
powder, a small pile of golden capsules, fresh tropical fruits like orange
and passionfruit, and a soft warm orange-to-amber gradient background.
Editorial wellness photography, soft natural light, premium aesthetic, no
text or logos. Aspect ratio 16:10.
```

---

## 🧴 3. Skincare

**Slug:** `scripts-skincare` · **Cor base:** rosa pálido
**Arquivo:** `skincare.webp`

```
A minimal beauty flat-lay with elegant unbranded skincare bottles in soft
pink and cream tones, a single droplet of clear serum, fresh rose petals,
and a powder-pink gradient background. Editorial skincare photography,
diffused lighting, dreamy aesthetic, no text or labels. Aspect ratio 16:10.
```

---

## 💇‍♀️ 4. Cabelo

**Slug:** `scripts-cabelo` · **Cor base:** âmbar/dourado
**Arquivo:** `cabelo.webp`

```
A soft golden-hour still life with a sleek unbranded amber glass shampoo
bottle, a wooden hairbrush, strands of glossy healthy hair flowing, and a
warm amber-to-honey gradient background. Editorial hair care aesthetic,
glow lighting, premium and feminine, no text or labels. Aspect ratio 16:10.
```

---

## 🌸 5. Perfumes & Body Splash

**Slug:** `scripts-perfumes` · **Cor base:** rosa/violeta
**Arquivo:** `perfumes.webp`

```
An elegant beauty still life with a faceted clear perfume bottle catching
light, soft pink peony petals scattered around, a delicate cloud of mist,
and a pink-to-lavender gradient background. Editorial fragrance photography,
dreamy soft lighting, feminine and sensorial, no text or logos. Aspect
ratio 16:10.
```

---

## 🏠 6. Casa e Organização

**Slug:** `scripts-casa-organizacao` · **Cor base:** verde menta/teal
**Arquivo:** `casa-organizacao.webp`

```
A clean overhead flat-lay of perfectly organized home essentials — neatly
folded white towels, small bamboo storage boxes, a tiny green plant in a
terracotta pot, on a soft mint-to-teal gradient background. Editorial home
organization aesthetic, bright natural light, calm and satisfying, no text
or labels. Aspect ratio 16:10.
```

---

## 👗 7. Moda

**Slug:** `scripts-moda` · **Cor base:** índigo/violeta
**Arquivo:** `moda.webp`

```
A stylish flat-lay of curated outfit pieces — a folded oversized white
shirt, gold delicate jewelry, soft beige fabric draped, on an indigo-to-
violet gradient background. Editorial fashion magazine aesthetic, soft
side lighting, elevated and minimal, no text or labels. Aspect ratio 16:10.
```

---

## 📱 8. Eletrônicos

**Slug:** `scripts-eletronicos` · **Cor base:** azul céu/ciano
**Arquivo:** `eletronicos.webp`

```
A modern tech flat-lay with sleek unbranded white wireless earbuds in their
case, a thin smartwatch face up, a small portable charger, and a clean
soft sky-blue-to-cyan gradient background. Editorial tech aesthetic, crisp
soft lighting, premium and minimal, no text, no logos, no brand marks.
Aspect ratio 16:10.
```

---

## 💬 9. Suporte Yara

**Slug:** `suporte` · **Cor base:** azul/céu
**Arquivo:** `suporte.webp`

```
A friendly cozy desk scene with a smartphone showing a chat conversation
bubble, a warm cup of tea or coffee, a small notebook with a pen, soft
focus pink flowers in the background, on a sky-blue gradient background.
Editorial lifestyle photography, warm soft lighting, welcoming and
supportive, no text or logos. Aspect ratio 16:10.
```

---

## Como subir as imagens

1. **Gera as 9 imagens** (Gemini Imagen / Midjourney / DALL·E).
2. **Sobe num CDN público** — opções:
   - **Supabase Storage** (já temos, bucket `agentes-images` precisa ser criado público)
   - **Cloudinary** free tier
   - **Vercel Blob** (já vem com Vercel Pro)
   - **GitHub** (commita as imagens em `/public/agentes/*.webp` e referencia como `/agentes/skincare.webp`)
3. **Cola a URL** em `lib/agents-catalog.ts` no campo `imageUrl: "..."` do agente correspondente.

### Opção mais simples: pasta `public/agentes/`

Salva as 9 imagens como:
```
public/agentes/info.webp
public/agentes/suplementos.webp
public/agentes/skincare.webp
public/agentes/cabelo.webp
public/agentes/perfumes.webp
public/agentes/casa-organizacao.webp
public/agentes/moda.webp
public/agentes/eletronicos.webp
public/agentes/suporte.webp
```

E preenche o catálogo:
```ts
imageUrl: "/agentes/skincare.webp"
```

Pronto — Vercel serve direto, sem precisar de CDN externo.
