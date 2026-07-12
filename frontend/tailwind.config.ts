import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--canvas)',
        'canvas-2': 'var(--canvas-2)',
        'canvas-3': 'var(--canvas-3)',
        accent: 'var(--accent-blue)',
        'risk-critical': 'var(--risk-critical)',
        'risk-high': 'var(--risk-high)',
        'risk-medium': 'var(--risk-medium)',
        'risk-low': 'var(--risk-low)',
        'risk-safe': 'var(--risk-safe)'
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)'
      },
      boxShadow: {
        clay: 'var(--clay-shadow-neutral)'
      }
    }
  }
};

export default config;
