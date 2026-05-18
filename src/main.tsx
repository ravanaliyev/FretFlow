import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * FRETFLOW VITE/REACT ÇALIŞMA ZAMANI BAŞLANGIÇ NOKTASI (main.tsx)
 * 
 * Bu dosya, tüm uygulamanın tarayıcı üzerindeki fiili çalışma döngüsünü başlatır.
 * 1. HTML şablonumuzda (`index.html`) bulunan `<div id="root"></div>` etiketini yakalar.
 * 2. React 18 ile gelen modern `createRoot` API'sini kullanarak bu düğüm üzerinde sanal DOM (Virtual DOM) ağacını kurar.
 * 3. Küresel CSS dosyamızı (`index.css`) derleme zincirine dahil eder.
 * 4. Geliştirme aşamasında potansiyel hataları ve yan etkileri (side-effects) erkenden yakalamak için 
 *    uygulamayı `StrictMode` sarmalı içerisinde render eder.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Ana Uygulama Gövdesini Yükler */}
    <App />
  </StrictMode>,
)
