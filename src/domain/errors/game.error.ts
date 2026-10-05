export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class GameNotFoundError extends DomainError {
  constructor(message = 'Game not found') {
    super(message);
    this.name = 'GameNotFoundError';
  }
}

export class InvalidMoveError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidMoveError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'Conflict: Stale game revision') {
    super(message);
    this.name = 'ConflictError';
  }
}
