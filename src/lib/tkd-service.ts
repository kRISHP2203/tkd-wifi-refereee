'use client';

import type { Referee, ConnectionStatus, ScorePayload, ScoreSettings } from '@/types';

const ID_STORAGE_KEY = 'TKD_REFEREE_ID';
const IP_STORAGE_KEY = 'TKD_SERVER_IP';
const SCORE_SETTINGS_KEY = 'TKD_SCORE_SETTINGS';
const WEBSOCKET_PORT = 8080;

let socket: WebSocket | null = null;
let serverIP: string | null = null;
let refereeId: Referee = 1;
let heartbeatInterval: NodeJS.Timeout | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let connectionAttempt = 0;

let connectionStatus: ConnectionStatus = 'disconnected';
let statusChangeCallback: (status: ConnectionStatus) => void = () => {};

const defaultScoreSettings: ScoreSettings = {
  headTap: 3,
  headSwipe: 5,
  bodyTap: 2,
  bodySwipe: 4,
  punch: 1,
};

const updateStatus = (newStatus: ConnectionStatus) => {
  if (connectionStatus !== newStatus) {
    connectionStatus = newStatus;
    if (statusChangeCallback) {
      statusChangeCallback(newStatus);
    }
  }
};

export function onServerConnectionChange(cb: (status: ConnectionStatus) => void): void {
  statusChangeCallback = cb;
}

export function setRefereeID(id: Referee): void {
  refereeId = id;
  localStorage.setItem(ID_STORAGE_KEY, String(id));
}

export function setServerIP(ip: string): void {
  serverIP = ip;
  localStorage.setItem(IP_STORAGE_KEY, ip);
}

export function saveScoreSettings(settings: ScoreSettings): void {
  localStorage.setItem(SCORE_SETTINGS_KEY, JSON.stringify(settings));
}

export function connectToServer(ipAddress: string): void {
  if (!ipAddress) {
    console.log('IP address is empty, disconnecting.');
    disconnectFromServer();
    return;
  }
  
  serverIP = ipAddress;
  
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    if (socket.url.includes(ipAddress)) {
      console.log('Already connected or connecting to this IP.');
      return;
    }
    disconnectFromServer();
  }

  clearTimeout(reconnectTimeout);

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const url = `${protocol}://${serverIP}:${WEBSOCKET_PORT}`;
  console.log(`Connecting to ${url}...`);
  socket = new WebSocket(url);
  
  handleConnectionEvents();
}

function handleConnectionEvents() {
  if (!socket) return;
  
  socket.onopen = () => {
    console.log('Connected to server.');
    updateStatus('connected');
    connectionAttempt = 0; 
    sendHeartbeat(); 
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(sendHeartbeat, 5000);
  };

  socket.onclose = () => {
    console.log('Disconnected from server.');
    updateStatus('disconnected');
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    reconnectIfDropped();
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    updateStatus('disconnected');
    socket?.close();
  };

  socket.onmessage = (event) => {
    // Lag detection could be implemented here based on heartbeat responses
    console.log('Message from server:', event.data);
    if (connectionStatus === 'disconnected') {
      updateStatus('connected');
    }
    // Set status to 'lagging' if heartbeat response is slow, then back to 'connected'
  };
}

function reconnectIfDropped() {
  if (!serverIP) return;
  
  // Exponential backoff
  const delay = Math.pow(2, connectionAttempt) * 1000;
  console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);
  
  reconnectTimeout = setTimeout(() => {
    connectionAttempt++;
    connectToServer(serverIP!);
  }, delay);
}


export function sendScore(payload: Omit<ScorePayload, 'refereeId' | 'action' | 'timestamp'>): boolean {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      const message: ScorePayload = { 
        ...payload, 
        refereeId: refereeId, 
        action: 'score', 
        timestamp: Date.now() 
      };
      socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send score:', error);
      updateStatus('lagging');
      return false;
    }
  }
  console.warn('Cannot send score, not connected.');
  return false;
}

export function sendHeartbeat(): void {
  if (socket && socket.readyState === WebSocket.OPEN) {
     try {
      const heartbeatPayload = { refereeId: refereeId, action: 'heartbeat', timestamp: Date.now() };
      socket.send(JSON.stringify(heartbeatPayload));
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
      updateStatus('lagging');
    }
  }
}

export async function loadSettings(): Promise<{ refereeId: Referee, scoreSettings: ScoreSettings, serverIp: string | null }> {
  try {
    const storedId = localStorage.getItem(ID_STORAGE_KEY);
    const storedIp = localStorage.getItem(IP_STORAGE_KEY);
    const storedScoreSettings = localStorage.getItem(SCORE_SETTINGS_KEY);

    let loadedScoreSettings = defaultScoreSettings;
    if (storedScoreSettings) {
      try {
        loadedScoreSettings = { ...defaultScoreSettings, ...JSON.parse(storedScoreSettings) };
      } catch (e) {
        console.error("Failed to parse score settings, using default.", e);
      }
    }

    if (storedId) {
      refereeId = Number(storedId) as Referee;
    }

    if (storedIp) {
      serverIP = storedIp;
    }

    return {
      refereeId: refereeId || 1,
      scoreSettings: loadedScoreSettings,
      serverIp: serverIP
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return {
      refereeId: 1,
      scoreSettings: defaultScoreSettings,
      serverIp: null
    };
  }
}

export function disconnectFromServer(): void {
  console.log('Disconnecting from server...');
  clearTimeout(reconnectTimeout);
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (socket) {
    socket.onclose = null;
    socket.close();
    socket = null;
  }
  updateStatus('disconnected');
}
