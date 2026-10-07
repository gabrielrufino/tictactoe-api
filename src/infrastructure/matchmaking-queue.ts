export class MatchmakingQueueImpl {
  private readonly waiting: Set<string> = new Set();

  public getWaitingPlayers(): string[] {
    return Array.from(this.waiting);
  }

  public getPlayerCount(): number {
    return this.waiting.size;
  }

  public addPlayer(playerName: string): boolean {
    if (this.waiting.has(playerName))
      return false;
    this.waiting.add(playerName);
    return true;
  }

  public removePlayer(playerName: string): boolean {
    return this.waiting.delete(playerName);
  }

  public hasPlayer(playerName: string): boolean {
    return this.waiting.has(playerName);
  }

  public getOtherPlayer(playerName: string): string | null {
    for (const player of this.waiting) {
      if (player !== playerName)
        return player;
    }
    return null;
  }
}
