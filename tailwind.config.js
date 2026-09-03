/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // 文旅科技感克制配色：深墨绿 / 石色 / 暖沙
        forest: {
          50:  '#f3f6f4',
          100: '#e1ebe5',
          200: '#c3d6cb',
          300: '#9bbba8',
          400: '#6e9a83',
          500: '#4f7d67',
          600: '#3d6452',
          700: '#325043', // 主色：深墨绿
          800: '#2a4138',
          900: '#23362f',
          950: '#121e1a'
        },
        stone2: {
          50:  '#f7f6f3',
          100: '#ebe8e1',
          200: '#d6cfc2',
          300: '#bdb19c', // 石色
          400: '#a5957b',
          500: '#907e63',
          600: '#796651',
          700: '#5f4f3f',
          800: '#453a30',
          900: '#2f2822'
        },
        sand: {
          50:  '#fbf7ef',
          100: '#f3ead5',
          200: '#e6d2a9', // 暖沙
          300: '#d4b376',
          400: '#c49851',
          500: '#b3813d',
          600: '#9a6832',
          700: '#7e502a',
          800: '#654128',
          900: '#533623'
        },
        ink: '#1a1d1b'
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Source Han Serif"', 'Georgia', 'serif']
      },
      borderRadius: {
        xl2: '14px'
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(20,40,30,0.06)'
      }
    }
  },
  plugins: []
}
