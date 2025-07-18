"use client"

import { useState, useEffect } from 'react';
import type { Referee, ConnectionStatus } from '@/types';
import Header from '@/components/header';
import RefereeScreen from '@/components/referee-screen';
import SettingsPanel from '@/components/settings-panel';
import { useToast } from "@/hooks/use-toast"
import * as TKDService from '@/lib/tkd-service';

export default function Home() {
  const [refereeId, setRefereeId] = useState<Referee>(1);
  const [serverIp, setServerIp] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    async function initialize() {
      const settings = await TKDService.loadSettings();
      if (settings) {
        setRefereeId(settings.refereeId as Referee);
        setServerIp(settings.serverIP);
        if (settings.serverIP) {
          TKDService.connectToServer();
        }
      }
    }
    initialize();

    const onStatusChange = (status: ConnectionStatus) => {
      setConnectionStatus(status);
      if (status === 'disconnected') {
        toast({
          variant: "destructive",
          title: "Connection Lost",
          description: "Disconnected from server. Please check connection and IP.",
        });
      }
    };

    TKDService.onServerConnectionChange(onStatusChange);

    return () => {
      TKDService.disconnectFromServer();
    };
  }, [toast]);

  const handleScore = (target: 'red' | 'blue', points: number, action: string) => {
    const scoreData = {
      refereeId: refereeId,
      action: action,
      points: points,
      target: target,
      timestamp: Date.now(),
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

  const handleServerIpChange = (ip: string) => {
    setServerIp(ip);
    if (TKDService.setServerIP(ip)) {
      TKDService.disconnectFromServer();
      TKDService.connectToServer();
    } else {
       toast({
        variant: "destructive",
        title: "Invalid IP Address",
        description: "Please enter a valid IPv4 address.",
      });
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <Header 
        status={connectionStatus} 
        onSettingsClick={() => setIsSettingsOpen(true)} 
      />
      <main className="flex-1">
        <RefereeScreen onScore={handleScore} />
      </main>
      <SettingsPanel
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        refereeId={refereeId}
        onRefereeIdChange={handleRefereeIdChange}
        serverIp={serverIp}
        onServerIpChange={handleServerIpChange}
      />
    </div>
  );
}
