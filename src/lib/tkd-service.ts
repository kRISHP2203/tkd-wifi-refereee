
'use client';

import type { Referee, ConnectionStatus, ScoreSettings, ClientMessage, ServerMessage, ScoreData } from '@/types';

const ID_STORAGE_KEY = 'TKD_REFEREE_ID';
const IP_STORAGE_KEY = 'TKD_SERVER_IP';
const PORT_STORAGE_KEY = 'TKD_SERVER_PORT';
const SCORE_SETTINGS_KEY = 'TKD_SCORE_SETTINGS';
const DEFAULT_PORT = 8080;
const HEARTBEAT_INTERVAL_MS = 5000;
const LAG_THRESHOLD_MS = 2000;
const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_DELAY_MS = 1000;


let socket: WebSocket | null = null;
let serverIP: string | null = null;
let serverPort: number = DEFAULT_PORT;
let refereeId: Referee = 1;
let heartbeatInterval: NodeJS.Timeout | null = null;
let lagTimeout: NodeJS.Timeout | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;

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

function cleanupTimers() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (lagTimeout) clearTimeout(lagTimeout);
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    heartbeatInterval = null;
    lagTimeout = null;
    reconnectTimeout = null;
}

export function onServerConnectionChange(cb: (status: ConnectionStatus) => void): void {
  statusChangeCallback = cb;
}

export function setRefereeID(id: Referee): void {
  refereeId = id;
  localStorage.setItem(ID_STORAGE_KEY, String(id));
}

export function setServerConnectionDetails(ip: string, port: number): void {
  serverIP = ip;
  serverPort = port;
  localStorage.setItem(IP_STORAGE_KEY, ip);
  localStorage.setItem(PORT_STORAGE_KEY, String(port));
}

export function saveScoreSettings(settings: ScoreSettings): void {
  localStorage.setItem(SCORE_SETTINGS_KEY, JSON.stringify(settings));
}

export function connectToServer(ipAddress: string, port: number): void {
  if (typeof window === 'undefined') return;

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket is already open or connecting.');
      return;
  }

  cleanupTimers();
  
  if (!ipAddress) {
    console.log('IP address is empty, ensuring disconnection.');
    disconnectFromServer();
    return;
  }
  
  serverIP = ipAddress;
  serverPort = port;
  
  const isSecure = window.location.protocol === 'https:';
  const protocol = isSecure ? 'wss' : 'ws';
  const url = `${protocol}://${serverIP}:${serverPort}`;
  
  console.log(`Attempting to connect to ${url}...`);
  
  try {
    socket = new WebSocket(url);
    handleConnectionEvents();
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
  }
}

function handleConnectionEvents() {
  if (!socket) return;
  
  socket.onopen = (event) => {
    console.log('✅ WebSocket connected successfully');
    console.log('Connection event:', event);
    updateStatus('connected');
    reconnectAttempts = 0; 
    sendHeartbeat(); 
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
  };

  socket.onclose = (event) => {
    console.log('🔴 WebSocket connection closed');
    console.log('Close code:', event.code, 'Reason:', event.reason, 'Was clean:', event.wasClean);
    updateStatus('disconnected');
    cleanupTimers();
    if (!event.wasClean) {
        reconnectIfDropped();
    }
  };

  socket.onerror = (error) => {
    console.error('=== WebSocket Error Details ===');
    console.error('Error object:', error);
    if(socket) {
        console.error('Socket readyState:', socket.readyState);
        console.error('Socket URL:', socket.url);
    }
    console.error('Timestamp:', new Date().toISOString());
    console.error('This often happens due to a firewall on the server, the server app not running, or a network issue.');
    console.error('================================');
    updateStatus('disconnected');
    socket?.close();
  };

  socket.onmessage = (event) => {
    try {
      console.log('📨 WebSocket message received:', event.data);
      const message: ServerMessage = JSON.parse(event.data);
      
      if (message.action === 'pong') {
        if (lagTimeout) clearTimeout(lagTimeout);
        if (connectionStatus === 'lagging' || connectionStatus === 'disconnected') {
           updateStatus('connected');
        }
      } else if (message.action === 'score_ack') {
        console.log(`Score acknowledged for ${message.target}`);
      }
    } catch (e) {
      console.error('Failed to parse server message:', event.data, e);
    }
  };
}

function reconnectIfDropped() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error(`Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Stopping.`);
        return;
    }

    if (!serverIP) return;
    
    reconnectAttempts++;
    const delay = Math.pow(2, reconnectAttempts - 1) * INITIAL_RECONNECT_DELAY_MS;
    console.log(`Connection dropped. Attempting reconnect ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay / 1000}s...`);

    reconnectTimeout = setTimeout(() => {
        connectToServer(serverIP!, serverPort);
    }, delay);
}


export function sendScore(payload: ScoreData): boolean {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      const message: ClientMessage = { 
        refereeId: refereeId,
        action: payload.action,
        points: payload.points,
        target: payload.target,
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
      const message: ClientMessage = { 
        action: 'heartbeat',
        refereeId: refereeId,
        timestamp: Date.now() 
      };
      socket.send(JSON.stringify(message));

      if (lagTimeout) clearTimeout(lagTimeout);
      lagTimeout = setTimeout(() => {
        updateStatus('lagging');
      }, LAG_THRESHOLD_MS);

    } catch (error) {
      console.error('Failed to send heartbeat:', error);
      updateStatus('lagging');
    }
  }
}

export async function loadSettings(): Promise<{ refereeId: Referee, scoreSettings: ScoreSettings, serverIp: string | null, serverPort: number }> {
  try {
    if (typeof window === 'undefined') {
      return { refereeId: 1, scoreSettings: defaultScoreSettings, serverIp: null, serverPort: DEFAULT_PORT };
    }
    const storedId = localStorage.getItem(ID_STORAGE_KEY);
    const storedIp = localStorage.getItem(IP_STORAGE_KEY);
    const storedPort = localStorage.getItem(PORT_STORAGE_KEY);
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
    
    if (storedPort) {
      const portNum = Number(storedPort);
      if (!isNaN(portNum)) {
        serverPort = portNum;
      }
    }


    return {
      refereeId: refereeId || 1,
      scoreSettings: loadedScoreSettings,
      serverIp: serverIP,
      serverPort: serverPort
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return {
      refereeId: 1,
      scoreSettings: defaultScoreSettings,
      serverIp: null,
      serverPort: DEFAULT_PORT
    };
  }
}

export function disconnectFromServer(): void {
  console.log('Manually disconnecting from server...');
  cleanupTimers();
  reconnectAttempts = 0;
  
  if (socket) {
    socket.onclose = () => {
        console.log('WebSocket connection cleanly closed by user.');
    };
    socket.close(1000, "User disconnected");
    socket = null;
  }
  updateStatus('disconnected');
}
