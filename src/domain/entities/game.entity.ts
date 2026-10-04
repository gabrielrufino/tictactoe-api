import { InvalidMoveError } from '../errors/game.error.js';

export type PlayerSymbol = 'X' | 'O';
export type BoardCell = PlayerSymbol | null;
export type Board = [
  [BoardCell, BoardCell, BoardCell],
  [BoardCell, BoardCell, BoardCell],
  [BoardCell, BoardCell, BoardCell],
];

export type GameStatus = 'PLAYING' | 'WON' | 'DRAW';

export interface GameProps {
  id: string
  board: Board
  players: {
    X: string
    O: string
  }
  turn: PlayerSymbol
  status: GameStatus
  winner: PlayerSymbol | null
}

export class Game {
  private readonly _id: string;
  private _board: Board;
  private _players: { X: string, O: string };
  private _turn: PlayerSymbol;
  private _status: GameStatus;
  private _winner: PlayerSymbol | null;

  constructor(props: GameProps) {
    this._id = props.id;
    this._board = props.board;
    this._players = props.players;
    this._turn = props.turn;
    this._status = props.status;
    this._winner = props.winner;
  }

  get id(): string { return this._id; }
  get board(): Board { return this._board; }
  get players(): { X: string, O: string } { return this._players; }
  get turn(): PlayerSymbol { return this._turn; }
  get status(): GameStatus { return this._status; }
  get winner(): PlayerSymbol | null { return this._winner; }

  public static create(id: string, playerX: string, playerO: string): Game {
    return new Game({
      id,
      board: [
        [null, null, null],
        [null, null, null],
        [null, null, null],
      ],
      players: {
        X: playerX,
        O: playerO,
      },
      turn: 'X',
      status: 'PLAYING',
      winner: null,
    });
  }

  public makeMove(playerSymbol: PlayerSymbol, row: number, col: number): void {
    if (this._status !== 'PLAYING') {
      throw new InvalidMoveError('Game is not active');
    }

    if (this._turn !== playerSymbol) {
      throw new InvalidMoveError(`It is not player ${playerSymbol}'s turn`);
    }

    if (row < 0 || row > 2 || col < 0 || col > 2) {
      throw new InvalidMoveError('Move out of bounds');
    }

    if (this._board[row][col] !== null) {
      throw new InvalidMoveError('Cell is already occupied');
    }

    this._board[row][col] = playerSymbol;

    if (this.checkWin(playerSymbol)) {
      this._status = 'WON';
      this._winner = playerSymbol;
    }
    else if (this.checkDraw()) {
      this._status = 'DRAW';
      this._winner = null;
    }
    else {
      this._turn = this._turn === 'X' ? 'O' : 'X';
    }
  }

  private checkWin(player: PlayerSymbol): boolean {
    const b = this._board;

    for (let i = 0; i < 3; i++) {
      if (b[i][0] === player && b[i][1] === player && b[i][2] === player) {
        return true;
      }
    }

    for (let i = 0; i < 3; i++) {
      if (b[0][i] === player && b[1][i] === player && b[2][i] === player) {
        return true;
      }
    }

    if (b[0][0] === player && b[1][1] === player && b[2][2] === player) {
      return true;
    }
    if (b[0][2] === player && b[1][1] === player && b[2][0] === player) {
      return true;
    }

    return false;
  }

  private checkDraw(): boolean {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (this._board[r][c] === null) {
          return false;
        }
      }
    }
    return true;
  }
}
