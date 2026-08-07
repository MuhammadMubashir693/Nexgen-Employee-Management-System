/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
        },
        surface: 'var(--color-surface)',
        'surface-alt': 'var(--color-surface-alt)',
        chrome: {
          DEFAULT: 'var(--color-chrome-bg)',
          border: 'var(--color-chrome-border)',
          active: 'var(--color-chrome-active)',
          hover: 'var(--color-chrome-hover)',
          text: 'var(--color-chrome-text)',
          muted: 'var(--color-chrome-text-muted)',
        },
      },
    },
  },
  plugins: [],
}