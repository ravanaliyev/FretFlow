import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * FRETFLOW ESLINT KOD KALİTE STANDARTLARI YAPILANDIRMASI (eslint.config.js)
 * 
 * CORE PURPOSE (Ana Amaç):
 * ESLint, kod yazım standartlarını denetleyen ve potansiyel runtime hatalarını,
 * kullanılmayan değişkenleri veya yanlış React Hook kullanımlarını yazım aşamasında 
 * tespit eden statik kod analiz aracıdır (Linter).
 * 
 * Bu dosya, yeni Flat Config formatında yazılmış olup şu kuralları uygular:
 * - `tseslint`: TypeScript tür güvenliği kuralları (TypeScript-ESLint).
 * - `reactHooks`: React Hooks kurallarının (örneğin useEffect bağımlılık dizileri) doğruluğunu izler.
 * - `reactRefresh`: Hot Reload (Sıcak Yenileme) esnasında bileşenlerin durumunu koruyan kurallar.
 */
export default defineConfig([
  // Derlenmiş çıktıların (dist klasörü) linter tarafından taranmasını engeller
  globalIgnores(['dist']),
  {
    // Yalnızca TypeScript (.ts) ve React JSX (.tsx) dosyalarını tarar
    files: ['**/*.{ts,tsx}'],
    
    // Genişletilen (Extended) Küresel Standart Kurallar Zinciri
    extends: [
      js.configs.recommended,             // Temel JavaScript önerilen kuralları
      tseslint.configs.recommended,      // TypeScript için önerilen tip standartları
      reactHooks.configs.flat.recommended, // React Hooks (useMemo, useCallback vb.) kuralları
      reactRefresh.configs.vite,          // Vite Canlı yenileme kuralları
    ],
    
    // Tarayıcı küresel değişkenlerini (window, document vb.) tanır
    languageOptions: {
      globals: globals.browser,
    },
  },
])
