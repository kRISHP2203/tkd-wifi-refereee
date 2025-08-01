"use client"

import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import React from 'react';
import Image from 'next/image';
import type { ScoreSettings } from '@/types';

const RedHeadgearIcon = () => (
    <Image 
        src="https://images.unsplash.com/photo-1599831912445-3532ba3b5115?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx0YWVrd29uZG8lMjByZWQlMjBoZWFkZ2VhcnxlbnwwfHx8fDE3NTI4MzQyOTB8MA&ixlib=rb-4.1.0&q=80&w=1080"
        alt="Red Taekwondo Headgear" 
        width={80} 
        height={80} 
        className="w-16 h-16 md:w-20 md:h-20 object-cover"
        data-ai-hint="red headgear"
    />
);

const BlueHeadgearIcon = () => (
    <Image 
        src="https://placehold.co/80x80.png" 
        alt="Blue Taekwondo Headgear" 
        width={80} 
        height={80} 
        className="w-16 h-16 md:w-20 md:h-20"
        data-ai-hint="taekwondo blue head guard"
    />
);

const RedTrunkIcon = () => (
    <Image 
        src="https://images.unsplash.com/photo-1753516372005-1e10cf208451?q=80&w=594&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
        alt="Red Taekwondo Trunk Protector" 
        width={80} 
        height={80} 
        className="w-16 h-16 md:w-20 md:h-20 object-cover"
        data-ai-hint="red trunk"
    />
);

const BlueTrunkIcon = () => (
    <Image 
        src="https://placehold.co/80x80.png" 
        alt="Blue Taekwondo Trunk Protector" 
        width={80} 
        height={80} 
        className="w-16 h-16 md:w-20 md:h-20"
        data-ai-hint="blue trunk"
    />
);

const PunchIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-10 h-10 md:w-12 md:h-12"
  >
    <path
      d="M14 13.0641V14.5C14 15.8807 12.8807 17 11.5 17C10.1193 17 9 15.8807 9 14.5V12.0002C9 10.3433 10.3431 9.00021 12 9.00021C12.9622 9.00021 13.8222 9.53123 14.3218 10.3335M18.5 10.5C18.5 8.29086 16.7091 6.5 14.5 6.5C12.2909 6.5 10.5 8.29086 10.5 10.5V15.5C10.5 16.8807 11.6193 18 13 18C14.3807 18 15.5 16.8807 15.5 15.5V13.0641C16.929 12.5638 18.0001 11.233 18.0001 9.66675C18.0001 9.42857 17.9822 9.19502 17.9481 8.96693"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);


const ScoreButton = ({
  icon: Icon,
  tapPoints,
  swipePoints,
  onScore,
  label
}: {
  icon: React.ElementType,
  tapPoints: number,
  swipePoints: number,
  onScore: (points: number) => void,
  label: string
}) => {
  const [isTapped, setIsTapped] = useState(false);
  const touchStartRef = useRef<{ x: number, y: number, time: number } | null>(null);

  const handleInteractionStart = (clientX: number, clientY: number) => {
    touchStartRef.current = { x: clientX, y: clientY, time: Date.now() };
    setIsTapped(true);
  };

  const handleInteractionEnd = (clientX: number, clientY: number) => {
    if (!touchStartRef.current) return;
    setIsTapped(false);

    const touchEnd = { x: clientX, y: clientY, time: Date.now() };
    const start = touchStartRef.current;
    
    const dx = touchEnd.x - start.x;
    const dy = touchEnd.y - start.y;
    const dt = touchEnd.time - start.time;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (dt < 500 && distance > 50) {
      onScore(swipePoints);
    } else { 
      onScore(tapPoints);
    }

    touchStartRef.current = null;
  };
  
  const cancelInteraction = () => {
    setIsTapped(false);
    touchStartRef.current = null;
  }

  return (
    <div 
      className={cn(
        "flex-1 w-full flex justify-center items-center cursor-pointer select-none transition-transform duration-100 ease-out border-2 border-black/50",
        isTapped ? 'scale-[0.98] bg-white/20' : 'scale-100'
      )}
      onTouchStart={(e) => handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={(e) => handleInteractionEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
      onTouchCancel={cancelInteraction}
      onMouseDown={(e) => handleInteractionStart(e.clientX, e.clientY)}
      onMouseUp={(e) => handleInteractionEnd(e.clientX, e.clientY)}
      onMouseLeave={cancelInteraction}
      role="button"
      aria-label={`${label}`}
    >
      <div className="flex flex-col items-center gap-2 text-white text-center p-2">
        <Icon />
      </div>
    </div>
  )
}

const PlayerZone = ({ 
  color, 
  onScore,
  scoreSettings
}: { 
  color: 'red' | 'blue', 
  onScore: (target: 'red' | 'blue', points: number) => void,
  scoreSettings: ScoreSettings
}) => {
  const bgColor = color === 'red' ? 'bg-[#E00000]' : 'bg-[#1262E2]';
  const HeadIcon = color === 'red' ? RedHeadgearIcon : BlueHeadgearIcon;
  const BodyIcon = color === 'red' ? RedTrunkIcon : BlueTrunkIcon;

  return (
    <div className={cn("flex-1 h-full flex flex-col", bgColor)}>
      <ScoreButton 
        icon={HeadIcon}
        tapPoints={scoreSettings.headTap}
        swipePoints={scoreSettings.headSwipe}
        onScore={(points) => onScore(color, points)}
        label={`Score head for ${color}`}
      />
      <div className="w-full h-[2px] bg-black/50 self-center" />
      <ScoreButton 
        icon={BodyIcon}
        tapPoints={scoreSettings.bodyTap}
        swipePoints={scoreSettings.bodySwipe}
        onScore={(points) => onScore(color, points)}
        label={`Score body for ${color}`}
      />
    </div>
  )
};

const PunchButton = ({ onScore, target, className, points }: { 
    onScore: (target: 'red' | 'blue', points: number) => void;
    target: 'red' | 'blue';
    className?: string;
    points: number;
}) => {
    const [isTapped, setIsTapped] = useState(false);

    const handleTap = () => {
        onScore(target, points);
    };

    const handleInteractionStart = () => setIsTapped(true);
    const handleInteractionEnd = () => setIsTapped(false);

    return (
        <div
            role="button"
            aria-label={`Score punch for ${target}`}
            onClick={handleTap}
            onMouseDown={handleInteractionStart}
            onMouseUp={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            onMouseLeave={handleInteractionEnd}
            onTouchCancel={handleInteractionEnd}
            className={cn(
                'cursor-pointer flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm border-2 border-black/50 rounded-lg shadow-2xl transition-transform duration-100 ease-out w-32 h-32 md:w-36 md:h-36',
                isTapped ? 'scale-95' : 'scale-100',
                className
            )}
        >
            <PunchIcon />
        </div>
    );
};

export default function RefereeScreen({ onScore, scoreSettings }: { 
  onScore: (target: 'red' | 'blue', points: number) => void,
  scoreSettings: ScoreSettings
}) {
  return (
    <div className="relative flex h-full w-full flex-row overflow-hidden">
      <PlayerZone color="red" onScore={onScore} scoreSettings={scoreSettings} />
      <PlayerZone color="blue" onScore={onScore} scoreSettings={scoreSettings} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex gap-4 md:gap-8">
        <PunchButton
          target="red"
          onScore={onScore}
          points={scoreSettings.punch}
          className="bg-[#E00000]/80"
        />
        <PunchButton
          target="blue"
          onScore={onScore}
          points={scoreSettings.punch}
          className="bg-[#1262E2]/80"
        />
      </div>
    </div>
  );
}
