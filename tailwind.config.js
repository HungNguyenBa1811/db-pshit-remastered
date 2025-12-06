/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-app': 'var(--bg-app)',
        'bg-panel': 'var(--bg-panel)',
        'bg-card': 'var(--bg-card)',
        'primary': 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'text-main': 'var(--text-main)',
        'text-muted': 'var(--text-muted)',
        'border': 'var(--border)',
        'success': 'var(--success)',
        'error': 'var(--error)',
        'warning': 'var(--warning)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      }
    },
  },
  plugins: [],
}
