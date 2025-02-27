window.requestAnimationFrame =
    window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback, element) {
            var lastTime = element.__lastTime;
            if (lastTime === undefined) {
                lastTime = 0;
            }
            var currTime = Date.now();
            var timeToCall = Math.max(1, 33 - (currTime - lastTime));
            window.setTimeout(callback, timeToCall);
            element.__lastTime = currTime + timeToCall;
        };
    })();

window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));

// Global variables
var currentAudioPlayer = new Audio();
var audioPreloader = new Audio();
var isPreloading = false;
var isAnimating = false;
var currentIndex = 0;
var loaded = false;

var audioControls = {
    songs: [],
    songIndex: 0,
    previousIndex: -1,
    prevClickTime: 0,
    isInitialized: false
};

// Configure audio context with user interaction
let audioContext = null;

function initializeAudioControls() {
    const playPauseBtn = document.getElementById("play-pause");
    const nextBtn = document.getElementById("next");
    const prevBtn = document.getElementById("prev");
    const songTitleElement = document.getElementById('song-title');

    // Get the correct base URL for GitHub Pages
    const getBaseUrl = () => {
        const fullPath = window.location.pathname;
        const repoName = fullPath.split('/')[1]; // Get repository name
        return window.location.hostname.includes('github.io') 
            ? `/${repoName}/`
            : '/';
    };

    const baseUrl = getBaseUrl();

    // Setup songs with correct paths
    var firstSong = `${baseUrl}audio/Karencici - 愛你但說不出口.mp3`;
    var otherSongs = [
        "audio/P-Lo, Ymtk - SILK.mp3",
        "audio/Baby Bash - Suga Suga.mp3",
        "audio/Clairo - Add Up My Love.mp3",
        "audio/Giveon - Stuck On You.mp3",
        "audio/Raveena - If Only.mp3",
        "audio/slchld - you won't be there for me.mp3",
        "audio/Still Woozy - Anyone But You.mp3",
        "audio/Jay Park - (WYA) Remix.mp3",
        "audio/Sabrina Carpenter - Juno.mp3",
    ].map(song => `${baseUrl}${song}`);

    audioControls.songs = [firstSong].concat(otherSongs.sort(() => Math.random() - 0.5));

    // Initialize AudioContext after user interaction
    async function initAudioContextAndPlay() {
        try {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // Create audio element source if needed
            const source = audioContext.createMediaElementSource(currentAudioPlayer);
            source.connect(audioContext.destination);

            // Start playing the first song
            playSong(0);
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }
    }

    async function playSong(index) {
        try {
            // Ensure the audio context is running
            if (audioContext && audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            if (audioPreloader.src.includes(audioControls.songs[index])) {
                const temp = currentAudioPlayer;
                currentAudioPlayer = audioPreloader;
                audioPreloader = temp;
            } else {
                currentAudioPlayer.src = audioControls.songs[index];
            }

            songTitleElement.textContent = getSongName(audioControls.songs[index]);

            await currentAudioPlayer.load();
            const playPromise = currentAudioPlayer.play();

            if (playPromise !== undefined) {
                await playPromise;
                currentAudioPlayer.muted = false;
                playPauseBtn.innerHTML = '<div class="pause-icon"></div>';
                preloadNextSong();
            }
        } catch (error) {
            console.error('Playback failed:', error);
            setTimeout(() => {
                currentAudioPlayer.play().catch(e => console.warn("Retry failed:", e));
            }, 1000);
        }
    }

    function preloadNextSong() {
        const nextIndex = (audioControls.songIndex + 1) % audioControls.songs.length;
        if (!audioPreloader.src.includes(audioControls.songs[nextIndex])) {
            audioPreloader.src = audioControls.songs[nextIndex];
            audioPreloader.load();
        }
    }

    // Initialize audio only after user interaction
    document.addEventListener('click', function startAudio() {
        document.removeEventListener('click', startAudio);
        initAudioContextAndPlay();
    }, { once: true });

    // Event listeners
    playPauseBtn.addEventListener("click", () => {
        if (currentAudioPlayer.paused) {
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => currentAudioPlayer.play());
            } else {
                currentAudioPlayer.play();
            }
            playPauseBtn.innerHTML = '<div class="pause-icon"></div>';
        } else {
            currentAudioPlayer.pause();
            playPauseBtn.innerHTML = '<div class="play-icon"></div>';
        }
    });

    nextBtn.addEventListener("click", () => {
        audioControls.previousIndex = audioControls.songIndex;
        audioControls.songIndex = (audioControls.songIndex + 1) % audioControls.songs.length;
        playSong(audioControls.songIndex);
    });

    prevBtn.addEventListener("click", () => {
        const currentTime = Date.now();
        if (currentTime - audioControls.prevClickTime < 500) {
            audioControls.songIndex = (audioControls.songIndex - 1 + audioControls.songs.length) % audioControls.songs.length;
            playSong(audioControls.songIndex);
        } else {
            currentAudioPlayer.currentTime = 0;
        }
        audioControls.prevClickTime = currentTime;
    });

    currentAudioPlayer.addEventListener("ended", () => {
        audioControls.previousIndex = audioControls.songIndex;
        audioControls.songIndex = (audioControls.songIndex + 1) % audioControls.songs.length;
        playSong(audioControls.songIndex);
    });

    // Helper function to get formatted song name
    function getSongName(path) {
        return path.replace('audio/', '').replace('.mp3', '');
    }

    return playSong;
}

