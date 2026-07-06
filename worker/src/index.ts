/**
 * Citify Worker — Hono-based edge worker untuk scraping metadata URL.
 *
 * Satu-satunya endpoint:
 *   POST /api/scrape  →  fetch HTML dari URL, parse meta tags, return JSON
 *
 * DOI tidak diproses di sini; browser langsung ke CrossRef API (CORS diizinkan).
 */
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

// ─── Allowed Origins (CORS) ──────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://citify.app",
  "https://denaachmad27.github.io",
  "http://localhost:3000",
  "http://localhost:8787",
];

// Izinkan CORS hanya dari origin yang terdaftar
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      // Izinkan juga request tanpa origin (curl, Postman, server-to-server)
      if (!origin) return "*";
      if (ALLOWED_ORIGINS.includes(origin)) return origin;
      // Di development, izinkan localhost dengan port apapun
      if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return origin;
      }
      return ALLOWED_ORIGINS[0]; // fallback ke production origin
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    maxAge: 86400,
  })
);

// ─── Security Headers Middleware ──────────────────────────────────────
app.use("/api/*", async (c, next) => {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("X-XSS-Protection", "1; mode=block");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  c.res.headers.set(
    "Permissions-Policy",
    "accelerometer=(), camera=(), geolocation=(), microphone=(), payment=()"
  );
  c.res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
});

// ─── Rate Limiting (in-memory, per-IP) ───────────────────────────────
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Bersihkan entry expired setiap 5 menit
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupRateLimitMap() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  cleanupRateLimitMap();
  const WINDOW_MS = 60 * 1000; // 1 menit
  const MAX_REQUESTS = 30; // 30 request per menit per IP
  const now = Date.now();

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  entry.count++;
  if (entry.count > MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

// Rate limiting middleware
app.use("/api/*", async (c, next) => {
  // Gunakan CF-Connecting-IP (disediakan oleh Cloudflare) atau fallback ke header x-real-ip
  const ip =
    c.req.header("CF-Connecting-IP") ||
    c.req.header("x-real-ip") ||
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return c.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti.", code: "RATE_LIMITED" },
      429
    );
  }

  c.res.headers.set("X-RateLimit-Remaining", String(remaining));
  await next();
});

// ─── HTML Meta Parser (regex-based, edge-safe) ──────────────────────

const HTML_ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " ",
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMetaRegex(attrValue: string, global: boolean): RegExp {
  const escaped = escapeRegex(attrValue);
  const flags = global ? "gi" : "i";
  return new RegExp(
    `<meta\\s+[^>]*?\\b(?:name|property)=["']${escaped}["'][^>]*?\\bcontent=["']([^"']*)["']` +
      `|<meta\\s+[^>]*?\\bcontent=["']([^"']*)["'][^>]*?\\b(?:name|property)=["']${escaped}["']`,
    flags
  );
}

function decodeHtmlEntities(s: string): string {
  if (!s) return s;
  return s
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (m) => HTML_ENTITY_MAP[m] ?? m)
    .replace(/&#(\d+);/g, (_, d) => {
      const n = parseInt(d, 10);
      return isNaN(n) ? "" : String.fromCharCode(n);
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
      const n = parseInt(h, 16);
      return isNaN(n) ? "" : String.fromCharCode(n);
    });
}

function getMetaContent(html: string, attrValue: string): string | null {
  const re = buildMetaRegex(attrValue, false);
  const m = html.match(re);
  if (!m) return null;
  return decodeHtmlEntities((m[1] ?? m[2] ?? "").trim());
}

function getAllMetaContents(html: string, attrValue: string): string[] {
  const re = buildMetaRegex(attrValue, true);
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const val = decodeHtmlEntities((m[1] ?? m[2] ?? "").trim());
    if (val) out.push(val);
  }
  return out;
}

function getTitleTag(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  return decodeHtmlEntities(m[1].trim());
}

// ─── Author parsing ─────────────────────────────────────────────────

interface Author {
  given: string;
  family: string;
}

function parseAuthorName(full: string): Author {
  const cleaned = full.trim();
  if (cleaned.includes(",")) {
    const [family, given] = cleaned.split(",").map((s) => s.trim());
    return { family: family || cleaned, given: given || "" };
  }
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return { given: "", family: parts[0] };
  const family = parts[parts.length - 1];
  const given = parts.slice(0, -1).join(" ");
  return { given, family };
}

function extractYearFromDate(dateStr: string): number | null {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.getFullYear();
  const m = dateStr.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
}

// ─── SSRF Protection ─────────────────────────────────────────────────

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "metadata.google.internal",       // GCP metadata
  "169.254.169.254",                 // AWS/Azure/GCP metadata IP
]);

