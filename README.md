# Citify

> Generator daftar pustaka otomatis — **gratis, tanpa daftar, tanpa simpan**.
> Pelajar tinggal input URL/DOI, pilih format, salin hasilnya.

🔗 **Repo**: https://github.com/denaachmad27/citify

## Tech Stack

- **Next.js 14** (App Router) + TypeScript strict — **edge runtime** untuk semua API
- **Tailwind CSS** untuk styling
- **Cheerio** untuk scraping meta tags dari URL generik
- **Zod** untuk validasi request
- **Custom citation formatter** (pure TypeScript, edge-safe)
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
| `npm run build`      | Production build (Next.js)          |
| `npm run start`      | Jalankan production build           |
| `npm run lint`       | ESLint                              |
| `npm run typecheck`  | TypeScript type-check               |
| `npm run test`       | Unit test (Vitest, 22 tests)        |

## Struktur Folder

```
citify/
├── app/
│   ├── api/citations/
│   │   ├── fetch-metadata/route.ts   # Edge runtime — ambil metadata dari DOI/URL
│   │   └── format/route.ts           # Edge runtime — format sitasi
│   ├── layout.tsx
│   ├── page.tsx                      # Halaman utama (SPA)
│   └── globals.css
├── components/
│   └── generate-form.tsx             # Form interaktif + history entri
├── lib/
│   ├── metadata-fetcher.ts           # CrossRef + Cheerio
│   ├── citation-formatter.ts         # Manual formatter (edge-safe)
│   └── validations.ts                # Zod schemas
├── tests/                            # Unit test (22 tests)
├── .github/workflows/deploy.yml      # Auto-deploy ke Cloudflare Pages
├── wrangler.toml                     # Konfigurasi Cloudflare
├── types/citation.ts
├── tailwind.config.ts
└── package.json
```

## Deploy ke Cloudflare Pages

Deploy otomatis via Cloudflare Pages direct integration.

### Setup sekali (di Cloudflare Dashboard)

1. Buka https://dash.cloudflare.com → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. Pilih repo `denaachmad27/citify`
3. Pada **Build settings**, set:
   - **Framework preset**: `Next.js`
   - **Build command**: `npx @cloudflare/next-on-pages@1.12.0`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: (kosong)
4. **Environment variables** (opsional):
   - `NEXT_TELEMETRY_DISABLED` = `1`
5. **Save and Deploy** — Cloudflare akan build dan deploy otomatis.

### Atau via GitHub Actions

Lihat `.github/workflows/deploy.yml`. Butuh secrets:
- `CLOUDFLARE_API_TOKEN` (https://dash.cloudflare.com/profile/api-tokens)
- `CLOUDFLARE_ACCOUNT_ID` (lihat di sidebar dashboard)

## API Endpoints

| Method | Path                              | Runtime | Fungsi                                |
|--------|-----------------------------------|---------|---------------------------------------|
| POST   | `/api/citations/fetch-metadata`   | Edge    | Ambil metadata dari DOI/URL           |
| POST   | `/api/citations/format`           | Edge    | Format metadata jadi string sitasi    |

**Mengapa edge runtime?** Cloudflare Pages menjalankan semua routes sebagai edge functions (V8 isolate). API Citify tidak butuh Node.js APIs (fs, path, dll), sehingga edge runtime sempurna untuk latency rendah + cold-start cepat di edge network.

**Mengapa tidak pakai `citation-js`?** Library `citation-js` dan plugin CSL-nya menggunakan dynamic require + Node.js modules — tidak kompatibel dengan edge runtime. Sebagai gantinya, Citify pakai **custom formatter** (pure TypeScript, ~150 baris) yang mengimplementasikan 4 format secara manual: APA 7, MLA 9, Chicago Author-Date, APA Indonesia.

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
- **Edge-first** — semua proses di edge network untuk latency minimum

## Catatan Penting

- **APA Indonesia** adalah format *custom* (non-standar internasional). Implementasi saat ini menggunakan heuristik: nama penulis ditulis lengkap urut (`Budi Santoso`, bukan `Santoso, B.`). Aturan ini perlu divalidasi dengan sample dari 3-5 kampus Indonesia sebelum finalisasi.
- Daftar pustaka hasil generate diurut alfabetis berdasarkan string sitasi lengkap menggunakan `localeCompare`.
- Custom formatter menghasilkan output **mendekati** standar internasional (APA 7, MLA 9, Chicago 17), bukan 100% identik. Untuk skripsi formal yang butuh kepatuhan ketat, tetap gunakan reference manager (Zotero, Mendeley).

## Lisensi

Internal use only.
