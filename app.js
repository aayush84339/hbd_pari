/* ===================================================================
   app.js  –  Birthday Website for Pari
   Landing page, confetti, synthesized music, and image slideshow
   =================================================================== */

// ==================== IMAGE LIST (10 images) ====================
const images = [
    'images/photo1.jpg',
    'images/photo2.jpg',
    'images/photo3.jpg',
    'images/photo4.jpg',
    'images/photo5.jpg',
    'images/photo6.jpg',
    'images/photo7.jpg',
    'images/photo8.jpg',
    'images/photo9.jpg',
    'images/photo10.jpg'
];

let currentIndex = 0;
let slideshowInterval = null;
let slideshowTimeout = null;
let musicPlaying = false;
let audioCtx = null;
let masterGain = null;
let melodyTimeout = [];
let isTransitioning = false;

// ==================== ANIMATION PAIRS ====================
// Each image gets a unique enter/exit animation pair
const animationPairs = [
    { enter: 'anim-enter-expand',  exit: 'anim-exit-shrink'  },  // 1: expand from center
    { enter: 'anim-enter-left',    exit: 'anim-exit-right'   },  // 2: slide from left
    { enter: 'anim-enter-right',   exit: 'anim-exit-left'    },  // 3: slide from right
    { enter: 'anim-enter-top',     exit: 'anim-exit-bottom'  },  // 4: drop from top
    { enter: 'anim-enter-bottom',  exit: 'anim-exit-top'     },  // 5: rise from bottom
    { enter: 'anim-enter-spiral',  exit: 'anim-exit-spiral'  },  // 6: spiral in
    { enter: 'anim-enter-flip',    exit: 'anim-exit-flip'    },  // 7: 3D flip
    { enter: 'anim-enter-blur',    exit: 'anim-exit-blur'    },  // 8: blur zoom
    { enter: 'anim-enter-elastic', exit: 'anim-exit-elastic' },  // 9: elastic bounce
    { enter: 'anim-enter-corner',  exit: 'anim-exit-corner'  },  // 10: corner spin
];

// ==================== SECTION MANAGEMENT ====================
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    if (sectionId === 'gallery') {
        startSlideshow();
    } else {
        stopSlideshow();
    }

    if (sectionId === 'game') {
        initFlappyGame();
    }
}

// ==================== CONFETTI ON LANDING ====================
function initConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confettiPieces = [];
    const colors = ['#ff6b9d', '#ffd700', '#a855f7', '#6366f1', '#ff9a9e', '#fbc2eb', '#a1c4fd', '#c2e9fb', '#f6d365'];

    class Confetti {
        constructor() {
            this.reset();
            this.y = Math.random() * canvas.height;
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = -10;
            this.size = Math.random() * 8 + 3;
            this.speedY = Math.random() * 2 + 1;
            this.speedX = (Math.random() - 0.5) * 2;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.rotation = Math.random() * 360;
            this.rotationSpeed = (Math.random() - 0.5) * 8;
            this.opacity = Math.random() * 0.7 + 0.3;
            this.shape = Math.floor(Math.random() * 3);
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.y * 0.01) * 0.5;
            this.rotation += this.rotationSpeed;
            if (this.y > canvas.height + 20) this.reset();
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;

            if (this.shape === 0) {
                ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
            } else if (this.shape === 1) {
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                drawStar(ctx, 0, 0, 5, this.size / 2, this.size / 4);
            }
            ctx.restore();
        }
    }

    function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
        let rot = Math.PI / 2 * 3, step = Math.PI / spikes;
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerR);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
            rot += step;
            ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
            rot += step;
        }
        ctx.closePath();
        ctx.fill();
    }

    for (let i = 0; i < 80; i++) {
        confettiPieces.push(new Confetti());
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiPieces.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// ==================== MUSIC SYNTHESIS ====================
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(audioCtx.destination);
}

function playHappyBirthdayMelody() {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    melodyTimeout.forEach(t => clearTimeout(t));
    melodyTimeout = [];

    const G4 = 392.00, A4 = 440.00, B4 = 493.88;
    const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99;

    const melody = [
        [G4, 300], [G4, 150], [A4, 500], [G4, 500], [C5, 500], [B4, 900],
        [0, 200],
        [G4, 300], [G4, 150], [A4, 500], [G4, 500], [D5, 500], [C5, 900],
        [0, 200],
        [G4, 300], [G4, 150], [G5, 500], [E5, 500], [C5, 500], [B4, 400], [A4, 900],
        [0, 200],
        [F5, 300], [F5, 150], [E5, 500], [C5, 500], [D5, 500], [C5, 1000],
        [0, 600]
    ];

    let time = 0;
    melody.forEach(([freq, dur]) => {
        if (freq > 0) {
            const t = setTimeout(() => playNote(freq, dur / 1000), time);
            melodyTimeout.push(t);
        }
        time += dur + 50;
    });

    const totalDuration = time;
    const loopT = setTimeout(() => {
        if (musicPlaying) playHappyBirthdayMelody();
    }, totalDuration);
    melodyTimeout.push(loopT);

    startAmbientPad();
}

function playNote(freq, duration) {
    if (!audioCtx || !musicPlaying) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration + 0.1);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();

    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;

    gain2.gain.setValueAtTime(0, audioCtx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration * 0.7);

    osc2.connect(gain2);
    gain2.connect(masterGain);

    osc2.start(audioCtx.currentTime);
    osc2.stop(audioCtx.currentTime + duration + 0.1);
}

