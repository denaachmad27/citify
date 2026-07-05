import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm paper / ink palette ala koran & jurnal cetak
        paper: {
          DEFAULT: "#F7F3EC", // warm cream background
          deep: "#EFE7D9",    // slightly deeper for contrast sections
          card: "#FBF8F2",    // card / sheet color
        },
        ink: {
          DEFAULT: "#1A1814", // near-black, slightly warm
          soft: "#3D362C",    // secondary text
          muted: "#7A6F5F",   // tertiary / metadata
          rule: "#D9CFBF",    // hairline borders
        },
        accent: {
          DEFAULT: "#B8410E", // deep saffron/terracotta — cap perpustakaan
          warm: "#D97706",    // hover state
          dim: "#F2DDC4",     // background tint
        },
        success: {
          DEFAULT: "#3F5E3A", // dark forest green
          dim: "#E4E7DC",
        },
      },
      fontFamily: {
        // Display serif — untuk headline, nama project, "headlines" halaman
        display: ['"Fraunces"', "ui-serif", "Georgia", "serif"],
        // Body sans — modern humanist, untuk UI
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        // Mono untuk metadata, kutipan URL, dll
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        // Body serif untuk daftar pustaka (feel academic)
        serif: ['"Source Serif 4"', '"Source Serif Pro"', "Georgia", "serif"],
      },
      fontSize: {
        // Magazine-scale display sizes
        "display-xl": ["clamp(3.5rem, 9vw, 7.5rem)", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
        "display-lg": ["clamp(2.5rem, 6vw, 4.5rem)", { lineHeight: "0.98", letterSpacing: "-0.03em" }],
        "display-md": ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      animation: {
        "fade-up": "fadeUp 0.7s cubic-bezier(0.2, 0.6, 0.2, 1) both",
        "fade-in": "fadeIn 0.6s ease-out both",
        "shimmer": "shimmer 3s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
