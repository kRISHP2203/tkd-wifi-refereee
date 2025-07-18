"use client"

import { useState, useEffect } from 'react';
import type { Referee, ConnectionStatus } from '@/types';
import Header from '@/components/header';
import RefereeScreen from '@/components/referee-screen';
import SettingsPanel from '@/components/settings-panel';
import { useToast } from "@/hooks/use-toast"

export default function Home() {
  const [refereeId, setRefereeId] = useState<Referee>(1);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { toast } = useToast()

  const handleScore = (target: 'red' | 'blue', points: number, action: string) => {
    if (connectionStatus === 'disconnected') {
      toast({
        variant: "destructive",
        title: "Failed to send score",
        description: "Not connected to the server.",
      })
      return;
    }

    const scoreData = {
      referee_id: refereeId,
      action: action,
      points: points,
      target: target,
      timestamp: Date.now(),
    };
    console.log('Sending score:', JSON.stringify(scoreData, null, 2));
  };

  const simulateConnectionLost = () => {
    setConnectionStatus('disconnected');
    toast({
      variant: "destructive",
      title: "Connection Lost",
      description: "Disconnected from server. Please check connection.",
    })
  }
  
  const simulateScoreFail = () => {
    toast({
      variant: "destructive",
      title: "Failed to send score",
      description: "Could not reach the server. Please try again.",
    })
  }

  useEffect(() => {
    const intervalId = setInterval(() => {
      setConnectionStatus(prevStatus => {
        if (prevStatus === 'disconnected') {
          return 'disconnected';
        }
        const rand = Math.random();
        return rand < 0.1 ? 'lagging' : 'connected';
      });
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

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
        onRefereeIdChange={setRefereeId}
        onSimulateConnectionLost={simulateConnectionLost}
        onSimulateScoreFail={simulateScoreFail}
      />
    </div>
  );
}
