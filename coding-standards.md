# Coding Standards — Citify

## Struktur Folder

```
citify/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx                 # landing page
│   ├── (app)/
│   │   ├── dashboard/page.tsx
│   │   ├── project/[id]/page.tsx
│   │   └── layout.tsx               # layout dengan auth check
│   ├── api/
│   │   ├── citations/
│   │   │   ├── fetch-metadata/route.ts
│   │   │   └── format/route.ts
│   │   ├── projects/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── citations/route.ts
│   │   ├── export/docx/route.ts
│   │   └── auth/[...nextauth]/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                          # komponen dasar (button, input, dll)
│   ├── citation-form.tsx
│   ├── citation-preview.tsx
│   └── project-list.tsx
├── lib/
│   ├── prisma.ts                    # prisma client singleton
│   ├── citation-formatter.ts        # wrapper di atas citation-js
│   ├── metadata-fetcher.ts          # logic CrossRef + scraping
│   └── validations.ts               # Zod schemas
├── prisma/
│   └── schema.prisma
├── types/
│   └── citation.ts
└── docs/                            # dokumen ini
```

---

## Konvensi Penamaan

| Item | Konvensi | Contoh |
|---|---|---|
| Variable & function | camelCase | `fetchMetadata`, `citationText` |
| Component | PascalCase | `CitationForm`, `ProjectList` |
| Type/Interface | PascalCase dengan prefix jelas | `CitationMetadata`, `ProjectResponse` |
| File komponen | kebab-case | `citation-form.tsx` |
| API route folder | kebab-case | `fetch-metadata/route.ts` |
| Database table/column | snake_case | `citation_count`, `created_at` |
| Konstanta | UPPER_SNAKE_CASE | `MAX_FREE_CITATIONS` |

---

## TypeScript

- Strict mode wajib aktif di `tsconfig.json`
- Hindari `any` — kalau terpaksa, beri komentar alasan
- Semua fungsi exported harus punya type return eksplisit
- Gunakan Zod untuk validasi runtime + infer type dari schema Zod, jangan duplikasi definisi type manual

Contoh pola yang diharapkan:
```typescript
const citationRequestSchema = z.object({
  sourceType: z.enum(["url", "doi"]),
  value: z.string().min(1),
});

type CitationRequest = z.infer<typeof citationRequestSchema>;
```

---

## API Route Pattern

Setiap API route harus mengikuti pola ini:

```typescript
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = citationRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Input tidak valid", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    // logic utama di sini, idealnya dipanggil dari lib/ bukan ditulis inline

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
```

**Aturan:** logic bisnis (fetch metadata, format citation) harus ada di `lib/`, bukan langsung di dalam route handler. Route handler hanya bertugas validasi input, panggil fungsi lib, dan format response.

---

## Komponen React

- Functional component + hooks saja, tidak ada class component
- Gunakan Server Components secara default; tambahkan `"use client"` hanya kalau butuh interaktivitas (state, event handler)
- Props harus punya interface eksplisit, tidak inline typing untuk komponen yang dipakai lebih dari 1 tempat

---

## Git Flow

Konsisten dengan pola yang sudah dipakai di project Nara Studio sebelumnya:

- `main` — production, hanya menerima merge dari `develop` via PR
- `develop` — integration branch
- `feature/nama-fitur` — branch kerja per fitur
- Commit message format: `type(scope): deskripsi singkat`
  - Contoh: `feat(citations): add DOI metadata fetching`
  - Type yang dipakai: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`

---

## Environment Variables

Semua secret/config lewat `.env.local` (tidak pernah commit ke git):

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MIDTRANS_SERVER_KEY=
```

Sediakan `.env.example` dengan key yang sama tapi value kosong, untuk referensi setup.

---

## Testing (Minimal untuk MVP)

Tidak perlu full test coverage di MVP, tapi wajib ada unit test untuk:
- `lib/citation-formatter.ts` — pastikan output format APA/MLA/Chicago sesuai contoh standar
- `lib/metadata-fetcher.ts` — mock response CrossRef API, pastikan parsing benar

Gunakan Vitest (lebih ringan dari Jest untuk project Next.js baru).

---

## Hal yang Harus Dihindari (Lessons dari Project Sebelumnya)

- Jangan taruh logic bisnis di dalam component React — susah ditest dan reuse
- Jangan hardcode string error — selalu pakai konstanta code error yang terdaftar di api-spec.md
- Jangan skip validasi input di API route walau "cuma MVP" — ini sumber bug paling sering muncul saat testing manual
- Jangan implementasi fitur di luar scope MVP tanpa update agents.md dulu (biar dokumentasi & kode tidak divergen)