let ambientOscillators = [];

function startAmbientPad() {
    if (ambientOscillators.length > 0) return;

    const freqs = [130.81, 196.00, 261.63];
    freqs.forEach(f => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        gain.gain.value = 0.03;

        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.value = 0.3 + Math.random() * 0.2;
        lfoGain.gain.value = 0.01;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();

        ambientOscillators.push({ osc, gain, lfo });
    });
}

function stopAmbientPad() {
    ambientOscillators.forEach(({ osc, gain, lfo }) => {
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
        setTimeout(() => {
            osc.stop();
            lfo.stop();
        }, 600);
    });
    ambientOscillators = [];
}

function toggleMusic() {
    const btn = document.getElementById('musicToggle');
    const icon = document.getElementById('musicIcon');

    if (musicPlaying) {
        musicPlaying = false;
        melodyTimeout.forEach(t => clearTimeout(t));
        melodyTimeout = [];
        stopAmbientPad();
        icon.textContent = '🔇';
        btn.classList.remove('playing');
    } else {
        musicPlaying = true;
        playHappyBirthdayMelody();
        icon.textContent = '🔊';
        btn.classList.add('playing');
    }
}

// ==================== NEW SLIDESHOW WITH 10 UNIQUE ANIMATIONS ====================

function initDots() {
    const dotsContainer = document.getElementById('slideDots');
    dotsContainer.innerHTML = '';
    images.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'slide-dot' + (i === 0 ? ' active' : '');
        dotsContainer.appendChild(dot);
    });
}

function updateDots(index) {
    document.querySelectorAll('.slide-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function showImageWithAnimation(index) {
    if (isTransitioning) return;
    isTransitioning = true;

    const wrapper = document.getElementById('slideWrapper');
    const activeSlide = document.getElementById('activeSlide');
    const pair = animationPairs[index % animationPairs.length];

    // If there's a current image showing, animate it out
    if (activeSlide.style.backgroundImage) {
        // Apply exit animation to the current slide
        const currentPair = animationPairs[currentIndex % animationPairs.length];
        activeSlide.className = 'slide-img ' + currentPair.exit;

        // After exit animation finishes, show the new image
        setTimeout(() => {
            // Create a fresh slide element for the new image
            activeSlide.className = 'slide-img';
            activeSlide.style.backgroundImage = `url('${images[index]}')`;

            // Force reflow to ensure the class change takes effect
            activeSlide.offsetHeight;

            // Apply entrance animation
            activeSlide.classList.add(pair.enter);

            currentIndex = index;
            document.getElementById('slideNum').textContent = index + 1;
            updateDots(index);

            setTimeout(() => {
                isTransitioning = false;
            }, 1200);
        }, 850);
    } else {
        // First image — just enter
        activeSlide.style.backgroundImage = `url('${images[index]}')`;
        activeSlide.offsetHeight;
        activeSlide.className = 'slide-img ' + pair.enter;

        currentIndex = index;
        document.getElementById('slideNum').textContent = index + 1;
        updateDots(index);

        setTimeout(() => {
            isTransitioning = false;
        }, 1200);
    }
}

function nextSlide() {
    const nextIndex = (currentIndex + 1) % images.length;
    showImageWithAnimation(nextIndex);
}

function startSlideshow() {
    stopSlideshow();
    initDots();
    currentIndex = 0;
    isTransitioning = false;

    // Reset the slide element
    const activeSlide = document.getElementById('activeSlide');
    activeSlide.className = 'slide-img';
    activeSlide.style.backgroundImage = '';

    // Show first image immediately
    showImageWithAnimation(0);

    // Auto-advance every 5 seconds (5s display + ~1s transition overlap)
    slideshowInterval = setInterval(() => {
        nextSlide();
    }, 5000);
}

function stopSlideshow() {
    if (slideshowInterval) {
        clearInterval(slideshowInterval);
        slideshowInterval = null;
    }
    if (slideshowTimeout) {
        clearTimeout(slideshowTimeout);
        slideshowTimeout = null;
    }
}

// ==================== SPARKLE EFFECTS ====================
function initSparkles() {
    const container = document.getElementById('sparkles');
    for (let i = 0; i < 30; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = Math.random() * 100 + '%';
        sparkle.style.top = Math.random() * 100 + '%';
        sparkle.style.animationDelay = Math.random() * 3 + 's';
        sparkle.style.animationDuration = (Math.random() * 2 + 2) + 's';
        const colors = ['rgba(255,215,0,0.6)', 'rgba(255,107,157,0.6)', 'rgba(168,85,247,0.5)'];
        sparkle.style.boxShadow = `0 0 6px 2px ${colors[Math.floor(Math.random() * colors.length)]}`;
        container.appendChild(sparkle);
    }
}

// ==================== START EXPERIENCE ====================
function startExperience() {
    musicPlaying = true;
    playHappyBirthdayMelody();
    document.getElementById('musicToggle').classList.add('playing');
    document.getElementById('musicIcon').textContent = '🔊';

    showSection('gallery');
}

// ==================== INIT ====================
window.addEventListener('DOMContentLoaded', () => {
    initConfetti();
    initSparkles();
});