// Private IPv4 ranges (CIDR)
const PRIVATE_IPV4_RANGES = [
  { prefix: 0x0a000000, mask: 0xff000000 },      // 10.0.0.0/8
  { prefix: 0xac100000, mask: 0xfff00000 },      // 172.16.0.0/12
  { prefix: 0xc0a80000, mask: 0xffff0000 },      // 192.168.0.0/16
  { prefix: 0x7f000000, mask: 0xff000000 },      // 127.0.0.0/8
  { prefix: 0xa9fe0000, mask: 0xffff0000 },      // 169.254.0.0/16 (link-local)
];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let result = 0;
  for (let i = 0; i < 4; i++) {
    const n = parseInt(parts[i], 10);
    if (isNaN(n) || n < 0 || n > 255) return null;
    result = (result << 8) | n;
  }
  return result >>> 0; // unsigned
}

function isPrivateIPv4(ip: string): boolean {
  const int = ipv4ToInt(ip);
  if (int === null) return false;
  return PRIVATE_IPV4_RANGES.some(
    (range) => (int & range.mask) === range.prefix
  );
}

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(lower)) return true;
  // Block bare IPv4 in hostname position
  if (isPrivateIPv4(lower)) return true;
  // Block IPv6 loopback shorthand
  if (lower === "::1" || lower === "[::1]") return true;
  return false;
}

// ─── Scraper ────────────────────────────────────────────────────────

interface ScrapeResult {
  success: true;
  title: string;
  authors: Author[];
  published_year: number | null;
  publisher: string | null;
  url: string;
  doi: string | null;
  source_type: "journal" | "webpage" | "book";
}

async function scrapeUrl(url: string): Promise<ScrapeResult | { success: false; error: string }> {
  // Validasi URL
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { success: false, error: "Hanya protokol http/https yang didukung" };
    }
  } catch {
    return { success: false, error: "URL tidak valid" };
  }

  // SSRF Protection — blokir hostname/IP internal
  if (isBlockedHostname(parsed.hostname)) {
    return { success: false, error: "URL dengan hostname internal tidak diizinkan" };
  }

  // Fetch HTML
  const res = await fetch(parsed.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CitifyBot/0.1; +https://citify.app)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(10_000), // timeout 10 detik
  });

  if (!res.ok) {
    return { success: false, error: `Gagal mengambil halaman: ${res.status} ${res.statusText}` };
  }

  const html = await res.text();
  if (html.length > 500_000) {
    return { success: false, error: "Halaman terlalu besar (>500KB)" };
  }

  // Title
  const title =
    getMetaContent(html, "citation_title") ??
    getMetaContent(html, "og:title") ??
    getTitleTag(html) ??
    "";
  if (!title) {
    return { success: false, error: "Tidak dapat menemukan judul halaman" };
  }

  // Authors
  const authorStrs = getAllMetaContents(html, "citation_author");
  const authors: Author[] = authorStrs
    .filter((s) => s.trim().length > 0)
    .map(parseAuthorName);

  if (authors.length === 0) {
    const dcCreator = getMetaContent(html, "dc.creator");
    if (dcCreator) {
      authors.push(
        ...dcCreator
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .map(parseAuthorName)
      );
    }
  }
  if (authors.length === 0) {
    const ogAuthor = getMetaContent(html, "article:author");
    if (ogAuthor) authors.push(parseAuthorName(ogAuthor));
  }
  if (authors.length === 0) {
    return { success: false, error: "Tidak dapat menemukan data penulis" };
  }

  // Year
  const dateStr =
    getMetaContent(html, "citation_publication_date") ??
    getMetaContent(html, "citation_date") ??
    getMetaContent(html, "article:published_time") ??
    getMetaContent(html, "dc.date") ??
    "";
  const year = dateStr ? extractYearFromDate(dateStr) : null;

  // Publisher
  const publisher =
    getMetaContent(html, "citation_journal_title") ??
    getMetaContent(html, "citation_publisher") ??
    getMetaContent(html, "og:site_name") ??
    null;

  // DOI
  const doi = getMetaContent(html, "citation_doi") ?? null;

  return {
    success: true,
    title: title.trim(),
    authors,
    published_year: year,
    publisher: publisher?.trim() ?? null,
    url: parsed.toString(),
    doi,
    source_type: doi ? "journal" : "webpage",
  };
}

// ─── Routes ─────────────────────────────────────────────────────────

app.post("/api/scrape", async (c) => {
  try {
    const body = await c.req.json<{ url?: string }>();
    const url = body?.url?.trim();

    if (!url) {
      return c.json({ error: "Parameter 'url' wajib diisi" }, 400);
    }

    const result = await scrapeUrl(url);
    if (!result.success) {
      return c.json({ error: result.error }, 422);
    }

    return c.json(result, 200);
  } catch (err) {
    console.error("scrape error:", err);
    return c.json({ error: "Terjadi kesalahan internal" }, 500);
  }
});

// Health check
app.get("/api/health", (c) => c.json({ status: "ok" }));

// ─── Export ─────────────────────────────────────────────────────────
export default app;
