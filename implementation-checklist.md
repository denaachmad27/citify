# Implementation Checklist — Citify

Estimasi total: 1-2 minggu untuk versi yang bisa dipakai publik (bukan sempurna, cukup untuk validasi).

---

## Fase 0 — Setup Project (Hari 1)

- [ ] Init Next.js 14 project dengan TypeScript + Tailwind
- [ ] Setup Prisma + koneksi PostgreSQL (lokal dulu, bisa pakai Supabase/Neon untuk dev cepat)
- [ ] Setup NextAuth.js dengan provider email + Google OAuth
- [ ] Setup struktur folder sesuai `coding-standards.md`
- [ ] Setup `.env.example` dan `.env.local`
- [ ] Install dependencies inti: `citation-js`, `cheerio`, `docx`, `zod`

---

## Fase 1 — Database Schema (Hari 1-2)

- [ ] Definisikan `schema.prisma`:
  - Model `User` (dari NextAuth)
  - Model `Project` (id, name, userId, createdAt, updatedAt)
  - Model `Citation` (id, projectId, format, text, metadata JSON, createdAt)
  - Model `UsageLog` (userId, month, citationCount) — untuk tracking freemium limit
- [ ] Jalankan migration pertama
- [ ] Seed data dummy untuk testing lokal

---

## Fase 2 — Metadata Fetching (Hari 2-3)

- [ ] Implementasi `lib/metadata-fetcher.ts`:
  - [ ] Fungsi fetch dari CrossRef API by DOI
  - [ ] Fungsi scraping meta tags generic pakai Cheerio (fallback untuk URL non-DOI)
  - [ ] Deteksi otomatis apakah input adalah DOI atau URL biasa
- [ ] Implementasi endpoint `POST /api/citations/fetch-metadata`
- [ ] Test manual dengan 10 sumber berbeda (5 jurnal via DOI, 5 artikel web umum) — catat rate keberhasilan

---

## Fase 3 — Citation Formatting (Hari 3-4)

- [ ] Implementasi `lib/citation-formatter.ts` wrapper di atas `citation-js`
- [ ] Implementasi format APA 7th, MLA 9th, Chicago (pakai citation-js langsung)
- [ ] **Riset dulu:** kumpulkan 3-5 contoh format "APA Indonesia" dari panduan skripsi kampus berbeda (cari di web, bandingkan aturan penulisan nama penulis Indonesia)
- [ ] Implementasi custom post-processor untuk APA Indonesia di atas basis APA 7th
- [ ] Implementasi endpoint `POST /api/citations/format`
- [ ] Unit test: bandingkan output dengan contoh sitasi manual yang sudah diverifikasi benar

---

## Fase 4 — Project & Citation Management (Hari 4-5)

- [ ] Endpoint `GET/POST /api/projects`
- [ ] Endpoint `GET /api/projects/:id`
- [ ] Endpoint `POST /api/projects/:id/citations`
- [ ] Endpoint `DELETE /api/projects/:id/citations/:citationId`
- [ ] Middleware auth check di semua endpoint project (kecuali fetch-metadata & format yang bisa diakses anonim dengan limit)

---

## Fase 5 — Freemium Gate & Rate Limiting (Hari 5-6)

- [ ] Implementasi counter penggunaan (tabel `UsageLog`, reset bulanan)
- [ ] Implementasi limit untuk user anonim (session/cookie based, 3 sitasi per sesi)
- [ ] Implementasi limit untuk user gratis (10/bulan, 1 project aktif)
- [ ] UI prompt upgrade ketika limit tercapai

---

## Fase 6 — Export ke Word (Hari 6-7)

- [ ] Implementasi `POST /api/export/docx` pakai library `docx`
- [ ] Sorting alfabetis otomatis berdasarkan nama belakang penulis sebelum export
- [ ] Test hasil export dibuka di Word/Google Docs — pastikan formatting tidak berantakan

---

## Fase 7 — Frontend UI (Hari 7-9, bisa paralel dengan fase backend)

- [ ] Landing page — value prop jelas, contoh sebelum/sesudah
- [ ] Form input sumber (URL/DOI/manual) dengan preview real-time
- [ ] Halaman dashboard — list project
- [ ] Halaman detail project — list sitasi, tombol export, tombol hapus
- [ ] State kosong (empty state) yang jelas untuk user baru
- [ ] Responsive check di mobile (banyak pelajar akses dari HP)

---

## Fase 8 — Payment Integration (Hari 9-10)

- [ ] Integrasi Midtrans/Xendit untuk upgrade ke premium
- [ ] Webhook handler untuk update status `user.plan` setelah pembayaran sukses
- [ ] Halaman pricing sederhana

---

## Fase 9 — Testing & Polish (Hari 10-12)

- [ ] Unit test untuk `citation-formatter.ts` dan `metadata-fetcher.ts`
- [ ] Manual QA: test flow lengkap dari landing → sitasi → export, sebagai user anonim dan user login
- [ ] Cek edge case: DOI tidak valid, URL mati, metadata sebagian kosong
- [ ] Perbaikan copy/UX berdasarkan hasil testing

---

## Fase 10 — Soft Launch (Hari 12-14)

- [ ] Deploy ke Vercel (atau VPS existing)
- [ ] Setup domain
- [ ] Share ke grup kecil (misal komunitas mahasiswa/forum skripsi) untuk validasi awal
- [ ] Setup analytics dasar (Plausible/Google Analytics) untuk track conversion freemium → premium

---

## Metrik Validasi yang Perlu Dipantau Setelah Launch

- Jumlah sitasi yang berhasil di-generate per hari
- Rate keberhasilan auto-fetch metadata (target >70% untuk sumber akademik)
- Conversion rate freemium → premium
- Retention: berapa % user yang kembali generate sitasi kedua kalinya
