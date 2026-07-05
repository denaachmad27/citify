// POST /api/citations/fetch-metadata
// Ambil metadata publikasi dari DOI (CrossRef) atau URL (Cheerio).
// Stateless, publik, tanpa rate limit.

import { NextResponse } from "next/server";
import { fetchMetadataRequestSchema } from "@/lib/validations";
import { fetchMetadata } from "@/lib/metadata-fetcher";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = fetchMetadataRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Input tidak valid", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const metadata = await fetchMetadata(parsed.data.source_type, parsed.data.value);

    if (!metadata) {
      return NextResponse.json(
        {
          success: false,
          error: "Metadata tidak dapat diambil otomatis, silakan coba URL lain",
          code: "METADATA_NOT_FOUND",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, metadata });
  } catch (error) {
    console.error("fetch-metadata error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
