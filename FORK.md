# Forking Atrium for a new project

Atrium is a **forkable site foundation**.  
The engine (`src/`, `kit/`) stays generic. Each product is a **site pack** under `sites/`.

## Mental model

```
Atrium
├── brand/               # Atrium foundation brand (mark / wordmark)
├── src/                 # generic modules (home, wiki, forums, store, pulse, radio…)
├── kit/                 # schema + contracts
├── sites/
│   └── shoe-atelier/    # example demo pack (Solecraft Atelier)
├── site.config.json     # ACTIVE pack config (generated)
└── content/             # ACTIVE pack content (generated)
```

## Create a new site

```bash
pnpm site:new -- my-brand
# edit sites/my-brand/site.config.json
# replace sites/my-brand/content/*
# replace public/assets/* as needed
pnpm site:use -- my-brand
pnpm atriumid:migrate
pnpm dev
```

## What you change vs what you keep

| Change per fork | Keep (engine) |
|---|---|
| `sites/<id>/site.config.json` | `src/app/**` routes |
| `sites/<id>/content/**` | Wiki / forums / store / pulse / radio modules |
| `public/assets/**` | Auth / shell patterns |
| Feature flags (`map`, `guilds`, `radio`…) | Build scripts |
| Theme colors + fonts | Atrium ID core |

## Feature flags

```json
"features": {
  "map": false,
  "guilds": false,
  "store": true,
  "pulse": true,
  "radio": false
}
```

## Theme

Colors in `site.config.json → theme` are injected as CSS variables on `<body>`:

- `--atr-brand`, `--atr-brand-hover`, CTA / night / gold tokens, font stacks

See `brand/README.md` for the Atrium foundation palette (separate from your product theme).

## Downstream private products

Clone this public kit into a **private** repository for a real brand. Keep product lore, member data, and private ops docs only in that private fork.
