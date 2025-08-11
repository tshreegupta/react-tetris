export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const EMPTY_CELL = 0;

export const TETROMINOS: { [key: string]: { shape: number[][]; color: string } } = {
    'I': { shape: [[1, 1, 1, 1]], color: '#00f0f0' },      // Cyan
    'J': { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000f0' },  // Blue
    'L': { shape: [[0, 0, 1], [1, 1, 1]], color: '#f0a000' },  // Orange
    'O': { shape: [[1, 1], [1, 1]], color: '#f0f000' },      // Yellow
    'S': { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000' },  // Green
    'T': { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0' },  // Purple
    'Z': { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000' }   // Red
};

export interface Piece {
    type: string;
    shape: number[][];
    color: string;
    x: number;
    y: number;
}

export class GameState {
    board: (number | string)[][];
    currentPiece: Piece;
    nextPiece: Piece;
    score: number;
    gameOver: boolean;

    constructor() {
        this.board = Array(BOARD_HEIGHT).fill(0).map(() => Array(BOARD_WIDTH).fill(EMPTY_CELL));
        this.score = 0;
        this.gameOver = false;
        this.nextPiece = this.newPiece();
        this.currentPiece = this.newPiece();
    }

    newPiece(): Piece {
        const pieceTypes = Object.keys(TETROMINOS);
        const pieceType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
        const piece: Piece = {
            type: pieceType,
            shape: TETROMINOS[pieceType].shape,
            color: TETROMINOS[pieceType].color,
            x: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETROMINOS[pieceType].shape[0].length / 2),
            y: 0
        };
        if (this.checkCollision(piece.shape, piece.x, piece.y)) {
            this.gameOver = true;
        }
        return piece;
    }

    checkCollision(shape: number[][], x: number, y: number): boolean {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col] !== EMPTY_CELL) {
                    const boardX = x + col;
                    const boardY = y + row;

                    if (
                        boardX < 0 ||
                        boardX >= BOARD_WIDTH ||
                        boardY >= BOARD_HEIGHT ||
                        (boardY >= 0 && this.board[boardY][boardX] !== EMPTY_CELL)
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    mergePiece(): void {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((cell, x) => {
                if (cell !== EMPTY_CELL) {
                    this.board[this.currentPiece.y + y][this.currentPiece.x + x] = this.currentPiece.type;
                }
            });
        });
    }

    clearLines(): void {
        let linesCleared = 0;
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== EMPTY_CELL)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(BOARD_WIDTH).fill(EMPTY_CELL));
                linesCleared++;
                y++; // Check the same line again as it's now a new line
            }
        }
        if (linesCleared > 0) {
            this.score += linesCleared * 100;
        }
    }

    move(direction: 'left' | 'right' | 'down'): void {
        if (this.gameOver) return;

        let newX = this.currentPiece.x;
        let newY = this.currentPiece.y;

        if (direction === 'left') {
            newX--;
        } else if (direction === 'right') {
            newX++;
        } else if (direction === 'down') {
            newY++;
        }

        if (!this.checkCollision(this.currentPiece.shape, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
        } else if (direction === 'down') {
            this.mergePiece();
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.newPiece();
        }
    }

    rotate(): void {
        if (this.gameOver) return;

        const originalShape = this.currentPiece.shape;
        const rotatedShape: number[][] = originalShape[0].map((_, index) =>
            originalShape.map(row => row[index]).reverse()
        );

        if (!this.checkCollision(rotatedShape, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.shape = rotatedShape;
        }
    }
}
