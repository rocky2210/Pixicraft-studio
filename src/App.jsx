import React, { useState, useCallback, useEffect } from 'react';
import { DEFAULT_WIDTH, DEFAULT_HEIGHT, DEFAULT_PALETTE, MAX_DIMENSION } from './constants.js';
import PixelCanvas from './components/PixelCanvas.jsx';
import Toolbar from './components/Toolbar.jsx';
import PalettePanel from './components/PalettePanel.jsx';
import TopBar from './components/TopBar.jsx';
import LayerPanel from './components/LayerPanel.jsx';
import FilterPanel from './components/FilterPanel.jsx';
import StatusBar from './components/StatusBar.jsx';
import AnimationPanel from './components/AnimationPanel.jsx';
import Modal from './components/Modal.jsx';
import Welcome from './components/Welcome.jsx';
import ProjectGallery from './components/ProjectGallery.jsx';
import Toast from './components/Toast.jsx';
import { storageService } from './services/storage.js';

const createLayer = (name, pixels = {}) => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'layer',
  name,
  visible: true,
  locked: false,
  blendMode: 'source-over',
  opacity: 1,
  pixels
});

const createFrame = (layers) => ({
  id: Math.random().toString(36).substr(2, 9),
  layers: JSON.parse(JSON.stringify(layers))
});

const findLayer = (layers, id) => {
  for (const l of layers) {
    if (l.id === id) return l;
    if (l.children) {
      const found = findLayer(l.children, id);
      if (found) return found;
    }
  }
  return null;
};

const flattenLayers = (layers, parentAlpha = 1, parentVisible = true) => {
  let flat = [];
  layers.forEach(l => {
    const effectiveAlpha = l.opacity * parentAlpha;
    const effectiveVisible = l.visible && parentVisible;

    if (l.type === 'group' && l.children) {
      flat.push(...flattenLayers(l.children, effectiveAlpha, effectiveVisible));
    } else if (l.type === 'layer') {
      flat.push({ ...l, opacity: effectiveAlpha, visible: effectiveVisible });
    }
  });
  return flat;
};

const replaceLayerPixelsInTree = (layers, id, newPixels) => {
  return layers.map(l => {
    if (l.id === id) return { ...l, pixels: newPixels };
    if (l.children) return { ...l, children: replaceLayerPixelsInTree(l.children, id, newPixels) };
    return l;
  });
};



