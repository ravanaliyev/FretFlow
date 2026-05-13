// --- FretFlow Syllabus (Step-by-Step Curriculum) ---
const DEFAULT_LESSONS = [
    { id: 1, title: 'The E String (Low)', level: 1, difficulty: 'easy', status: 'available', sequence: ['E2'], desc: 'The thickest string. Pluck it once.' },
    { id: 2, title: 'String Discovery', level: 1, difficulty: 'easy', status: 'locked', sequence: ['E2', 'A2', 'D3'], desc: 'Discover the first three strings.' },
    { id: 3, title: 'First Fret Drill', level: 2, difficulty: 'medium', status: 'locked', sequence: ['F2', 'Bb2', 'Eb3'], desc: 'Press the first fret on three strings.' },
    { id: 4, title: 'The G Major Note', level: 2, difficulty: 'easy', status: 'locked', sequence: ['G2'], desc: 'Find G on the 3rd fret of the E string.' },
    { id: 5, title: 'Classic Rock Riff', level: 3, difficulty: 'hard', status: 'locked', sequence: ['E2', 'G2', 'A2'], desc: 'The beginning of a legend.' },
    { id: 6, title: 'Simple Scale', level: 3, difficulty: 'medium', status: 'locked', sequence: ['C3', 'D3', 'E3', 'F3', 'G3'], desc: 'Your first major scale fragment.' }
];

let storedLessons = JSON.parse(localStorage.getItem('fretflow_lessons'));
if (storedLessons && storedLessons.length > 0 && !storedLessons[0].sequence) {
    localStorage.removeItem('fretflow_lessons');
    storedLessons = null;
}
let LESSONS = storedLessons || DEFAULT_LESSONS;
let historyData = JSON.parse(localStorage.getItem('fretflow_history')) || [];

const STRINGS = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
const FRET_COUNT = 12;
const processor = new AudioProcessor();

let activeLesson = null;
let currentSequenceIndex = 0;

// --- DOM Elements ---
const levelSelection = document.getElementById('level-selection');
const lessonView = document.getElementById('lesson-view');
const backToLevels = document.getElementById('back-to-levels');
const lessonGrid = document.getElementById('lesson-grid');
const historyList = document.getElementById('history-list');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const searchInput = document.getElementById('lesson-search');
const difficultyFilter = document.getElementById('difficulty-filter');
const statusFilter = document.getElementById('status-filter');
const interactiveView = document.getElementById('interactive-view');
const activeLessonTitle = document.getElementById('active-lesson-title');
const guitarFretboard = document.getElementById('guitar-fretboard');
const targetNoteDisplay = document.getElementById('target-note');
const micStatusDisplay = document.getElementById('mic-status');
const currentPitchDisplay = document.getElementById('current-pitch');
const sequenceContainer = document.getElementById('lesson-sequence-container');

// Admin Elements
const adminFab = document.getElementById('admin-fab');
const adminModal = document.getElementById('admin-modal');
const lessonForm = document.getElementById('lesson-form');
const closeModal = document.getElementById('close-modal');

// --- Initialization ---
function init() {
    generateFretboard();
    renderLevelMenu();
    renderHistory();
    updateProgress();
    setupEventListeners();
}

function renderLevelMenu() {
    const levels = [
        { id: 1, name: "The Foundations", desc: "Learn the strings and open notes." },
        { id: 2, name: "Fret Mastery", desc: "Navigate the first 3 frets with ease." },
        { id: 3, name: "Melodies", desc: "Play your first riffs and songs." }
    ];
    levelSelection.style.display = 'flex';
    lessonView.style.display = 'none';
    levelSelection.innerHTML = levels.map(l => `
        <div class="level-item glass" onclick="showLessons(${l.id})">
            <span class="level-badge">LEVEL ${l.id}</span>
            <h1>${l.name}</h1>
            <p>${l.desc}</p>
        </div>
    `).join('');
}

