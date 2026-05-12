// --- Data Management ---
let LESSONS = JSON.parse(localStorage.getItem('fretflow_lessons')) || [
    { id: 1, title: 'The E String (Low)', difficulty: 'easy', status: 'completed', targetNote: 'E2', desc: 'Focus on the thickest string.' },
    { id: 2, title: 'Basic A Minor Chord', difficulty: 'easy', status: 'available', targetNote: 'A2', desc: 'First fret of the B string.' },
    { id: 3, title: 'Pentatonic Box 1', difficulty: 'medium', status: 'available', targetNote: 'G3', desc: 'Mastering the G string.' },
    { id: 4, title: 'Barre Chord Shape', difficulty: 'hard', status: 'locked', targetNote: 'B3', desc: 'Advanced finger strength.' },
    { id: 5, title: 'Open G Major', difficulty: 'easy', status: 'completed', targetNote: 'G2', desc: 'Strumming fundamentals.' },
    { id: 6, title: 'Blues Turnaround', difficulty: 'medium', status: 'available', targetNote: 'E4', desc: 'High E string accuracy.' }
];

let historyData = JSON.parse(localStorage.getItem('fretflow_history')) || [
    { id: 101, title: 'The E String (Low)', date: '2023-10-01', duration: '15m' },
    { id: 102, title: 'Open G Major', date: '2023-10-02', duration: '20m' }
];

const STRINGS = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2']; // High to Low
const FRET_COUNT = 12;

// --- Audio Engine (YIN Integration) ---
const processor = new AudioProcessor();
let detectionActive = false;

// --- DOM Elements ---
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

// Admin Elements
const adminFab = document.getElementById('admin-fab');
const adminModal = document.getElementById('admin-modal');
const lessonForm = document.getElementById('lesson-form');
const closeModal = document.getElementById('close-modal');

// --- Initialization ---
function init() {
    generateFretboard();
    renderLessons();
    renderHistory();
    updateProgress();
    setupEventListeners();
}

// --- Fretboard Logic ---
function generateFretboard() {
    guitarFretboard.innerHTML = '';
    STRINGS.forEach((stringName, sIdx) => {
        const stringEl = document.createElement('div');
        stringEl.className = 'string';
        stringEl.dataset.string = stringName;

        for (let f = 0; f <= FRET_COUNT; f++) {
            const fretEl = document.createElement('div');
            fretEl.className = 'fret';
            
            // Add fret numbers on the first string only
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

function highlightTargetNote(note) {
    // In a real app, we'd map 'E2' to String 6, Fret 0 etc.
    // Simple mock: highlight a random fret for visual effect
    document.querySelectorAll('.note-marker').forEach(m => m.style.display = 'none');
    
    // Logic for demo: if note is E2, show 6th string, 0 fret
    let s = 'E2', f = 0;
    if (note === 'A2') { s = 'A2'; f = 0; }
    if (note === 'G3') { s = 'G3'; f = 0; }
    
    const target = document.getElementById(`note-${s}-${f}`);
    if (target) target.style.display = 'block';
}

// --- Rendering ---
function renderLessons() {
    const searchTerm = searchInput.value.toLowerCase();
    const diff = difficultyFilter.value;
    const stat = statusFilter.value;

    const filtered = LESSONS.filter(lesson => {
        const matchesSearch = lesson.title.toLowerCase().includes(searchTerm);
        const matchesDiff = diff === 'all' || lesson.difficulty === diff;
        const matchesStat = stat === 'all' || lesson.status === stat;
        return matchesSearch && matchesDiff && matchesStat;
    });

    lessonGrid.innerHTML = filtered.map(lesson => `
        <div class="lesson-card glass ${lesson.status === 'locked' ? 'locked' : ''}">
            <div class="card-header">
                <span class="difficulty-badge ${lesson.difficulty}">${lesson.difficulty}</span>
                <span class="status-label">
                    ${lesson.status === 'completed' ? '<i class="fas fa-check-circle" style="color: var(--success)"></i>' : 
                      lesson.status === 'locked' ? '<i class="fas fa-lock"></i>' : '<i class="fas fa-play-circle"></i>'}
                </span>
            </div>
            <h3 class="lesson-title">${lesson.title}</h3>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px;">${lesson.desc || ''}</p>
            <button class="practice-btn" 
                onclick="startPractice(${lesson.id})" 
                ${lesson.status === 'locked' ? 'disabled' : ''}>
                ${lesson.status === 'completed' ? 'Review' : 'Start'}
            </button>
        </div>
    `).join('');
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

// --- Actions ---
let activeLesson = null;

window.startPractice = function(id) {
    activeLesson = LESSONS.find(l => l.id === id);
    activeLessonTitle.innerText = activeLesson.title;
    targetNoteDisplay.innerText = activeLesson.targetNote || 'Any';
    interactiveView.style.display = 'flex';
    highlightTargetNote(activeLesson.targetNote);
    
    // Start Audio Processing
    startAudio();
};

function startAudio() {
    processor.start();
    micStatusDisplay.innerHTML = '<i class="fas fa-microphone" style="color: var(--success)"></i> Microphone: Listening...';
    
    processor.onNoteDetected = (freq, note) => {
        if (note !== '--') {
            currentPitchDisplay.innerText = note;
            
            // Check for match
            if (activeLesson && note === activeLesson.targetNote) {
                handleMatch();
            }
        } else {
            currentPitchDisplay.innerText = '--';
        }
    };
}

function handleMatch() {
    // Visual Feedback
    const targetMarker = document.querySelector('.note-marker[style*="display: block"]');
    if (targetMarker) {
        targetMarker.style.background = 'var(--success)';
        targetMarker.style.boxShadow = '0 0 25px var(--success)';
    }
    
    // Auto-complete after a short delay
    setTimeout(() => {
        if (activeLesson) {
            completeActiveLesson();
        }
    }, 1500);
}

function completeActiveLesson() {
    if (activeLesson.status !== 'completed') {
        activeLesson.status = 'completed';
        historyData.unshift({
            id: Date.now(),
            title: activeLesson.title,
            date: new Date().toLocaleDateString(),
            duration: '10m'
        });
        renderLessons();
        renderHistory();
        updateProgress();
    }
    closePracticeView();
}

function closePracticeView() {
    processor.stop();
    micStatusDisplay.innerHTML = '<i class="fas fa-microphone-slash"></i> Microphone: Off';
    currentPitchDisplay.innerText = '--';
    interactiveView.style.display = 'none';
    activeLesson = null;
}

window.deleteHistory = function(id) {
    historyData = historyData.filter(item => item.id !== id);
    renderHistory();
    updateProgress();
};

document.getElementById('finish-practice').onclick = completeActiveLesson;

document.getElementById('close-fretboard').onclick = closePracticeView;

// --- Admin Logic ---
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
        targetNote: document.getElementById('new-lesson-note').value
    };
    
    LESSONS.push(newLesson);
    renderLessons();
    updateProgress();
    adminModal.style.display = 'none';
    lessonForm.reset();
};

// --- Listeners ---
function setupEventListeners() {
    searchInput.oninput = renderLessons;
    difficultyFilter.onchange = renderLessons;
    statusFilter.onchange = renderLessons;
}

init();
