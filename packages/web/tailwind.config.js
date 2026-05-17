/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mango: {
          bg: '#FFF7D6',
          card: '#FFFFFF',
          primary: '#F8D76E',
          'primary-dark': '#E7B93F',
          blue: '#BFE8F5',
          'blue-dark': '#7DC5DC',
          text: '#3F3528',
          muted: '#8A7D68',
          success: '#B5DBA0',
          danger: '#F5A6A6'
        }
      },
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        body: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        hand: ['Caveat', '"ZCOOL KuaiLe"', 'cursive']
      },
      borderRadius: {
        card: '24px',
        button: '16px'
      },
      boxShadow: {
        soft: '0 2px 8px rgba(63, 53, 40, 0.08)',
        card: '0 4px 16px rgba(63, 53, 40, 0.06)'
      }
    }
  },
  plugins: []
};