// Mobile scaling handler
function handleMobileScaling() {
    // Fix for iOS height issues
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // Update canvas scaling for mobile
    const mobile = window.isDevice;
    const koef = mobile ? 0.5 : 1;
    const canvas = document.getElementById('heart');
    if (canvas) {
        // Adjust for device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr * koef;
        canvas.height = rect.height * dpr * koef;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr * koef, dpr * koef);
    }
}

// Add event listeners for scaling
window.addEventListener('resize', handleMobileScaling);
window.addEventListener('orientationchange', handleMobileScaling);

// Initial call
handleMobileScaling();

// Prevent default touch behaviors
document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

function handleCanvasScaling() {
    const canvas = document.getElementById('heart');
    const ctx = canvas.getContext('2d');
    
    // Remove any transforms
    canvas.style.transform = 'none';
    
    // Make canvas fill the viewport
    function resizeCanvas() {
        // Get window dimensions
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Set canvas size to match window
        canvas.width = width;
        canvas.height = height;
        
        // Set canvas style dimensions
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        
        // Clear and fill with black
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(0, 0, width, height);
    }
    
    // Initial resize
    resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
    });
}

function init() {
    if (loaded) return;
    loaded = true;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        
        #heart {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 0;
        }
        
        .hidden-initially {
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.5s ease-in-out;
        }
        
        .visible {
            opacity: 1;
            pointer-events: auto;
        }
        
        #controls-container {
            position: fixed;
            bottom: max(20px, env(safe-area-inset-bottom));
            left: 0;
            right: 0;
            z-index: 1;
        }
    `;
    document.head.appendChild(style);
    handleCanvasScaling();

    var mobile = window.isDevice;
    var koef = mobile ? 0.5 : 1;
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = koef * innerWidth;
    var height = canvas.height = koef * innerHeight;

    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, width, height);

    // Hide controls initially
    const controlElements = document.querySelectorAll('#fireworks-btn, #audio-controls');
    controlElements.forEach(element => {
        if (element) element.classList.add('hidden-initially');
    });

    var textContainer = document.getElementById('text-container');
    var messages = [
        "Hey bab, I know this is very unconventional",
        "But I thought to try this new letter giving idea for your birthday",
        "I wanted to put my skills to the test and make something special for you",
        "I figured, I should make something memorable and last forever. Even to the end of time...",
        "I'm writing this to you November 13th, 2024 at home, waiting for you to come over to celebrate your birthday weekend",
        "We're going to have a really fun weekend; and even better, you'll be able to spend it with our friends from norcal",
        "This DNA-sequenced heart is made from the combination of both our hearts",
        "So long as this heart beats, my love for you will be forever",
        "If you're ever having a bad day, come to this website and just relax and calm your mind",
        "I have also inputted a couple songs that we love to listen to when we're on the hill near your house",
        "Also, I'm very excited to give your gifts to you and I hope you love them. Be ready :)",
        "P.S this took a LOT of math and coding so I'm really brain fried right now LOL",
        "Remember to always follow your heart",
        "Happy birthday my sweet pea",
        "I love you",
        "Always,",
        "-Lucian (Bub)"
    ];

    const startPrompt = document.getElementById('start-prompt');
    const audioPlayer = new Audio();
    const playPauseBtn = document.getElementById("play-pause");
    const nextBtn = document.getElementById("next");
    const prevBtn = document.getElementById("prev");
    const songTitleElement = document.getElementById('song-title');

    var firstSong = "audio/Karencici - 愛你但說不出口.mp3";
    var otherSongs = [
        "audio/P-Lo, Ymtk - SILK.mp3",
        "audio/Baby Bash - Suga Suga.mp3",
        "audio/Clairo - Add Up My Love.mp3",
        "audio/Giveon - Stuck On You.mp3",
        "audio/Raveena - If Only.mp3",
        "audio/slchld - you won't be there for me.mp3",
        "audio/Still Woozy - Anyone But You.mp3",
        "audio/Jay Park - (WYA) Remix.mp3",
        "audio/Sabrina Carpenter - Juno.mp3",
    ];
    //beep boop

    var shuffledSongs = [firstSong].concat(otherSongs.sort(() => Math.random() - 0.5));
    var songIndex = 0;
    var previousIndex = -1;
    var prevClickTime = 0;

    function playSong(index) {
        audioPlayer.src = shuffledSongs[index];
        songTitleElement.textContent = getSongName(shuffledSongs[index]);
        
        audioPlayer.play().then(() => {
            audioPlayer.muted = false;
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<div class="pause-icon"></div>';
            }
        }).catch((error) => {
            console.warn("Playback failed:", error);
        });
    }

    function getSongName(path) {
        return path.replace('audio/', '').replace('.mp3', '');
    }

    function nextSong() {
        previousIndex = songIndex;
        songIndex = (songIndex + 1) % shuffledSongs.length;
        playSong(songIndex);
    }

    function prevSong() {
        const currentTime = Date.now();
        if (currentTime - prevClickTime < 500) {
            songIndex = (songIndex - 1 + shuffledSongs.length) % shuffledSongs.length;
            playSong(songIndex);
        } else {
            audioPlayer.currentTime = 0;
        }
        prevClickTime = currentTime;
    }

    // Audio control event listeners
    if (nextBtn) nextBtn.addEventListener("click", nextSong);
    if (prevBtn) prevBtn.addEventListener("click", prevSong);
    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", () => {
            if (audioPlayer.paused) {
                audioPlayer.play();
                playPauseBtn.innerHTML = '<div class="pause-icon"></div>';
            } else {
                audioPlayer.pause();
                playPauseBtn.innerHTML = '<div class="play-icon"></div>';
            }
        });
    }

    audioPlayer.addEventListener("ended", nextSong);

    function changeText() {
        if (!textContainer || isAnimating) return;
        
        isAnimating = true;
        textContainer.style.animation = 'none';
        textContainer.offsetHeight;
        
        if (currentIndex === 0) {
            textContainer.textContent = '';
            setTimeout(() => {
                textContainer.textContent = messages[currentIndex];
                textContainer.style.animation = 'fadeInOut 10s ease-in-out';
                currentIndex = (currentIndex + 1) % messages.length;
                
                setTimeout(() => {
                    isAnimating = false;
                    changeText();
                }, 10000);
            }, 2000);
        } else {
            textContainer.textContent = messages[currentIndex];
            textContainer.style.animation = 'fadeInOut 10s ease-in-out';
            currentIndex = (currentIndex + 1) % messages.length;
            
            setTimeout(() => {
                isAnimating = false;
                changeText();
            }, 10000);
        }
    }

    // Set up click handler
    document.addEventListener('click', function startExperience(e) {
        // Remove the click listener after the first click
        document.removeEventListener('click', startExperience);
        
        // Resume the audio context if suspended
        if (currentAudioPlayer.context && currentAudioPlayer.context.state === 'suspended') {
            currentAudioPlayer.context.resume().then(() => {
                console.log('Audio context resumed successfully');
            }).catch(error => console.warn("Error resuming audio context:", error));
        }
        
        // Hide start prompt
        if (startPrompt) {
            startPrompt.style.display = 'none';
        }
        
        // Show controls with slight delay
        setTimeout(() => {
            controlElements.forEach(element => {
                if (element) element.classList.add('visible');
            });
        }, 500);
        
        // Start everything
        playSong(songIndex);
        heartAnimation();
        changeText();
        initCursor();
        initFireworks();
    });
}

// Cursor and trail effect
function initCursor() {
    const cursor = document.querySelector('.cursor');
    const cursorTrail = document.querySelector('.cursor-trail');
    const trails = [];
    const trailCount = 10; // Number of trailing hearts

    // Create initial trail hearts
    for (let i = 0; i < trailCount; i++) {
        const trail = document.createElement('div');
        trail.className = 'trail-heart';
        trail.style.opacity = 1 - (i / trailCount);
        cursorTrail.appendChild(trail);
        trails.push({
            element: trail,
            x: 0,
            y: 0
        });
    }

    // Update cursor position
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';

        // Update trail positions with delay
        trails.forEach((trail, index) => {
            setTimeout(() => {
                trail.x = e.clientX - 9;
                trail.y = e.clientY - 13;
                trail.element.style.left = trail.x + 'px';
                trail.element.style.top = trail.y + 'px';
            }, index * 70);
        });
    });

    // Scale effect on click
    document.addEventListener('mousedown', () => {
        cursor.style.transform = 'scale(0.8)';
        trails.forEach(trail => {
            trail.element.style.transform = 'scale(0.8)';
        });
    });

    document.addEventListener('mouseup', () => {
        cursor.style.transform = 'scale(1)';
        trails.forEach(trail => {
            trail.element.style.transform = 'scale(1)';
        });
    });

    // Make sure cursor is visible when entering window
    document.addEventListener('mouseenter', () => {
        cursor.style.display = 'block';
        cursorTrail.style.display = 'block';
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
        cursor.style.display = 'none';
        cursorTrail.style.display = 'none';
    });
}

function initFireworks() {
    const fireworksBtn = document.getElementById('fireworks-btn');
    const canvas = document.getElementById('heart'); // Using existing canvas
    const ctx = canvas.getContext('2d');

    class Firework {
        constructor(x, y, targetX, targetY, color, particleCount = 50) {
            this.x = x;
            this.y = y;
            this.startX = x;
            this.startY = y;
            this.targetX = targetX;
            this.targetY = targetY;
            this.color = color;
            this.distance = Math.sqrt(Math.pow(targetX - x, 2) + Math.pow(targetY - y, 2));
            this.angle = Math.atan2(targetY - y, targetX - x);
            this.speed = 2;
            this.progress = 0;
            this.alpha = 1;
            this.particles = [];
            this.explosionParticles = particleCount;
        }

        update() {
            if (this.progress >= 1) {
                if (this.particles.length === 0) {
                    // Create more particles for bigger explosions
                    for (let i = 0; i < this.explosionParticles; i++) {
                        const angle = (Math.PI * 2 / this.explosionParticles) * i;
                        // Randomize the velocity more for varied particle paths
                        const velocity = 2 + Math.random() * 3;
                        this.particles.push({
                            x: this.x,
                            y: this.y,
                            vx: Math.cos(angle) * velocity,
                            vy: Math.sin(angle) * velocity,
                            alpha: 1,
                            color: this.color,
                            // Add size variation to particles
                            size: 1 + Math.random() * 2
                        });
                    }
                }
                return this.updateParticles();
            }

            this.progress += this.speed / this.distance;
            this.x = this.startX + (this.targetX - this.startX) * this.progress;
            this.y = this.startY + (this.targetY - this.startY) * this.progress - 
                     (this.progress * (1 - this.progress) * 100);
            
            return true;
        }

        updateParticles() {
            let alive = false;
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                // Reduce gravity effect for slower falling
                p.vy += 0.05;
                // Slow down horizontal movement gradually
                p.vx *= 0.99;
                // Slow down the fade out significantly
                p.alpha *= 0.985; // Changed from 0.95 to 0.985
                if (p.alpha > 0.01) alive = true;
            }
            return alive;
        }

        draw(ctx) {
            if (this.progress >= 1) {
                // Draw particles with improved visual effects
                this.particles.forEach(p => {
                    const r = parseInt(p.color.slice(1,3), 16);
                    const g = parseInt(p.color.slice(3,5), 16);
                    const b = parseInt(p.color.slice(5,7), 16);
                    
                    // Create a gradient for each particle
                    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
                    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${p.alpha})`);
                    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
                    ctx.fill();
                });
                return;
            }
        
            // Trail effect for launching firework
            const r = parseInt(this.color.slice(1,3), 16);
            const g = parseInt(this.color.slice(3,5), 16);
            const b = parseInt(this.color.slice(5,7), 16);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
            ctx.fillRect(this.x, this.y, 3, 3);
        }
    }

    let fireworks = [];
    const colors = [
        '#C63347',    // Red
        '#F28E63',    // Light Orange
        '#FC7F81',    // Salmon
        '#FAEFC4',   // Pale Yellow
        '#F9AE9B',   // Skin
        '#792BB2',    // Purple
        '#2E42CB',    // Blue
        '#F75781',    // Pink
        '#E365E4',    // Pink/Purple
        '#FA5348',    // Orange
    ];

    function launchFirework(startX) {
        const targetX = startX + (Math.random() * 200 - 100);
        const targetY = 50 + Math.random() * 150;
        const color = colors[Math.floor(Math.random() * colors.length)];
        // Increase particle count for bigger explosions
        const particleCount = 80 + Math.floor(Math.random() * 40);
        fireworks.push(new Firework(startX, canvas.height, targetX, targetY, color, particleCount));
    }

    function launchFireworks() {
        // Number of fireworks per side
        const fireworksPerSide = 15; // Increase this number for more fireworks
        
        // Launch from left side with varying delays and positions
        for(let i = 0; i < fireworksPerSide; i++) {
            setTimeout(() => {
                // Vary the starting X position slightly for more natural look
                const startX = 300 + Math.random() * 40;
                launchFirework(startX);
            }, i * 200); // 200ms delay between each launch
        }
        
        // Launch from right side with varying delays and positions
        for(let i = 0; i < fireworksPerSide; i++) {
            setTimeout(() => {
                // Vary the starting X position slightly for more natural look
                const startX = (canvas.width - 280) + Math.random() * 40;
                launchFirework(startX);
            }, i * 200); // 200ms delay between each launch
        }
    }

    let animationFrameId;
    function animate() {
        // Reduce the fade rate of the background for longer-lasting trails
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'; // Changed from 0.1 to 0.05
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        for (let i = fireworks.length - 1; i >= 0; i--) {
            if (!fireworks[i].update()) {
                fireworks.splice(i, 1);
                continue;
            }
            fireworks[i].draw(ctx);
        }
    
        if (fireworks.length > 0) {
            animationFrameId = requestAnimationFrame(animate);
        }
    }

    fireworksBtn.addEventListener('click', () => {
        launchFireworks();
        animate();
    });
}