window.showLessons = function(levelId) {
    const searchTerm = searchInput.value.toLowerCase();
    const diff = difficultyFilter.value;
    const stat = statusFilter.value;

    const filtered = LESSONS.filter(lesson => {
        const matchesLevel = lesson.level == levelId;
        const matchesSearch = lesson.title.toLowerCase().includes(searchTerm);
        const matchesDiff = diff === 'all' || lesson.difficulty === diff;
        const matchesStat = stat === 'all' || lesson.status === stat;
        return matchesLevel && matchesSearch && matchesDiff && matchesStat;
    });

    levelSelection.style.display = 'none';
    lessonView.style.display = 'block';
    lessonGrid.innerHTML = filtered.map(lesson => renderLessonCard(lesson)).join('');
}

function renderLessonCard(lesson) {
    return `
        <div class="lesson-card glass ${lesson.status === 'locked' ? 'locked' : ''}">
            <div class="card-header">
                <span class="difficulty-badge ${lesson.difficulty}">${lesson.difficulty}</span>
                <div class="status-label">
                    ${lesson.status === 'completed' ? '<i class="fas fa-check-circle" style="color: var(--success)"></i>' : 
                      lesson.status === 'locked' ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-play-circle"></i>'}
                </div>
            </div>
            <h3 class="lesson-title">${lesson.title}</h3>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px;">${lesson.desc}</p>
            <div style="font-size: 0.7rem; color: var(--primary-color); margin-bottom: 15px;">
                <i class="fas fa-music"></i> ${lesson.sequence.length} Notes
            </div>
            <button class="practice-btn" onclick="startPractice(${lesson.id})" ${lesson.status === 'locked' ? 'disabled' : ''}>
                ${lesson.status === 'completed' ? 'Review' : 'Start'}
            </button>
        </div>
    `;
}

backToLevels.onclick = renderLevelMenu;

// --- Fretboard & Logic ---
function generateFretboard() {
    guitarFretboard.innerHTML = '';
    STRINGS.forEach((stringName, sIdx) => {
        const stringEl = document.createElement('div');
        stringEl.className = 'string';
        for (let f = 0; f <= FRET_COUNT; f++) {
            const fretEl = document.createElement('div');
            fretEl.className = 'fret';
            if (sIdx === 0) {
                const num = document.createElement('span');
                num.className = 'fret-number';
                num.innerText = f;
                fretEl.appendChild(num);
            }
            const marker = document.createElement('div');
            marker.className = 'note-marker';
            marker.id = `note-${stringName}-${f}`;
            fretEl.appendChild(marker);
            stringEl.appendChild(fretEl);
        }
        guitarFretboard.appendChild(stringEl);
    });
}