const App = () => {
  const [view, setView] = useState('LANDING');

  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('Untitled Project');

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  const [scale, setScale] = useState(20);
  const [cursorPos, setCursorPos] = useState(null);

  const [frames, setFrames] = useState([createFrame([createLayer('Layer 1')])]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [fps, setFps] = useState(8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [onionSkin, setOnionSkin] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [onionSkinOpacity, setOnionSkinOpacity] = useState(0.3);

  const currentFrame = frames[currentFrameIndex] || frames[0];
  const rootLayers = currentFrame.layers;
  const visibleFlatLayers = flattenLayers(rootLayers);

  const [activeLayerId, setActiveLayerId] = useState(visibleFlatLayers[0]?.id || '');

  const [palette, setPalette] = useState(DEFAULT_PALETTE);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_PALETTE[0]);
  const [activeTool, setActiveTool] = useState('PENCIL');
  const [brushSize, setBrushSize] = useState(1);

  const [showGrid, setShowGrid] = useState(true);
  const [mirrorX, setMirrorX] = useState(false);
  const [mirrorY, setMirrorY] = useState(false);
  const [tileMode, setTileMode] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [fxOpen, setFxOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(true);

  const [selection, setSelection] = useState(null);
  const [floatingPixels, setFloatingPixels] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
  };

    useEffect(() => {
    // On app start – try to restore previous view
    const savedView = localStorage.getItem('px_last_view');
    if (savedView === 'EDITOR' || savedView === 'PROJECTS') {
      setView(savedView);
    }
  }, []);

  // Save view every time it changes
  useEffect(() => {
    localStorage.setItem('px_last_view', view);
  }, [view]);


  // Auto-select layer if active disappears
  useEffect(() => {
    const exists = findLayer(rootLayers, activeLayerId);
    if (!exists && visibleFlatLayers.length > 0) {
      setActiveLayerId(visibleFlatLayers[0].id);
    }
  }, [rootLayers, activeLayerId, visibleFlatLayers]);

  // Animation playback
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % frames.length);
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, fps, frames.length]);

  // History
  const addToHistory = useCallback((newFrames, newFrameIndex) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      const deepCopy = JSON.parse(JSON.stringify(newFrames));
      newHistory.push({ frames: deepCopy, currentFrameIndex: newFrameIndex });
      if (newHistory.length > 30) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 29));
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const step = history[newIndex];
      setFrames(JSON.parse(JSON.stringify(step.frames)));
      setCurrentFrameIndex(step.currentFrameIndex);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const step = history[newIndex];
      setFrames(JSON.parse(JSON.stringify(step.frames)));
      setCurrentFrameIndex(step.currentFrameIndex);
    }
  }, [historyIndex, history]);

  useEffect(() => {
    if (history.length === 0 && frames.length > 0) {
      addToHistory(frames, 0);
    }
  }, [projectId]);

  const handleUpdateLayers = (newLayers) => {
    const newFrames = [...frames];
    newFrames[currentFrameIndex] = { ...newFrames[currentFrameIndex], layers: newLayers };
    setFrames(newFrames);
    addToHistory(newFrames, currentFrameIndex);
  };

  const handleMoveLayer = (id, direction) => {
    const recursiveMove = (list) => {
      const index = list.findIndex(l => l.id === id);
      if (index !== -1) {
        const newList = [...list];
        if (direction === 'up' && index > 0) {
          [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
        } else if (direction === 'down' && index < list.length - 1) {
          [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
        }
        return newList;
      }
      return list.map(l => l.children ? { ...l, children: recursiveMove(l.children) } : l);
    };
    const newLayers = recursiveMove(rootLayers);
    handleUpdateLayers(newLayers);
  };

  const handleLayerPixelUpdate = (id, newPixels) => {
    const updatedRoot = replaceLayerPixelsInTree(rootLayers, id, newPixels);
    handleUpdateLayers(updatedRoot);
  };

  const handleFilterApply = (newPixels) => {
    if (selection) {
      const activeLayer = findLayer(rootLayers, activeLayerId);
      if (!activeLayer) return;
      const mergedPixels = { ...activeLayer.pixels };
      Object.keys(mergedPixels).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        if (x >= selection.x && x < selection.x + selection.w &&
            y >= selection.y && y < selection.y + selection.h) {
          delete mergedPixels[key];
        }
      });
      Object.entries(newPixels).forEach(([key, color]) => {
        const [x, y] = key.split(',').map(Number);
        if (x >= selection.x && x < selection.x + selection.w &&
            y >= selection.y && y < selection.y + selection.h) {
          mergedPixels[key] = color;
        }
      });
      const updatedRoot = replaceLayerPixelsInTree(rootLayers, activeLayerId, mergedPixels);
      handleUpdateLayers(updatedRoot);
    } else {
      const updatedRoot = replaceLayerPixelsInTree(rootLayers, activeLayerId, newPixels);
      handleUpdateLayers(updatedRoot);
    }
  };

  const handleSelectionTransform = (op) => {
    if (!selection) return;

    let pixelsToTransform = floatingPixels;
    if (!pixelsToTransform) {
      const activeLayer = findLayer(rootLayers, activeLayerId);
      if (!activeLayer) return;

      pixelsToTransform = {};
      const remainingLayerPixels = { ...activeLayer.pixels };
      let hasPixels = false;

      Object.entries(activeLayer.pixels).forEach(([key, color]) => {
        const [x, y] = key.split(',').map(Number);
        if (x >= selection.x && x < selection.x + selection.w &&
            y >= selection.y && y < selection.y + selection.h) {
          pixelsToTransform[key] = color;
          delete remainingLayerPixels[key];
          hasPixels = true;
        }
      });

      if (hasPixels) {
        handleLayerPixelUpdate(activeLayerId, remainingLayerPixels);
      } else return;
    }

    const newFloating = {};
    Object.entries(pixelsToTransform).forEach(([key, color]) => {
      const [x, y] = key.split(',').map(Number);
      let nx = x, ny = y;
      const rx = x - selection.x;
      const ry = y - selection.y;

      if (op === 'flipH') nx = selection.x + (selection.w - 1 - rx);
      if (op === 'flipV') ny = selection.y + (selection.h - 1 - ry);
      if (op === 'rotate') {
        nx = selection.x + (selection.h - 1 - ry);
        ny = selection.y + rx;
      }

      newFloating[`${nx},${ny}`] = color;
    });

    setFloatingPixels(newFloating);
    if (op === 'rotate') {
      setSelection({ ...selection, w: selection.h, h: selection.w });
    }
  };

  const handleDeselect = () => {
    if (floatingPixels && activeLayerId) {
      const activeLayer = findLayer(rootLayers, activeLayerId);
      if (activeLayer) {
        const newPixels = { ...activeLayer.pixels, ...floatingPixels };
        handleLayerPixelUpdate(activeLayerId, newPixels);
      }
    }
    setSelection(null);
    setFloatingPixels(null);
    setActiveTool('SELECT_RECT');
  };

  const createNewProject = (w, h) => {
    const cw = Math.min(Math.max(w, 4), MAX_DIMENSION);
    const ch = Math.min(Math.max(h, 4), MAX_DIMENSION);

    const newId = Math.random().toString(36).substr(2, 9);
    const initialLayer = createLayer('Layer 1');
    const initialFrame = createFrame([initialLayer]);

    setProjectId(newId);
    setProjectName('Untitled Project');
    setWidth(cw);
    setHeight(ch);
    setFrames([initialFrame]);
    setCurrentFrameIndex(0);
    setActiveLayerId(initialLayer.id);
    setPalette(DEFAULT_PALETTE);
    setHistory([{ frames: [initialFrame], currentFrameIndex: 0 }]);
    setHistoryIndex(0);
    setSelection(null);
    setFloatingPixels(null);

    setIsNewModalOpen(false);
    setView('EDITOR');
    showToast('New project created', 'success');
  };

  const handleLoadProject = (id) => {
    const project = storageService.getProject(id);
    if (project) {
      setProjectId(project.id);
      setProjectName(project.name);
      setWidth(project.width);
      setHeight(project.height);
      setFrames(project.frames || [createFrame([createLayer('Layer 1')])]);
      setPalette(project.palette || DEFAULT_PALETTE);
      setActiveLayerId('');
      setCurrentFrameIndex(0);
      setHistory([]);
      setHistoryIndex(-1);
      setSelection(null);
      setFloatingPixels(null);
      setView('EDITOR');
      showToast('Project loaded successfully', 'success');
    } else {
      showToast('Failed to load project', 'error');
    }
  };

  const handleSave = () => {
    if (floatingPixels && activeLayerId) {
      const activeLayer = findLayer(rootLayers, activeLayerId);
      if (activeLayer) {
        activeLayer.pixels = { ...activeLayer.pixels, ...floatingPixels };
        setFloatingPixels(null);
      }
    }

    const cvs = document.createElement('canvas');
    cvs.width = width;
    cvs.height = height;
    const ctx = cvs.getContext('2d');
    let thumbnail = '';
    const flat = flattenLayers(rootLayers);

    if (ctx) {
      for (let i = flat.length - 1; i >= 0; i--) {
        const layer = flat[i];
        if (!layer.visible) continue;
        ctx.globalAlpha = layer.opacity;
        Object.entries(layer.pixels).forEach(([key, color]) => {
          const [x, y] = key.split(',').map(Number);
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        });
      }
      thumbnail = cvs.toDataURL('image/png');
    }

    const project = {
      id: projectId,
      name: projectName,
      width,
      height,
      frames,
      palette,
      lastModified: Date.now(),
      thumbnail,
      fps
    };

    storageService.saveProject(project);
    showToast('Project saved!', 'success');
  };

  const handleExit = () => {
    handleSave();
    setView('PROJECTS');
  };

  const addFrame = () => {
    const newFrame = createFrame([createLayer('Layer 1')]);
    const newFrames = [...frames, newFrame];
    setFrames(newFrames);
    setCurrentFrameIndex(newFrames.length - 1);
    addToHistory(newFrames, newFrames.length - 1);
  };

  const duplicateFrame = () => {
    const current = frames[currentFrameIndex];
    const newFrame = {
      id: Math.random().toString(36).substr(2, 9),
      layers: JSON.parse(JSON.stringify(current.layers))
    };
    const newFrames = [...frames];
    newFrames.splice(currentFrameIndex + 1, 0, newFrame);
    setFrames(newFrames);
    setCurrentFrameIndex(currentFrameIndex + 1);
    addToHistory(newFrames, currentFrameIndex + 1);
  };

  const deleteFrame = () => {
    if (frames.length <= 1) return;
    const newFrames = frames.filter((_, i) => i !== currentFrameIndex);
    setFrames(newFrames);
    const newIndex = Math.max(0, currentFrameIndex - 1);
    setCurrentFrameIndex(newIndex);
    addToHistory(newFrames, newIndex);
  };

  const activeLayer = findLayer(rootLayers, activeLayerId);

  const renderView = () => {
    switch (view) {
      case 'LANDING':
        return <Welcome onNewProject={() => setIsNewModalOpen(true)} onOpenGallery={() => setView('PROJECTS')} />;
      case 'PROJECTS':
        return <ProjectGallery onOpenProject={handleLoadProject} onNewProject={() => setIsNewModalOpen(true)} onBack={() => setView('LANDING')} showToast={showToast} />;
      case 'EDITOR':
        return (
          <div className="h-screen w-screen bg-[#1e1e1e] text-gray-200 flex flex-col overflow-hidden font-sans">
            <TopBar
              projectName={projectName}
              onRename={setProjectName}
              width={width}
              height={height}
              onSave={handleSave}
              onBack={handleExit}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              layers={visibleFlatLayers}
              frames={frames}
              fps={fps}
              showGrid={showGrid}
              onToggleGrid={() => setShowGrid(!showGrid)}
              tileMode={tileMode}
              onToggleTileMode={() => setTileMode(!tileMode)}
              showToast={showToast}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              activeTool={activeTool}
              selection={selection}
              onTransformSelection={handleSelectionTransform}
              onDeselect={handleDeselect}
            />

            <div className="flex-1 flex overflow-hidden relative min-h-0">
              <div className="w-10 md:w-11 bg-[#252526] border-r border-[#333] flex flex-col items-center py-2 z-30 shadow-lg flex-shrink-0 overflow-visible">
                <Toolbar
                  activeTool={activeTool}
                  onSelectTool={setActiveTool}
                  mirrorX={mirrorX}
                  mirrorY={mirrorY}
                  onToggleMirrorX={() => setMirrorX(!mirrorX)}
                  onToggleMirrorY={() => setMirrorY(!mirrorY)}
                />
              </div>

              <div className="flex-1 bg-[#181818] relative overflow-hidden flex flex-col min-w-0 min-h-0">
                <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden min-h-0">
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `radial-gradient(#444 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />

                  <PixelCanvas
                    width={width}
                    height={height}
                    layers={visibleFlatLayers}
                    onionLayers={onionSkin && currentFrameIndex > 0 ? flattenLayers(frames[currentFrameIndex - 1].layers) : undefined}
                    onionSkinOpacity={onionSkinOpacity}
                    activeLayerId={activeLayerId}
                    onLayerChange={handleLayerPixelUpdate}
                    activeTool={activeTool}
                    selectedColor={selectedColor}
                    setSelectedColor={setSelectedColor}
                    showGrid={showGrid}
                    mirrorX={mirrorX}
                    mirrorY={mirrorY}
                    scale={scale}
                    setScale={setScale}
                    onHover={setCursorPos}
                    brushSize={brushSize}
                    tileMode={tileMode}
                    selection={selection}
                    setSelection={setSelection}
                    floatingPixels={floatingPixels}
                    setFloatingPixels={setFloatingPixels}
                  />
                </div>

                {showTimeline && (
                  <div className="animate-in slide-in-from-bottom-10 fade-in duration-300 shrink-0 z-20">
                    <AnimationPanel
                      frames={frames}
                      currentFrameIndex={currentFrameIndex}
                      onSelectFrame={setCurrentFrameIndex}
                      onAddFrame={addFrame}
                      onDuplicateFrame={duplicateFrame}
                      onDeleteFrame={deleteFrame}
                      isPlaying={isPlaying}
                      onTogglePlay={() => setIsPlaying(!isPlaying)}
                      fps={fps}
                      setFps={setFps}
                      onionSkin={onionSkin}
                      onionSkinOpacity={onionSkinOpacity}
                      setOnionSkinOpacity={setOnionSkinOpacity}
                      toggleOnionSkin={() => setOnionSkin(!onionSkin)}
                      width={width}
                      height={height}
                    />
                  </div>
                )}
              </div>

              <div className="w-48 lg:w-52 bg-[#252526] border-l border-[#333] flex flex-col z-40 shadow-xl overflow-hidden shrink-0">
                <div className={`${layersOpen ? 'flex-1 min-h-0' : 'shrink-0'} flex flex-col border-b border-[#333] transition-all duration-200`}>
                  <LayerPanel
                    layers={rootLayers}
                    activeLayerId={activeLayerId}
                    onSelectLayer={setActiveLayerId}
                    onUpdateLayers={handleUpdateLayers}
                    onMoveLayer={handleMoveLayer}
                    width={width}
                    height={height}
                    isOpen={layersOpen}
                    onToggle={() => setLayersOpen(!layersOpen)}
                  />
                </div>

                <div className="shrink-0 border-b border-[#333]">
                  <FilterPanel
                    isOpen={fxOpen}
                    onToggle={() => setFxOpen(!fxOpen)}
                    pixels={activeLayer ? activeLayer.pixels : {}}
                    activeLayerId={activeLayerId}
                    width={width}
                    height={height}
                    onApply={handleFilterApply}
                  />
                </div>

                <div className={`${paletteOpen ? 'h-40' : 'h-auto'} shrink-0 flex flex-col transition-all duration-200`}>
                  <PalettePanel
                    colors={palette}
                    selectedColor={selectedColor}
                    onSelectColor={setSelectedColor}
                    onUpdatePalette={setPalette}
                    showToast={showToast}
                    isOpen={paletteOpen}
                    onToggle={() => setPaletteOpen(!paletteOpen)}
                  />
                </div>
              </div>
            </div>

            <StatusBar
              scale={scale}
              onChangeScale={setScale}
              cursorPos={cursorPos}
              width={width}
              height={height}
              showTimeline={showTimeline}
              onToggleTimeline={() => setShowTimeline(!showTimeline)}
            />
          </div>
        );
    }
  };

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {renderView()}

      {isNewModalOpen && (
        <Modal title="New Project" onClose={() => setIsNewModalOpen(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Width</label>
                <input type="number" defaultValue={32} onChange={(e) => {}} className="w-full bg-[#1e1e1e] border border-[#444] rounded p-2 text-white focus:border-indigo-500 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Height</label>
                <input type="number" defaultValue={32} onChange={(e) => {}} className="w-full bg-[#1e1e1e] border border-[#444] rounded p-2 text-white focus:border-indigo-500 outline-none transition-colors" />
              </div>
            </div>
            <button
              onClick={() => {
                const w = parseInt(document.querySelector('input[type=number]:first-of-type').value) || 32;
                const h = parseInt(document.querySelector('input[type=number]:last-of-type').value) || 32;
                createNewProject(w, h);
              }}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-2.5 px-4 rounded transition-all shadow-lg shadow-indigo-900/20"
            >
              Create Canvas
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};

export default App;