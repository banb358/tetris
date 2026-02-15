class Game {
    moves = {
        [KEY.LEFT]: p => ({ ...p, x: p.x - 1 }),
        [KEY.RIGHT]: p => ({ ...p, x: p.x + 1 }),
        [KEY.DOWN]: p => ({ ...p, y: p.y + 1 }),
        [KEY.SPACE]: p => ({ ...p, y: p.y + 1 })
    };

    constructor(canvas, nextCanvas) {
        this.canvas = canvas;
        this.nextCanvas = nextCanvas;
        this.ctx = canvas.getContext('2d');
        this.ctxNext = nextCanvas.getContext('2d');

        this.score = 0;
        this.lines = 0;
        this.level = 1;

        // Sound System (Web Audio API)
        this.audioCtx = null;
        this.bgmGain = null;
        this.bgmPlaying = false;
        this.bgmStep = 0;
        this.bgmTimer = null;

        this.init();
    }

    init() {
        // Calculate size of canvas from constants.
        this.ctx.canvas.width = COLS * BLOCK_SIZE;
        this.ctx.canvas.height = ROWS * BLOCK_SIZE;

        // Scale blocks
        this.ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

        this.board = new Board(this.ctx, this.ctxNext);
        this.time = { start: 0, elapsed: 0, level: 1000 }; // スピードを標準的な 1秒に戻す

        this.addEventListeners();
    }

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playBGM() {
        this.initAudio();
        if (this.bgmPlaying) this.stopBGM();

        this.bgmGain = this.audioCtx.createGain();
        this.bgmGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        this.bgmGain.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + 0.5); // 音量を最大限に引き上げ
        this.bgmGain.connect(this.audioCtx.destination);

        const notes = [
            { f: 329.63, d: 400 }, // E4
            { f: 246.94, d: 200 }, // B3
            { f: 261.63, d: 200 }, // C4
            { f: 293.66, d: 400 }, // D4
            { f: 261.63, d: 200 }, // C4
            { f: 246.94, d: 200 }, // B3
            { f: 220.00, d: 400 }, // A3
            { f: 220.00, d: 200 }, // A3
            { f: 261.63, d: 200 }, // C4
            { f: 329.63, d: 400 }, // E4
            { f: 293.66, d: 200 }, // D4
            { f: 261.63, d: 200 }, // C4
            { f: 246.94, d: 600 }, // B3
            { f: 261.63, d: 200 }, // C4
            { f: 293.66, d: 400 }, // D4
            { f: 329.63, d: 400 }, // E4
            { f: 261.63, d: 400 }, // C4
            { f: 220.00, d: 400 }, // A3
            { f: 220.00, d: 400 }, // A3
        ];

        const playNote = (note, time) => {
            const osc = this.audioCtx.createOscillator();
            const g = this.audioCtx.createGain();
            osc.type = 'square'; // はっきり聞こえる音色
            osc.frequency.setValueAtTime(note.f, time);

            g.gain.setValueAtTime(0.4, time); // 個別の音量も大幅に引き上げ
            g.gain.exponentialRampToValueAtTime(0.01, time + (note.d / 1000) * 0.9);

            osc.connect(g);
            g.connect(this.bgmGain);
            osc.start(time);
            osc.stop(time + (note.d / 1000));
        };

        const scheduler = () => {
            if (!this.bgmPlaying) return;
            const note = notes[this.bgmStep % notes.length];
            playNote(note, this.audioCtx.currentTime + 0.05);
            this.bgmTimer = setTimeout(scheduler, note.d);
            this.bgmStep++;
        };

        this.bgmPlaying = true;
        this.bgmStep = 0;
        scheduler();
        console.log('Tetris Main BGM Started (Max Volume Mode)');
    }

    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
        if (this.bgmGain) {
            this.bgmGain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.2);
            const g = this.bgmGain;
            setTimeout(() => { try { g.disconnect(); } catch (e) { } }, 300);
            this.bgmGain = null;
        }
    }

    playSE(type) {
        this.initAudio();
        if (!this.audioCtx) return;

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime;

        switch (type) {
            case 'move':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(150, now);
                oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);
                gainNode.gain.setValueAtTime(0.4, now); // 0.05 -> 0.4
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;
            case 'rotate':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(300, now);
                oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                gainNode.gain.setValueAtTime(0.4, now); // 0.05 -> 0.4
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;
            case 'clear':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(440, now);
                oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.2);
                gainNode.gain.setValueAtTime(0.5, now); // 0.1 -> 0.5
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
                break;
            case 'gameOver':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, now);
                oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5);
                gainNode.gain.setValueAtTime(0.5, now); // 0.1 -> 0.5
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
                break;
            case 'start':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(440, now);
                oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.1);
                gainNode.gain.setValueAtTime(0.5, now); // 0.2 -> 0.5
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;
            case 'win':
                // Simple Victory Fanfare
                [440, 554.37, 659.25, 880].forEach((f, i) => {
                    const osc = this.audioCtx.createOscillator();
                    const g = this.audioCtx.createGain();
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(f, now + i * 0.1);
                    g.gain.setValueAtTime(0.3, now + i * 0.1);
                    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.1);
                    osc.connect(g);
                    g.connect(this.audioCtx.destination);
                    osc.start(now + i * 0.1);
                    osc.stop(now + i * 0.1 + 0.1);
                });
                break;
        }
    }

    addEventListeners() {

        document.addEventListener('keydown', event => {
            if (event.keyCode === 27) { // ESC to pause
                this.pause();
            } else if (this.requestId) {
                if (this.moves[event.key]) {
                    event.preventDefault();
                    let p = this.moves[event.key](this.board.piece);

                    if (event.key === KEY.SPACE) {
                        while (this.board.valid(p)) {
                            this.board.piece.move(p);
                            this.score += POINTS.HARD_DROP;
                            p = this.moves[KEY.DOWN](this.board.piece);
                        }
                        this.playSE('move');
                    } else if (this.board.valid(p)) {
                        this.board.piece.move(p);
                        if (event.key === KEY.DOWN) {
                            this.score += POINTS.SOFT_DROP;
                        }
                        this.playSE('move');
                    }
                } else if (event.key === KEY.UP) {
                    event.preventDefault();
                    this.board.rotate(this.board.piece);
                    this.playSE('rotate');
                }
                this.draw();
                this.updateUI();
            }
        });

        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.initAudio(); // 確実に有効化
                this.playSE('start');
                this.playBGM();
                this.play();
                document.getElementById('start-screen').classList.add('hidden');
            });
        }

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.initAudio(); // 確実に有効化
                this.playSE('start');
                this.playBGM();
                this.play();
                document.getElementById('game-over').classList.add('hidden');
            });
        }

        const winBtn = document.getElementById('win-btn');
        if (winBtn) {
            winBtn.addEventListener('click', () => {
                this.initAudio();
                this.playSE('start');
                this.playBGM();
                this.play();
                document.getElementById('game-clear').classList.add('hidden');
            });
        }

        // Touch Controls
        const handleMove = (key) => {
            if (!this.requestId) return;
            let p = this.moves[key](this.board.piece);
            if (this.board.valid(p)) {
                this.board.piece.move(p);
                if (key === KEY.DOWN) {
                    this.score += POINTS.SOFT_DROP;
                }
                this.playSE('move');
                this.draw();
                this.updateUI();
            }
        };

        const handleRotate = () => {
            if (!this.requestId) return;
            this.board.rotate(this.board.piece);
            this.playSE('rotate');
            this.draw();
            this.updateUI();
        };

        const handleHardDrop = () => {
            if (!this.requestId) return;
            let p = this.moves[KEY.DOWN](this.board.piece);
            while (this.board.valid(p)) {
                this.board.piece.move(p);
                this.score += POINTS.HARD_DROP;
                p = this.moves[KEY.DOWN](this.board.piece);
            }
            this.playSE('move');
            this.draw();
            this.updateUI();
        };

        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnDown = document.getElementById('btn-down');
        const btnRotate = document.getElementById('btn-rotate');
        const btnHardDrop = document.getElementById('btn-hard-drop');

        if (btnLeft) btnLeft.addEventListener('click', (e) => { e.preventDefault(); handleMove(KEY.LEFT); });
        if (btnRight) btnRight.addEventListener('click', (e) => { e.preventDefault(); handleMove(KEY.RIGHT); });
        if (btnDown) btnDown.addEventListener('click', (e) => { e.preventDefault(); handleMove(KEY.DOWN); });
        if (btnRotate) btnRotate.addEventListener('click', (e) => { e.preventDefault(); handleRotate(); });
        if (btnHardDrop) btnHardDrop.addEventListener('click', (e) => { e.preventDefault(); handleHardDrop(); });
    }

    reset() {
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.board = new Board(this.ctx, this.ctxNext);
        this.time = { start: 0, elapsed: 0, level: 1000 };
        this.updateUI();
    }

    play() {
        this.reset();
        this.board.spawnPiece();
        this.animate();
    }

    animate(now = 0) {
        this.time.elapsed = now - this.time.start;
        if (this.time.elapsed > this.time.level) {
            this.time.start = now;
            if (!this.board.drop()) {
                this.gameOver();
                return;
            }
            // Check for line clears and update score
            const clearedLines = this.board.clearLines();
            if (clearedLines > 0) {
                this.playSE('clear');
                this.updateScore(clearedLines);
            }
        }

        this.draw();
        this.requestId = requestAnimationFrame(this.animate.bind(this));
    }

    draw() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.board.draw();
        this.board.piece.draw();
    }

    updateScore(lines) {
        if (lines === 1) this.score += POINTS.SINGLE;
        if (lines === 2) this.score += POINTS.DOUBLE;
        if (lines === 3) this.score += POINTS.TRIPLE;
        if (lines === 4) this.score += POINTS.TETRIS;

        this.lines += lines;
        this.level = Math.floor(this.lines / 5) + 1; // 5ラインごとにレベルアップ
        this.time.level = Math.max(100, 1000 - (this.level - 1) * 100); // 速度を標準的な変化に戻す
        this.updateUI();

        // Game Clear Condition: Level 2 (たった5ラインでクリア！)
        if (this.level >= 2) {
            this.gameWin();
        }
    }

    updateUI() {
        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        const linesEl = document.getElementById('lines');
        if (scoreEl) scoreEl.innerText = this.score;
        if (levelEl) levelEl.innerText = this.level;
        if (linesEl) linesEl.innerText = this.lines;
    }

    gameOver() {
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
        this.stopBGM();
        this.playSE('gameOver');
        const gameOverEl = document.getElementById('game-over');
        if (gameOverEl) gameOverEl.classList.remove('hidden');
    }

    gameWin() {
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
        this.stopBGM();
        this.playSE('win');
        const winEl = document.getElementById('game-clear');
        if (winEl) winEl.classList.remove('hidden');
    }

    pause() {
        if (!this.requestId) {
            this.animate();
            return;
        }
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
    }
}
