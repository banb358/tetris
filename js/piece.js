class Piece {
    constructor(ctx) {
        this.ctx = ctx;
        this.spawn();
    }

    spawn() {
        this.typeId = this.randomizeTetrominoType(SHAPES.length - 1);
        this.shape = SHAPES[this.typeId];
        this.color = COLORS[this.typeId];
        this.x = Math.floor(COLS / 2) - Math.floor(this.shape[0].length / 2);
        this.y = 0;
    }

    draw() {
        this.ctx.fillStyle = this.color;
        // Apply neon glow effect to the current piece
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.color;

        this.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    this.ctx.fillRect(this.x + x, this.y + y, 1, 1);
                }
            });
        });

        this.ctx.shadowBlur = 0;
    }

    move(p) {
        this.x = p.x;
        this.y = p.y;
        this.shape = p.shape;
    }

    rotate() {
        let p = JSON.parse(JSON.stringify(this));

        // Transpose matrix (MxN -> NxM)
        p.shape = p.shape[0].map((_, i) => p.shape.map(row => row[i]));

        // Reverse each row for clockwise rotation
        p.shape.forEach(row => row.reverse());

        return p;
    }

    randomizeTetrominoType(noOfTypes) {
        return Math.floor(Math.random() * noOfTypes + 1);
    }
}
