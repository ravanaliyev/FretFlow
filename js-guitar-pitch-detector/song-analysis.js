// Song Analysis Module for Guitar Pitch Detector
// Supports recording performances and DTW-based scoring

// ============================================
// HELPER FUNCTIONS
// ============================================

const A4 = 440;

function frequencyToCents(frequency) {
    return 1200 * Math.log2(frequency / A4);
}

function centsToFrequency(cents) {
    return A4 * Math.pow(2, cents / 1200);
}

function noteToFrequency(note) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let noteName = note.replace(/[0-9]/g, '');
    let octave = parseInt(note.match(/[0-9]+/)?.[0] || '4');
    let noteIndex = noteNames.indexOf(noteName);
    if (noteIndex === -1) return 0;
    let midiNote = (octave + 1) * 12 + noteIndex;
    return A4 * Math.pow(2, (midiNote - 69) / 12);
}

function noteToMidi(note) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let noteName = note.replace(/[0-9]/g, '');
    let octave = parseInt(note.match(/[0-9]+/)?.[0] || '4');
    let noteIndex = noteNames.indexOf(noteName);
    if (noteIndex === -1) return 0;
    return (octave + 1) * 12 + noteIndex;
}

function midiToNoteName(midi) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let noteIndex = midi % 12;
    let octave = Math.floor(midi / 12) - 1;
    return noteNames[noteIndex] + octave;
}

// ============================================
// NOTE BUFFER
// ============================================

class NoteBuffer {
    constructor(sampleRate = 44100) {
        this.sampleRate = sampleRate;
        this.notes = [];
        this.startTime = null;
        this.endTime = null;
        this.isRecording = false;
    }

    start() {
        this.notes = [];
        this.startTime = performance.now();
        this.endTime = null;
        this.isRecording = true;
    }

    addNote(frequency, note, volume) {
        if (!this.isRecording) return;
        let timestamp = (performance.now() - this.startTime) / 1000;
        let noteName = note && note !== '--' ? note.replace(/[0-9]/g, '') : null;
        this.notes.push({
            frequency,
            note: noteName,
            midi: frequency > 0 ? Math.round(12 * Math.log2(frequency / A4)) + 69 : 0,
            timestamp,
            duration: 0,
            volume,
            isSilent: frequency === 0 || !note || note === '--'
        });
    }

    end() {
        if (!this.isRecording) return;
        this.endTime = performance.now();
        this.isRecording = false;
        this.updateDurations();
    }

    updateDurations() {
        for (let i = 0; i < this.notes.length; i++) {
            if (this.notes[i].isSilent) {
                this.notes[i].duration = 0;
            } else {
                let j = i + 1;
                while (j < this.notes.length && this.notes[j].isSilent) j++;
                if (j < this.notes.length) {
                    this.notes[i].duration = this.notes[j].timestamp - this.notes[i].timestamp;
                }
            }
        }
    }

    getNotes() {
        return this.notes.map(n => ({ ...n }));
    }

    getDuration() {
        if (!this.startTime) return 0;
        let end = this.endTime || performance.now();
        return (end - this.startTime) / 1000;
    }

    getNonSilentNotes() {
        return this.notes.filter(n => !n.isSilent);
    }

    clear() {
        this.notes = [];
        this.startTime = null;
        this.endTime = null;
        this.isRecording = false;
    }
}

// ============================================
// SONG DATA STRUCTURE
// ============================================

function createSong(songData) {
    return {
        id: songData.id || 'unknown',
        title: songData.title || 'Untitled',
        artist: songData.artist || 'Unknown',
        tempo: songData.tempo || 90,
        difficulty: songData.difficulty || 'beginner',
        timeSignature: songData.timeSignature || [4, 4],
        noteOffset: songData.noteOffset || 0,
        tags: songData.tags || [],
        notes: songData.notes || [],
        chordInterpretation: songData.chordInterpretation || 'arpeggio'
    };
}

function scaleSongToTempo(song, targetBPM) {
    if (targetBPM === song.tempo) return song;
    let ratio = song.tempo / targetBPM;
    return {
        ...song,
        tempo: targetBPM,
        notes: song.notes.map(n => ({
            ...n,
            time: n.time * ratio,
            duration: n.duration * ratio
        }))
    };
}

// ============================================
// DTW ALIGNMENT
// ============================================