function heartAnimation() {
    var mobile = window.isDevice;
    var koef = mobile ? 0.5 : 1;
    var canvas = document.getElementById('heart');
    var ctx = canvas.getContext('2d');
    var width = canvas.width = koef * innerWidth;
    var height = canvas.height = koef * innerHeight;
    var rand = Math.random;
    var traceCount = mobile ? 20 : 50;
    var pointsOrigin = [];
    var i;
    var dr = mobile ? 0.3 : 0.1;

    var heartPosition = function (rad) {
        return [Math.pow(Math.sin(rad), 3), -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))];
    };

    var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
    };

    window.addEventListener('resize', function () {
        width = canvas.width = koef * innerWidth;
        height = canvas.height = koef * innerHeight;
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(0, 0, width, height);
    });

    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
    for (i = 0; i < Math.PI * 2; i += dr) pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));

    var heartPointsCount = pointsOrigin.length;
    var targetPoints = [];
    var pulse = function (kx, ky) {
        for (i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [];
            targetPoints[i][0] = kx * pointsOrigin[i][0] + width / 2;
            targetPoints[i][1] = ky * pointsOrigin[i][1] + height / 2;
        }
    };

    var e = [];
    for (i = 0; i < heartPointsCount; i++) {
        var x = rand() * width;
        var y = rand() * height;
        e[i] = {
            vx: 0,
            vy: 0,
            R: 2,
            speed: rand() + 5,
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: 0.2 * rand() + 0.7,
            f: "hsla(0," + ~~(40 * rand() + 60) + "%," + ~~(60 * rand() + 20) + "%,.3)",
            trace: []
        };
        for (var k = 0; k < traceCount; k++) e[i].trace[k] = { x: x, y: y };
    }

    var config = {
        traceK: 0.4,
        timeDelta: 0.01
    };

    var time = 0;
    var loop = function () {
        var n = -Math.cos(time);
        pulse((1 + n) * 0.5, (1 + n) * 0.5);
        time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? 0.2 : 1) * config.timeDelta;
        ctx.fillStyle = "rgba(0,0,0,.1)";
        ctx.fillRect(0, 0, width, height);

        for (i = e.length; i--;) {
            var u = e[i];
            var q = targetPoints[u.q];
            var dx = u.trace[0].x - q[0];
            var dy = u.trace[0].y - q[1];
            var length = Math.sqrt(dx * dx + dy * dy);
            if (10 > length) {
                if (0.95 < rand()) {
                    u.q = ~~(rand() * heartPointsCount);
                } else {
                    if (0.99 < rand()) {
                        u.D *= -1;
                    }
                    u.q += u.D;
                    u.q %= heartPointsCount;
                    if (0 > u.q) {
                        u.q += heartPointsCount;
                    }
                }
            }
            u.vx += -dx / length * u.speed;
            u.vy += -dy / length * u.speed;
            u.trace[0].x += u.vx;
            u.trace[0].y += u.vy;
            u.vx *= u.force;
            u.vy *= u.force;
            for (k = 0; k < u.trace.length - 1;) {
                var T = u.trace[k];
                var N = u.trace[++k];
                N.x -= config.traceK * (N.x - T.x);
                N.y -= config.traceK * (N.y - T.y);
            }
            ctx.fillStyle = u.f;
            for (k = 0; k < u.trace.length; k++) {
                ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
            }
        }
        window.requestAnimationFrame(loop, canvas);
    };
    loop();
}
var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);
