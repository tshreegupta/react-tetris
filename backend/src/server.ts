import express from 'express';
import cors from 'cors';
import { GameState } from './game';

const app = express();
const PORT = 5001;

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000']
}));
app.use(express.json());

let game = new GameState();

app.get('/game', (req, res) => {
    res.json({
        board: game.board,
        current_piece: game.currentPiece,
        next_piece: game.nextPiece,
        score: game.score,
        game_over: game.gameOver
    });
});

app.post('/move', (req, res) => {
    const { direction } = req.body;
    game.move(direction);
    res.json({ status: 'success' });
});

app.post('/rotate', (req, res) => {
    game.rotate();
    res.json({ status: 'success' });
});

app.post('/reset', (req, res) => {
    game = new GameState();
    res.json({ status: 'success' });
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
