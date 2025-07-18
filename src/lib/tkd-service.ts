// @ts-nocheck
'use client';

import type { Referee, ConnectionStatus, ScorePayload, ScoreSettings } from '@/types';

const IP_STORAGE_KEY = 'TKD_SERVER_IP';
const ID_STORAGE_KEY = 'TKD_REFEREE_ID';
const SCORE_SETTINGS_KEY = 'TKD_SCORE_SETTINGS';
const WEBSOCKET_PORT = 8080; // Default WebSocket port

let socket: WebSocket | null = null;
let serverIP: string | null = null;
let refereeId: Referee = 1;
let heartbeatInterval: NodeJS.Timeout | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

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
    statusChangeCallback(newStatus);
  }
};

const isValidIPv4 = (ip: string) => {
  const regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(ip);
};

export function setServerIP(ip: string): boolean {
  if (isValidIPv4(ip)) {
    serverIP = ip;
    localStorage.setItem(IP_STORAGE_KEY, ip);
    return true;
  }
  return false;
}

export function setRefereeID(id: Referee): void {
  refereeId = id;
  localStorage.setItem(ID_STORAGE_KEY, String(id));
}

export function saveScoreSettings(settings: ScoreSettings): void {
  localStorage.setItem(SCORE_SETTINGS_KEY, JSON.stringify(settings));
}


export async function connectToServer(): Promise<void> {
  // Bypassing connection logic for now
  console.log('Connection to server is currently disabled.');
  return;

  if (!serverIP) {
    console.error('Server IP not set.');
    return;
  }
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  clearTimeout(reconnectTimeout);
  
  const url = `wss://${serverIP}:${WEBSOCKET_PORT}`;
  console.log(`Connecting to ${url}...`);
  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log('Connected to server.');
    updateStatus('connected');
    sendHeartbeat(); 
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(sendHeartbeat, 3000);
  };

  socket.onclose = () => {
    console.log('Disconnected from server.');
    updateStatus('disconnected');
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    // Retry connection after a delay
    reconnectTimeout = setTimeout(connectToServer, 5000);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    updateStatus('disconnected');
    socket?.close();
  };

  socket.onmessage = (event) => {
    console.log('Message from server:', event.data);
    // Can be used to handle incoming messages, e.g., lag detection
    if (connectionStatus === 'disconnected') {
      updateStatus('connected');
    }
  };
}

export function sendScore(payload: ScorePayload): boolean {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      // The `action` property is now part of the payload passed in.
      // We default to 'score' if it's not provided, but the UI should determine the action.
      const message = { ...payload, action: payload.action || 'score' };
      socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send score:', error);
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
    }
  }
}

export async function loadSettings(): Promise<{ refereeId: Referee, serverIP: string, scoreSettings: ScoreSettings } | null> {
  try {
    const storedIp = localStorage.getItem(IP_STORAGE_KEY);
    const storedId = localStorage.getItem(ID_STORAGE_KEY);
    const storedScoreSettings = localStorage.getItem(SCORE_SETTINGS_KEY);

    let loadedScoreSettings = defaultScoreSettings;
    if (storedScoreSettings) {
      try {
        loadedScoreSettings = { ...defaultScoreSettings, ...JSON.parse(storedScoreSettings) };
      } catch (e) {
        console.error("Failed to parse score settings, using default.", e);
      }
    }

    if (storedIp) {
      serverIP = storedIp;
    }
    if (storedId) {
      refereeId = Number(storedId) as Referee;
    }

    return {
      refereeId: refereeId || 1,
      serverIP: serverIP || '',
      scoreSettings: loadedScoreSettings,
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return null;
  }
}

export function disconnectFromServer(): void {
  console.log('Disconnecting from server...');
  clearTimeout(reconnectTimeout);
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (socket) {
    socket.onclose = null; // Prevent reconnect logic from firing on manual disconnect
    socket.close();
    socket = null;
  }
  updateStatus('disconnected');
}

export async function testServerConnection(): Promise<boolean> {
  if (!serverIP) return false;
  
  return new Promise((resolve) => {
    const testSocket = new WebSocket(`wss://${serverIP}:${WEBSOCKET_PORT}`);
    
    testSocket.onopen = () => {
      testSocket.close();
      resolve(true);
    };
    
    testSocket.onerror = () => {
      resolve(false);
    };

    setTimeout(() => {
        if (testSocket.readyState !== WebSocket.OPEN) {
            testSocket.close();
            resolve(false);
        }
    }, 3000); // 3-second timeout for the test
  });
}

export function onServerConnectionChange(cb: (status: ConnectionStatus) => void): void {
  statusChangeCallback = cb;
}
