"use client"

import { useState } from "react";
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
import type { Referee } from "@/types";

type SettingsPanelProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  refereeId: Referee;
  onRefereeIdChange: (id: Referee) => void;
  serverIp: string;
  onServerIpChange: (ip: string) => void;
};

export default function SettingsPanel({
  isOpen,
  onOpenChange,
  refereeId,
  onRefereeIdChange,
  serverIp,
  onServerIpChange,
}: SettingsPanelProps) {
  const [ipValue, setIpValue] = useState(serverIp);

  const handleSave = () => {
    onServerIpChange(ipValue);
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Configure your referee controller.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-6">
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
            <Label htmlFor="server-ip" className="text-base font-semibold">Server IP Address</Label>
            <p className="text-sm text-muted-foreground mb-2">Enter the IP address of the TKD WiFi Server.</p>
            <Input 
              id="server-ip"
              value={ipValue}
              onChange={(e) => setIpValue(e.target.value)}
              placeholder="e.g., 192.168.0.101"
            />
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save & Connect</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
