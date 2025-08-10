import random
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}})

# Game constants
BOARD_WIDTH = 10
BOARD_HEIGHT = 20
EMPTY_CELL = 0

# Tetrimino shapes and colors
TETROMINOS = {
    'I': {'shape': [[1, 1, 1, 1]], 'color': '#00f0f0'},      # Cyan
    'J': {'shape': [[1, 0, 0], [1, 1, 1]], 'color': '#0000f0'},  # Blue
    'L': {'shape': [[0, 0, 1], [1, 1, 1]], 'color': '#f0a000'},  # Orange
    'O': {'shape': [[1, 1], [1, 1]], 'color': '#f0f000'},      # Yellow
    'S': {'shape': [[0, 1, 1], [1, 1, 0]], 'color': '#00f000'},  # Green
    'T': {'shape': [[0, 1, 0], [1, 1, 1]], 'color': '#a000f0'},  # Purple
    'Z': {'shape': [[1, 1, 0], [0, 1, 1]], 'color': '#f00000'}   # Red
}

class GameState:
    def __init__(self):
        self.board = [[EMPTY_CELL for _ in range(BOARD_WIDTH)] for _ in range(BOARD_HEIGHT)]
        self.score = 0
        self.game_over = False
        self.next_piece = self.new_piece()
        self.current_piece = self.new_piece()

    def new_piece(self):
        piece_type = random.choice(list(TETROMINOS.keys()))
        piece = {
            'type': piece_type,
            'shape': TETROMINOS[piece_type]['shape'],
            'color': TETROMINOS[piece_type]['color'],
            'x': BOARD_WIDTH // 2 - len(TETROMINOS[piece_type]['shape'][0]) // 2,
            'y': 0
        }
        if self.check_collision(piece['shape'], piece['x'], piece['y']):
            self.game_over = True
        return piece

    def check_collision(self, shape, x, y):
        for row_index, row in enumerate(shape):
            for col_index, cell in enumerate(row):
                if cell:
                    board_x = x + col_index
                    board_y = y + row_index
                    if not (0 <= board_x < BOARD_WIDTH and 0 <= board_y < BOARD_HEIGHT and self.board[board_y][board_x] == EMPTY_CELL):
                        return True
        return False

    def merge_piece(self):
        shape = self.current_piece['shape']
        x, y = self.current_piece['x'], self.current_piece['y']
        for row_index, row in enumerate(shape):
            for col_index, cell in enumerate(row):
                if cell:
                    self.board[y + row_index][x + col_index] = self.current_piece['type']

    def clear_lines(self):
        lines_cleared = 0
        new_board = [row for row in self.board if any(cell == EMPTY_CELL for cell in row)]
        lines_cleared = BOARD_HEIGHT - len(new_board)
        if lines_cleared > 0:
            self.score += lines_cleared * 100
            self.board = [[EMPTY_CELL for _ in range(BOARD_WIDTH)] for _ in range(lines_cleared)] + new_board

    def move(self, direction):
        if self.game_over:
            return

        x, y = self.current_piece['x'], self.current_piece['y']
        if direction == 'left':
            x -= 1
        elif direction == 'right':
            x += 1
        elif direction == 'down':
            y += 1

        if not self.check_collision(self.current_piece['shape'], x, y):
            self.current_piece['x'] = x
            self.current_piece['y'] = y
        elif direction == 'down':
            self.merge_piece()
            self.clear_lines()
            self.current_piece = self.next_piece
            self.next_piece = self.new_piece()

    def rotate(self):
        if self.game_over:
            return
        shape = self.current_piece['shape']
        rotated_shape = [list(row) for row in zip(*shape[::-1])]
        if not self.check_collision(rotated_shape, self.current_piece['x'], self.current_piece['y']):
            self.current_piece['shape'] = rotated_shape

game = GameState()

@app.route('/game', methods=['GET'])
def get_game_state():
    return jsonify({
        'board': game.board,
        'current_piece': game.current_piece,
        'next_piece': game.next_piece,
        'score': game.score,
        'game_over': game.game_over
    })

@app.route('/move', methods=['POST'])
def move_piece():
    print("Received /move request")
    direction = request.json['direction']
    game.move(direction)
    return jsonify({'status': 'success'})

@app.route('/rotate', methods=['POST'])
def rotate_piece():
    game.rotate()
    return jsonify({'status': 'success'})

@app.route('/reset', methods=['POST'])
def reset_game():
    global game
    game = GameState()
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)