function computeDTW(userNotes, refNotes, options = {}) {
    const {
        pitchWeight = 0.5,
        timingWeight = 0.5,
        silencePenalty = 1.0,
        extraNotePenalty = 0.5,
        windowWidth = 10
    } = options;

    if (userNotes.length === 0) return { path: [], cost: Infinity };
    if (refNotes.length === 0) return { path: [], cost: Infinity };

    let userFiltered = userNotes.filter(n => !n.isSilent);
    let refFiltered = refNotes.filter(n => n.note);

    if (userFiltered.length === 0 || refFiltered.length === 0) {
        return { path: [], cost: Infinity };
    }

    let n = userFiltered.length;
    let m = refFiltered.length;

    let dtw = Array(n).fill(null).map(() => Array(m).fill(Infinity));
    let costMatrix = Array(n).fill(null).map(() => Array(m).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            let u = userFiltered[i];
            let r = refFiltered[j];
            let refFreq = noteToFrequency(r.note);

            let pitchCents = Math.abs(frequencyToCents(u.frequency) - frequencyToCents(refFreq));
            let normalizedPitch = Math.min(pitchCents / 50, 1.0);

            let timingDelta = Math.abs(u.timestamp - r.time);
            let normalizedTiming = Math.min(timingDelta / 0.2, 1.0);

            costMatrix[i][j] = normalizedPitch * pitchWeight + normalizedTiming * timingWeight;
        }
    }

    dtw[0][0] = costMatrix[0][0];

    for (let i = 1; i < n; i++) {
        let jStart = Math.max(0, i - windowWidth);
        let jEnd = Math.min(m - 1, i + windowWidth);
        for (let j = jStart; j <= jEnd; j++) {
            let prevCosts = [dtw[i-1][j-1], dtw[i-1][j], dtw[i][j-1]];
            let minPrev = Math.min(...prevCosts);
            dtw[i][j] = costMatrix[i][j] + minPrev;
        }
    }

    let path = [];
    let i = n - 1;
    let j = m - 1;

    while (i > 0 || j > 0) {
        path.unshift({ userIndex: i, refIndex: j, cost: costMatrix[i][j] });
        if (i === 0) { j--; continue; }
        if (j === 0) { i--; continue; }

        let options = [
            { val: dtw[i-1][j-1], di: -1, dj: -1 },
            { val: dtw[i-1][j], di: -1, dj: 0 },
            { val: dtw[i][j-1], di: 0, dj: -1 }
        ];
        let best = options.reduce((a, b) => a.val < b.val ? a : b);
        i += best.di;
        j += best.dj;
    }
    path.unshift({ userIndex: 0, refIndex: 0, cost: costMatrix[0][0] });

    return { path, cost: dtw[n-1][m-1], costMatrix };
}

// ============================================
// SONG ANALYZER
// ============================================

class SongAnalyzer {
    constructor(song, options = {}) {
        this.song = song;
        this.options = {
            pitchWeight: 0.4,
            timingWeight: 0.3,
            completenessWeight: 0.3,
            perfectCentsThreshold: 20,
            goodCentsThreshold: 50,
            perfectMsThreshold: 50,
            goodMsThreshold: 200,
            ...options
        };
    }

    analyze(noteBuffer) {
        let userNotes = noteBuffer.getNotes();
        let refNotes = this.song.notes;

        let { path, cost, costMatrix } = computeDTW(userNotes, refNotes, this.options);

        if (path.length === 0) {
            return this.createEmptyReport();
        }

        let userFiltered = userNotes.filter(n => !n.isSilent);
        let perNote = this.scoreNotes(path, userFiltered, refNotes);
        let stats = this.calculateStats(perNote, refNotes);
        let scores = this.calculateScores(stats, perNote);
        let grade = this.calculateGrade(scores.overall);
        let feedback = this.generateFeedback(scores, stats);

        return {
            songId: this.song.id,
            overallScore: Math.round(scores.overall),
            pitchAccuracy: Math.round(scores.pitchAccuracy),
            timingAccuracy: Math.round(scores.timingAccuracy),
            completeness: Math.round(scores.completeness),
            feedback,
            grade,
            perNote,
            stats
        };
    }

