# Sprites Jornadas Método TTS

Pixel art assets pra feature `/jornadas`. **Enquanto não tiver sprites reais aqui, o `CharacterSprite.tsx` faz fallback automático pra emoji animado** — feature funciona sem assets, mas perde o wow factor de joguinho.

## Convenção de paths

```
public/sprites/
  characters/
    {stage}/
      idle.png         # sprite sheet horizontal, 4 frames de 64×64
      walk.png         # 8 frames de 64×64
      celebrating.png  # 6 frames de 64×64
      locked.png       # 1 frame de 64×64 (greyscale do idle)
      studying.png     # 4 frames de 64×64
  ui/
    coin.png           # 32×32
    xp-pill.png        # ~120×24
    lock-icon.png      # 24×24
    badge-frame.png    # 128×128 (moldura genérica)
  map/
    journey-1-bg.png   # 1280×800 (background pixel art Jornada 1)
    journey-2-bg.png
    journey-3-bg.png
    path-tile.png      # 32×32 tileable
    milestone-flag.png # 32×48
    locked-tile.png    # 32×32
  badges/
    primeira-aula.png       # 128×128 cada
    primeira-jornada.png
    trilogia.png
    primeira-venda.png
    vendedora-100.png
    vendedora-1000.png
    comentarista.png
    popular.png
    madrugadora.png
    coruja.png
    maratonista.png
    consistente.png
    adolescente.png
    adulta.png
    pioneira.png
```

**Stages:** `bebe`, `adolescente`, `adulta` (sem acento, snake-case).

**Sprite sheets** são horizontais: frame 0 vai de x=0 a x=63, frame 1 de x=64 a x=127, etc.

**Image rendering:** todos PNG com `image-rendering: pixelated` aplicado no CSS dos componentes.

## Specs visuais

- **Canvas:** 64×64px por frame (sprite-sheet) — escala 2-4x no display
- **Paleta:** 12 cores ancoradas no design system (rose `#fdb4c2`, peach `#ffd6a8`, lilac `#d4a8ff`, ink `#2a2a2a`, etc)
- **Estilo:** chibi, fofo, paleta quente, sem outline preto pesado (ou outline 1px no tom do design system)

### Bebê (Jornada 1)
- Chupeta, fralda visível
- Expressão "uau, eu existo"
- Cabelo ralo / babador
- Anims: idle (piscar), walk (passinhos curtos), celebrating (palminhas), studying (olhando blocos)

### Adolescente (Jornada 2)
- Celular na mão, fones de ouvido
- Cabelo soltinho, expressão confiante "já me viro"
- Roupa casual mais moderna
- Anims: idle (mexendo no celular), walk (passada normal), celebrating (selfie pose), studying (estudando em tablet)

### Adulta (Jornada 3)
- Notebook + xícara de café
- Cabelo arrumado, postura calma e poderosa
- Roupa estilo "criadora de conteúdo profissional"
- Anims: idle (sip do café), walk (caminhada elegante), celebrating (high-five), studying (anotando em planner)

## Pipeline de produção recomendado

1. **GPT-4o Image** (`gpt-image-1` via OpenAI API): gerar reference de cada stage. Prompt template:
   ```
   pixel art 64x64, chibi character, [stage description], soft palette
   {rose #fdb4c2, peach #ffd6a8, white background}, no outline
   ```
2. **Aseprite** (pago $20 ou trial): refinar pixel-by-pixel, animar frames, exportar sprite sheet horizontal PNG.
3. **Kenney.nl** (free CC0): puxar UI chrome (coin, badge frame, flag, lock icon) prontos do `Kenney Game Assets Bundle`.

## Quando substituir os emojis

`CharacterSprite.tsx` detecta automaticamente se o PNG existe (`onload` vs `onerror`). Subir o PNG no path correto faz o componente trocar **sem deploy de código**.

Pra ver em dev: `next.config.ts` serve `/public/*` direto, então `/sprites/characters/bebe/idle.png` fica em `https://www.metodotts.app/sprites/characters/bebe/idle.png`.
