import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* shadcn primitives (kept for component library compatibility) */
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* Direction C design tokens -- surfaces */
        surface: {
          base:     "var(--surface-base)",
          raised:   "var(--surface-raised)",
          elevated: "var(--surface-elevated)",
          overlay:  "var(--surface-overlay)",
        },

        /* Direction C design tokens -- borders
           Extended to an object so border-border retains backward compat
           via DEFAULT while border-border-subtle etc. add new utilities. */
        border: {
          DEFAULT: "hsl(var(--border))",
          subtle:  "var(--border-subtle)",
          default: "var(--border-default)",
          strong:  "var(--border-strong)",
        },

        /* Direction C design tokens -- text colors
           Produces utilities: text-text-primary, text-text-secondary, etc. */
        text: {
          primary:   "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary:  "var(--text-tertiary)",
          disabled:  "var(--text-disabled)",
        },

        /* Direction C design tokens -- accent (cyan)
           accent.DEFAULT is the direct hex value from Direction C.
           foreground keeps the shadcn contract for component lib. */
        accent: {
          DEFAULT:    "var(--accent)",
          bright:     "var(--accent-bright)",
          muted:      "var(--accent-muted)",
          border:     "var(--accent-border)",
          foreground: "hsl(var(--accent-foreground))",
        },

        /* Direction C design tokens -- severity */
        severity: {
          critical: "var(--severity-critical)",
          high:     "var(--severity-high)",
          medium:   "var(--severity-medium)",
          low:      "var(--severity-low)",
        },

        /* Direction C design tokens -- status */
        status: {
          pending:   "var(--status-pending)",
          running:   "var(--status-running)",
          completed: "var(--status-completed)",
          failed:    "var(--status-failed)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
