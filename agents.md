# agents.md — Citify (Generator Daftar Pustaka Otomatis)

## Project Overview

**Nama produk:** Citify (working name)
**Tagline:** Paste link, dapat sitasi rapi — APA, MLA, Chicago, otomatis.
**Target user:** Mahasiswa & siswa SMA/SMK di Indonesia yang mengerjakan tugas, skripsi, atau makalah.
**Model bisnis:** B2C freemium/subscription.

**Problem yang diselesaikan:**
Mahasiswa sering salah format sitasi dan daftar pustaka. Tool referensi manajer yang ada (Mendeley, Zotero) terlalu berat/kompleks untuk kebutuhan sederhana, dan tidak mengakomodasi variasi format "APA Indonesia" yang dipakai banyak kampus lokal.

**Solusi:**
Web app ringan: user paste URL/DOI atau input manual → sistem fetch metadata otomatis → generate sitasi dalam beberapa format standar → kumpulkan jadi daftar pustaka → export ke Word.

---

## Scope MVP (JANGAN keluar dari scope ini)

### In-scope
- Input sumber: URL, DOI, manual entry
- Auto-extract metadata via CrossRef API (jurnal) + web scraping fallback (artikel umum)
- Format output: APA 7th, MLA 9th, Chicago, APA Indonesia (custom)
- Project/daftar pustaka builder per user (CRUD sitasi dalam satu project)
- Export ke .docx dan copy plain text
- Auth sederhana (email + Google OAuth)
- Freemium gate: 10 sitasi/bulan gratis tanpa save, unlimited + save untuk premium

### Out-of-scope (v2, jangan dikerjakan dulu)
- In-text citation generator
- Import dari Mendeley/Zotero/BibTeX
- Kolaborasi tim/kelompok dalam satu project
- OCR dari foto buku fisik
- Format sitasi selain 4 yang disebutkan di atas
- Mobile app native (web-only untuk MVP, responsive cukup)

**Aturan untuk AI agent:** Jika ada permintaan fitur yang masuk kategori out-of-scope, tandai sebagai "v2 backlog" di komentar kode, jangan diimplementasikan langsung tanpa konfirmasi eksplisit dari product owner.

---

## Tech Stack

| Layer | Teknologi | Catatan |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Server components untuk landing/marketing, client components untuk form interaktif |
| Styling | Tailwind CSS | Konsisten dengan stack Nara Studio |
| Backend | Next.js API Routes | Tidak perlu backend terpisah untuk MVP — kurangi kompleksitas deployment |
| Database | PostgreSQL | Lewat Prisma ORM |
| ORM | Prisma | Schema-first, migration terkelola |
| Auth | NextAuth.js (email + Google OAuth) | Session-based, JWT strategy |
| Citation formatting | `citation-js` (npm package) | Sudah support APA/MLA/Chicago; APA Indonesia dibuat sebagai custom style di atas basis APA 7th |
| Metadata fetching | CrossRef API (gratis, no key) + Cheerio untuk scraping fallback | CrossRef untuk DOI/jurnal, Cheerio untuk generic URL |
| Export | `docx` (npm package) untuk generate file Word | Alternatif: html-to-docx jika format lebih kompleks |
| Hosting | Vercel (frontend+API) atau VPS existing Nara Studio | Vercel lebih simpel untuk MVP validasi cepat |
| Payment | Midtrans atau Xendit | Untuk market Indonesia, support QRIS/e-wallet |

---

## Arsitektur Singkat

```
User Browser
    │
    ▼
Next.js Frontend (App Router)
    │
    ├── /api/citations/fetch-metadata   → CrossRef API / Cheerio scraping
    ├── /api/citations/format            → citation-js processing
    ├── /api/projects                    → CRUD project (Prisma → Postgres)
    ├── /api/export/docx                 → generate & return .docx file
    └── /api/auth/*                      → NextAuth.js handlers
    │
    ▼
PostgreSQL (via Prisma)
```

**Prinsip desain:** Stateless API routes, semua state project tersimpan di DB, session dikelola NextAuth. Tidak ada background job/queue di MVP — semua proses fetch metadata & format sitasi terjadi synchronous dalam request-response cycle (karena operasinya ringan dan cepat).

---

## Coding Conventions (ringkas — detail di coding-standards.md)

- TypeScript strict mode wajib
- Komponen React: functional component + hooks, tidak ada class component
- Naming: camelCase untuk variable/function, PascalCase untuk component/type
- Semua API route harus punya validasi input (pakai Zod)
- Error handling: konsisten pakai try-catch + return format error terstruktur `{ error: string, code: string }`

---

## Referensi Dokumen Lain

- `api-spec.md` — kontrak API detail (endpoint, request/response schema)
- `coding-standards.md` — konvensi kode, struktur folder, git flow
- `implementation-checklist.md` — daftar tugas implementasi bertahap

---

## Catatan untuk AI Agent

1. Selalu cek scope MVP di atas sebelum menambah fitur baru.
2. Prioritaskan library yang sudah battle-tested (`citation-js`, `docx`) daripada membangun formatter sitasi dari nol — ini bagian paling rawan bug kalau custom.
3. APA Indonesia BUKAN standar resmi internasional — ini adalah modifikasi custom berdasarkan kebiasaan kampus Indonesia (nama penulis Indonesia tidak dibalik urutannya). Perlu riset lebih lanjut/konfirmasi dengan sample dari 3-5 kampus sebelum finalisasi rule-nya. Tandai sebagai asumsi yang perlu divalidasi.
4. Untuk MVP, jangan over-engineer auth — email/password + Google OAuth cukup, tidak perlu multi-provider lain.
