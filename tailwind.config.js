/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // ============================================================
        // 《山见》浅色 Design Token v2.0
        // 主基调：奶酪暖底 + 青苹果强调
        // ============================================================

        // 奶酪色（主背景）— 暖米白系
        cheese: {
          DEFAULT: '#F4F1E8',  // 主奶酪色 — 大面积背景
          50:  '#FBFAF4',      // 最浅 — 卡片底/上浮层
          100: '#F4F1E8',      // 标准 — 主背景
          200: '#EAE5D3',      // 略深 — 次级背景
          300: '#DDD6BD',      // 边框/分割线
          400: '#C9C0A0',      // 更深边框
        },

        // 青苹果（强调主色）— 鲜活自然绿
        apple: {
          DEFAULT: '#8DB838',  // 主青苹果 — 按钮/CTA/强调
          50:  '#F4F8E5',      // 最浅 — 高亮背景
          100: '#E4EFC8',      // 浅色 — 标签底
          200: '#C8DE9A',      // 中浅 — hover 态
          300: '#A9CB65',      // 中色 — 次强调
          400: '#8DB838',      // 标准青苹果 — 主操作
          500: '#6F9A24',      // 深色 — active 态/pressed
          600: '#577A18',      // 更深 — 深色文字
          700: '#3D5708',      // 极深 — 标题强调
        },

        // 暖墨色（正文文字）— 深绿黑替代纯黑
        ink: {
          DEFAULT: '#1F2818',  // 主文字 — 暖深绿黑
          50:  '#5C6852',      // 次级文字
          100: '#3D4A2E',      // 深文字
          200: '#2A3220',      // 标题文字
          300: '#1F2818',      // 主文字
          400: '#14190E',      // 极深
        },

        // 深森林（次强调/标题）— 用于深色标题/分割
        forest: {
          50:  '#F1F5EE',
          100: '#DDE7D3',
          200: '#B5C9A0',
          300: '#8AA66E',
          400: '#5F8042',
          500: '#3D5A1F',      // 深森林 — 副标题
          600: '#2D4A2B',      // 极深森林 — 标题
          700: '#1F3415',      // 最深 — 标题强调
        },

        // 岩石灰（中性辅助）— 加深以保证浅色背景对比度 ≥ 4.5:1
        rock: {
          DEFAULT: '#52544F',
          50:  '#F3F3F0',
          100: '#D8DAD3',
          200: '#BDC0B6',
          300: '#6F726C',      // 次级文字（原 400，提升对比度）
          400: '#52544F',      // 重要次级文字（原 500）
          500: '#3D3F3A',      // 极深
        },

        // 暮色橙（警示/成功辅助）— 替代原日落金，更鲜亮
        amber: {
          DEFAULT: '#D97B3D',
          50:  '#FCF0E5',
          100: '#F5D5B5',
          200: '#D97B3D',      // 暮色橙主色 — 成功/警示
          300: '#B5632A',
          400: '#8E4D1E',
        },

        // 苔藓绿（保留兼容旧引用 — 重定向到 apple）
        moss: {
          DEFAULT: '#8DB838',
          50:  '#F4F8E5',
          100: '#E4EFC8',
          200: '#C8DE9A',
          300: '#8DB838',
          400: '#6F9A24',
          500: '#577A18',
        },

        // 山雾白（保留兼容旧引用 — 重定向到 cheese）
        mist: {
          DEFAULT: '#F4F1E8',
          50:  '#FBFAF4',
          100: '#F4F1E8',
          200: '#EAE5D3',
          300: '#DDD6BD',
        },

        // 日落金（保留兼容旧引用 — 重定向到 amber/apple）
        gold: {
          DEFAULT: '#8DB838',  // 重定向到青苹果
          50:  '#F4F8E5',
          100: '#E4EFC8',
          200: '#8DB838',      // gold 主操作 → 青苹果
          300: '#6F9A24',
          400: '#577A18',
          500: '#3D5708',
        },

        // 兼容旧 stone2 / sand 引用（保留 token，不再使用）
        stone2: {
          50:  '#FBFAF4', 100: '#EAE5D3', 200: '#DDD6BD',
          300: '#C9C0A0', 400: '#A8A085', 500: '#8E866B',
          600: '#736B53', 700: '#5A5440', 800: '#3F3A2D', 900: '#27231A'
        },
        sand: {
          50:  '#FBFAF4', 100: '#F4F1E8', 200: '#EAE5D3',
          300: '#DDD6BD', 400: '#C9C0A0', 500: '#A8A085',
          600: '#8E866B', 700: '#736B53', 800: '#5A5440', 900: '#3F3A2D'
        },
      },
      fontFamily: {
        // sans 改为更专业的中英结合方案
        sans: ['"HarmonyOS Sans SC"', '"Source Han Sans SC"', '"PingFang SC"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', 'Georgia', 'serif'],
        mono: ['"SF Mono"', '"Cascadia Code"', '"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        // ===== 完整字号层级体系 =====
        'overline':  ['0.625rem', { lineHeight: '0.875rem', letterSpacing: '0.12em', fontWeight: '500' }],  // 10px 上划线/标签
        'caption':   ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],                       // 11px 辅助说明
        '2xs':       ['0.75rem', { lineHeight: '1.0625rem' }],                                             // 12px 小字
        'xs':        ['0.8125rem', { lineHeight: '1.1875rem' }],                                          // 13px 次要正文
        'sm':        ['0.875rem', { lineHeight: '1.3125rem' }],                                           // 14px 正文小
        'base':      ['1rem', { lineHeight: '1.5rem' }],                                                  // 16px 正文
        'lg':        ['1.125rem', { lineHeight: '1.625rem', fontWeight: '500' }],                         // 18px 正文大
        'xl':        ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],                           // 20px 小标题
        '2xl':       ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],                               // 24px 中标题
        '3xl':       ['1.875rem', { lineHeight: '2.25rem', fontWeight: '700' }],                          // 30px 大标题
        '4xl':       ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],                            // 36px Hero 副
        '5xl':       ['3rem', { lineHeight: '3.25rem', fontWeight: '700' }],                              // 48px Hero 主
        '6xl':       ['3.75rem', { lineHeight: '4rem', fontWeight: '700' }],                               // 60px 超大显示
        // 保留极小字号兼容
        '3xs':       ['0.5rem', { lineHeight: '0.75rem' }],                                                // 8px
      },
      borderRadius: {
        xl2: '14px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        soft:  '0 1px 2px rgba(31,40,24,0.04), 0 4px 16px rgba(31,40,24,0.06)',
        card:  '0 1px 3px rgba(31,40,24,0.05), 0 2px 8px rgba(31,40,24,0.04)',
        glass: '0 2px 24px rgba(31,40,24,0.08), 0 0 1px rgba(141,184,56,0.12) inset',
        apple: '0 4px 16px rgba(141,184,56,0.25), 0 1px 3px rgba(141,184,56,0.15)',
        deep:  '0 4px 32px rgba(31,40,24,0.12)',
        sheet: '0 -4px 24px rgba(31,40,24,0.10)',
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.4s ease-out forwards',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down': 'slide-down 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '70%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    }
  },
  plugins: []
}
