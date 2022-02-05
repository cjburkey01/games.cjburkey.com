// The padding around the drawing area within the canvas.
const CANVAS_PAD = 10;
// The size of the cross relative to a cell
const CROSS_REL_SIZE = 0.75;

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

// Constant symbols to work in place of enums.
const BOARD_CELL_EMPTY = Symbol('BOARD_CELL_EMPTY');
const BOARD_CELL_CROSSED_OUT = Symbol('BOARD_CELL_CROSSED_OUT');
const BOARD_CELL_FILLED = Symbol('BOARD_CELL_FILLED');

class NonogramGame {
    constructor(width) {
        this.width = width;

        // The maximum number of labels that could be displayed for a given col/row.
        this.maxNumLabels = 0;

        // The start of the game board part of the canvas.
        this.innerStart = 0;
        this.innerSize = 0;
        this.innerEnd = 0;
        // The size of a cell on the game board in pixels.
        this.cellSize = 0;

        // Initialize the 2D game board to empty.
        this.gameBoard = Array(this.width * this.width).fill(BOARD_CELL_EMPTY);
        // Initialize a debug board to test with
        this.correctBoard = Array(this.width * this.width).fill(true);
        this.correctBoard[0] = false;
        this.correctBoard[2] = false;
        this.correctBoard[7] = false;
        this.correctBoard[9] = false;
        this.correctBoard[12] = false;
        this.correctBoard[17] = false;
        this.correctBoard[21] = false;
        this.correctBoard[23] = false;

        this.initCanvas();
    }

    initCanvas() {
        console.log('Initializing nonogram game');

        // Get the canvas element.
        this.canvas = document.getElementById('nonogram-canvas');
        if (!this.canvas) {
            console.error('Failed to get nonogram canvas');
            return;
        }

        // Get the canvas context.
        this.ctx = this.canvas.getContext("2d");
        if (!this.ctx) {
            console.error('Failed to get 2d context from nonogram canvas');
            return;
        }

        // Setup the click handler for the canvas.
        this.canvas.onclick = (event) => this.onMouseDown(event);
    }

    startGame() {
        // Initial game render.
        this.displayGame();

        console.log('Started nonogram game');
    }

    // Render the game's current state.
    displayGame() {
        // Make sure the canvas's size information is cached in for this render
        this.updateSizing();

        // Clear the background.
        this.clearBackground();

        // Draw the filled in cells.
        this.drawBoardCells();

        // Draw the grid on top.
        this.drawGrid();

        // Draw the numbers in the space surrounding the inner game board.
        this.drawNumbers();
    }

    updateSizing() {
        // Determine the maximum size of the labels in the worst-case scenario.
        this.maxNumLabels = Math.ceil(this.width / 2.0);
        let maxLabelSize = NUMBER_PAD * this.maxNumLabels;

        // Update cached canvas bounds
        this.innerSize = Math.floor(this.canvas.width - maxLabelSize - 2 * CANVAS_PAD);
        this.innerStart = Math.floor(maxLabelSize + CANVAS_PAD);
        this.innerEnd = this.innerStart + this.innerSize;
        this.cellSize = Math.floor(this.innerSize / this.width);
        // The size needs to update so it rounds nicely
        this.innerSize = this.cellSize * this.width;
    }

    clearBackground() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = BACKGROUND_FILL;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGridForAxis(isVertical) {
        for (let i = 1; i < this.width; i ++) {
            const iAt = this.innerStart + Math.floor(this.cellSize * i);
            this.ctx.beginPath();
            if (isVertical) {
                this.ctx.moveTo(iAt, this.innerStart);
                this.ctx.lineTo(iAt, this.innerEnd);
            } else {
                this.ctx.moveTo(this.innerStart, iAt);
                this.ctx.lineTo(this.innerEnd, iAt);
            }
            this.ctx.stroke();
        }
    }

    drawGrid() {
        // Set the line color.
        this.ctx.strokeStyle = GRID_LINE_FILL;
        this.ctx.lineWidth = GRID_LINE_WIDTH;

        // Draw grid lines
        this.drawGridForAxis(true);
        this.drawGridForAxis(false);

        // Draw the board outline.
        this.ctx.strokeStyle = INNER_OUTLINE;
        this.ctx.strokeRect(this.innerStart, this.innerStart, this.innerSize, this.innerSize);
    }

