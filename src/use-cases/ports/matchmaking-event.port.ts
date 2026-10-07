export interface MatchmakingEvent {
  type: 'PLAYER_JOINED' | 'MATCH_FOUND' | 'PLAYER_LEFT' | 'QUEUE_EMPTY'
  playerName?: string
  opponentName?: string
  gameId?: string
  timestamp: string
}

export interface MatchmakingEventPublisher {
  publish: (event: MatchmakingEvent) => void
  subscribe: (listener: (event: MatchmakingEvent) => void) => () => void
}

export interface MatchmakingQueue {
  getWaitingPlayers: () => string[]
  getPlayerCount: () => number
  hasPlayer: (playerName: string) => boolean
  addPlayer: (playerName: string) => boolean
  removePlayer: (playerName: string) => boolean
  getOtherPlayer: (playerName: string) => string | null
}
