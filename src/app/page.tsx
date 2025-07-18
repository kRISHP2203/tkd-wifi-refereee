"use client"

import { useState, useEffect } from 'react';
import type { Referee, ConnectionStatus, ScoreSettings, ScorePayload } from '@/types';
import Header from '@/components/header';
import RefereeScreen from '@/components/referee-screen';
import SettingsPanel from '@/components/settings-panel';
import { useToast } from "@/hooks/use-toast"
import * as TKDService from '@/lib/tkd-service';

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
  const { toast } = useToast()

  useEffect(() => {
    async function initialize() {
      const settings = await TKDService.loadSettings();
      if (settings) {
        setRefereeId(settings.refereeId as Referee);
        setScoreSettings(settings.scoreSettings);
      }
    }
    initialize();

  }, [toast]);

  const handleScore = (target: 'red' | 'blue', points: number, action: ScorePayload['action']) => {
    const scoreData: ScorePayload = {
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

  const handleScoreSettingsChange = (newSettings: ScoreSettings) => {
    setScoreSettings(newSettings);
    TKDService.saveScoreSettings(newSettings);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <Header 
        status={connectionStatus} 
        onSettingsClick={() => setIsSettingsOpen(true)} 
      />
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
      />
    </div>
  );
}
