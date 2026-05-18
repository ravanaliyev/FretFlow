export default {
  /**
   * FRETFLOW POSTCSS STİL İŞLEME YAPILANDIRMASI (postcss.config.js)
   * 
   * CORE PURPOSE (Ana Amaç):
   * PostCSS, CSS dosyalarını JavaScript nesnelerine dönüştürerek tarayıcılar için optimize eden
   * bir stil derleyicisidir.
   * 
   * `@tailwindcss/postcss` eklentisi:
   * index.css içerisindeki `@import "tailwindcss"` komutunu yakalar ve onu tarayıcıların 
   * anlayacağı saf CSS kurallarına, tarayıcı uyumluluk ön eklerine (Autoprefixer) ve
   * optimize edilmiş stil çıktılarına dönüştürür.
   */
  plugins: {
    '@tailwindcss/postcss': {}, // Tailwind v4 PostCSS motorunu aktif eder
  },
}
