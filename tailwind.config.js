/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d10",
        card: "#0f141a",
        panel: "#151b22",
        border: "#22303d",
        text: "#e9eef5",
        muted: "#9fb0c3",
        accent: "#2fb47d",
        accent2: "#1e7e59"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,.35)"
      }
    }
  },
  plugins: []
};
