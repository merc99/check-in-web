import type { Config } from 'tailwindcss'

// Check-in design tokens. `colors`, `boxShadow` and `borderRadius` REPLACE Tailwind's
// defaults on purpose: if a color, shadow or radius isn't here, it isn't in the brand.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      peach: { DEFAULT: '#FCEFD7', deep: '#F7E3BC' },
      card: { DEFAULT: '#FFFFFF', alt: '#FFFAF0' },
      ink: { DEFAULT: '#1F1D1A', soft: '#5A574F', mute: '#8A8779' },
      mint: { DEFAULT: '#B8E5B5', deep: '#8FCF8C' },
      rule: '#EAD9B5',
      sky: { DEFAULT: '#A8D8E8', ink: '#2A5E73' },
      coral: { DEFAULT: '#F5A78E', ink: '#8A3E2A' },
      rose: { DEFAULT: '#ED8AA0', ink: '#7A2E45' },
      grape: { DEFAULT: '#B89BD6', ink: '#4F356E' },
      indigo: { DEFAULT: '#8A95D6', ink: '#2E3870' },
      lemon: { DEFAULT: '#F0D86E', ink: '#6B5A1A' },
      leaf: { DEFAULT: '#9DCB8F', ink: '#3A6432' },
      clay: { DEFAULT: '#D9A574', ink: '#6B4220' },
      danger: { DEFAULT: '#E27272', ink: '#6B1C1C' },
    },
    boxShadow: {
      none: 'none',
      sh1: '0 2px 0 #1F1D1A', // chips, small elements
      sh2: '2px 3px 0 #1F1D1A', // cards
      sh3: '2px 4px 0 #1F1D1A', // buttons, CTAs, hero cards
      'sh1-pressed': '0 1px 0 #1F1D1A',
      'sh3-pressed': '2px 2px 0 #1F1D1A',
      focus: '2px 3px 0 #1F1D1A, 0 0 0 4px #B8E5B5', // input focus: sh2 + mint ring
      you: '0 0 0 3px #B8E5B5, 0 0 0 4.5px #1F1D1A', // signed-in user's avatar ring
      selected: '0 0 0 3px #FCEFD7, 0 0 0 4.5px #1F1D1A', // chosen color swatch: peach gap + ink ring
    },
    borderRadius: {
      none: '0',
      tiny: '4px',
      input: '12px',
      card: '14px',
      lg: '18px',
      full: '9999px',
    },
    extend: {
      borderWidth: { DEFAULT: '1.5px' },
      fontFamily: {
        display: ['var(--font-bowlby)', 'Impact', 'Arial Black', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      maxWidth: { app: '640px' },
      transitionTimingFunction: {
        spring: 'cubic-bezier(.34,1.45,.64,1)',
        out: 'cubic-bezier(.2,.8,.2,1)',
      },
      keyframes: {
        enter: {
          from: { opacity: '0', transform: 'translateY(-18px) scale(.94)', clipPath: 'inset(0 0 100% 0 round 18px)' },
          '60%': { clipPath: 'inset(0 0 0 0 round 18px)' },
        },
        bump: { '50%': { transform: 'scale(1.08)' } },
        burst: {
          '0%': { opacity: '0', transform: 'translate(-50%,-50%) scale(0) rotate(-15deg)' },
          '30%': { opacity: '1', transform: 'translate(-50%,-50%) scale(1.1) rotate(4deg)' },
          '70%': { opacity: '1', transform: 'translate(-50%,-60%) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(-50%,-90%) scale(.8)' },
        },
        word: { from: { opacity: '0', transform: 'translateY(40px) rotate(-6deg)' }, to: { opacity: '1', transform: 'none' } },
        stickpop: { '30%': { transform: 'translateY(-6px) rotate(-6deg) scale(1.1)' } },
        tickpop: { from: { transform: 'scale(0) rotate(-90deg)' } },
        cellin: { from: { transform: 'scale(.4)', opacity: '0' } },
        wave: { '40%': { transform: 'translateY(-8px)' } },
        draw: { to: { strokeDashoffset: '0' } },
        fall: { to: { transform: 'translateY(1100px) rotate(var(--r))' } },
        ping: { from: { transform: 'scale(.4)', opacity: '1' }, to: { transform: 'scale(1.4)', opacity: '0' } },
      },
      animation: {
        enter: 'enter .7s cubic-bezier(.34,1.45,.64,1)',
        bump: 'bump .3s cubic-bezier(.34,1.45,.64,1)',
        burst: 'burst .8s cubic-bezier(.34,1.45,.64,1)',
        word: 'word .6s cubic-bezier(.34,1.45,.64,1) forwards',
        stickpop: 'stickpop .6s cubic-bezier(.34,1.45,.64,1)',
        tickpop: 'tickpop .5s .15s cubic-bezier(.34,1.45,.64,1) both',
        cellin: 'cellin .5s cubic-bezier(.34,1.45,.64,1) both',
        wave: 'wave .5s cubic-bezier(.34,1.45,.64,1) both',
        draw: 'draw .35s .15s cubic-bezier(.2,.8,.2,1) forwards',
        fall: 'fall linear forwards',
        ping: 'ping 1.8s cubic-bezier(.2,.8,.2,1) infinite',
      },
    },
  },
  plugins: [],
}
export default config
