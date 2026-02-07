import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1.5rem' },
    extend: {
      colors: {
        background: '#f8fafc',
        foreground: '#0f172a',
        card: '#ffffff',
        muted: '#e2e8f0',
        accent: '#0ea5e9',
        success: '#10b981',
        warning: '#f97316',
        danger: '#ef4444',
      },
      boxShadow: {
        card: '0 8px 30px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [animate],
};

export default config;
