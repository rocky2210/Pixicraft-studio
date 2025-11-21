import React, { useEffect, useRef } from 'react';

const LayerPreview = ({ layer, width, height }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Checkerboard background for transparency
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#444';
    const checkSize = Math.max(1, Math.floor(width / 8));
    for (let y = 0; y < height; y += checkSize) {
      for (let x = 0; x < width; x += checkSize) {
        if (((x / checkSize) + (y / checkSize)) % 2 === 0) {
          ctx.fillRect(x, y, checkSize, checkSize);
        }
      }
    }

    // Draw actual pixels
    Object.entries(layer.pixels).forEach(([key, color]) => {
      const [x, y] = key.split(',').map(Number);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    });
  }, [layer, width, height]);

  return (
    <div className="w-8 h-8 bg-black border border-neutral-700 rounded overflow-hidden shrink-0">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full object-contain image-pixelated"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};

export default LayerPreview;