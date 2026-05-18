import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * FRETFLOW VITE YAPILANDIRMA DOSYASI (vite.config.ts)
 * 
 * CORE PURPOSE (Ana Amaç):
 * Bu dosya, FretFlow projesinin derleme (build) ve canlı geliştirme sunucusu (dev server)
 * ayarlarını yönetir.
 * 
 * 1. `@vitejs/plugin-react`: React bileşenlerinin hızlı yenileme (Fast Refresh) ve 
 *    JSX/TSX derlemelerini yapmasını sağlar.
 * 
 * 2. `server.proxy`: Tarayıcılarda oluşan CORS (Cross-Origin Resource Sharing) güvenlik engellerini
 *    aşmak amacıyla bir tersine vekil sunucu (Reverse Proxy) kurar.
 *    - Ön yüzden `/api/v1/auth` gibi yapılan tüm istekleri arka planda `http://localhost:3000/api/v1/auth`
 *      adresine yönlendirerek geliştirme ortamında pürüzsüz API iletişimi sağlar.
 */
export default defineConfig({
  // React derleme eklentisini entegre eder
  plugins: [react()],
  
  // Canlı Geliştirme Sunucusu Ayarları
  server: {
    proxy: {
      // '/api' ile başlayan tüm yolları arka uç sunucusuna (localhost:3000) yönlendirir
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true, // Sunucuya giden isteğin kökenini (origin) hedefe göre günceller
      },
    },
  },
})
