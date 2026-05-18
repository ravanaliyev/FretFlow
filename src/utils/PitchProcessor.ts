/**
 * ==========================================================================================
 *                          YIN RİTİM VE FREKANS TESPİT ALGORİTMASI (utils/PitchProcessor.ts)
 * ==========================================================================================
 * 
 * CORE ALGORITHM DETAILS (YIN Algoritması Aşamaları):
 * Zaman domeninde çalışan (time-domain) ve müzikal temel frekansı (fundamental frequency - f0)
 * son derece yüksek doğrulukla bulup alt-harmonik kilitlenme hatalarını (oktav hatalarını) önleyen 
 * gelişmiş bir DSP algoritmasıdır.
 * 
 * Aşama 1: Fark Fonksiyonu (Difference Function)
 * - Ses tamponu (buffer) ile kendisinin 'tau' kadar kaydırılmış (lagged) kopyası arasındaki farkı ölçer.
 * - Formül: d_t(tau) = sum_{i=1}^{W} (x_i - x_{i+tau})^2
 * 
 * Aşama 2: Kümülatif Ortalama Normalize Fark Fonksiyonu (Cumulative Mean Normalized Difference Function)
 * - Oktav hatalarını azaltmak için ham fark fonksiyonunu, o ana kadar olan farkların koşan ortalamasına böler.
 * - Algoritmanın yanlışlıkla bir üst oktavı (frekansın 2 katını) kilitlenmesini kesin olarak önler.
 * 
 * Aşama 3: Mutlak Eşik Değeri (Absolute Thresholding & Minima Search)
 * - Normalize edilmiş fark dizisini tarar ve önceden belirlenmiş bir eşik değerinin (varsayılan 0.1)
 *   altına düşen ilk yerel minimum noktasını (first local minimum) bulur.
 * - Ardından, tamsayı örneklemelerinin ötesinde hassasiyet elde etmek için komşu noktalar arasında
 *   parabolik interpolasyon uygulayarak milimetrik küsuratlı frekans tespiti yapar.
 * ==========================================================================================
 */

/**
 * yinDetector - Ham ses dalgalarından temel nota frekansını (Hz) ayırt eder.
 * @param buffer - Mikrofon girişinden alınan 32-bit kayan noktalı ses tampon dizisi (Float32Array).
 * @param sampleRate - Aktif AudioContext örnekleme hızı (genellikle 44100Hz veya 48000Hz).
 * @param threshold - Eşik değeri (Bu değerin altındaki dalgalanmalar gerçek nota olarak kabul edilir).
 * @returns Tespit edilen temel frekans (Hertz - Hz) değeri veya ses algılanamadıysa 0.
 */
function yinDetector(buffer: Float32Array, sampleRate: number, threshold = 0.1): number {
    const bufferSize = buffer.length;
    const halfBufferSize = Math.floor(bufferSize / 2);
    const yinBuffer = new Array(halfBufferSize).fill(0);

    // AŞAMA 1: Fark Fonksiyonunun Hesaplanması
    // Orijinal ses sinyali ile 'tau' kadar kaydırılmış sinyal arasındaki fark kareleri toplanır.
    for (let tau = 0; tau < halfBufferSize; tau++) {
        for (let i = 0; i < halfBufferSize; i++) {
            const delta = buffer[i] - buffer[i + tau];
            yinBuffer[tau] += delta * delta;
        }
    }

    // AŞAMA 2: Kümülatif Ortalama Normalizasyon
    // Üst oktavlara kayma hatasını (octave error) koşan toplam ortalamaya bölerek engeller.
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfBufferSize; tau++) {
        runningSum += yinBuffer[tau];
        yinBuffer[tau] *= tau / runningSum;
    }

    // AŞAMA 3: Mutlak Eşik & Minimum Nokta Araması
    // Belirlenen eşik değerinin altındaki ilk vadi noktası aranır ve parabolik interpolasyon ile Hertz'e çevrilir.
    for (let tau = 2; tau < halfBufferSize; tau++) {
        if (yinBuffer[tau] < threshold) {
            let betterTau = tau;
            // Yerel minimumu (vadi dip noktasını) ara
            for (let i = tau + 1; i < halfBufferSize; i++) {
                if (yinBuffer[i] < yinBuffer[betterTau]) {
                    betterTau = i;
                }
            }
            // En dik dip noktayı komşularıyla parabolik olarak hizala ve gerçek frekansa (Hz) çevir
            return sampleRate / parabolicInterpolation(yinBuffer, betterTau);
        }
    }
    return 0;
}

/**
 * parabolicInterpolation - Parabolik İnterpolasyon Yardımcısı.
 * Tam sayı indeksli örnek noktalarının (tau) komşularına parabol fit ederek, 
 * gerçek nota tepe noktasının kesirli/küsuratlı konumunu nokta atışı bulur.
 */
function parabolicInterpolation(yinBuffer: number[], tau: number): number {
    const x1 = tau - 1;
    const x2 = tau;
    const x3 = tau + 1;
    if (x1 < 0 || x3 >= yinBuffer.length) return tau;
    
    const y1 = yinBuffer[x1];
    const y2 = yinBuffer[x2];
    const y3 = yinBuffer[x3];
    
    // Parabol denkleminin a katsayısını hesaplar
    const a = (y1 - 2 * y2 + y3) / 2;
    if (a === 0) return tau;
    // Parabol denkleminin b katsayısını hesaplar
    const b = (y3 - y1) / 2;
    return x2 - b / (2 * a);
}

