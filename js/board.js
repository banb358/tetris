class Board {
    constructor(ctx, ctxNext) {
        this.ctx = ctx;
        this.ctxNext = ctxNext;
        this.grid = this.getEmptyGrid();
        this.piece = null;
        this.next = null;
    }

    getEmptyGrid() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    rotate(piece) {
        let p = piece.rotate();
        if (this.valid(p)) {
            piece.move(p);
        }
    }

    valid(p) {
        return p.shape.every((row, dy) => {
            return row.every((value, dx) => {
                let x = p.x + dx;
                let y = p.y + dy;
                return (
                    value === 0 ||
                    (this.isInsideWalls(x, y) && this.notOccupied(x, y))
                );
            });
        });
    }

    isInsideWalls(x, y) {
        return x >= 0 && x < COLS && y < ROWS;
    }

    notOccupied(x, y) {
        return this.grid[y] && this.grid[y][x] === 0;
    }

    drop() {
        let p = { ...this.piece, y: this.piece.y + 1 };
        if (this.valid(p)) {
            this.piece.move(p);
        } else {
            this.freeze();
            this.clearLines();
            if (this.piece.y === 0) {
                // Game Over
                return false;
            }
            this.spawnPiece();
        }
        return true;
    }

    freeze() {
        this.piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.grid[this.piece.y + y][this.piece.x + x] = value;
                }
            });
        });
    }

    draw() {
        this.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.ctx.fillStyle = COLORS[value];
                    this.ctx.fillRect(x, y, 1, 1);
                }
            });
        });
    }

    drawBoard() {
        this.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.ctx.fillStyle = COLORS[value];
                    this.ctx.fillRect(x, y, 1, 1);
                }
            });
        });
    }

    spawnPiece() {
        this.piece = this.next || new Piece(this.ctx);
        this.piece.ctx = this.ctx; // Ensure the active piece uses the main board context
        this.next = new Piece(this.ctxNext);
        this.drawNext();
    }

    drawNext() {
        this.ctxNext.clearRect(0, 0, this.ctxNext.canvas.width, this.ctxNext.canvas.height);
        this.ctxNext.fillStyle = this.next.color;

        // Reset scale for drawing next piece
        this.ctxNext.save();
        this.ctxNext.scale(BLOCK_SIZE, BLOCK_SIZE);

        // Center the piece in the next box
        const offsetX = (this.ctxNext.canvas.width / BLOCK_SIZE - this.next.shape[0].length) / 2;
        const offsetY = (this.ctxNext.canvas.height / BLOCK_SIZE - this.next.shape.length) / 2;

        this.next.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.ctxNext.fillRect(offsetX + x, offsetY + y, 1, 1);
                }
            });
        });
        this.ctxNext.restore();
    }

    clearLines() {
        let lines = 0;
        this.grid.forEach((row, y) => {
            if (row.every(value => value > 0)) {
                lines++;
                this.grid.splice(y, 1);
                this.grid.unshift(Array(COLS).fill(0));
            }
        });

        if (lines > 0) {
            // This will be used in Game class to update score
            return lines;
        }
        return 0;
    }
}
