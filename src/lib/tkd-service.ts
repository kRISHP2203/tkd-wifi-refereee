
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
let errorCallback: (error: string) => void = () => {};

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

export function onServerError(cb: (error: string) => void): void {
  errorCallback = cb;
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

  // Fully disconnect and clean up any existing socket before creating a new one.
  if (socket) {
    console.log('WebSocket is already open or connecting. Closing existing connection before creating a new one.');
    // Temporarily remove onclose to prevent reconnect logic from firing on a manual change.
    socket.onclose = null;
    socket.close(1000, "Initiating new connection");
    socket = null;
  }

  cleanupTimers();
  reconnectAttempts = 0; // Reset reconnect attempts on a new manual connection.
  
  if (!ipAddress) {
    console.log('IP address is empty, ensuring disconnection.');
    updateStatus('disconnected');
    errorCallback('Server IP address is not set.');
    return;
  }
  
  serverIP = ipAddress;
  serverPort = port;
  
  const isConnectingToLocalhost = serverIP === 'localhost' || serverIP === '127.0.0.1';
  // Use insecure 'ws://' for localhost, otherwise match the page protocol for security.
  const protocol = window.location.protocol === 'https:' && !isConnectingToLocalhost ? 'wss' : 'ws';
  const url = `${protocol}://${serverIP}:${serverPort}`;
  
  console.log(`Attempting to connect to ${url}...`);
  
  try {
    socket = new WebSocket(url);
    handleConnectionEvents();
  } catch (error) {
    console.error('Failed to create WebSocket instance:', error);
    updateStatus('disconnected');
    errorCallback('Could not create WebSocket. Check for typos in the address or browser restrictions.');
  }
}

function handleConnectionEvents() {
  if (!socket) return;
  
  socket.onopen = (event) => {
    console.log('✅ WebSocket connected successfully');
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
    // Reconnect only if it was not a clean, intentional close (code 1000)
    if (event.code !== 1000) { 
        reconnectIfDropped();
    }
  };

  socket.onerror = (error) => {
    const errorMessage = 'Connection failed. Please check the following: \n1. The TKD WiFi Server is running on the target machine. \n2. The server machine\'s firewall is allowing connections on the specified port. \n3. This device and the server are on the same WiFi network.';
    console.error('=== WebSocket Error Details ===');
    console.error('Error object:', error);
    if(socket) {
        console.error('Socket readyState:', socket.readyState);
        console.error('Socket URL:', socket.url);
    }
    console.error('Timestamp:', new Date().toISOString());
    console.error('This error is often due to the server not running, a firewall blocking the port, or being on the wrong network.');
    console.error('================================');
    updateStatus('disconnected');
    errorCallback(errorMessage);
  };

  socket.onmessage = (event) => {
    try {
      const message: ServerMessage = JSON.parse(event.data);
      
      if (message.action === 'pong') {
        if (lagTimeout) clearTimeout(lagTimeout);
        lagTimeout = null;
        if (connectionStatus === 'lagging') {
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
        errorCallback('Could not reconnect to the server. Please check the connection and settings.');
        return;
    }

    if (!serverIP) {
        console.log('No server IP set, cannot reconnect.');
        return;
    }
    
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

    const loadedRefereeId = storedId ? Number(storedId) as Referee : 1;
    const loadedServerIp = storedIp || null;
    const loadedServerPort = storedPort ? Number(storedPort) : DEFAULT_PORT;

    return {
      refereeId: loadedRefereeId,
      scoreSettings: loadedScoreSettings,
      serverIp: loadedServerIp,
      serverPort: loadedServerPort
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
    // Remove the old onclose listener to prevent reconnection logic from firing on a manual disconnect.
    socket.onclose = () => {
        console.log('WebSocket connection cleanly closed by user.');
    };
    socket.close(1000, "User disconnected");
    socket = null;
  }
  updateStatus('disconnected');
}
