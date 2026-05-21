/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        mimi: {
          bg: '#F8F6FF',
          surface: '#FFFFFF',
          primary: '#8B5CF6',
          primarySoft: '#DDD6FE',
          accent: '#F4A7B9',
          accentSoft: '#FFE4EC',
          text: '#1F1B2E',
          muted: '#6B647A',
          border: '#E7E0F5',
          cream: '#FFF7E8',
          blueSoft: '#DDEEFF'
        }
      },
      fontFamily: {
        sans: ['Nunito Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 24px 70px rgba(31, 27, 46, 0.12)'
      }
    }
  },
  plugins: []
};
