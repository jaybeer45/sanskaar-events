/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#ec3013",
          "red-hover": "#d4270f",
          dark: "#201e1d",
          gold: "#f5a623",
          "gold-hover": "#e09510",
        },
        // Night-sky palette: night is for hero/footer, marigold for time and
        // price highlights, red stays reserved for primary actions and Live.
        night: { DEFAULT: "#1A1445", soft: "#2A2260", deep: "#0F0B2E" },
        marigold: { DEFAULT: "#F5A623", soft: "#FDEBC8" },
        moonlight: "#F5F5FA",
        ink: "#16132B",
        mist: "#D9D8E6",
        surface: {
          DEFAULT: "#F5F5FA",
          dark: "#111111",
        },
        card: {
          DEFAULT: "#ffffff",
          dark: "#1e1e1e",
        },
        border: {
          DEFAULT: "#D9D8E6",
          dark: "#2d2d2d",
        },
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', "Hind", "sans-serif"],
        body: ["Hind", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        ticket: "14px",
        pill: "9999px",
      },
      boxShadow: {
        // Indigo-tinted instead of neutral grey, so shadows belong to the palette
        card: "0 1px 2px rgba(26,20,69,0.06), 0 10px 28px -14px rgba(26,20,69,0.22)",
        "card-hover":
          "0 2px 4px rgba(26,20,69,0.08), 0 16px 36px -14px rgba(26,20,69,0.3)",
        brand: "0 4px 20px rgba(236,48,19,0.3)",
      },
      animation: {
        "pulse-live": "pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-in-right": "slideInRight 0.35s ease-out",
        "ticket-in": "ticketIn 0.65s cubic-bezier(0.2,0.8,0.2,1) both",
        shimmer: "shimmer 1.5s infinite linear",
      },
      keyframes: {
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideInRight: {
          "0%": { opacity: 0, transform: "translateX(24px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },
        // The one orchestrated page-load moment: tickets "print" in
        ticketIn: {
          "0%": { opacity: 0, transform: "translateY(20px) rotate(-1.5deg)" },
          "100%": { opacity: 1, transform: "translateY(0) rotate(0)" },
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