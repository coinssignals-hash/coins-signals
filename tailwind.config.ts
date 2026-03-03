import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        xs: "375px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
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
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Trading-specific colors
        bullish: "hsl(var(--bullish))",
        bearish: "hsl(var(--bearish))",
        neutral: "hsl(var(--neutral))",
        chart: {
          positive: "hsl(var(--chart-positive))",
          negative: "hsl(var(--chart-negative))",
          neutral: "hsl(var(--chart-neutral))",
          grid: "hsl(var(--chart-grid))",
        },
        currency: {
          eur: "hsl(var(--currency-eur))",
          usd: "hsl(var(--currency-usd))",
          gbp: "hsl(var(--currency-gbp))",
          jpy: "hsl(var(--currency-jpy))",
          aud: "hsl(var(--currency-aud))",
          cad: "hsl(var(--currency-cad))",
          chf: "hsl(var(--currency-chf))",
          nzd: "hsl(var(--currency-nzd))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        "glow-green": "var(--shadow-glow-green)",
        "glow-red": "var(--shadow-glow-red)",
      },
      keyframes: {
        "zone-pulse": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "30%": { transform: "scale(1.18)", opacity: "0.85" },
          "60%": { transform: "scale(0.96)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(-10px)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(30px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "scale-bounce": {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
          "70%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "flip-in": {
          from: { opacity: "0", transform: "rotateY(-90deg) scale(0.8)" },
          to: { opacity: "1", transform: "rotateY(0) scale(1)" },
        },
        "rotate-in": {
          from: { opacity: "0", transform: "rotate(-180deg) scale(0.5)" },
          to: { opacity: "1", transform: "rotate(0) scale(1)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0)" },
          "60%": { opacity: "1", transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "number-roll": {
          "0%": { opacity: "0", transform: "translateY(100%)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px currentColor, 0 0 10px currentColor" },
          "50%": { boxShadow: "0 0 20px currentColor, 0 0 30px currentColor" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "rgba(34, 197, 94, 0.3)" },
          "50%": { borderColor: "rgba(34, 197, 94, 0.8)" },
        },
        "zone-bar-pulse": {
          "0%": { transform: "scale(1)" },
          "15%": { transform: "scale(1.03)" },
          "30%": { transform: "scale(0.98)" },
          "50%": { transform: "scale(1.01)" },
          "100%": { transform: "scale(1)" },
        },
        "dot-pulse": {
          "0%": { transform: "translateX(-50%) translateY(-50%) scale(1)", opacity: "1" },
          "25%": { transform: "translateX(-50%) translateY(-50%) scale(1.8)", opacity: "0.7" },
          "50%": { transform: "translateX(-50%) translateY(-50%) scale(1)", opacity: "1" },
          "75%": { transform: "translateX(-50%) translateY(-50%) scale(1.4)", opacity: "0.8" },
          "100%": { transform: "translateX(-50%) translateY(-50%) scale(1)", opacity: "1" },
        },
        "ripple-expand": {
          "0%": { transform: "translateX(-50%) translateY(-50%) scale(0.5)", opacity: "0.8" },
          "100%": { transform: "translateX(-50%) translateY(-50%) scale(4)", opacity: "0" },
        },
        "bar-glow": {
          "0%": { filter: "brightness(1)" },
          "30%": { filter: "brightness(1.6)" },
          "100%": { filter: "brightness(1)" },
        },
        "icon-shake": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(-12deg)" },
          "40%": { transform: "rotate(12deg)" },
          "60%": { transform: "rotate(-8deg)" },
          "80%": { transform: "rotate(8deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "fade-out": "fade-out 0.3s ease-out forwards",
        "slide-up": "slide-up 0.4s ease-out forwards",
        "slide-down": "slide-down 0.4s ease-out forwards",
        "slide-in-left": "slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-right": "slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 0.2s ease-out forwards",
        "scale-bounce": "scale-bounce 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "flip-in": "flip-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "rotate-in": "rotate-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pop-in": "pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "number-roll": "number-roll 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s infinite linear",
        "border-glow": "border-glow 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
