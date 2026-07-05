# Citify

> Generator daftar pustaka otomatis — **gratis, tanpa daftar, tanpa simpan**.
> Pelajar tinggal input URL/DOI, pilih format, salin hasilnya.

🔗 **Repo**: https://github.com/denaachmad27/citify

## Tech Stack

- **Next.js 14** (App Router) + TypeScript strict
- **Tailwind CSS** untuk styling
- **citation-js** untuk format APA / MLA / Chicago
- **Cheerio** untuk scraping meta tags dari URL generik
- **Zod** untuk validasi request
- **Cloudflare Pages** untuk hosting (via `@cloudflare/next-on-pages`)

## Quick Start (Local)

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Scripts

| Command              | Fungsi                              |
|----------------------|-------------------------------------|
| `npm run dev`        | Jalankan Next.js dev server         |
| `npm run build`      | Production build (Next.js only)     |
| `npm run start`      | Jalankan production build           |
| `npm run lint`       | ESLint                              |
| `npm run typecheck`  | TypeScript type-check               |
| `npm run test`       | Unit test (Vitest)                  |

## Struktur Folder

```
citify/
├── app/
│   ├── api/citations/
│   │   ├── fetch-metadata/route.ts   # Ambil metadata dari DOI/URL
│   │   └── format/route.ts           # Format sitasi
│   ├── layout.tsx
│   ├── page.tsx                      # Halaman utama (SPA)
│   └── globals.css
├── components/
│   └── generate-form.tsx             # Form interaktif + history entri
├── lib/
│   ├── metadata-fetcher.ts           # CrossRef + Cheerio
│   ├── citation-formatter.ts         # citation-js + APA Indonesia
│   └── validations.ts                # Zod schemas
├── tests/                            # Unit test
├── .github/workflows/deploy.yml      # Auto-deploy ke Cloudflare Pages
├── wrangler.toml                     # Konfigurasi Cloudflare
├── types/citation.ts
├── tailwind.config.ts
└── package.json
```

## Deploy ke Cloudflare Pages

Deploy otomatis via GitHub Actions. Setiap push ke branch `main` akan trigger build & deploy.

### Setup sekali (di Cloudflare Dashboard)

1. Buka https://dash.cloudflare.com → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. Pilih repo `denaachmad27/citify`
3. Pada **Build settings**, set:
   - **Framework preset**: `Next.js`
   - **Build command**: `npx @cloudflare/next-on-pages@1.12.0`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: (kosong)
4. **Environment variables** (tidak wajib, tapi untuk nonaktifkan telemetry):
   - `NEXT_TELEMETRY_DISABLED` = `1`
5. **Save and Deploy** — Cloudflare akan build dan deploy.

### Atau via GitHub Actions (auto-deploy dari push)

Jika ingin kontrol penuh, gunakan workflow `.github/workflows/deploy.yml` yang sudah disiapkan:

1. Buat **Cloudflare API Token** di https://dash.cloudflare.com/profile/api-tokens
   - Template: **Edit Cloudflare Pages**
   - Account Resources: `<your-account>` · Cloudflare Pages:Edit
2. Salin **Account ID** dari sidebar dashboard Cloudflare
3. Di GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
   - `CLOUDFLARE_API_TOKEN` = `<token-dari-step-1>`
   - `CLOUDFLARE_ACCOUNT_ID` = `<account-id-dari-step-2>`
4. Push ke branch `main` (sudah dilakukan) — workflow akan jalan otomatis.

## API Endpoints

| Method | Path                              | Fungsi                                |
|--------|-----------------------------------|---------------------------------------|
| POST   | `/api/citations/fetch-metadata`   | Ambil metadata dari DOI/URL           |
| POST   | `/api/citations/format`           | Format metadata jadi string sitasi    |

## Cara Pakai (UX)

1. Buka halaman utama
2. Pilih tab **URL** atau **DOI**
3. Tempel URL artikel / ketik DOI
4. Pilih **Format** (APA, MLA, Chicago, atau APA Indonesia)
5. Tekan **+ Tambah** — entri baru muncul di daftar pustaka sesi
6. Ulangi untuk entri lainnya
7. **Salin entri** untuk satu per satu, atau **Salin semua** untuk menyalin daftar pustaka lengkap (urut alfabetis)

## Prinsip Desain

- **Tanpa database** — tidak ada Postgres/SQLite
- **Tanpa auth** — tidak ada NextAuth, OAuth, magic link
- **Tanpa payment** — tidak ada Midtrans/Xendit
- **Tanpa rate limit** — pakai sepuasnya
- **Data tidak disimpan ke server** — daftar pustaka ada di memori browser saja

## Catatan Penting

- **APA Indonesia** adalah format *custom* (non-standar internasional). Implementasi saat ini menggunakan heuristik: nama penulis ditulis lengkap urut (`Budi Santoso`, bukan `Santoso, B.`). Aturan ini perlu divalidasi dengan sample dari 3-5 kampus Indonesia sebelum finalisasi.
- Daftar pustaka hasil generate diurut alfabetis berdasarkan string sitasi lengkap menggunakan `localeCompare`.

## Lisensi

Internal use only.
