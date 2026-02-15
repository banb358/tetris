class Game {
    constructor(canvas, nextCanvas) {
        this.canvas = canvas;
        this.nextCanvas = nextCanvas;
        this.ctx = canvas.getContext('2d');
        this.ctxNext = nextCanvas.getContext('2d');

        this.score = 0;
        this.lines = 0;
        this.level = 1;

        this.init();
    }

    init() {
        // Calculate size of canvas from constants.
        this.ctx.canvas.width = COLS * BLOCK_SIZE;
        this.ctx.canvas.height = ROWS * BLOCK_SIZE;

        // Scale blocks
        this.ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

        this.board = new Board(this.ctx, this.ctxNext);
        this.time = { start: 0, elapsed: 0, level: 1000 };

        this.addEventListeners();
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
                    } else if (this.board.valid(p)) {
                        this.board.piece.move(p);
                        if (event.key === KEY.DOWN) {
                            this.score += POINTS.SOFT_DROP;
                        }
                    }
                } else if (event.key === KEY.UP) {
                    event.preventDefault();
                    this.board.rotate(this.board.piece);
                }
                this.draw();
                this.updateUI();
            }
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.reset();
            this.play();
            document.getElementById('game-over').classList.add('hidden');
        });

        // Touch Controls
        const handleMove = (key) => {
            if (!this.requestId) return;
            let p = this.moves[key](this.board.piece);
            if (this.board.valid(p)) {
                this.board.piece.move(p);
                if (key === KEY.DOWN) {
                    this.score += POINTS.SOFT_DROP;
                }
                this.draw();
                this.updateUI();
            }
        };

        const handleRotate = () => {
            if (!this.requestId) return;
            this.board.rotate(this.board.piece);
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
            this.draw();
            this.updateUI();
        };

        document.getElementById('btn-left').addEventListener('click', (e) => { e.preventDefault(); handleMove(KEY.LEFT); });
        document.getElementById('btn-right').addEventListener('click', (e) => { e.preventDefault(); handleMove(KEY.RIGHT); });
        document.getElementById('btn-down').addEventListener('click', (e) => { e.preventDefault(); handleMove(KEY.DOWN); });
        document.getElementById('btn-rotate').addEventListener('click', (e) => { e.preventDefault(); handleRotate(); });
        document.getElementById('btn-hard-drop').addEventListener('click', (e) => { e.preventDefault(); handleHardDrop(); });
    }

    moves = {
        [KEY.LEFT]: p => ({ ...p, x: p.x - 1 }),
        [KEY.RIGHT]: p => ({ ...p, x: p.x + 1 }),
        [KEY.DOWN]: p => ({ ...p, y: p.y + 1 }),
        [KEY.SPACE]: p => ({ ...p, y: p.y + 1 })
    };

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
        this.level = Math.floor(this.lines / 10) + 1;
        this.time.level = Math.max(100, 1000 - (this.level - 1) * 100);
        this.updateUI();
    }

    updateUI() {
        document.getElementById('score').innerText = this.score;
        document.getElementById('level').innerText = this.level;
        document.getElementById('lines').innerText = this.lines;
    }

    gameOver() {
        cancelAnimationFrame(this.requestId);
        this.requestId = null;
        document.getElementById('game-over').classList.remove('hidden');
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
