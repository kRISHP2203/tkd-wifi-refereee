"use client"

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import type { Referee, ScoreSettings } from "@/types";

type SettingsPanelProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  refereeId: Referee;
  onRefereeIdChange: (id: Referee) => void;
  scoreSettings: ScoreSettings;
  onScoreSettingsChange: (settings: ScoreSettings) => void;
  serverIp: string;
  serverPort: number;
  onServerConnectionChange: (ip: string, port: number) => void;
};

export default function SettingsPanel({
  isOpen,
  onOpenChange,
  refereeId,
  onRefereeIdChange,
  scoreSettings,
  onScoreSettingsChange,
  serverIp,
  serverPort,
  onServerConnectionChange,
}: SettingsPanelProps) {
  const [localScoreSettings, setLocalScoreSettings] = useState(scoreSettings);
  const [localServerIp, setLocalServerIp] = useState(serverIp);
  const [localServerPort, setLocalServerPort] = useState(String(serverPort));

  useEffect(() => {
    setLocalScoreSettings(scoreSettings);
  }, [scoreSettings]);

  useEffect(() => {
    setLocalServerIp(serverIp);
  }, [serverIp]);
  
  useEffect(() => {
    setLocalServerPort(String(serverPort));
  }, [serverPort]);


  const handleSave = () => {
    onScoreSettingsChange(localScoreSettings);
    const portNumber = Number(localServerPort);
    onServerConnectionChange(localServerIp, isNaN(portNumber) ? 8080 : portNumber);
    onOpenChange(false);
  };

  const handleScoreChange = (field: keyof ScoreSettings, value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setLocalScoreSettings(prev => ({ ...prev, [field]: numValue }));
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Configure your referee controller.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-6">
           <div>
            <Label className="text-base font-semibold">Server Connection</Label>
            <p className="text-sm text-muted-foreground mb-4">Enter the IP and Port of the TKD WiFi Server.</p>
            <div className="flex items-center gap-2">
              <Input 
                id="server-ip" 
                type="text" 
                value={localServerIp} 
                onChange={e => setLocalServerIp(e.target.value)} 
                placeholder="e.g., 192.168.1.100"
                className="flex-grow"
              />
              <Input
                id="server-port"
                type="number"
                value={localServerPort}
                onChange={e => setLocalServerPort(e.target.value)}
                placeholder="8080"
                className="w-24"
              />
            </div>
          </div>

          <Separator />
          
          <div>
            <Label className="text-base font-semibold">Referee ID</Label>
            <p className="text-sm text-muted-foreground mb-4">Select your assigned referee number.</p>
            <RadioGroup
              value={String(refereeId)}
              onValueChange={(value) => onRefereeIdChange(Number(value) as Referee)}
              className="flex gap-4"
            >
              {[1, 2, 3].map((id) => (
                <div key={id} className="flex items-center space-x-2">
                  <RadioGroupItem value={String(id)} id={`referee-${id}`} />
                  <Label htmlFor={`referee-${id}`} className="text-lg font-bold">{id}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <Separator />
          
          <div>
            <Label className="text-base font-semibold">Scoring Settings</Label>
            <p className="text-sm text-muted-foreground mb-4">Customize points for each action.</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="punch-score">Punch</Label>
                <Input id="punch-score" type="number" value={localScoreSettings.punch} onChange={e => handleScoreChange('punch', e.target.value)} className="w-20" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="body-kick-score">Body Kick (Tap)</Label>
                <Input id="body-kick-score" type="number" value={localScoreSettings.bodyTap} onChange={e => handleScoreChange('bodyTap', e.target.value)} className="w-20" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="body-turn-kick-score">Body Turning Kick (Swipe)</Label>
                <Input id="body-turn-kick-score" type="number" value={localScoreSettings.bodySwipe} onChange={e => handleScoreChange('bodySwipe', e.target.value)} className="w-20" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="head-kick-score">Head Kick (Tap)</Label>
                <Input id="head-kick-score" type="number" value={localScoreSettings.headTap} onChange={e => handleScoreChange('headTap', e.target.value)} className="w-20" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="head-turn-kick-score">Head Turning Kick (Swipe)</Label>
                <Input id="head-turn-kick-score" type="number" value={localScoreSettings.headSwipe} onChange={e => handleScoreChange('headSwipe', e.target.value)} className="w-20" />
              </div>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save & Reconnect</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
