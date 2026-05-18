/** @type {import('tailwindcss').Config} */
export default {
  // CONTENT SCANNER (Tarama Yolları):
  // Tailwind'in kullanılmayan CSS sınıflarını temizleyip (Tree-Shaking) üretim paketi boyutunu 
  // minimize etmek amacıyla tarayacağı HTML ve React dosya yollarını belirtir.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  theme: {
    extend: {
      // Küresel Vurgu ve Temel Renk Tanımlamaları
      colors: {
        dark: {
          900: '#0a0a0a', // Arka Plan Koyu Siyah
          800: '#141414', // Kart Panelleri
          700: '#1e1e1e', // Kenarlık ve Girdiler
        },
        primary: {
          500: '#39ff14', // Kurumsal FretFlow Neon Yeşili
          600: '#32cc11', // Koyu gölge yeşili
        },
        accent: {
          500: '#ff8c00', // Dikkat çekici turuncu (Seviyeler)
        },
        ambient: {
          500: '#8a2be2', // Yumuşak mor aura rengi (Gökyüzü aydınlatması)
        }
      },
      
      // Küresel Yazı Tipi Ailesi
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      
      // Özel Animasyon İsimleri ve Tanımları
      animation: {
        // float: Rozetlerin gökyüzünde tatlıca süzülmesi için dikey salınım animasyonu (6 saniye)
        'float': 'float 6s ease-in-out infinite',
        // pulse-glow: Neon parlamaların yumuşakça yanıp sönmesi için parlaklık animasyonu (3 saniye)
        'pulse-glow': 'pulse-glow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      // Animasyonların Milisaniye / Yüzde Tabanlı Keyframe Haritaları
      keyframes: {
        // Dikey salınım (yukarı aşağı) yumuşak hareket değerleri
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' }, // Zirvede 20px yukarı kalkar
        },
        // Parlaklık değişimi (neon etkisi)
        'pulse-glow': {
          '0%, 100%': { opacity: 1, filter: 'brightness(1)' },
          '50%': { opacity: .7, filter: 'brightness(1.5)' }, // Yarı yolda %50 daha parlak olur
        }
      }
    },
  },
  plugins: [],
}
