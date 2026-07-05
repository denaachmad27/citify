# Citify

> Generator daftar pustaka otomatis — **gratis, tanpa daftar, tanpa simpan**.
> Pelajar tinggal input URL/DOI, pilih format, salin hasilnya.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript strict
- **Tailwind CSS** untuk styling
- **citation-js** untuk format APA / MLA / Chicago
- **Cheerio** untuk scraping meta tags dari URL generik
- **Zod** untuk validasi request

## Quick Start

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Scripts

| Command              | Fungsi                              |
|----------------------|-------------------------------------|
| `npm run dev`        | Jalankan Next.js dev server         |
| `npm run build`      | Production build                    |
| `npm run start`      | Jalankan production build           |
| `npm run lint`       | ESLint                              |
| `npm run typecheck`  | TypeScript type-check               |
| `npm run test`       | Unit test (Vitest)                  |

## Struktur Folder

```
citify/
├── app/
│   ├── api/
│   │   └── citations/
│   │       ├── fetch-metadata/route.ts   # Ambil metadata dari DOI/URL
│   │       └── format/route.ts           # Format sitasi
│   ├── layout.tsx                       # Root layout
│   ├── page.tsx                         # Halaman utama (SPA generator)
│   └── globals.css
├── components/
│   └── generate-form.tsx                # Form interaktif + history entri
├── lib/
│   ├── metadata-fetcher.ts              # CrossRef + Cheerio
│   ├── citation-formatter.ts            # citation-js wrapper + APA Indonesia
│   └── validations.ts                   # Zod schemas
├── tests/                               # Unit test
├── types/citation.ts
├── vitest.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

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

- **Tanpa database** — tidak ada Postgres/SQLite. Tidak ada Prisma.
- **Tanpa auth** — tidak ada NextAuth, tidak ada Google OAuth, tidak ada magic link.
- **Tanpa payment** — tidak ada Midtrans/Xendit. Gratis selamanya.
- **Tanpa rate limit** — tidak ada tracking usage. Pakai sepuasnya.
- **Data tidak disimpan ke server** — daftar pustaka ada di memori browser saja. Refresh = mulai ulang.

## Catatan Penting

- **APA Indonesia** adalah format *custom* (non-standar internasional). Implementasi saat ini menggunakan heuristik: nama penulis ditulis lengkap urut (`Budi Santoso`, bukan `Santoso, B.`). Aturan ini perlu divalidasi dengan sample dari 3-5 kampus Indonesia sebelum finalisasi.
- Daftar pustaka hasil generate diurut alfabetis berdasarkan string sitasi lengkap. Untuk hasil paling akurat sesuai standar APA, penulis pertama akan muncul di awal entri (yang biasanya berarti nama dibalik ke format "Family, F."). Perhatikan bahwa ini berbeda dengan pengurutan daftar pustaka tradisional yang hanya berdasarkan nama belakang penulis pertama — kami menggunakan pendekatan `localeCompare` sederhana untuk performa.

## Lisensi

Internal use only.
