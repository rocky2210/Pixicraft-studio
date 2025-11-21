import React, { useState, useRef, useEffect } from 'react';
import { Download, Undo, Redo, Grid, ChevronLeft, Save, Video, Clapperboard, FileImage, ChevronDown, LayoutGrid, FlipHorizontal, FlipVertical, RotateCw, X } from 'lucide-react';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

const TopBar = ({ 
  projectName, 
  onRename, 
  width, 
  height, 
  onSave, 
  onBack, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo, 
  layers, 
  frames, 
  fps, 
  showGrid, 
  onToggleGrid, 
  tileMode = false, 
  onToggleTileMode, 
  showToast, 
  brushSize, 
  setBrushSize, 
  activeTool, 
  selection, 
  onTransformSelection, 
  onDeselect 
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  const showSizeSlider = [
    'PENCIL', 'BRUSH', 'ERASER', 'SPRAY', 
    'LINE', 'RECTANGLE', 'CIRCLE'
  ].includes(activeTool);

  const flattenForExport = (rootLayers, parentAlpha = 1) => {
    let flat = [];
    rootLayers.forEach(l => {
      if (!l.visible) return;
      const alpha = l.opacity * parentAlpha;
      if (l.type === 'group' && l.children) {
        flat.push(...flattenForExport(l.children, alpha));
      } else if (l.type === 'layer') {
        flat.push({ ...l, opacity: alpha });
      }
    });
    return flat;
  };

  const drawFrameToCanvas = (ctx, frameLayers) => {
    ctx.clearRect(0, 0, width, height);
    const isTree = frameLayers.some(l => l.type === 'group');
    const flat = isTree ? flattenForExport(frameLayers) : frameLayers;

    for (let i = flat.length - 1; i >= 0; i--) {
      const layer = flat[i];
      ctx.globalAlpha = layer.opacity;
      Object.entries(layer.pixels).forEach(([key, color]) => {
        const [x, y] = key.split(',').map(Number);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      });
      ctx.globalAlpha = 1.0;
    }
  };

  const handleExportPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawFrameToCanvas(ctx, layers);

    const scale = 20;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width * scale;
    exportCanvas.height = height * scale;
    const exportCtx = exportCanvas.getContext('2d');
    if (exportCtx) {
      exportCtx.imageSmoothingEnabled = false;
      exportCtx.drawImage(canvas, 0, 0, width * scale, height * scale);

      const link = document.createElement('a');
      link.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
      showToast('Saved PNG successfully', 'success');
    }
    setShowExportMenu(false);
  };

  const handleExportGIF = async () => {
    showToast('Generating GIF...', 'info');
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const gif = GIFEncoder();
    const delay = Math.round(1000 / fps);

    frames.forEach(frame => {
      drawFrameToCanvas(ctx, frame.layers);
      const { data } = ctx.getImageData(0, 0, width, height);
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      gif.writeFrame(index, width, height, { palette, delay });
    });

    gif.finish();
    const buffer = gif.bytes();
    const blob = new Blob([buffer], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.gif`;
    link.href = url;
    link.click();
    showToast('Saved GIF successfully', 'success');
    setShowExportMenu(false);
  };

  const handleExportMP4 = async () => {
    showToast('Generating Video...', 'info');
    const scale = 10;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/mp4' });
    const chunks = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.mp4`;
      link.href = url;
      link.click();
      showToast('Saved MP4 successfully', 'success');
    };

    recorder.start();

    const drawAndCapture = async () => {
      for (const frame of frames) {
        const tempCvs = document.createElement('canvas');
        tempCvs.width = width;
        tempCvs.height = height;
        const tempCtx = tempCvs.getContext('2d');
        if (tempCtx) {
          drawFrameToCanvas(tempCtx, frame.layers);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#171717';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tempCvs, 0, 0, width * scale, height * scale);
        }
        await new Promise(r => setTimeout(r, 1000 / fps));
      }
      recorder.stop();
    };

    drawAndCapture();
    setShowExportMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="h-8 bg-[#252526] border-b border-[#333] flex items-center justify-between z-50 select-none text-xs shadow-md relative shrink-0">
      {/* Left & Center - Scrollable */}
      <div className="flex-1 flex items-center overflow-x-auto no-scrollbar px-2 md:px-3 min-w-0 h-full">
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <button onClick={onBack} className="p-1 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors flex items-center gap-1">
            <ChevronLeft size={14} />
            <span className="hidden md:inline font-medium text-[10px]">Home</span>
          </button>
          <div className="h-3 w-px bg-[#444]"></div>
          <input 
            type="text" 
            value={projectName} 
            onChange={(e) => onRename(e.target.value)} 
            className="bg-transparent text-gray-200 font-bold text-xs px-1 py-0.5 rounded hover:bg-[#333] focus:bg-[#111] focus:text-white outline-none w-24 md:w-32 lg:w-40 transition-colors" 
          />
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0 mx-4">
          {/* Selection Tools */}
          {selection && (
            <div className="flex items-center gap-0.5 bg-indigo-900/30 border border-indigo-500/30 rounded-md px-1 py-0.5 animate-in fade-in zoom-in duration-200 mr-2">
              <button onClick={() => onTransformSelection('flipH')} className="p-1 text-indigo-300 hover:bg-indigo-500/50 rounded" title="Flip Horizontal"><FlipHorizontal size={12} /></button>
              <button onClick={() => onTransformSelection('flipV')} className="p-1 text-indigo-300 hover:bg-indigo-500/50 rounded" title="Flip Vertical"><FlipVertical size={12} /></button>
              <button onClick={() => onTransformSelection('rotate')} className="p-1 text-indigo-300 hover:bg-indigo-500/50 rounded" title="Rotate 90°"><RotateCw size={12} /></button>
              <div className="w-px h-2 bg-indigo-500/30 mx-0.5"></div>
              <button onClick={onDeselect} className="p-1 text-red-300 hover:bg-red-900/50 rounded" title="Deselect"><X size={12} /></button>
            </div>
          )}

          {showSizeSlider && !selection && (
            <div className="flex items-center gap-1 bg-[#1e1e1e] rounded-md border border-[#333] px-1.5 py-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="hidden md:inline text-[8px] text-gray-500 font-bold uppercase mr-1">Size</span>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={brushSize} 
                onChange={(e) => setBrushSize(parseInt(e.target.value))} 
                className="w-10 md:w-12 h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
              <div className="w-3 h-3 flex items-center justify-center">
                <div className="rounded-full bg-white" style={{ width: Math.min(6, brushSize * 1.5), height: Math.min(6, brushSize * 1.5) }} />
              </div>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1 bg-[#1e1e1e] rounded-md border border-[#333] px-1.5 py-0.5">
            <span className="text-[8px] text-gray-500 font-bold uppercase mr-1">Canvas</span>
            <span className="text-gray-300 text-[9px]">{width} × {height}</span>
          </div>

          <div className="flex gap-0.5">
            <button onClick={onUndo} disabled={!canUndo} className={`p-1 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors ${!canUndo ? 'opacity-30 cursor-default' : ''}`} title="Undo (Ctrl+Z)">
              <Undo size={12} />
            </button>
            <button onClick={onRedo} disabled={!canRedo} className={`p-1 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors ${!canRedo ? 'opacity-30 cursor-default' : ''}`} title="Redo (Ctrl+Y)">
              <Redo size={12} />
            </button>
          </div>

          <button onClick={onToggleGrid} className={`p-1 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors ${showGrid ? 'bg-[#333] text-indigo-400' : ''}`} title="Toggle Grid">
            <Grid size={12} />
          </button>

          {onToggleTileMode && (
            <button onClick={onToggleTileMode} className={`p-1 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors ${tileMode ? 'bg-[#333] text-indigo-400' : ''}`} title="Toggle Tile Mode">
              <LayoutGrid size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Right Side - Save & Export */}
      <div className="shrink-0 flex items-center gap-1 px-2 md:px-3 bg-[#252526] relative h-full border-l border-[#333]">
        <button onClick={onSave} className="p-1 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors" title="Save Project">
          <Save size={14} />
        </button>

        <div className="relative" ref={exportMenuRef}>
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)} 
            className="flex items-center gap-1 bg-indigo-700 hover:bg-indigo-600 text-white text-[9px] px-2 py-1 rounded shadow-md transition-all hover:shadow-indigo-900/50 uppercase font-bold tracking-wide"
          >
            <Download size={10} /> 
            <span className="hidden md:inline">Export</span> 
            <ChevronDown size={8} />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-[#252526] border border-[#444] rounded shadow-xl overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-150">
              <button onClick={handleExportPNG} className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white text-gray-300 flex items-center gap-2 transition-colors text-[10px]">
                <FileImage size={12} /> Export PNG
              </button>
              <button onClick={handleExportGIF} className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white text-gray-300 flex items-center gap-2 transition-colors text-[10px]">
                <Clapperboard size={12} /> Export GIF
              </button>
              <button onClick={handleExportMP4} className="w-full text-left px-3 py-1.5 hover:bg-indigo-600 hover:text-white text-gray-300 flex items-center gap-2 transition-colors text-[10px]">
                <Video size={12} /> Export MP4
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default TopBar;