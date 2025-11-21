import React, { useRef, useEffect, useState } from 'react';

const PixelCanvas = ({
  width,
  height,
  layers,
  onionLayers,
  activeLayerId,
  onLayerChange,
  activeTool,
  selectedColor,
  setSelectedColor,
  showGrid,
  mirrorX,
  mirrorY,
  scale,
  setScale,
  onHover,
  brushSize,
  tileMode = false,
  selection,
  setSelection,
  floatingPixels,
  setFloatingPixels,
  onionSkinOpacity = 0.3,
}) => {
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);

  const [isMovingSelection, setIsMovingSelection] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const displayMult = tileMode ? 3 : 1;
  const canvasW = width * displayMult;
  const canvasH = height * displayMult;

  const render = () => {
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;

    const ctx = canvas.getContext('2d');
    const ctxOverlay = overlay.getContext('2d');
    if (!ctx || !ctxOverlay) return;

    if (canvas.width !== canvasW || canvas.height !== canvasH) {
      canvas.width = canvasW;
      canvas.height = canvasH;
    }

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvasW, canvasH);

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = '#333333';
    for (let y = 0; y < canvasH; y++) {
      for (let x = 0; x < canvasW; x++) {
        if ((x + y) % 2 === 1) ctx.fillRect(x, y, 1, 1);
      }
    }


    const offsets = tileMode ? [-1, 0, 1] : [0];

    const drawLayersAtOffset = (offX, offY) => {
      const dx = offX * width + (tileMode ? width : 0);
      const dy = offY * height + (tileMode ? height : 0);

      ctx.save();
      ctx.translate(dx, dy);

      if (onionLayers) {
        ctx.globalAlpha = onionSkinOpacity;
        for (let i = onionLayers.length - 1; i >= 0; i--) {
          const layer = onionLayers[i];
          if (!layer.visible) continue;
          Object.entries(layer.pixels).forEach(([key, color]) => {
            const [x, y] = key.split(',').map(Number);
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
          });
        }
        ctx.globalAlpha = 1.0;
      }

      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (!layer.visible) continue;

        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode || 'source-over';

        Object.entries(layer.pixels).forEach(([key, color]) => {
          const [x, y] = key.split(',').map(Number);
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        });

        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
      }

      if (floatingPixels && selection) {
        Object.entries(floatingPixels).forEach(([key, color]) => {
          let [lx, ly] = key.split(',').map(Number);
          if (isMovingSelection) {
            lx += dragOffset.x;
            ly += dragOffset.y;
          }
          ctx.fillStyle = color;
          ctx.fillRect(lx, ly, 1, 1);
        });
      }

      ctx.restore();
    };

    offsets.forEach(oy => {
      offsets.forEach(ox => {
        drawLayersAtOffset(ox, oy);
      });
    });

    if (isDragging && startPos && currentPos && !isMovingSelection) {
      if (![ 'SELECT_RECT', 'SPRAY', 'ERASER' ].includes(activeTool)) {
        const previewPixels = getShapePixels(activeTool, startPos.x, startPos.y, currentPos.x, currentPos.y, selectedColor, brushSize);

        const drawPreviewAtOffset = (offX, offY) => {
          const dx = offX * width + (tileMode ? width : 0);
          const dy = offY * height + (tileMode ? height : 0);
          ctx.save();
          ctx.translate(dx, dy);

          Object.entries(previewPixels).forEach(([key, color]) => {
            const [x, y] = key.split(',').map(Number);
            if (selection && !isInSelection(x, y)) return;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
            if (mirrorX) ctx.fillRect(width - 1 - x, y, 1, 1);
            if (mirrorY) ctx.fillRect(x, height - 1 - y, 1, 1);
            if (mirrorX && mirrorY) ctx.fillRect(width - 1 - x, height - 1 - y, 1, 1);
          });
          ctx.restore();
        };

        offsets.forEach(oy => offsets.forEach(ox => drawPreviewAtOffset(ox, oy)));
      }
    }

    const displayWidth = canvasW * scale;
    const displayHeight = canvasH * scale;

    if (overlay.width !== displayWidth || overlay.height !== displayHeight) {
      overlay.width = displayWidth;
      overlay.height = displayHeight;
    }
    ctxOverlay.clearRect(0, 0, displayWidth, displayHeight);

    if (showGrid && scale >= 4) {
      ctxOverlay.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctxOverlay.lineWidth = 1;
      ctxOverlay.beginPath();
      for (let x = 0; x <= canvasW; x++) {
        const px = Math.floor(x * scale) + 0.5;
        ctxOverlay.moveTo(px, 0);
        ctxOverlay.lineTo(px, displayHeight);
      }
      for (let y = 0; y <= canvasH; y++) {
        const py = Math.floor(y * scale) + 0.5;
        ctxOverlay.moveTo(0, py);
        ctxOverlay.lineTo(displayWidth, py);
      }
      ctxOverlay.stroke();
    }

    if (tileMode) {
      ctxOverlay.strokeStyle = 'rgba(100, 100, 255, 0.5)';
      ctxOverlay.lineWidth = 2;
      ctxOverlay.beginPath();
      ctxOverlay.moveTo(width * scale, 0); ctxOverlay.lineTo(width * scale, displayHeight);
      ctxOverlay.moveTo(width * 2 * scale, 0); ctxOverlay.lineTo(width * 2 * scale, displayHeight);
      ctxOverlay.moveTo(0, height * scale); ctxOverlay.lineTo(displayWidth, height * scale);
      ctxOverlay.moveTo(0, height * 2 * scale); ctxOverlay.lineTo(displayWidth, height * 2 * scale);
      ctxOverlay.stroke();
    }

    const drawMarquee = (x, y, w, h) => {
      const offsetX = tileMode ? width : 0;
      const offsetY = tileMode ? height : 0;
      const sx = (x + offsetX) * scale;
      const sy = (y + offsetY) * scale;
      const sw = w * scale;
      const sh = h * scale;

      ctxOverlay.lineWidth = 1;
      ctxOverlay.strokeStyle = '#fff';
      ctxOverlay.setLineDash([4, 4]);
      ctxOverlay.lineDashOffset = -Date.now() / 40;
      ctxOverlay.strokeRect(sx, sy, sw, sh);
      ctxOverlay.strokeStyle = '#000';
      ctxOverlay.lineDashOffset = (-Date.now() / 40) + 4;
      ctxOverlay.strokeRect(sx, sy, sw, sh);
      ctxOverlay.setLineDash([]);
    };

    if (selection) {
      const drawX = isMovingSelection ? selection.x + dragOffset.x : selection.x;
      const drawY = isMovingSelection ? selection.y + dragOffset.y : selection.y;
      drawMarquee(drawX, drawY, selection.w, selection.h);
    } else if (activeTool === 'SELECT_RECT' && isDragging && startPos && currentPos) {
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const w = Math.abs(currentPos.x - startPos.x) + 1;
      const h = Math.abs(currentPos.y - startPos.y) + 1;
      drawMarquee(x, y, w, h);
    }

    if (currentPos && ['BRUSH', 'ERASER', 'PENCIL'].includes(activeTool) && brushSize >= 1) {
      offsets.forEach(oy => {
        offsets.forEach(ox => {
          const dx = ox * width + (tileMode ? width : 0);
          const dy = oy * height + (tileMode ? height : 0);
          const bx = (Math.floor(currentPos.x) + dx) * scale;
          const by = (Math.floor(currentPos.y) + dy) * scale;
          const bSize = brushSize * scale;
          const offset = Math.floor(brushSize / 2) * scale;

          if (activeTool === 'ERASER') {
            ctxOverlay.strokeStyle = '#fff';
            ctxOverlay.lineWidth = 2;
            ctxOverlay.setLineDash([4, 4]);
            ctxOverlay.strokeRect(bx - offset, by - offset, bSize, bSize);
            ctxOverlay.strokeStyle = '#000';
            ctxOverlay.lineDashOffset = 4;
            ctxOverlay.strokeRect(bx - offset, by - offset, bSize, bSize);
            ctxOverlay.setLineDash([]);
          } else {
            ctxOverlay.strokeStyle = 'rgba(255,255,255,0.8)';
            ctxOverlay.lineWidth = 1;
            ctxOverlay.strokeRect(bx - offset, by - offset, bSize, bSize);
          }
        });
      });
    }
  };

  useEffect(() => {
    let id;
    const loop = () => {
      render();
      id = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(id);
  });

  const isInSelection = (x, y) => {
    if (!selection) return false;
    return x >= selection.x && x < selection.x + selection.w &&
           y >= selection.y && y < selection.y + selection.h;
  };

  const getShapePixels = (tool, x0, y0, x1, y1, color, size = 1) => {
    const temp = {};
    const plotPoint = (px, py) => {
      if (size > 1) {
        const offset = Math.floor(size / 2);
        for (let bx = -offset; bx < size - offset; bx++) {
          for (let by = -offset; by < size - offset; by++) {
            const nx = (px + bx + width * 1000) % width;
            const ny = (py + by + height * 1000) % height;
            temp[`${nx},${ny}`] = color;
          }
        }
      } else {
        const nx = (px + width * 1000) % width;
        const ny = (py + height * 1000) % height;
        temp[`${nx},${ny}`] = color;
      }
    };

    if (['LINE', 'PENCIL', 'BRUSH', 'ERASER'].includes(tool)) {
      let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
      let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
      let cx = x0, cy = y0;
      while (true) {
        plotPoint(cx, cy);
        if (cx === x1 && cy === y1) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; cx += sx; }
        if (e2 < dx) { err += dx; cy += sy; }
      }
    } else if (tool === 'RECTANGLE') {
      const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
      const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          plotPoint(x, y);
        }
      }
    } else if (tool === 'CIRCLE') {
      let xc = Math.floor((x0 + x1) / 2);
      let yc = Math.floor((y0 + y1) / 2);
      let r = Math.floor(Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)) / 2);
      let x = 0, y = r, d = 3 - 2 * r;
      const plot = (cx, cy, x, y) => {
        plotPoint(cx + x, cy + y); plotPoint(cx - x, cy + y);
        plotPoint(cx + x, cy - y); plotPoint(cx - x, cy - y);
        plotPoint(cx + y, cy + x); plotPoint(cx - y, cy + x);
        plotPoint(cx + y, cy - x); plotPoint(cx - y, cy - x);
      };
      while (y >= x) {
        plot(xc, yc, x, y);
        x++;
        if (d > 0) { y--; d = d + 4 * (x - y) + 10; }
        else d = d + 4 * x + 6;
      }
    }
    return temp;
  };

  const floodFill = (startX, startY, targetColor, currentPixels) => {
    if (selection && !isInSelection(startX, startY)) return currentPixels;

    const startKey = `${startX},${startY}`;
    const startColor = currentPixels[startKey];
    if (startColor === targetColor) return currentPixels;

    const newPixels = { ...currentPixels };
    const stack = [[startX, startY]];
    const visited = new Set();

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const key = `${x},${y}`;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (selection && !isInSelection(x, y)) continue;
      if (visited.has(key)) continue;

      const currentColor = newPixels[key];
      if (currentColor === startColor || (!currentColor && !startColor)) {
        newPixels[key] = targetColor;
        visited.add(key);
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
    }
    return newPixels;
  };

  const applyToLayer = (newPixels, mode = 'DRAW') => {
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked) return;

    const nextPixels = { ...activeLayer.pixels };
    Object.entries(newPixels).forEach(([key, color]) => {
      let [x, y] = key.split(',').map(Number);
      const applyPoint = (px, py) => {
        if (px < 0 || px >= width || py < 0 || py >= height) return;
        if (selection && !isInSelection(px, py)) return;
        const k = `${px},${py}`;
        if (mode === 'ERASE') delete nextPixels[k];
        else nextPixels[k] = color;
      };
      applyPoint(x, y);
      if (mirrorX) applyPoint(width - 1 - x, y);
      if (mirrorY) applyPoint(x, height - 1 - y);
      if (mirrorX && mirrorY) applyPoint(width - 1 - x, height - 1 - y);
    });
    onLayerChange(activeLayerId, nextPixels);
  };

  const applySpray = (cx, cy) => {
    const radius = brushSize + 2;
    const density = brushSize * 3;
    const sprayPixels = {};
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const px = Math.floor(cx + r * Math.cos(angle));
      const py = Math.floor(cy + r * Math.sin(angle));
      const nx = (px + width * 1000) % width;
      const ny = (py + height * 1000) % height;
      sprayPixels[`${nx},${ny}`] = selectedColor;
    }
    applyToLayer(sprayPixels, 'DRAW');
  };

  const getCoords = (e) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const visualX = Math.floor((e.clientX - rect.left) / scale);
    const visualY = Math.floor((e.clientY - rect.top) / scale);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    if (visualX < 0 || visualX >= canvasW || visualY < 0 || visualY >= canvasH) return null;

    let x = visualX;
    let y = visualY;
    if (tileMode) {
      x = visualX % width;
      y = visualY % height;
      if (x < 0) x += width;
      if (y < 0) y += height;
    }
    return { x, y };
  };

  const unroll = (curr, start, size) => {
    if (!tileMode) return curr;
    const diff = curr - start;
    if (diff > size / 2) return curr - size;
    if (diff < -size / 2) return curr + size;
    return curr;
  };

  const handleMouseDown = (e) => {
    if (activeTool === 'MOVE' || e.button === 1 || e.altKey) {
      setIsPanning(true);
      return;
    }

    const coords = getCoords(e);
    if (!coords) {
      if (activeTool === 'SELECT_RECT') setSelection(null);
      return;
    }

    if (activeTool === 'EYEDROPPER') {
      for (let i = 0; i < layers.length; i++) {
        if (!layers[i].visible) continue;
        const c = layers[i].pixels[`${coords.x},${coords.y}`];
        if (c) {
          setSelectedColor(c);
          return;
        }
      }
      return;
    }

    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || !activeLayer.visible || activeLayer.locked) return;

    if (activeTool === 'SELECT_RECT') {
      if (selection && isInSelection(coords.x, coords.y)) {
        setIsMovingSelection(true);
        setDragOffset({ x: 0, y: 0 });
        setStartPos(coords);
        setCurrentPos(coords);
        setIsDragging(true);

        if (!floatingPixels) {
          const liftedPixels = {};
          const newLayerPixels = { ...activeLayer.pixels };
          Object.entries(activeLayer.pixels).forEach(([key, color]) => {
            const [x, y] = key.split(',').map(Number);
            if (isInSelection(x, y)) {
              liftedPixels[key] = color;
              delete newLayerPixels[key];
            }
          });
          setFloatingPixels(liftedPixels);
          onLayerChange(activeLayerId, newLayerPixels);
        }
        return;
      } else {
        if (floatingPixels) {
          const newPixels = { ...activeLayer.pixels, ...floatingPixels };
          onLayerChange(activeLayerId, newPixels);
          setFloatingPixels(null);
        }
        setSelection(null);
        setIsDragging(true);
        setStartPos(coords);
        setCurrentPos(coords);
        return;
      }
    }

    setIsDragging(true);
    setStartPos(coords);
    setCurrentPos(coords);

    if (activeTool === 'FILL') {
      const newPixels = floodFill(coords.x, coords.y, selectedColor, activeLayer.pixels);
      onLayerChange(activeLayerId, { ...activeLayer.pixels, ...newPixels });
      setIsDragging(false);
    } else if (['PENCIL', 'ERASER', 'BRUSH'].includes(activeTool)) {
      const pixels = getShapePixels(activeTool, coords.x, coords.y, coords.x, coords.y, selectedColor, brushSize);
      applyToLayer(pixels, activeTool === 'ERASER' ? 'ERASE' : 'DRAW');
    } else if (activeTool === 'SPRAY') {
      applySpray(coords.x, coords.y);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
      return;
    }

    const coords = getCoords(e);
    if (coords) {
      onHover(coords);
      let effectiveCoords = coords;
      if (isDragging && startPos && tileMode) {
        effectiveCoords = {
          x: unroll(coords.x, startPos.x, width),
          y: unroll(coords.y, startPos.y, height)
        };
      }
      setCurrentPos(effectiveCoords);
    }

    if (!isDragging || !startPos || !coords) return;

    if (isMovingSelection && activeTool === 'SELECT_RECT') {
      setDragOffset({
        x: coords.x - startPos.x,
        y: coords.y - startPos.y
      });
      return;
    }

    if (activeTool === 'SELECT_RECT') return;

    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || activeLayer.locked) return;

    if (['PENCIL', 'ERASER', 'BRUSH'].includes(activeTool)) {
      let tx = coords.x, ty = coords.y;
      if (tileMode) {
        tx = unroll(coords.x, startPos.x, width);
        ty = unroll(coords.y, startPos.y, height);
      }
      const stroke = getShapePixels(activeTool, startPos.x, startPos.y, tx, ty, selectedColor, brushSize);
      applyToLayer(stroke, activeTool === 'ERASER' ? 'ERASE' : 'DRAW');
      setStartPos(coords);
    } else if (activeTool === 'SPRAY') {
      applySpray(coords.x, coords.y);
    }
  };

  const handleMouseUp = () => {
    if (isDragging && startPos && currentPos) {
      const activeLayer = layers.find(l => l.id === activeLayerId);
      if (activeLayer && !activeLayer.locked) {
        if (isMovingSelection && activeTool === 'SELECT_RECT' && selection) {
          if (floatingPixels) {
            const movedPixels = {};
            Object.entries(floatingPixels).forEach(([key, color]) => {
              const [lx, ly] = key.split(',').map(Number);
              const nx = lx + dragOffset.x;
              const ny = ly + dragOffset.y;
              movedPixels[`${nx},${ny}`] = color;
            });
            setFloatingPixels(movedPixels);
          }

          setSelection({
            ...selection,
            x: selection.x + dragOffset.x,
            y: selection.y + dragOffset.y
          });

          setIsMovingSelection(false);
          setDragOffset({ x: 0, y: 0 });
        } else if (activeTool === 'SELECT_RECT') {
          const x = Math.min(startPos.x, currentPos.x);
          const y = Math.min(startPos.y, currentPos.y);
          const w = Math.abs(currentPos.x - startPos.x) + 1;
          const h = Math.abs(currentPos.y - startPos.y) + 1;
          setSelection({ x, y, w, h });
        } else if (['LINE', 'RECTANGLE', 'CIRCLE'].includes(activeTool)) {
          const shapePixels = getShapePixels(activeTool, startPos.x, startPos.y, currentPos.x, currentPos.y, selectedColor, brushSize);
          applyToLayer(shapePixels, 'DRAW');
        }
      }
    }
    setIsDragging(false);
    setIsPanning(false);
    setStartPos(null);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -Math.sign(e.deltaY) * 2;
      setScale(Math.min(Math.max(scale + delta, 1), 100));
    }
  };

  return (

    
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden cursor-crosshair touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { handleMouseUp(); onHover(null); }}
      // onWheel={handleWheel}

      onTouchStart={(e) => { e.preventDefault(); handleMouseDown(e.touches[0]); }}
      onTouchMove={(e) => { e.preventDefault(); handleMouseMove(e.touches[0]); }}
      onTouchEnd={(e) => { e.preventDefault(); handleMouseUp(); }}
      onTouchCancel={(e) => { e.preventDefault(); handleMouseUp(); }}
      onWheel={handleWheel}

    >
      <div style={{
        transform: `translate(${pan.x}px, ${pan.y}px)`,
        transition: isPanning ? 'none' : 'transform 0.1s ease-out'
      }}>
        <div className="shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-neutral-800 relative" style={{ width: canvasW * scale, height: canvasH * scale }}>
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            style={{ width: '100%', height: '100%', imageRendering: 'pixelated', display: 'block' }}
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>

      {activeTool === 'SELECT_RECT' && selection && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full pointer-events-none z-50 shadow-lg animate-in fade-in slide-in-from-top-2">
          {isMovingSelection ? 'Move Selection' : 'Drag inside to move, click outside to clear'}
        </div>
      )}
    </div>

    
  );
};

export default PixelCanvas;