function getFretPosition(noteName) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const match = noteName.match(/^([A-G]#?)(\d)$/);
    if (!match) return null;
    const name = match[1], octave = parseInt(match[2]);
    const midiNote = (octave + 1) * 12 + noteNames.indexOf(name);
    const guitarStrings = [
        { name: 'E4', midi: 64 }, { name: 'B3', midi: 59 }, { name: 'G3', midi: 55 },
        { name: 'D3', midi: 50 }, { name: 'A2', midi: 45 }, { name: 'E2', midi: 40 }
    ];
    for (const string of guitarStrings) {
        const fret = midiNote - string.midi;
        if (fret >= 0 && fret <= 12) return { string: string.name, fret: fret };
    }
    return null;
}

function highlightTargetNote(note) {
    document.querySelectorAll('.note-marker').forEach(m => {
        m.style.display = 'none';
        m.style.background = 'var(--primary-color)';
        m.style.boxShadow = '0 0 15px var(--primary-color)';
    });
    const pos = getFretPosition(note);
    if (pos) {
        const target = document.getElementById(`note-${pos.string}-${pos.fret}`);
        if (target) target.style.display = 'block';
    }
}

// --- Practice Logic ---
window.startPractice = function(id) {
    activeLesson = LESSONS.find(l => l.id === id);
    currentSequenceIndex = 0;
    activeLessonTitle.innerText = activeLesson.title;
    interactiveView.style.display = 'flex';
    renderSequenceIndicators();
    updateActiveStep();
    startAudio();
};

function renderSequenceIndicators() {
    sequenceContainer.innerHTML = activeLesson.sequence.map((_, i) => `
        <div class="sequence-dot" id="dot-${i}"></div>
    `).join('');
}

function updateActiveStep() {
    const targetNote = activeLesson.sequence[currentSequenceIndex];
    targetNoteDisplay.innerText = targetNote;
    highlightTargetNote(targetNote);
    document.querySelectorAll('.sequence-dot').forEach((dot, i) => {
        dot.className = 'sequence-dot' + (i < currentSequenceIndex ? ' completed' : i === currentSequenceIndex ? ' active' : '');
    });
}

function startAudio() {
    processor.start();
    micStatusDisplay.innerHTML = '<i class="fas fa-microphone" style="color: var(--success)"></i> Microphone: Listening...';
    processor.onNoteDetected = (freq, note) => {
        if (note !== '--') {
            currentPitchDisplay.innerText = note;
            const targetNote = activeLesson.sequence[currentSequenceIndex];
            if (note === targetNote) handleMatch();
        } else {
            currentPitchDisplay.innerText = '--';
        }
    };
}

function handleMatch() {
    const targetMarker = document.querySelector('.note-marker[style*="display: block"]');
    if (targetMarker) {
        targetMarker.style.background = 'var(--success)';
        targetMarker.style.boxShadow = '0 0 25px var(--success)';
    }
    currentSequenceIndex++;
    if (currentSequenceIndex < activeLesson.sequence.length) {
        setTimeout(updateActiveStep, 800);
    } else {
        setTimeout(completeActiveLesson, 1200);
    }
}

function completeActiveLesson() {
    if (activeLesson.status !== 'completed') {
        activeLesson.status = 'completed';
        historyData.unshift({ id: Date.now(), title: activeLesson.title, date: new Date().toLocaleDateString() });
        const currentIndex = LESSONS.findIndex(l => l.id === activeLesson.id);
        if (currentIndex < LESSONS.length - 1) LESSONS[currentIndex + 1].status = 'available';
        updateProgress();
    }
    closePracticeView();
    showLessons(activeLesson.level); // Return to the current level's lesson list
}

function closePracticeView() {
    processor.stop();
    micStatusDisplay.innerHTML = '<i class="fas fa-microphone-slash"></i> Microphone: Off';
    interactiveView.style.display = 'none';
    activeLesson = null;
}

function renderHistory() {
    historyList.innerHTML = historyData.map(item => `
        <div class="history-item">
            <div class="history-info">
                <p>${item.title}</p>
                <span>${item.date}</span>
            </div>
            <button class="delete-btn" onclick="deleteHistory(${item.id})">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
}

function updateProgress() {
    const completed = LESSONS.filter(l => l.status === 'completed').length;
    const percentage = Math.round((completed / LESSONS.length) * 100);
    progressFill.style.width = `${percentage}%`;
    progressText.innerText = `${percentage}%`;
    localStorage.setItem('fretflow_lessons', JSON.stringify(LESSONS));
    localStorage.setItem('fretflow_history', JSON.stringify(historyData));
}

window.deleteHistory = function(id) {
    historyData = historyData.filter(item => item.id !== id);
    renderHistory();
    updateProgress();
};

document.getElementById('finish-practice').onclick = completeActiveLesson;
document.getElementById('close-fretboard').onclick = closePracticeView;

adminFab.onclick = () => adminModal.style.display = 'flex';
closeModal.onclick = () => adminModal.style.display = 'none';

lessonForm.onsubmit = function(e) {
    e.preventDefault();
    const newLesson = {
        id: Date.now(),
        title: document.getElementById('new-lesson-title').value,
        difficulty: document.getElementById('new-lesson-diff').value,
        status: 'available',
        desc: document.getElementById('new-lesson-desc').value,
        sequence: document.getElementById('new-lesson-note').value.split(',').map(s => s.trim())
    };
    LESSONS.push(newLesson);
    updateProgress();
    adminModal.style.display = 'none';
    lessonForm.reset();
};

function setupEventListeners() {
    searchInput.oninput = () => { if (lessonView.style.display === 'block') showLessons(activeLevelId); }; // Simplified
    difficultyFilter.onchange = () => { if (lessonView.style.display === 'block') showLessons(activeLevelId); };
    statusFilter.onchange = () => { if (lessonView.style.display === 'block') showLessons(activeLevelId); };
}

init();
