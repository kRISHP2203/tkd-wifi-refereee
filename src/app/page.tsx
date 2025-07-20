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

export default function Home() {
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
  const [showConnectionAlert, setShowConnectionAlert] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    async function initialize() {
      const settings = await TKDService.loadSettings();
      if (settings) {
        setRefereeId(settings.refereeId);
        setScoreSettings(settings.scoreSettings);
        if (settings.serverIp) {
          setServerIp(settings.serverIp);
          TKDService.connectToServer(settings.serverIp);
        }
      }
    }
    initialize();

    TKDService.onServerConnectionChange((status) => {
      setConnectionStatus(status);
      setShowConnectionAlert(status === 'disconnected');
    });

    return () => {
      TKDService.disconnectFromServer();
    };

  }, []);

  const handleScore = (target: 'red' | 'blue', points: number) => {
    const scoreData: ScoreData = {
      points: points,
      target: target,
      action: 'score', // As per new spec
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
  
  const handleServerIpChange = (ip: string) => {
    setServerIp(ip);
    TKDService.setServerIP(ip);
    if(ip) {
      TKDService.connectToServer(ip);
    } else {
      TKDService.disconnectFromServer();
    }
  };


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
        onServerIpChange={handleServerIpChange}
      />
    </div>
  );
}
