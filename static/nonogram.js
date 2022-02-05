// The width of the game board. Traditionally, this value is a multiple of five.
const WIDTH = 5;
// Size, in pixels, of the game board within the canvas. The remainder of the
// space is used for the numbers.
const INNER_SIZE = 384;
// The size of a cell on the game board in pixels.
const CELL_SIZE = INNER_SIZE / WIDTH;
// The Manhattan distance between the corners of a crossed out cell and the
// lines going towards the corner of the cell.
const CROSS_PADDING = 15;

// Color and style constants.
const BACKGROUND_FILL = '#ffffff';
const CELL_FILL = '#111111';
const CELL_CROSS_FILL = '#222222';
const CELL_CROSS_WIDTH = 6;
const GRID_LINE_FILL = '#d8d8d8';
const GRID_LINE_WIDTH = 1;
const INNER_OUTLINE = '#666666';
const NUMBER_FILL = '#000000';
const FONT = '15px serif';
const NUMBER_PAD = 18;

const BOARD_CELL_EMPTY = Symbol('BOARD_CELL_EMPTY');
const BOARD_CELL_CROSSED_OUT = Symbol('BOARD_CELL_CROSSED_OUT');
const BOARD_CELL_FILLED = Symbol('BOARD_CELL_FILLED');

// Initialize the 2D game board to empty.
let gameBoard = Array(WIDTH * WIDTH).fill(BOARD_CELL_EMPTY);
// Initialize a debug board to test with
let correctBoard = Array(WIDTH * WIDTH).fill(true);
correctBoard[0] = false;
correctBoard[2] = false;
correctBoard[7] = false;
correctBoard[9] = false;
correctBoard[12] = false;
correctBoard[17] = false;
correctBoard[21] = false;
correctBoard[23] = false;

// Game state values.
let canvas, ctx;

// The start of the game board part of the canvas.
let innerStart, innerEnd;

// Setup the game.
window.onload = () => {
    console.log('Loading nonogram game');

    // Get the canvas element.
    canvas = document.getElementById('nonogram-canvas');
    if (!canvas) {
        console.error('Failed to get nonogram canvas');
        return;
    }

    // Get the canvas context.
    ctx = canvas.getContext("2d");
    if (!ctx) {
        console.error('Failed to get 2d context from nonogram canvas');
        return;
    }

    // Setup the click handler for the canvas.
    canvas.onclick = onMouseDown;

    // Initial game render.
    displayGame();

    console.log('Loaded nonogram game');
};

// Render the game's current state.
function displayGame() {
    // Set the drawing helper state variables.
    innerStart = Math.floor((canvas.width - INNER_SIZE) / 2.0);
    innerEnd = innerStart + INNER_SIZE;

    // Clear the background.
    clearBackground();

    // Draw the filled in cells.
    drawBoardCells();

    // Draw the grid on top.
    drawGrid();

    // Draw the numbers in the space surrounding the inner game board.
    drawNumbers();
}

function clearBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = BACKGROUND_FILL;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
    // Set the line color.
    ctx.strokeStyle = GRID_LINE_FILL;
    ctx.lineWidth = GRID_LINE_WIDTH;

    // Vertical lines.
    for (let x = 1; x < WIDTH; x ++) {
        const xAt = innerStart + Math.floor(CELL_SIZE * x);
        ctx.beginPath();
        ctx.moveTo(xAt, innerStart);
        ctx.lineTo(xAt, innerEnd);
        ctx.stroke();
    }

    // Horizontal lines.
    for (let y = 1; y < WIDTH; y ++) {
        const yAt = innerStart + Math.floor(CELL_SIZE * y);
        ctx.beginPath();
        ctx.moveTo(innerStart, yAt);
        ctx.lineTo(innerEnd, yAt);
        ctx.stroke();
    }

    // Draw the board outline.
    ctx.strokeStyle = INNER_OUTLINE;
    ctx.strokeRect(innerStart, innerStart, INNER_SIZE, INNER_SIZE);
}

