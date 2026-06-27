import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f13',
        surface: '#1a1a24',
        border: '#2a2a3a',
        accent: '#7c3aed',
        danger: '#dc2626',
        warning: '#d97706',
        success: '#16a34a',
        text: '#e2e8f0',
        muted: '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
