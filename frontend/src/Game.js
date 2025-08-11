import React, { useState, useEffect, useCallback } from 'react';
import './Game.css';

// Custom hook for game loop
const useInterval = (callback, delay) => {
    const savedCallback = React.useRef();

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
};

const NextPiece = ({ piece }) => {
    if (!piece) return null;
    const { shape } = piece;
    const grid = Array(4).fill(0).map(() => Array(4).fill(0));
    shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                grid[y][x] = piece.type;
            }
        });
    });

    return (
        <div className="next-piece">
            <h3>Next</h3>
            <div className="next-piece-grid">
                {grid.map((row, y) =>
                    row.map((cell, x) => <div key={`${y}-${x}`} className={`next-piece-cell ${cell || ''}`}></div>)
                )}
            </div>
        </div>
    );
};

const Game = () => {
    const [gameState, setGameState] = useState(null);

    const fetchGameState = useCallback(async () => {
        try {
            const res = await fetch('http://127.0.0.1:5001/game');
            const data = await res.json();
            setGameState(data);
        } catch (error) {
            console.error("Failed to fetch game state:", error);
        }
    }, []);

    useEffect(() => {
        fetchGameState();
    }, [fetchGameState]);

    const movePiece = async (direction) => {
        if (gameState && gameState.game_over) return;
        try {
            await fetch('http://127.0.0.1:5001/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ direction })
            });
            fetchGameState();
        } catch (error) {
            console.error("Failed to move piece:", error);
        }
    };

    const rotatePiece = async () => {
        if (gameState && gameState.game_over) return;
        try {
            await fetch('http://127.0.0.1:5001/rotate', { method: 'POST' });
            fetchGameState();
        } catch (error) {
            console.error("Failed to rotate piece:", error);
        }
    };

    const resetGame = async () => {
        try {
            await fetch('http://127.0.0.1:5001/reset', { method: 'POST' });
            fetchGameState();
        } catch (error) {
            console.error("Failed to reset game:", error);
        }
    };

    const handleKeyDown = useCallback((e) => {
        if (gameState && gameState.game_over) return;
        switch (e.key) {
            case 'ArrowLeft':
                movePiece('left');
                break;
            case 'ArrowRight':
                movePiece('right');
                break;
            case 'ArrowDown':
                movePiece('down');
                break;
            case 'ArrowUp':
                rotatePiece();
                break;
            default:
                break;
        }
    }, [gameState, fetchGameState]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    useInterval(() => {
        movePiece('down');
    }, gameState && gameState.game_over ? null : 1000);

    if (!gameState) {
        return <div>Loading...</div>;
    }

    const { board, current_piece, next_piece, score, game_over } = gameState;

    return (
        <div className="game-container">
            <h1>Tetris</h1>
            <div className="main-game-area">
                <div className="game-info">
                    <div className="score-card">
                        <h2>Score</h2>
                        <p>{score}</p>
                    </div>
                </div>
                <div className="game-board">
                    {game_over && (
                        <div className="game-over-overlay">
                            <div>Game Over</div>
                        </div>
                    )}
                    {board.map((row, y) =>
                        row.map((cell, x) => <div key={`${y}-${x}`} className={`cell ${cell || ''}`}></div>)
                    )}
                    {current_piece &&
                        current_piece.shape.map((row, y) =>
                            row.map((cell, x) => {
                                if (cell) {
                                    const pieceX = x + current_piece.x;
                                    const pieceY = y + current_piece.y;
                                    return (
                                        <div
                                            key={`${pieceY}-${pieceX}`}
                                            className={`cell ${current_piece.type}`}
                                            style={{ top: `${pieceY * 30}px`, left: `${pieceX * 30}px`, position: 'absolute' }}
                                        ></div>
                                    );
                                }
                                return null;
                            })
                        )}
                </div>
                <div className="game-info">
                    <NextPiece piece={next_piece} />
                    <button className="restart-button" onClick={resetGame}>Restart</button>
                </div>
            </div>
        </div>
    );
};

export default Game;