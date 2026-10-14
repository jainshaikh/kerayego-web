import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
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
        // 4321-Drive design system v3 "Sunset Coral" — brand + warm neutrals +
        // frozen status tones. Fixed hex (not HSL-var indirection) so they match
        // the design deck verbatim. Token NAMES are unchanged from v2; only the
        // values moved, so no component needs editing for the palette swap.
        brand: {
          50: '#FFF0F2',
          100: '#FFDDE2',
          600: '#FF4E64',
          700: '#E63350',
          800: '#C2203C',
        },
        // Second half of the brand gradient. Use via bg-brand (backgroundImage)
        // rather than reaching for amber directly.
        amber: {
          DEFAULT: '#FF9E45',
          deep: '#F07C18',
          50: '#FFF6EC',
        },
        ink: '#1A0F14',
        page: '#FFF7F3',
        surface: '#FFFFFF',
        'surface-hover': '#FFF1EA',
        'border-subtle': '#F0DFD7',
        'border-strong': '#E2CBC1',
        'text-muted': '#7A5F68',
        // Darkened from #A98D96 (2.86:1 on bg-page) to pass WCAG AA 4.5:1.
        'text-faint': '#8B6974',
        whatsapp: {
          DEFAULT: '#25D366',
          hover: '#1FB855',
        },
        // Frozen. See components/common/StatusBadge.tsx — do not add a second map.
        status: {
          amber: { fg: '#92400E', bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706' },
          blue: { fg: '#1E3A8A', bg: '#EFF6FF', border: '#BFDBFE', dot: '#2563EB' },
          emerald: { fg: '#065F46', bg: '#ECFDF5', border: '#A7F3D0', dot: '#059669' },
          red: { fg: '#991B1B', bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626' },
          slate: { fg: '#334155', bg: '#F8FAFC', border: '#E2E8F0', dot: '#64748B' },
          violet: { fg: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE', dot: '#7C3AED' },
          teal: { fg: '#115E59', bg: '#F0FDFA', border: '#99F6E4', dot: '#0D9488' },
        },
      },
      backgroundImage: {
        // The one gradient. Primary buttons, active nav pill, price badge on
        // hover, stat underlines. Everything else stays flat so it keeps meaning.
        brand: 'linear-gradient(100deg, #FF4E64 0%, #FF9E45 100%)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        chip: '8px',
        control: '11px',
        media: '14px',
        card: '18px',
        sheet: '26px',
      },
      boxShadow: {
        // Warm-tinted. Grey shadows read as dirt on a warm page.
        xs: '0 1px 2px rgba(60,20,30,0.05)',
        sm: '0 2px 6px rgba(60,20,30,0.06), 0 1px 2px rgba(60,20,30,0.04)',
        md: '0 8px 24px rgba(60,20,30,0.09), 0 2px 6px rgba(60,20,30,0.05)',
        lg: '0 24px 60px rgba(60,20,30,0.16), 0 4px 12px rgba(60,20,30,0.06)',
        coral: '0 10px 30px rgba(255,78,100,0.30)',
        'coral-lg': '0 16px 38px rgba(255,78,100,0.38)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(.34,1.56,.44,1)',
        smooth: 'cubic-bezier(.22,1,.36,1)',
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
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-480px 0' },
          '100%': { backgroundPosition: '480px 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.25s ease-out',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
