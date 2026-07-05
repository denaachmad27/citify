// POST /api/citations/format
// Format metadata menjadi string sitasi sesuai gaya yang dipilih.

import { NextResponse } from "next/server";
import { formatCitationRequestSchema } from "@/lib/validations";
import { formatCitation } from "@/lib/citation-formatter";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = formatCitationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Input tidak valid",
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    const citation = await formatCitation(parsed.data.metadata, parsed.data.format);

    return NextResponse.json({ success: true, citation });
  } catch (error) {
    console.error("format error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