function drawBoardCells() {
    ctx.fillStyle = CELL_FILL;
    ctx.strokeStyle = CELL_CROSS_FILL;
    ctx.lineWidth = CELL_CROSS_WIDTH;

    // Loop through the grid
    const s = CELL_SIZE;
    for (let x = 0; x < WIDTH; x ++) {
        for (let y = 0; y < WIDTH; y ++) {
            // Get the type of cell at this board location.
            const cellType = gameBoard[x * WIDTH + y];

            // Check if the cell type needs to be drawn.
            switch (cellType) {
                case BOARD_CELL_FILLED:
                    ctx.fillRect(innerStart + x * s, innerStart + y * s, s, s);
                    break;
                case BOARD_CELL_CROSSED_OUT:
                    let start_x = innerStart + x * s;
                    let start_y = innerStart + y * s;
                    // Line 1
                    ctx.beginPath();
                    ctx.moveTo(CROSS_PADDING + start_x, CROSS_PADDING + start_y);
                    ctx.lineTo(start_x + s - CROSS_PADDING, start_y + s - CROSS_PADDING);
                    ctx.stroke();
                    // Line 2
                    ctx.beginPath();
                    ctx.moveTo(start_x + s - CROSS_PADDING, CROSS_PADDING + start_y);
                    ctx.lineTo(CROSS_PADDING + start_x, start_y + s - CROSS_PADDING);
                    ctx.stroke();
                    break;
            }
        }
    }
}

function drawNumbers() {
    ctx.fillStyle = NUMBER_FILL;
    ctx.font = FONT;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    // Column labels.
    for (let x = 0; x < WIDTH; x ++) {
        let columnNumbers = getNumbersForLine(x, correctBoard, true);
        let xAt = innerStart + (x + 0.5) * CELL_SIZE;
        for (let i = 0; i < columnNumbers.length; i ++) {
            let yAt = (i + 0.5) * NUMBER_PAD;
            ctx.fillText(columnNumbers[i].toString(), xAt, yAt);
        }
    }

    // Row labels.
    for (let y = 0; y < WIDTH; y ++) {
        let columnNumbers = getNumbersForLine(y, correctBoard, false);
        let yAt = innerStart + (y + 0.5) * CELL_SIZE;
        for (let i = 0; i < columnNumbers.length; i ++) {
            let xAt = (i + 0.5) * NUMBER_PAD;
            ctx.fillText(columnNumbers[i].toString(), xAt, yAt);
        }
    }
}

function onMouseDown(event) {
    // Get the pixel position of the mouse click within the canvas.
    const rect = canvas.getBoundingClientRect();
    let canvasX = Math.floor(event.clientX - rect.left);
    let canvasY = Math.floor(event.clientY - rect.top);

    // Get the location of the cell that was clicked on
    let cellX = Math.floor((canvasX - innerStart) / CELL_SIZE);
    let cellY = Math.floor((canvasY - innerStart) / CELL_SIZE);

    if (cellX >= 0 && cellY >= 0 && cellX < WIDTH && cellY < WIDTH) {
        // Get the current cell type at the location.
        const cellType = gameBoard[cellX * WIDTH + cellY];

        // Determine the new type of the cell
        let newCellType = BOARD_CELL_EMPTY;
        switch (cellType) {
            case BOARD_CELL_EMPTY:
                newCellType = BOARD_CELL_CROSSED_OUT;
                break;
            case BOARD_CELL_CROSSED_OUT:
                newCellType = BOARD_CELL_FILLED;
                break;
            case BOARD_CELL_FILLED:
                newCellType = BOARD_CELL_EMPTY;
                break;
        }

        // Update the cell type
        if (cellType != newCellType) {
            console.log(`Updating cell at ${cellX},${cellY} to type ${newCellType.toString()}`);

            gameBoard[cellX * WIDTH + cellY] = newCellType;

            // Update game board
            displayGame();
        }
    }
}

// Row=false, Col=true
function getNumbersForLine(x, correctBoard, rowCol) {
    let numbers = [];
    let current;
    let size = 0;
    for (let y = 0; y < WIDTH; y ++) {
        const prevCurrent = current;
        current = correctBoard[(rowCol ? (x * WIDTH + y) : (y * WIDTH + x))];

        if (prevCurrent && !current) {
            numbers.push(size);
            size = 0;
        }
        if (current) {
            size ++;
        }
    }
    if (current) {
        numbers.push(size)
    }
    return numbers;
}
