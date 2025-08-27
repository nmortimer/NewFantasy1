/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./app/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      boxShadow: { soft: "0 10px 30px rgba(0,0,0,.35)" }
    }
  },
  plugins: []
};
