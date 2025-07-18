"use client"

import { cn } from "@/lib/utils";
import type { ConnectionStatus } from "@/types";

type RefereeStatusProps = {
  status: ConnectionStatus;
};

const statusConfig: Record<ConnectionStatus, { color: string; text: string }> = {
  connected: {
    color: "bg-success",
    text: "Connected",
  },
  lagging: {
    color: "bg-accent",
    text: "Lagging",
  },
  disconnected: {
    color: "bg-destructive",
    text: "Disconnected",
  },
};

export default function RefereeStatus({ status }: RefereeStatusProps) {
  const { color, text } = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-3 w-3 rounded-full", status !== 'disconnected' && 'animate-pulse', color)} />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
