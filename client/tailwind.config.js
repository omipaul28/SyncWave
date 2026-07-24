/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Spotify brand green and custom yellow accent
        accent: {
          DEFAULT: '#1DB954', // Spotify Green
          light: '#1ed760',
          dark: '#1aa34a',
        },
        yellow: {
          DEFAULT: '#FFD700', // Yellow secondary
          light: '#ffe033',
          dark: '#e6c200',
        },
        // Dark theme surfaces (Spotify-like)
        surface: {
          base:    '#000000', // Main background
          raised:  '#121212', // Sidebar / panels
          overlay: '#181818', // Cards, player bottom bar
          border:  '#282828', // Borders, dividers
          hover:   '#2a2a2a', // Hover states
        },
        // Text
        text: {
          primary:   '#FFFFFF', // White
          secondary: '#B3B3B3', // Soft gray
          muted:     '#535353', // Darker gray
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':                'fadeIn 0.2s ease-out',
        'slide-up':               'slideUp 0.3s ease-out',
        'slide-down':             'slideDown 0.3s ease-out',
        'pulse-slow':             'pulse 3s ease-in-out infinite',
        'spin-slow':              'spin 8s linear infinite',
        'equalizer':              'equalizer 1s ease-in-out infinite alternate',
        'progress-indeterminate': 'progressIndeterminate 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:              { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp:             { '0%': { transform: 'translateY(16px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        slideDown:           { '0%': { transform: 'translateY(-16px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        equalizer:           { '0%': { transform: 'scaleY(0.3)' }, '100%': { transform: 'scaleY(1)' } },
        progressIndeterminate: {
          '0%':   { transform: 'translateX(-100%) scaleX(0.5)' },
          '50%':  { transform: 'translateX(0%)    scaleX(0.7)' },
          '100%': { transform: 'translateX(200%)  scaleX(0.5)' },
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};