/**
 * AudioProcessor - Donanım mikrofon akışını yöneten ve gerçek zamanlı gitar nota tespiti yapan sınıf.
 * 
 * - Kullanıcıdan mikrofon kayıt izni talep eder.
 * - Yüksek frekanslı tel sürtünme gürültülerini kesmek için 1000Hz Alçak Geçiren Filtre (Lowpass Biquad Filter) bağlar.
 * - AnalyserNode (FFT boyutu 4096) ile ses tamponlarını zaman domeninde okur.
 * - RMS (Root Mean Square) yöntemiyle ses gücünü (hacmini) hesaplar ve 0.8 RMS altındaki sessiz ortamları pas geçer.
 * - Gelen temiz ses sinyalini YIN dedektörüne besler ve nota titreşimlerini (jitter) stabilize etmek için son 3 ölçümün modunu alır.
 */
export class AudioProcessor {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private microphone: MediaStreamAudioSourceNode | null = null;
    private filter: BiquadFilterNode | null = null;
    public isRunning = false;
    private animationId: number | null = null;
    
    // Geçerli bir nota başarıyla haritalandığında tetiklenen geri çağırım (Callback) olay dinleyicisi
    public onNoteDetected: (frequency: number, note: string) => void = () => {}; 
    private recentNotes: string[] = []; // Frekans dalgalanmalarını (titremeyi) stabilize etmek için son notaların geçmiş kuyruğu

    /**
     * start - Donanım mikrofon erişimini başlatır, ses filtre zincirini kurar ve işlem döngüsünü tetikler.
     */
    async start() {
        try {
            // Tarayıcılar arası uyumlu AudioContext nesnesini oluşturur
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Mikrofon yakalama iznini tarayıcıdan ister
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.microphone = this.audioContext.createMediaStreamSource(stream);

            // Gitar telleri dışındaki tizlikteki (1000Hz üstü) gürültüleri yok etmek için Lowpass filtre kurar
            this.filter = this.audioContext.createBiquadFilter();
            this.filter.type = 'lowpass';
            this.filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);

            // Yüksek frekans çözünürlüğü için FFT (Hızlı Fourier Dönüşümü) penceresini 4096 seçer
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 4096;

            // Düğüm Bağlantı Zinciri: Mikrofon -> Lowpass Filtre -> Analizör (FFT Analyser)
            this.microphone.connect(this.filter);
            this.filter.connect(this.analyser);

            this.isRunning = true;
            this.animate(); // Gerçek zamanlı okuma döngüsünü başlatır
        } catch (error) {
            console.error('Mikrofona erişim sağlanamadı:', error);
            throw error;
        }
    }

    /**
     * stop - Donanım bağlantılarını söker, AudioContext'i kapatır ve animasyon döngüsünü durdurur.
     */
    stop() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.audioContext) this.audioContext.close();
    }

    /**
     * animate - requestAnimationFrame ile ekran tazeleme hızında (60-120 FPS) çalışan ses işleme döngüsü.
     */
    private animate() {
        if (!this.isRunning || !this.analyser || !this.audioContext) return;
        
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        this.analyser.getFloatTimeDomainData(dataArray);

        // Kök Ortalama Kare (RMS) yöntemiyle ses seviyesinin (hacminin) gücünü hesaplar
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / bufferLength);
        const volume = rms * 100;

        // Yalnızca ortam sesi belirli bir eşik gücünün (0.8 RMS) üzerindeyse YIN analizini başlatır
        if (volume > 0.8) { 
            const frequency = yinDetector(dataArray, this.audioContext.sampleRate);
            
            // Sadece standart gitar frekans aralığına giren (0 ile 2000Hz) temiz frekansları kabul eder
            if (frequency > 0 && frequency < 2000) {
                const rawNote = this.frequencyToNote(frequency);
                
                // Nota titremelerini önlemek için son 3 ölçümü hafızada tutar
                this.recentNotes.push(rawNote);
                if (this.recentNotes.length > 3) this.recentNotes.shift();
                
                // Hafızadaki son notaların en sık tekrar edenini (mod) bulup kararlı nota olarak iletir
                const mostFrequent = this.getMostFrequent(this.recentNotes);
                this.onNoteDetected(frequency, mostFrequent);
            }
        } else {
            // Ortam tamamen sessizleştiğinde veri geçmişini temizler
            this.recentNotes = [];
            this.onNoteDetected(0, '--');
        }

        // Bir sonraki ekran yenilemesinde döngüyü sürdürür
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * getMostFrequent - Kayan geçmiş penceresindeki en sık tekrar eden nota dizgisini (mod) döner.
     */
    private getMostFrequent(arr: string[]): string {
        const counts: Record<string, number> = {};
        let maxCount = 0;
        let mostFrequent = arr[0];
        
        for (const item of arr) {
            counts[item] = (counts[item] || 0) + 1;
            if (counts[item] > maxCount) {
                maxCount = counts[item];
                mostFrequent = item;
            }
        }
        return mostFrequent;
    }

    /**
     * frequencyToNote - Hertz cinsinden frekansı bilimsel müzik notasına (Örn: "E2", "A4") dönüştürür.
     * Referans olarak standard A4 = 440 Hz alır.
     * Formül: midi_numarasi = yuvarla(12 * log2(frekans / 440)) + 69
     */
    private frequencyToNote(frequency: number): string {
        const A4 = 440;
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        // MIDI nota numarasını logaritmik formülle bulur
        const midiNote = Math.round(12 * Math.log2(frequency / A4)) + 69;
        const noteIndex = midiNote % 12;
        const octave = Math.floor(midiNote / 12) - 1;
        return noteNames[noteIndex] + octave;
    }
}
