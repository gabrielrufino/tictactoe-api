import { describe, expect, it } from 'vitest';
import { Game } from './game.entity.js';

describe(Game.name, () => {
  it('should create a game with initial playing state', () => {
    const game = Game.create('game-1', 'player-1', 'player-2');
    expect(game.id).toBe('game-1');
    expect(game.players.X).toBe('player-1');
    expect(game.players.O).toBe('player-2');
    expect(game.turn).toBe('X');
    expect(game.status).toBe('PLAYING');
    expect(game.winner).toBeNull();
    expect(game.board).toEqual([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);
  });

  it('should make a valid move and switch turn', () => {
    const game = Game.create('game-1', 'player-1', 'player-2');
    game.makeMove('X', 0, 0);
    expect(game.board[0][0]).toBe('X');
    expect(game.turn).toBe('O');
  });

  it('should fail if making a move when it is not player turn', () => {
    const game = Game.create('game-1', 'player-1', 'player-2');
    expect(() => game.makeMove('O', 0, 0)).toThrow('It is not player O\'s turn');
  });

  it('should fail if cell is already occupied', () => {
    const game = Game.create('game-1', 'player-1', 'player-2');
    game.makeMove('X', 0, 0);
    expect(() => game.makeMove('O', 0, 0)).toThrow('Cell is already occupied');
  });

  it('should detect vertical win', () => {
    const game = Game.create('game-1', 'player-1', 'player-2');
    // X O -
    // X O -
    // X - -
    game.makeMove('X', 0, 0);
    game.makeMove('O', 0, 1);
    game.makeMove('X', 1, 0);
    game.makeMove('O', 1, 1);
    game.makeMove('X', 2, 0); // X wins vertically on col 0

    expect(game.status).toBe('WON');
    expect(game.winner).toBe('X');
  });

  it('should detect horizontal win', () => {
    const game = Game.create('game-1', 'player-1', 'player-2');
    // X X X
    // O O -
    // - - -
    game.makeMove('X', 0, 0);
    game.makeMove('O', 1, 0);
    game.makeMove('X', 0, 1);
    game.makeMove('O', 1, 1);
    game.makeMove('X', 0, 2); // X wins horizontally on row 0

    expect(game.status).toBe('WON');
    expect(game.winner).toBe('X');
  });

  it('should detect primary diagonal win', () => {
    const game = Game.create('game-1', 'player-1', 'player-2');
    // X O -
    // - X O
    // - - X
    game.makeMove('X', 0, 0);
    game.makeMove('O', 0, 1);
    game.makeMove('X', 1, 1);
    game.makeMove('O', 1, 2);
    game.makeMove('X', 2, 2); // X wins on primary diagonal

    expect(game.status).toBe('WON');
    expect(game.winner).toBe('X');
  });

  it('should detect secondary diagonal win', () => {
    const game = Game.create('game-1', 'player-1', 'player-2');
    // - O X
    // - X O
    // X - -
    game.makeMove('X', 0, 2);
    game.makeMove('O', 0, 1);
    game.makeMove('X', 1, 1);
    game.makeMove('O', 1, 2);
    game.makeMove('X', 2, 0); // X wins on secondary diagonal

    expect(game.status).toBe('WON');
    expect(game.winner).toBe('X');
  });

  it('should fail if making a move on a game that is not active', () => {
    const game = Game.create('game-1', 'player-1', 'player-2');
    game.makeMove('X', 0, 0);
    game.makeMove('O', 0, 1);
    game.makeMove('X', 1, 1);
    game.makeMove('O', 1, 2);
    game.makeMove('X', 2, 2); // X wins, game is now WON (not active)

    expect(() => game.makeMove('O', 2, 0)).toThrow('Game is not active');
  });

  it('should fail if making a move with row or column out of bounds', () => {
    const game = Game.create('game-1', 'player-1', 'player-2');
    expect(() => game.makeMove('X', -1, 0)).toThrow('Move out of bounds');
    expect(() => game.makeMove('X', 3, 0)).toThrow('Move out of bounds');
    expect(() => game.makeMove('X', 0, -1)).toThrow('Move out of bounds');
    expect(() => game.makeMove('X', 0, 3)).toThrow('Move out of bounds');
    expect(() => game.makeMove('X', 1.5, 0)).toThrow('Move out of bounds');
    expect(() => game.makeMove('X', NaN, 0)).toThrow('Move out of bounds');
  });

  it('should detect draw', () => {
    const game = Game.create('game-1', 'player-1', 'player-2');
    // X O X
    // X O O
    // O X - -> let's map a full board
    // X | O | X
    // X | O | O
    // O | X | X (draw)
    game.makeMove('X', 0, 0); // X
    game.makeMove('O', 0, 1); // O
    game.makeMove('X', 0, 2); // X
    game.makeMove('O', 1, 1); // O
    game.makeMove('X', 1, 0); // X
    game.makeMove('O', 1, 2); // O
    game.makeMove('X', 2, 1); // X
    game.makeMove('O', 2, 0); // O
    game.makeMove('X', 2, 2); // X

    expect(game.status).toBe('DRAW');
    expect(game.winner).toBeNull();
  });
});
