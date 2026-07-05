# API Specification — Citify

Base URL (dev): `http://localhost:3000/api`
Base URL (prod): `https://citify.app/api` *(placeholder domain)*

Semua request/response menggunakan `Content-Type: application/json` kecuali endpoint export (mengembalikan file binary).

---

## Auth

Menggunakan NextAuth.js — endpoint auth otomatis tersedia di `/api/auth/*` (signin, signout, session, callback). Tidak perlu didefinisikan manual, cukup konfigurasi provider di `[...nextauth].ts`.

Semua endpoint di bawah (kecuali disebutkan "public") memerlukan session valid. Jika tidak ada session, endpoint tetap bisa diakses untuk user anonim tapi dengan limit freemium (lihat rate limiting di bagian bawah).

---

## 1. Fetch Metadata dari Sumber

### `POST /api/citations/fetch-metadata`

Mengambil metadata (judul, penulis, tahun, penerbit) dari URL atau DOI yang diberikan.

**Request body:**
```json
{
  "source_type": "url" | "doi",
  "value": "https://example.com/artikel" 
}
```

**Response 200:**
```json
{
  "success": true,
  "metadata": {
    "title": "Judul Artikel atau Jurnal",
    "authors": [
      { "given": "Budi", "family": "Santoso" }
    ],
    "published_year": 2023,
    "publisher": "Nama Jurnal/Penerbit",
    "url": "https://example.com/artikel",
    "doi": "10.1234/xyz" ,
    "source_type": "journal" | "webpage" | "book"
  }
}
```

**Response 422 (metadata tidak ditemukan):**
```json
{
  "success": false,
  "error": "Metadata tidak dapat diambil otomatis, silakan input manual",
  "code": "METADATA_NOT_FOUND"
}
```

**Logic:**
1. Jika `source_type = "doi"` → query CrossRef API (`https://api.crossref.org/works/{doi}`)
2. Jika `source_type = "url"` → coba cek apakah URL mengandung DOI pattern dulu, kalau tidak → scraping meta tags (`og:title`, `citation_author`, dll) pakai Cheerio
3. Jika scraping gagal total → return 422, arahkan user ke manual input

---

## 2. Format Sitasi

### `POST /api/citations/format`

Mengubah metadata jadi string sitasi sesuai format yang dipilih.

**Request body:**
```json
{
  "metadata": {
    "title": "Judul Artikel",
    "authors": [{ "given": "Budi", "family": "Santoso" }],
    "published_year": 2023,
    "publisher": "Nama Jurnal",
    "url": "https://example.com/artikel",
    "doi": "10.1234/xyz"
  },
  "format": "apa" | "mla" | "chicago" | "apa_indonesia"
}
```

**Response 200:**
```json
{
  "success": true,
  "citation": "Santoso, B. (2023). Judul Artikel. Nama Jurnal. https://example.com/artikel"
}
```

**Catatan implementasi:** gunakan `citation-js` untuk format `apa`, `mla`, `chicago`. Untuk `apa_indonesia`, terapkan post-processing di atas hasil APA 7th (aturan spesifik didefinisikan terpisah setelah riset kampus — lihat catatan di agents.md).

---

## 3. Manajemen Project (Daftar Pustaka)

### `GET /api/projects`
List semua project milik user yang sedang login.

**Response 200:**
```json
{
  "projects": [
    { "id": "uuid", "name": "Skripsi Bab 2", "citation_count": 12, "updated_at": "2026-07-01T10:00:00Z" }
  ]
}
```

### `POST /api/projects`
Buat project baru.

**Request body:**
```json
{ "name": "Skripsi Bab 2" }
```

**Response 201:**
```json
{ "id": "uuid", "name": "Skripsi Bab 2", "created_at": "2026-07-03T10:00:00Z" }
```

### `GET /api/projects/:id`
Detail satu project + semua sitasi di dalamnya.

**Response 200:**
```json
{
  "id": "uuid",
  "name": "Skripsi Bab 2",
  "citations": [
    { "id": "uuid", "format": "apa", "text": "Santoso, B. (2023)...", "created_at": "..." }
  ]
}
```

### `POST /api/projects/:id/citations`
Tambah sitasi ke project.

**Request body:**
```json
{ "metadata": { }, "format": "apa", "text": "Santoso, B. (2023)..." }
```

**Response 201:** objek sitasi yang baru dibuat.

### `DELETE /api/projects/:id/citations/:citationId`
Hapus sitasi dari project.

**Response 204:** no content.

---

## 4. Export

### `POST /api/export/docx`

**Request body:**
```json
{ "project_id": "uuid" }
```

**Response 200:** file binary `.docx` dengan header:
```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="daftar-pustaka.docx"
```

Sitasi diurutkan alfabetis berdasarkan nama belakang penulis pertama sebelum digenerate ke dokumen.

---

## Rate Limiting / Freemium Gate

| Kondisi | Limit |
|---|---|
| User anonim (belum login) | 3 sitasi per sesi, tidak bisa save project |
| User gratis (sudah login) | 10 sitasi/bulan, maksimal 1 project aktif |
| User premium | Unlimited sitasi & project, akses export docx tanpa batas |

Implementasi: middleware cek `session.user.plan` dan counter di tabel `usage_logs` (reset tiap tanggal 1). Untuk user anonim, gunakan cookie/session token sementara (tidak perlu tabel DB, cukup in-memory atau Redis kalau sudah scale).

---

## Error Response Format (Konsisten di Semua Endpoint)

```json
{
  "success": false,
  "error": "Pesan error yang human-readable",
  "code": "ERROR_CODE_CONSTANT"
}
```

Daftar kode error umum:
- `METADATA_NOT_FOUND`
- `INVALID_INPUT`
- `UNAUTHORIZED`
- `LIMIT_EXCEEDED`
- `PROJECT_NOT_FOUND`
- `INTERNAL_ERROR`
