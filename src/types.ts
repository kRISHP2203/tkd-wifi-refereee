export type Referee = 1 | 2 | 3;
export type ConnectionStatus = 'connected' | 'lagging' | 'disconnected';

export type ScorePayload = { 
  refereeId: number; 
  action: string;
  points: number; 
  target: 'red' | 'blue'; 
  timestamp: number; 
};