    scoreNotes(path, userNotes, refNotes) {
        let perNote = [];
        let usedUserIndices = new Set();

        for (let k = 0; k < path.length; k++) {
            let { userIndex, refIndex } = path[k];
            let u = userNotes[userIndex];
            let r = refNotes[refIndex];

            if (!u || !r) continue;
            usedUserIndices.add(userIndex);

            let refFreq = noteToFrequency(r.note);
            let centsOff = Math.abs(frequencyToCents(u.frequency) - frequencyToCents(refFreq));
            let msOff = Math.abs(u.timestamp - r.time) * 1000;

            let pitchScore = Math.max(0, 100 - centsOff * 2);
            let timingScore = Math.max(0, 100 - msOff / 2);

            let status = 'hit';
            if (centsOff <= this.options.perfectCentsThreshold && msOff <= this.options.perfectMsThreshold * 2) {
                status = 'perfect';
            } else if (centsOff <= this.options.goodCentsThreshold && msOff <= this.options.goodMsThreshold) {
                status = 'close';
            } else if (centsOff > this.options.goodCentsThreshold || msOff > this.options.goodMsThreshold) {
                status = centsOff > this.options.goodCentsThreshold ? 'wrong-note' : 'late';
            }

            perNote.push({
                refIndex,
                refNote: r,
                userNote: u,
                pitchScore: Math.round(pitchScore),
                timingScore: Math.round(timingScore),
                centsOff: Math.round(centsOff),
                timingDeviationMs: Math.round(msOff),
                status
            });
        }

        let missedNotes = refNotes.filter((r, i) => !path.some(p => p.refIndex === i));
        for (let r of missedNotes) {
            perNote.push({
                refIndex: refNotes.indexOf(r),
                refNote: r,
                userNote: null,
                pitchScore: 0,
                timingScore: 0,
                centsOff: null,
                timingDeviationMs: null,
                status: 'missed'
            });
        }

        return perNote;
    }

    calculateStats(perNote, refNotes) {
        let total = refNotes.length;
        let hit = perNote.filter(p => p.status !== 'missed' && p.status !== 'extra').length;
        let missed = perNote.filter(p => p.status === 'missed').length;
        let perfect = perNote.filter(p => p.status === 'perfect').length;

        let centsSum = 0, centsCount = 0;
        let msSum = 0, msCount = 0;

        for (let p of perNote) {
            if (p.centsOff !== null) { centsSum += p.centsOff; centsCount++; }
            if (p.timingDeviationMs !== null) { msSum += p.timingDeviationMs; msCount++; }
        }

        return {
            totalExpectedNotes: total,
            notesHit: hit,
            notesMissed: missed,
            notesPerfect: perfect,
            averageCentsOff: centsCount > 0 ? centsSum / centsCount : 0,
            averageTimingMsOff: msCount > 0 ? msSum / msCount : 0
        };
    }

    calculateScores(stats, perNote) {
        let completeness = (stats.notesHit / stats.totalExpectedNotes) * 100;

        let pitchNotes = perNote.filter(p => p.userNote);
        let avgPitch = pitchNotes.length > 0
            ? pitchNotes.reduce((s, p) => s + p.pitchScore, 0) / pitchNotes.length
            : 0;

        let avgTiming = pitchNotes.length > 0
            ? pitchNotes.reduce((s, p) => s + p.timingScore, 0) / pitchNotes.length
            : 0;

        let pitchAccuracy = avgPitch;
        let timingAccuracy = avgTiming;

        let overall = (pitchAccuracy * this.options.pitchWeight) +
                     (timingAccuracy * this.options.timingWeight) +
                     (completeness * this.options.completenessWeight);

        return { overall, pitchAccuracy, timingAccuracy, completeness };
    }

    calculateGrade(score) {
        if (score >= 95) return 'A+';
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    generateFeedback(scores, stats) {
        if (scores.overall >= 90) {
            return stats.notesMissed > 0
                ? `Great job! Just missed ${stats.notesMissed} note(s).`
                : 'Perfect performance!';
        }
        if (scores.overall >= 80) {
            let tip = stats.averageCentsOff > 25 ? 'Try to tune more carefully.' : 'Watch your timing.';
            return `Good effort! ${tip}`;
        }
        if (scores.overall >= 70) {
            return 'Keep practicing! Focus on accuracy over speed.';
        }
        return 'Keep going! Try playing slower and more deliberately.';
    }

    createEmptyReport() {
        return {
            songId: this.song.id,
            overallScore: 0,
            pitchAccuracy: 0,
            timingAccuracy: 0,
            completeness: 0,
            feedback: 'No notes detected. Check your microphone.',
            grade: 'F',
            perNote: [],
            stats: { totalExpectedNotes: this.song.notes.length, notesHit: 0, notesMissed: 0, averageCentsOff: 0, averageTimingMsOff: 0 }
        };
    }
}

// ============================================
// EXPORTS
// ============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NoteBuffer,
        SongAnalyzer,
        createSong,
        scaleSongToTempo,
        frequencyToCents,
        centsToFrequency,
        noteToFrequency,
        noteToMidi,
        midiToNoteName
    };
}