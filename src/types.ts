export type Referee = 1 | 2 | 3;
export type ConnectionStatus = 'connected' | 'lagging' | 'disconnected';

// Base data for a scoring action
export type ScoreData = {
  points: number;
  target: 'red' | 'blue';
  action: 'score' | 'penalty';
};

// Message format sent from client (referee app) to server
export type ClientMessage = {
  refereeId: Referee;
  action: 'score' | 'penalty' | 'heartbeat';
  points?: number;
  target?: 'red' | 'blue';
  timestamp: number;
};

// Message format received by client from server
export type ServerMessage = {
  action: 'pong' | 'score_ack' | 'score' | 'penalty';
  refereeId?: Referee;
  points?: number;
  target?: 'red' | 'blue';
  timestamp?: number;
};

export type ScoreSettings = {
  headTap: number;
  headSwipe: number;
  bodyTap: number;
  bodySwipe: number;
  punch: number;
};
