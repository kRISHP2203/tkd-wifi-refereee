"use client"

import { useState } from 'react';
import { cn } from '@/lib/utils';

const PlayerZone = ({ 
  color, 
  name, 
  onScore 
}: { 
  color: 'red' | 'blue', 
  name: string, 
  onScore: (points: number, action: string) => void 
}) => {
  const [isTapped, setIsTapped] = useState(false);
  const bgColor = color === 'red' ? 'bg-[#E63946]' : 'bg-[#457B9D]';
  
  const handleClick = () => {
    onScore(2, 'body_tap');
    setIsTapped(true);
    setTimeout(() => setIsTapped(false), 200);
  };

  return (
    <div 
      className={cn(
        "flex-1 h-full flex justify-center items-center cursor-pointer select-none transition-transform duration-100 ease-out",
        bgColor,
        isTapped ? 'scale-[0.98]' : 'scale-100'
      )}
      onClick={handleClick}
      role="button"
      aria-label={`Score for ${name}`}
    >
      <div className="flex flex-col items-center gap-8 text-white text-center p-4">
        <h2 className="text-6xl md:text-8xl font-bold uppercase tracking-widest font-headline">{name}</h2>
        <div className={cn(
          "w-48 h-48 md:w-64 md:h-64 border-4 border-white border-dashed rounded-lg flex items-center justify-center transition-all duration-200",
          isTapped ? 'bg-white/20' : 'bg-transparent'
        )}>
          <span className="text-2xl font-semibold">TAP TO SCORE</span>
        </div>
        <p className="text-2xl font-medium">+2 POINTS</p>
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
