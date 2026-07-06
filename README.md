# Citify

> Generator daftar pustaka otomatis — **gratis, tanpa daftar, tanpa simpan**.
> Pelajar tinggal input URL/DOI, pilih format, salin hasilnya.

🔗 **Repo**: https://github.com/denaachmad27/citify

## Tech Stack

- **Frontend**: HTML + CSS (Tailwind via CDN) + Vanilla JS — **satu file, nol dependency**
- **Backend**: [Hono](https://hono.dev/) di [Cloudflare Workers](https://workers.cloudflare.com/) — edge runtime, cold start ~0ms
- **CrossRef API**: Dipanggil langsung dari browser (CORS diizinkan) — no proxy needed
- **Citation Formatter**: Pure JavaScript inline — 4 format (APA, MLA, Chicago, APA Indonesia)
- **Hosting**: Frontend di GitHub Pages / Netlify — Worker di Cloudflare

## Arsitektur

```
Browser (index.html)
  ├── DOI → https://api.crossref.org/works/... (langsung ✅ CORS)
  ├── URL → POST /api/scrape → Hono Worker → parse meta tags
  └── Formatting → pure JS di browser (4 format)
           │
           ▼
      Hono Worker (worker/src/index.ts)
        1 endpoint: POST /api/scrape
        - fetch HTML dari URL eksternal
        - parse meta tags (citation_*, og:*, dc.*)
        - return JSON metadata
```

## Quick Start

### Frontend (langsung buka)

```bash
# Buka aja file ini di browser:
open index.html
# Atau via live-server:
npx serve .
```

### Worker (local dev)

```bash
cd worker
npm install
npm run dev          # → http://localhost:8787
```

Test scraping:

```bash
curl -X POST http://localhost:8787/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/artikel"}'
```

## Deploy

### Frontend — GitHub Pages

```bash
# Push index.html ke repo → enable GitHub Pages di Settings
# URL: https://denaachmad27.github.io/citify/
```

### Worker — Cloudflare

```bash
cd worker
npm run deploy       # → https://citify-worker.denaachmad27.workers.dev
```

Set Worker URL di frontend: edit `SCRAPE_API` di index.html.

## Struktur Folder

```
citify/
├── index.html                     # Frontend SPA (file tunggal)
├── worker/                        # Hono Cloudflare Worker
│   ├── src/
│   │   └── index.ts              # 1 endpoint: POST /api/scrape
│   ├── wrangler.toml              # Konfigurasi Worker
│   ├── package.json
│   └── tsconfig.json
├── .github/workflows/deploy.yml   # CI/CD Worker
├── README.md
├── agents.md                      # Project guidelines (AI)
├── api-spec.md                    # API docs
├── coding-standards.md            # Coding conventions
└── implementation-checklist.md    # Task list
```

## API Endpoints

| Method | Path           | Runtime        | Fungsi                           |
|--------|----------------|----------------|----------------------------------|
| POST   | `/api/scrape`  | Cloudflare Edge | Scrape metadata dari URL         |
| GET    | `/api/health`  | Cloudflare Edge | Health check                     |

## Catatan

- **APA Indonesia** adalah format *custom* (non-standar internasional). Nama penulis Indonesia ditulis urut lengkap (`Budi Santoso`, bukan `Santoso, B.`).
- Daftar pustaka hanya di memori sesi browser — refresh = mulai ulang.
- CrossRef API gratis dan publik — tidak butuh API key.
