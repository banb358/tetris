const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 20;

const COLORS = [
    'none',
    '#00f3ff', // I - Cyan
    '#0044ff', // J - Blue
    '#ff8800', // L - Orange
    '#ffff00', // O - Yellow
    '#00ff00', // S - Green
    '#9900ff', // T - Purple
    '#ff0000'  // Z - Red
];

const SHAPES = [
    [],
    [[1, 1, 1, 1]], // I
    [[2, 0, 0], [2, 2, 2]], // J
    [[0, 0, 3], [3, 3, 3]], // L
    [[4, 4], [4, 4]], // O
    [[0, 5, 5], [5, 5, 0]], // S
    [[0, 6, 0], [6, 6, 6]], // T
    [[7, 7, 0], [0, 7, 7]]  // Z
];

const POINTS = {
    SINGLE: 100,
    DOUBLE: 300,
    TRIPLE: 500,
    TETRIS: 800,
    SOFT_DROP: 1,
    HARD_DROP: 2
};

const KEY = {
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    DOWN: 'ArrowDown',
    UP: 'ArrowUp',
    SPACE: ' '
};
