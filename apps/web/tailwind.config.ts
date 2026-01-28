import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Design system colors from design.json
        orange: {
          50: '#FFF9F0',
          100: '#FFF3E0',
          200: '#FFE7C7',
          300: '#FFD9A8',
          400: '#F2B76C',
          500: '#E89F4F',
          600: '#D68838',
          700: '#B8722C',
          800: '#9A5D23',
          900: '#7C4A1C',
        },
        blue: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#CFE9FC',
          300: '#B8DDFA',
          400: '#7CC4F7',
          500: '#3BABF5',
          600: '#0891D9',
          700: '#0678B8',
          800: '#055F96',
          900: '#044A75',
        },
        purple: {
          50: '#FAF8FF',
          100: '#F4F0FE',
          200: '#EBE3FD',
          300: '#DDD0FA',
          400: '#C5ADF7',
          500: '#A88BF3',
          600: '#8B69EF',
          700: '#7251D9',
          800: '#5A3FB8',
          900: '#462F96',
        },
        lime: {
          DEFAULT: '#84cc16',
          500: '#84cc16',
          600: '#65a30d',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Courier New', 'monospace'],
      },
      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
        base: '0.5rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.12)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
