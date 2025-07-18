"use client"

import { useState } from 'react';
import { cn } from '@/lib/utils';
import React from 'react';

const HeadgearIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
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
    className={className}
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
  points,
  action,
  onScore,
  isTapped,
  onTap,
  label
}: {
  icon: React.ElementType,
  points: number,
  action: string,
  onScore: (points: number, action: string) => void,
  isTapped: boolean,
  onTap: () => void,
  label: string
}) => {
  const handleClick = () => {
    onScore(points, action);
    onTap();
  };

  return (
    <div 
      className={cn(
        "flex-1 w-full flex justify-center items-center cursor-pointer select-none transition-transform duration-100 ease-out",
        isTapped ? 'scale-[0.98] bg-white/20' : 'scale-100'
      )}
      onClick={handleClick}
      role="button"
      aria-label={`${label}`}
    >
      <div className="flex flex-col items-center gap-4 text-white text-center p-4">
        <Icon className="w-24 h-24 md:w-32 md:h-32" />
        <p className="text-xl md:text-2xl font-semibold">+{points} POINTS</p>
      </div>
    </div>
  )
}

const PlayerZone = ({ 
  color, 
  name, 
  onScore 
}: { 
  color: 'red' | 'blue', 
  name: string, 
  onScore: (points: number, action: string) => void 
}) => {
  const [tappedItem, setTappedItem] = useState<string | null>(null);
  const bgColor = color === 'red' ? 'bg-[#E63946]' : 'bg-[#457B9D]';

  const handleTap = (item: string) => {
    setTappedItem(item);
    setTimeout(() => setTappedItem(null), 200);
  }

  return (
    <div className={cn("flex-1 h-full flex flex-col justify-center items-center", bgColor)}>
       <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-widest font-headline text-white pt-6 md:pt-10">{name}</h2>
       <div className="flex-1 w-full flex flex-col items-center justify-around">
          <ScoreButton 
            icon={HeadgearIcon}
            points={3}
            action="head_kick"
            onScore={onScore}
            isTapped={tappedItem === 'head'}
            onTap={() => handleTap('head')}
            label={`Score head for ${name}`}
          />
          <div className="w-4/5 h-[2px] bg-white/50" />
          <ScoreButton 
            icon={TrunkIcon}
            points={2}
            action="body_kick"
            onScore={onScore}
            isTapped={tappedItem === 'body'}
            onTap={() => handleTap('body')}
            label={`Score body for ${name}`}
          />
       </div>
    </div>
  )
};


export default function RefereeScreen({ onScore }: { onScore: (target: 'red' | 'blue', points: number, action: string) => void }) {
  return (
    <div className="flex h-full w-full flex-col md:flex-row">
      <PlayerZone color="red" name="Red" onScore={(points, action) => onScore('red', points, action)} />
      <PlayerZone color="blue" name="Blue" onScore={(points, action) => onScore('blue', points, action)} />
    </div>
  );
}
