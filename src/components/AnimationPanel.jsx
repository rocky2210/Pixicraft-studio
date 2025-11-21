import React from 'react';
import { Play, Pause, Plus, Trash2, Copy, Layers as LayersIcon } from 'lucide-react';

const AnimationPanel = ({
  frames,
  currentFrameIndex,
  onSelectFrame,
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  isPlaying,
  onTogglePlay,
  fps,
  setFps,
  onionSkin,
  toggleOnionSkin,
  onionSkinOpacity, 
  setOnionSkinOpacity,
  width, 
  height 
}) => {
  // Mini canvas renderer for thumbnails
  const renderThumbnail = (frame, canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const thumbnailSize = 48;
    canvas.width = thumbnailSize;
    canvas.height = thumbnailSize;

    // Checkerboard background
    ctx.fillStyle = '#252526';
    ctx.fillRect(0, 0, thumbnailSize, thumbnailSize);
    ctx.fillStyle = '#333';
    const check = 4;
    for (let y = 0; y < thumbnailSize; y += check) {
      for (let x = 0; x < thumbnailSize; x += check) {
        if ((x / check + y / check) % 2 === 1) {
          ctx.fillRect(x, y, check, check);
        }
      }
    }

    // Scale and draw all visible layers
    const scale = Math.min(thumbnailSize / width, thumbnailSize / height) * 0.8;
    const offsetX = (thumbnailSize - width * scale) / 2;
    const offsetY = (thumbnailSize - height * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    frame.layers.forEach(layer => {
      if (!layer.visible) return;
      ctx.globalAlpha = layer.opacity;
      Object.entries(layer.pixels).forEach(([key, color]) => {
        const [x, y] = key.split(',').map(Number);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      });
    });
    ctx.restore();
  };

  return (
    <div className="h-24 md:h-32 bg-[#252526] border-t border-[#333] flex flex-col text-xs z-20 select-none shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
      {/* Controls Bar */}
      <div className="h-8 md:h-9 flex items-center px-2 border-b border-[#333] gap-2 bg-[#2d2d2e] overflow-x-auto scrollbar-hide">
        <button
          onClick={onTogglePlay}
          className={`p-1.5 rounded flex items-center gap-1 transition-all shrink-0 ${
            isPlaying 
              ? 'bg-amber-600 text-white hover:bg-amber-500' 
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          }`}
        >
          {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
          <span className="font-bold">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        <div className="h-5 w-px bg-[#444] mx-1 shrink-0" />

        <div className="flex items-center gap-2 bg-[#1e1e1e] px-2 py-1 rounded border border-[#444] shrink-0">
          <span className="text-[10px] font-bold text-gray-500">FPS</span>
          <input
            type="range"
            min="1" max="24"
            value={fps}
            onChange={(e) => setFps(parseInt(e.target.value))}
            className="w-12 md:w-16 h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="w-4 text-right text-indigo-400 font-mono">{fps}</span>
        </div>

        <button
          onClick={toggleOnionSkin}
          className={`ml-2 p-1.5 rounded flex items-center gap-1 transition-colors shrink-0 ${
            onionSkin ? 'bg-teal-700 text-white' : 'text-gray-400 hover:bg-[#333]'
          }`}
          title="Onion Skin"
        >
          <LayersIcon size={14} />
          <span className="hidden sm:inline">Onion Skin</span>
        </button>

        {onionSkin && (
          <div className="flex items-center gap-2 bg-[#1e1e1e] px-2 py-1 rounded border border-[#444] shrink-0">
            <span className="text-[9px] text-gray-500">Opacity</span>
            <input
              type="range"
              min="10"
              max="100"
              value={onionSkinOpacity * 100}  // we'll add this state
              onChange={(e) => setOnionSkinOpacity(e.target.value / 100)}
              className="w-16 h-1 accent-teal-500"
            />
            <span className="text-[9px] w-8 text-right text-teal-400">{Math.round(onionSkinOpacity * 100)}%</span>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onAddFrame} className="p-1.5 hover:bg-[#333] rounded text-gray-300" title="New Frame">
            <Plus size={16} />
          </button>
          <button onClick={onDuplicateFrame} className="p-1.5 hover:bg-[#333] rounded text-gray-300" title="Duplicate Frame">
            <Copy size={16} />
          </button>
          <button 
            onClick={onDeleteFrame} 
            disabled={frames.length <= 1}
            className={`p-1.5 rounded transition-colors ${
              frames.length <= 1 
                ? 'text-gray-600 cursor-not-allowed' 
                : 'text-gray-300 hover:text-red-400 hover:bg-red-900/30'
            }`} 
            title="Delete Frame"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Timeline with Thumbnails */}
      <div className="flex-1 overflow-x-auto custom-scrollbar p-2 flex gap-2 bg-[#1e1e1e]">
        {frames.map((frame, index) => (
          <div
            key={frame.id}
            onClick={() => onSelectFrame(index)}
            className={`
              relative w-20 md:w-24 h-full rounded-lg border-2 flex flex-col cursor-pointer transition-all group overflow-hidden
              ${currentFrameIndex === index
                ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-105 z-10'
                : 'border-[#333] hover:border-gray-500'
              }
            `}
            title={`Frame ${index + 1}`}
          >
            {/* Thumbnail Canvas */}
            <canvas
              ref={(canvas) => canvas && renderThumbnail(frame, canvas)}
              className="w-full h-full object-contain image-pixelated pointer-events-none"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Frame Number Badge */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-center py-0.5">
              <span className={`text-[9px] font-bold ${currentFrameIndex === index ? 'text-indigo-400' : 'text-gray-400'}`}>
                {index + 1}
              </span>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        ))}

        {/* Add Frame Button */}
        <button
          onClick={onAddFrame}
          className="w-20 md:w-24 h-full rounded-lg border-2 border-dashed border-[#444] flex items-center justify-center hover:border-indigo-500 hover:bg-[#252526]/50 text-gray-500 hover:text-indigo-400 transition-all"
          title="Add new frame"
        >
          <Plus size={28} />
        </button>
      </div>

      <style jsx>{`
        .image-pixelated { image-rendering: pixelated; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AnimationPanel;