    drawCross(cellStartX, cellStartY) {
        const s = this.cellSize;
        let crossPadding = ((1.0 - CROSS_REL_SIZE) * s) / 2.0;

        // Line 1
        this.ctx.beginPath();
        this.ctx.moveTo(crossPadding + cellStartX, crossPadding + cellStartY);
        this.ctx.lineTo(cellStartX + s - crossPadding, cellStartY + s - crossPadding);
        this.ctx.stroke();
        // Line 2
        this.ctx.beginPath();
        this.ctx.moveTo(cellStartX + s - crossPadding, crossPadding + cellStartY);
        this.ctx.lineTo(crossPadding + cellStartX, cellStartY + s - crossPadding);
        this.ctx.stroke();
    }

    drawBoardCells() {
        this.ctx.fillStyle = CELL_FILL;
        this.ctx.strokeStyle = CELL_CROSS_FILL;
        this.ctx.lineWidth = CELL_CROSS_WIDTH;

        const s = this.cellSize;
        // Loop through the grid
        for (let x = 0; x < this.width; x ++) {
            for (let y = 0; y < this.width; y ++) {
                // Get the type of cell at this board location.
                const cellType = this.gameBoard[x * this.width + y];

                // Check if the cell type needs to be drawn.
                switch (cellType) {
                    case BOARD_CELL_FILLED:
                        this.ctx.fillRect(this.innerStart + x * s, this.innerStart + y * s, s, s);
                        break;
                    case BOARD_CELL_CROSSED_OUT:
                        // Draw the cross
                        this.drawCross(this.innerStart + x * s, this.innerStart + y * s)
                        break;

                    // If it's neither of those, don't draw anything
                }
            }
        }
    }

    drawLabelsInDirection(isColumn, x, numbers) {
        let xAt = this.innerStart + (x + 0.5) * this.cellSize;
        for (let i = 0; i < numbers.length; i ++) {
            let yAt = (i + 0.5 + (this.maxNumLabels - numbers.length) / 2.0) * NUMBER_PAD;
            if (isColumn) {
                this.ctx.fillText(numbers[i].toString(), xAt, yAt, NUMBER_PAD);
            } else {
                this.ctx.fillText(numbers[i].toString(), yAt, xAt, NUMBER_PAD);
            }
        }
    }

    drawNumbers() {
        this.ctx.fillStyle = NUMBER_FILL;
        this.ctx.font = FONT;
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';

        // Column labels.
        for (let x = 0; x < this.width; x ++) {
            let colNumbers = this.getNumbersForLine(x, this.correctBoard, true);
            this.drawLabelsInDirection(true, x, colNumbers);
        }

        // Row labels.
        for (let y = 0; y < this.width; y ++) {
            let rowNumbers = this.getNumbersForLine(y, this.correctBoard, false);
            this.drawLabelsInDirection(false, y, rowNumbers);
        }
    }

    onMouseDown(event) {
        // Get the pixel position of the mouse click within the canvas.
        const rect = this.canvas.getBoundingClientRect();
        let canvasX = Math.floor(event.clientX - rect.left);
        let canvasY = Math.floor(event.clientY - rect.top);

        // Get the location of the cell that was clicked on
        let cellX = Math.floor((canvasX - this.innerStart) / this.cellSize);
        let cellY = Math.floor((canvasY - this.innerStart) / this.cellSize);

        if (cellX >= 0 && cellY >= 0 && cellX < this.width && cellY < this.width) {
            // Get the current cell type at the location.
            const cellType = this.gameBoard[cellX * this.width + cellY];

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
                this.gameBoard[cellX * this.width + cellY] = newCellType;

                // Update game board
                this.displayGame();
            }
        }
    }

    getNumbersForLine(x, correctBoard, rowCol) {
        let numbers = [];
        let current;
        let size = 0;
        for (let y = 0; y < this.width; y ++) {
            const prevCurrent = current;
            current = correctBoard[(rowCol ? (x * this.width + y) : (y * this.width + x))];

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
}

// Setup the game.
window.onload = () => {
    let nonogramGame = new NonogramGame(5);
    nonogramGame.startGame();
};
