"use client"

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import type { Referee } from "@/types";

type SettingsPanelProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  refereeId: Referee;
  onRefereeIdChange: (id: Referee) => void;
  onSimulateConnectionLost: () => void;
  onSimulateScoreFail: () => void;
};

export default function SettingsPanel({
  isOpen,
  onOpenChange,
  refereeId,
  onRefereeIdChange,
  onSimulateConnectionLost,
  onSimulateScoreFail,
}: SettingsPanelProps) {
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
            <h3 className="text-base font-semibold mb-2">Debug Tools</h3>
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">These are for testing purposes.</p>
                <Button variant="destructive" className="w-full" onClick={() => { onSimulateConnectionLost(); onOpenChange(false); }}>
                    Simulate Connection Lost
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => { onSimulateScoreFail(); onOpenChange(false); }}>
                    Simulate Score Fail
                </Button>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
