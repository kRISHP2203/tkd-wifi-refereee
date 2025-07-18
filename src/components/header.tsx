import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RefereeStatus from '@/components/referee-status';
import type { ConnectionStatus } from '@/types';

type HeaderProps = {
  status: ConnectionStatus;
  onSettingsClick: () => void;
};

export default function Header({ status, onSettingsClick }: HeaderProps) {
  return (
    <header className="bg-neutral-900 text-white p-3 flex justify-between items-center shadow-md z-10 shrink-0">
      <h1 className="text-xl font-bold font-headline">TKD ScoreLink</h1>
      <div className="flex items-center gap-4">
        <RefereeStatus status={status} />
        <Button variant="ghost" size="icon" onClick={onSettingsClick} className="text-white hover:bg-neutral-700 hover:text-white">
          <Settings className="h-6 w-6" />
          <span className="sr-only">Settings</span>
        </Button>
      </div>
    </header>
  );
}
