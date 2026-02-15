const canvas = document.getElementById('tetris');
const nextCanvas = document.getElementById('next');

const game = new Game(canvas, nextCanvas);

// Welcome message in console
console.log('%c CYBER TETRIS INITIALIZED ', 'background: #00f3ff; color: #000; font-weight: bold;');

// game.play() is now called from the start button in Game class
