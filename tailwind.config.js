export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0B0F",
        mineral: "#0D1F2D",
        surface: "#111827",
        card: "#1A2F3D",
        teal: { DEFAULT: "#00E5CC", dim: "#007A6E", glow: "rgba(0,229,204,0.15)" },
        amber: { DEFAULT: "#F5A623", dim: "#7A5212" },
        violet: { DEFAULT: "#6C63FF", dim: "#2D2A6E" },
        ink: "#8CA3B5",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      keyframes: {
        fillrise: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(var(--fill-offset))" },
        },
        waveflow: {
          "0%,100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(-25%)" },
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.4" },
          "50%": { opacity: "0.9" },
        },
        floatUp: {
          "0%": { transform: "translateY(0) scale(1)", opacity: "0.6" },
          "100%": { transform: "translateY(-40px) scale(0.4)", opacity: "0" },
        },
      },
      animation: {
        fillrise: "fillrise 1.2s cubic-bezier(0.34,1.56,0.64,1) forwards",
        waveflow: "waveflow 4s ease-in-out infinite",
        pulseGlow: "pulseGlow 2s ease-in-out infinite",
        floatUp: "floatUp 1.5s ease-out forwards",
      },
    },
  },
  plugins: [],
};
