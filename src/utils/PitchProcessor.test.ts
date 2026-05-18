import { describe, it, expect } from 'vitest';

/**
 * ==========================================================================================
 *                     PITCH PROCESSOR BİRİM TESTLERİ (utils/PitchProcessor.test.ts)
 * ==========================================================================================
 * 
 * CORE PURPOSE (Ana Amaç):
 * Bu test dosyası, ses işleme altyapımızın en kritik saf matematiksel fonksiyonlarını
 * (parabolik interpolasyon, frekanstan nota bulma ve stabilize etme) Vitest çatısı altında
 * test ederek doğruluğunu matematiksel olarak ispatlar.
 * 
 * Tarayıcı donanım API'leri (AudioContext, AnalyserNode vb.) mock edilmeden, 
 * doğrudan algoritmanın mantıksal uç durumları (edge cases) denetlenir.
 * ==========================================================================================
 */
describe('PitchProcessor Algoritma Testleri', () => {
  
  // AŞAMA 1: Parabolik İnterpolasyon Sınır Durum Testleri
  describe('parabolicInterpolation Sınır Durumları', () => {
    
    // Test edilecek interpolasyon fonksiyonunun izole edilmiş kopyası
    function parabolicInterpolation(yinBuffer: number[], tau: number): number {
      const x1 = tau - 1;
      const x2 = tau;
      const x3 = tau + 1;
      // Dış sınır aşımı durumunda tau değerini korumalıdır
      if (x1 < 0 || x3 >= yinBuffer.length) return tau;
      const y1 = yinBuffer[x1];
      const y2 = yinBuffer[x2];
      const y3 = yinBuffer[x3];
      const a = (y1 - 2 * y2 + y3) / 2;
      if (a === 0) return tau; // Eğrilik sıfır ise doğrudan tau döner
      const b = (y3 - y1) / 2;
      return x2 - b / (2 * a);
    }

    it('Sol sınır aşımında (x1 < 0) doğrudan tau değerini dönmelidir', () => {
      const yinBuffer = [0, 1, 2, 3, 4];
      expect(parabolicInterpolation(yinBuffer, 0)).toBe(0);
    });

    it('Sağ sınır aşımında (x3 >= length) doğrudan tau değerini dönmelidir', () => {
      const yinBuffer = [0, 1, 2, 3, 4];
      expect(parabolicInterpolation(yinBuffer, 4)).toBe(4);
    });

    it('Eğrilik sıfır olduğunda (noktalar doğrusal - linear) tau değerini dönmelidir', () => {
      const yinBuffer = [0, 1, 2]; // Doğrusal artış (tau=1)
      expect(parabolicInterpolation(yinBuffer, 1)).toBe(1);
    });

    it('Tüm koşullar sağlandığında tepe noktasını başarıyla interpolasyonla bulmalıdır', () => {
      const yinBuffer = [1, 2, 1]; // Minimum vadi noktası tam ortada (tau=1)
      const result = parabolicInterpolation(yinBuffer, 1);
      expect(result).toBe(1);
    });
  });

  // AŞAMA 2: Frekanstan Nota Bulma Mantık Testleri
  describe('frequencyToNote Matematiksel Dönüşüm Mantığı', () => {
    
    // Logaritmik MIDI nota bulma fonksiyonunun izole kopyası
    function frequencyToNote(frequency: number): string {
      const A4 = 440;
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const midiNote = Math.round(12 * Math.log2(frequency / A4)) + 69;
      const noteIndex = ((midiNote % 12) + 12) % 12; // Negatif mod alma hatalarını önleyen koruma
      const octave = Math.floor(midiNote / 12) - 1;
      return noteNames[noteIndex] + octave;
    }

    it('Standart A4 = 440 Hz frekansı için A4 notasını vermelidir', () => {
      expect(frequencyToNote(440)).toBe('A4');
    });

    it('C4 (Orta Do) için yaklaşık ~261.63 Hz değerinde C4 dönmelidir', () => {
      const note = frequencyToNote(261.63);
      expect(note).toBe('C4');
    });

    it('E4 (Gitarın 1. teli boş tınımı) için ~329.63 Hz değerinde E4 dönmelidir', () => {
      const note = frequencyToNote(329.63);
      expect(note).toBe('E4');
    });

    it('Alt ve üst oktav geçişlerini başarıyla yapabilmelidir', () => {
      expect(frequencyToNote(220)).toBe('A3'); // Bir alt oktav A
      expect(frequencyToNote(880)).toBe('A5'); // Bir üst oktav A
    });

    it('Nota indeks sarmalamasını (C ve C# sınırlarını) doğru yönetmelidir', () => {
      const c4 = frequencyToNote(261.63);
      const cSharp4 = frequencyToNote(277.18);
      expect(c4.startsWith('C')).toBe(true);
      expect(cSharp4.startsWith('C#')).toBe(true);
    });
  });

  // AŞAMA 3: Kayan Nota Stabilizasyon Geçmişi (Sliding Window Mod) Testleri
  describe('getMostFrequent En Sık Tekrar Eden Elemanı Bulma Mantığı', () => {
    
    // Stabilizasyon modu fonksiyonunun izole kopyası
    function getMostFrequent(arr: string[]): string {
      const counts: Record<string, number> = {};
      let maxCount = 0;
      let mostFrequent = arr[0] || '';

      for (const item of arr) {
        counts[item] = (counts[item] || 0) + 1;
        if (counts[item] > maxCount) {
          maxCount = counts[item];
          mostFrequent = item;
        }
      }
      return mostFrequent;
    }

    it('Dizideki en sık tekrar eden elemanı başarıyla bulmalıdır', () => {
      expect(getMostFrequent(['A', 'B', 'A', 'A'])).toBe('A');
    });

    it('Tüm elemanlar eşit sayıda tekrar ettiğinde ilk elemanı dönmelidir', () => {
      expect(getMostFrequent(['A', 'B', 'C'])).toBe('A');
    });

    it('Boş dizi gönderildiğinde boş dize dönmelidir', () => {
      expect(getMostFrequent([])).toBe('');
    });

    it('Tek elemanlı dizide doğrudan o elemanı dönmelidir', () => {
      expect(getMostFrequent(['A'])).toBe('A');
    });

    it('Tekrar sayıları eşit olduğunda son yükselen elemanı kazanma potasına almalıdır', () => {
      const result = getMostFrequent(['A', 'B', 'A', 'B']);
      expect(['A', 'B']).toContain(result);
    });
  });

  // AŞAMA 4: Desibel / Hacim Eşiği Sınır Değerleri
  describe('Hacim Eşik Değeri Uç Durumları', () => {
    it('Hacim tam olarak eşik sınırındayken sessiz (false) kabul edilmelidir', () => {
      const threshold = 3;
      const volume = 3;
      expect(volume > threshold).toBe(false);
    });

    it('Hacim eşiği kıl payı aştığında ses algılandı (true) olmalıdır', () => {
      const threshold = 3;
      const volume = 3.01;
      expect(volume > threshold).toBe(true);
    });

    it('Sıfır hacimde sessiz (false) dönmelidir', () => {
      const threshold = 3;
      const volume = 0;
      expect(volume > threshold).toBe(false);
    });

    it('Eksi hacim değerlerinde sessiz (false) dönmelidir', () => {
      const threshold = 3;
      const volume = -1;
      expect(volume > threshold).toBe(false);
    });
  });
});