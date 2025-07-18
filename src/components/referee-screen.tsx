"use client"

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import React from 'react';
import { Shield, ArrowRight } from 'lucide-react';

const HeadgearIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-16 h-16 md:w-20 md:h-20", className)}
    >
      <path d="M14.5 9.5a2.5 2.5 0 1 0-5 0" />
      <path d="M12 12a5 5 0 0 1 5 5H7a5 5 0 0 1 5-5z" />
      <path d="M20 12a8 8 0 1 0-16 0" />
      <path d="M17 17a5 5 0 0 0-10 0" />
    </svg>
);

const TrunkIcon = ({ className }: { className?: string }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-16 h-16 md:w-20 md:h-20", className)}
    >
      <path d="M12 4L4 8v10h16V8l-8-4z" />
      <path d="M4 8l8 4 8-4" />
      <path d="M12 12v10" />
      <path d="M8 22V12" />
      <path d="M16 22V12" />
    </svg>
);

const ScoreButton = ({
  icon: Icon,
  tapPoints,
  swipePoints,
  tapAction,
  swipeAction,
  onScore,
  label
}: {
  icon: React.ElementType,
  tapPoints: number,
  swipePoints: number,
  tapAction: string,
  swipeAction: string,
  onScore: (points: number, action: string) => void,
  label: string
}) => {
  const [isTapped, setIsTapped] = useState(false);
  const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null);

  const handleInteractionStart = (clientX: number, clientY: number) => {
    touchStartRef.current = { x: clientX, y: clientY, time: Date.now() };
    setIsTapped(true);
  };

  const handleInteractionEnd = (clientX: number, clientY: number) => {
    setIsTapped(false);
    if (!touchStartRef.current) return;

    const touchEnd = { x: clientX, y: clientY, time: Date.now() };
    const start = touchStartRef.current;
    
    const dx = touchEnd.x - start.x;
    const dy = touchEnd.y - start.y;
    const dt = touchEnd.time - start.time;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Swipe detection: moved more than 50px in less than 500ms
    if (dt < 500 && distance > 50) {
      onScore(swipePoints, swipeAction);
    } else { // Tap detection
      onScore(tapPoints, tapAction);
    }

    touchStartRef.current = null;
  };

  return (
    <div 
      className={cn(
        "flex-1 w-full flex justify-center items-center cursor-pointer select-none transition-transform duration-100 ease-out",
        isTapped ? 'scale-[0.98] bg-white/20' : 'scale-100'
      )}
      onTouchStart={(e) => handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={(e) => handleInteractionEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
      onMouseDown={(e) => handleInteractionStart(e.clientX, e.clientY)}
      onMouseUp={(e) => handleInteractionEnd(e.clientX, e.clientY)}
      role="button"
      aria-label={`${label}`}
    >
      <div className="flex flex-col items-center gap-2 text-white text-center p-2">
        <Icon />
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-lg md:text-xl font-semibold">
            <span className="font-light">TAP:</span>
            <span>+{tapPoints}</span>
          </div>
          <div className="flex items-center gap-2 text-lg md:text-xl font-semibold">
            <span className="font-light">SWIPE:</span>
            <span>+{swipePoints}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const PlayerZone = ({ 
  color, 
  onScore 
}: { 
  color: 'red' | 'blue', 
  onScore: (points: number, action: string) => void 
}) => {
  const bgColor = color === 'red' ? 'bg-[#E63946]' : 'bg-[#457B9D]';

  return (
    <div className={cn("flex-1 h-full flex flex-col", bgColor)}>
      <ScoreButton 
        icon={HeadgearIcon}
        tapPoints={3}
        swipePoints={5}
        tapAction="head_kick"
        swipeAction="head_turning_kick"
        onScore={onScore}
        label={`Score head for ${color}`}
      />
      <div className="w-4/5 h-[2px] bg-white/50 self-center" />
      <ScoreButton 
        icon={TrunkIcon}
        tapPoints={2}
        swipePoints={4}
        tapAction="body_kick"
        swipeAction="body_turning_kick"
        onScore={onScore}
        label={`Score body for ${color}`}
      />
    </div>
  )
};


export default function RefereeScreen({ onScore }: { onScore: (target: 'red' | 'blue', points: number, action: string) => void }) {
  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      <PlayerZone color="red" onScore={(points, action) => onScore('red', points, action)} />
      <PlayerZone color="blue" onScore={(points, action) => onScore('blue', points, action)} />
    </div>
  );
}
