"use client"

import { useState, useEffect } from 'react';
import type { Referee, ConnectionStatus, ScoreSettings, ScoreData } from '@/types';
import Header from '@/components/header';
import RefereeScreen from '@/components/referee-screen';
import SettingsPanel from '@/components/settings-panel';
import { useToast } from "@/hooks/use-toast"
import * as TKDService from '@/lib/tkd-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [refereeId, setRefereeId] = useState<Referee>(1);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [scoreSettings, setScoreSettings] = useState<ScoreSettings>({
    headTap: 3,
    headSwipe: 5,
    bodyTap: 2,
    bodySwipe: 4,
    punch: 1,
  });
  const [serverIp, setServerIp] = useState('');
  const [serverPort, setServerPort] = useState(8080);
  const [showConnectionAlert, setShowConnectionAlert] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    setIsClient(true);

    async function initialize() {
      const settings = await TKDService.loadSettings();
      if (settings) {
        setRefereeId(settings.refereeId);
        setScoreSettings(settings.scoreSettings);
        if (settings.serverIp) {
          setServerIp(settings.serverIp);
          setServerPort(settings.serverPort);
          TKDService.connectToServer(settings.serverIp, settings.serverPort);
        }
      }
    }
    initialize();

    const handleStatusChange = (status: ConnectionStatus) => {
      setConnectionStatus(status);
      setShowConnectionAlert(status === 'disconnected');
    };

    TKDService.onServerConnectionChange(handleStatusChange);

    return () => {
      TKDService.disconnectFromServer();
      TKDService.onServerConnectionChange(() => {}); // Clear listener
    };

  }, []);

  const handleScore = (target: 'red' | 'blue', points: number) => {
    const scoreData: ScoreData = {
      points: points,
      target: target,
      action: 'score',
    };
    
    const sent = TKDService.sendScore(scoreData);

    if (!sent) {
       toast({
        variant: "destructive",
        title: "Failed to send score",
        description: "Not connected to the server.",
      });
    }
    console.log('Sending score:', JSON.stringify(scoreData, null, 2));
  };
  
  const handleRefereeIdChange = (id: Referee) => {
    setRefereeId(id);
    TKDService.setRefereeID(id);
  }

  const handleScoreSettingsChange = (newSettings: ScoreSettings) => {
    setScoreSettings(newSettings);
    TKDService.saveScoreSettings(newSettings);
  };
  
  const handleServerConnectionChange = (ip: string, port: number) => {
    setServerIp(ip);
    setServerPort(port);
    TKDService.setServerConnectionDetails(ip, port);
    if(ip) {
      TKDService.connectToServer(ip, port);
    } else {
      TKDService.disconnectFromServer();
    }
  };

  if (!isClient) {
    return (
      <div className="flex flex-col h-screen bg-background overflow-hidden">
        <header className="bg-neutral-900 p-3 flex justify-between items-center shadow-md shrink-0 h-[60px]">
          <Skeleton className="h-6 w-36" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </header>
        <main className="flex-1">
           <Skeleton className="h-full w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <Header 
        status={connectionStatus} 
        onSettingsClick={() => setIsSettingsOpen(true)} 
      />
      {showConnectionAlert && (
        <Alert variant="destructive" className="m-2 rounded-lg">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Disconnected from server</AlertTitle>
          <AlertDescription>
            Please check your connection or server IP in settings.
          </AlertDescription>
        </Alert>
      )}
      <main className="flex-1">
        <RefereeScreen onScore={handleScore} scoreSettings={scoreSettings} />
      </main>
      <SettingsPanel
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        refereeId={refereeId}
        onRefereeIdChange={handleRefereeIdChange}
        scoreSettings={scoreSettings}
        onScoreSettingsChange={handleScoreSettingsChange}
        serverIp={serverIp}
        serverPort={serverPort}
        onServerConnectionChange={handleServerConnectionChange}
      />
    </div>
  );
}
