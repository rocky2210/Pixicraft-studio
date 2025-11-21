import React from 'react';
import { Minus, Plus, Maximize, Film } from 'lucide-react';

const StatusBar = ({ 
  scale, 
  onChangeScale, 
  cursorPos, 
  width, 
  height, 
  showTimeline, 
  onToggleTimeline 
}) => {
  return (
    <div className="h-5 bg-[#252526] border-t border-[#333] flex items-center justify-between px-2 text-[9px] text-gray-400 select-none z-30 shrink-0">
      
      {/* Left Side */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleTimeline}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
            showTimeline 
              ? 'bg-indigo-900/50 text-indigo-400' 
              : 'hover:bg-[#333] hover:text-white'
          }`}
          title="Toggle Animation Timeline"
        >
          <Film size={10} />
          <span className="font-bold">Timeline</span>
        </button>

        <div className="h-3 w-px bg-[#444]" />

        <div className="flex items-center gap-1">
          <Maximize size={10} />
          <span>{width} × {height} px</span>
        </div>

        {cursorPos && (
          <div className="flex items-center gap-2 border-l border-[#444] pl-3">
            <span className="font-mono text-indigo-400">X:{cursorPos.x}</span>
            <span className="font-mono text-indigo-400">Y:{cursorPos.y}</span>
          </div>
        )}
      </div>

      {/* Right Side - Zoom Controls */}
      <div className="flex items-center gap-2">
        <span className="text-gray-500 uppercase font-bold text-[8px] tracking-wider">Zoom</span>
        
        <div className="flex items-center gap-1 bg-[#1e1e1e] rounded px-1 py-0 border border-[#333]">
          <button 
            onClick={() => onChangeScale(Math.max(scale - 5, 1))}
            className="hover:text-white p-0.5 transition-colors"
          >
            <Minus size={8} />
          </button>

          <input 
            type="range" 
            min="1" 
            max="100" 
            value={scale} 
            onChange={(e) => onChangeScale(parseInt(e.target.value))}
            className="w-12 h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />

          <button 
            onClick={() => onChangeScale(Math.min(scale + 5, 100))}
            className="hover:text-white p-0.5 transition-colors"
          >
            <Plus size={8} />
          </button>

          <span className="w-5 text-right font-mono text-white">{scale}x</span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;