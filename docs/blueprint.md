# **App Name**: TKD ScoreLink

## Core Features:

- Referee Screen: Displays a split screen UI with red and blue player zones, mirroring a physical Taekwondo match layout, built using React Native in landscape mode.
- Referee Status: Displays a connection status indicator, which includes green, yellow, and red indicators to symbolize the active/lagging/disconnected states of the referees to TKD server.
- Referee ID: Referee ID selection to let referees pick from three IDs.
- Score Reporting: Send JSON messages for score, using either WebSocket or UDP, containing referee ID, action type, points awarded, target player, and timestamp upon tapping or swiping.
- Heartbeat: Maintains a heartbeat signal with the TKD WiFi Server to maintain the real time active status.
- Alerting: Alert the user of connection problems by displaying a red banner: 'Disconnected from server' and 'Failed to send score'

## Style Guidelines:

- Primary color: Saturated red (#E63946) and blue (#457B9D) to clearly represent the players.
- Background color: Desaturated light gray (#F1FAEE) to reduce eye strain during long matches.
- Accent color: Bright yellow (#F4D35E) to highlight active zones and interactive elements.
- Body and headline font: 'Inter' sans-serif font, because of its modern, objective and neutral look.
- Use simple, high-contrast icons for settings and status indicators to make things clearly visible.
- Employ a clear, split-screen layout with distinct zones for each player, using a landscape orientation.