export type Referee = 1 | 2 | 3;
export type ConnectionStatus = 'connected' | 'lagging' | 'disconnected';

// Data sent from client to server
export type ScoreData = {
  points: number;
  target: 'red' | 'blue';
};

export type ScorePayload = ScoreData & {
  timestamp: number;
}

type PingPayload = {
  timestamp: number;
}

export type ClientMessage = {
  refereeId: Referee;
} & (
  | { type: 'score'; payload: ScorePayload }
  | { type: 'ping'; payload: PingPayload }
)

// Data sent from server to client
type PongMessage = {
  type: 'pong';
  timestamp: number;
};

type ScoreAckMessage = {
  type: 'score_ack';
  refereeId: Referee;
  target: 'red' | 'blue';
  timestamp: number;
};

export type ServerMessage = PongMessage | ScoreAckMessage;


export type ScoreSettings = {
  headTap: number;
  headSwipe: number;
  bodyTap: number;
  bodySwipe: number;
  punch: number;
};
