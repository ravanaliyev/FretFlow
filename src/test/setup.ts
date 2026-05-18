/**
 * ==========================================================================================
 *                                  FRETFLOW BİRİM TEST KURULUM DOSYASI (test/setup.ts)
 * ==========================================================================================
 * 
 * CORE PURPOSE (Ana Amaç):
 * Bu dosya, Vitest (birim/unit test koşucusu) ve React Testing Library (RTL) entegrasyonu 
 * için global test ortamını hazırlar.
 * 
 * JEST-DOM EXTENSIONS:
 * `import '@testing-library/jest-dom'` ifadesi, React bileşenlerinin DOM üzerindeki 
 * varlığını ve durumlarını test etmeyi son derece kolaylaştıran özel Jest-DOM eşleştiricilerini
 * (custom matchers) Vitest ortamına dahil eder.
 * 
 * Bu sayede test senaryolarımızda şu tip güçlü ve anlamlı sorguları yapabiliriz:
 * - `expect(element).toBeInTheDocument()` (Bileşenin ekranda başarıyla render edilip edilmediği)
 * - `expect(element).toHaveTextContent('Giriş Yap')` (Bileşenin doğru Türkçe metne sahip olup olmadığı)
 * - `expect(button).toBeDisabled()` (API isteği sürerken butonun kilitlenip kilitlenmediği)
 * - `expect(input).toHaveValue('user@example.com')` (Form kutusuna doğru değerlerin girilip girilmediği)
 * ==========================================================================================
 */

import '@testing-library/jest-dom';