import React, { useState, useEffect, useRef } from 'react';
import { Wand2, ChevronDown, ChevronRight, RefreshCcw } from 'lucide-react';

const FilterPanel = ({ 
  isOpen, 
  onToggle, 
  pixels, 
  activeLayerId, 
  width, 
  height, 
  onApply 
}) => {
  const [tab, setTab] = useState('adjust');
  const [basePixels, setBasePixels] = useState({});
  const [restorePoint, setRestorePoint] = useState({});
  const isInternalChange = useRef(false);

  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);

  // Helper functions
  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  };

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const clamp = (n) => Math.min(255, Math.max(0, Math.floor(n)));

  useEffect(() => {
    setBasePixels({ ...pixels });
    setRestorePoint({ ...pixels });
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    isInternalChange.current = false;
  }, [activeLayerId]);

  useEffect(() => {
    if (!isInternalChange.current) {
      setBasePixels({ ...pixels });
      setRestorePoint({ ...pixels });
      setBrightness(0);
      setContrast(0);
      setSaturation(0);
    } else {
      isInternalChange.current = false;
    }
  }, [pixels]);

  const applyChange = (newPixels, updateBase = true) => {
    isInternalChange.current = true;
    onApply(newPixels);
    if (updateBase) {
      setBasePixels(newPixels);
    }
  };

  const calculateAdjustment = (startPixels, bVal, cVal, sVal) => {
    const newPixels = {};
    Object.entries(startPixels).forEach(([key, hex]) => {
      let { r, g, b } = hexToRgb(hex);
      
      // Brightness
      r += bVal; g += bVal; b += bVal;

      // Contrast
      if (cVal !== 0) {
        const factor = (259 * (cVal + 255)) / (255 * (259 - cVal));
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;
      }

      // Saturation
      if (sVal !== 0) {
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = gray * (1 - sVal / 100) + r * (sVal / 100);
        g = gray * (1 - sVal / 100) + g * (sVal / 100);
        b = gray * (1 - sVal / 100) + b * (sVal / 100);
      }

      newPixels[key] = rgbToHex(clamp(r), clamp(g), clamp(b));
    });
    return newPixels;
  };

  const updateSliders = (b, c, s) => {
    const result = calculateAdjustment(basePixels, b, c, s);
    applyChange(result, false);
  };

  const handleSliderChange = (type, val) => {
    let newB = brightness;
    let newC = contrast;
    let newS = saturation;

    if (type === 'brightness') { setBrightness(val); newB = val; }
    if (type === 'contrast') { setContrast(val); newC = val; }
    if (type === 'saturation') { setSaturation(val); newS = val; }

    updateSliders(newB, newC, newS);
  };

  const handleReset = (e) => {
    e.stopPropagation();
    applyChange(restorePoint, true);
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
  };

  const bakeEffect = (effectFn) => {
    const currentLook = calculateAdjustment(basePixels, brightness, contrast, saturation);
    const newPixels = effectFn(currentLook);
    applyChange(newPixels, true);
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
  };

  const getPixelProcessor = (type) => {
    return (px) => {
      const newPixels = {};
      Object.entries(px).forEach(([key, hex]) => {
        let { r, g, b } = hexToRgb(hex);
        if (type === 'invert') {
          r = 255 - r; g = 255 - g; b = 255 - b;
        } else if (type === 'grayscale') {
          const avg = (r + g + b) / 3;
          r = avg; g = avg; b = avg;
        } else if (type === 'sepia') {
          r = 0.393 * r + 0.769 * g + 0.189 * b;
          g = 0.349 * r + 0.686 * g + 0.168 * b;
          b = 0.272 * r + 0.534 * g + 0.131 * b;
        }
        newPixels[key] = rgbToHex(clamp(r), clamp(g), clamp(b));
      });
      return newPixels;
    };
  };

  const applyDither = () => {
    bakeEffect((px) => {
      const newPixels = { ...px };
      Object.keys(newPixels).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        if ((x + y) % 2 === 1) {
          delete newPixels[key];
        }
      });
      return newPixels;
    });
  };

  const applyOutline = () => {
    bakeEffect((px) => {
      const newPixels = { ...px };
      const offsets = [[0,1], [0,-1], [1,0], [-1,0]];
      Object.keys(px).forEach(key => {
        const [x, y] = key.split(',').map(Number);
        offsets.forEach(([ox, oy]) => {
          const nx = x + ox, ny = y + oy;
          const nKey = `${nx},${ny}`;
          if (!px[nKey] && nx >= 0 && nx < width && ny >= 0 && ny < height) {
            newPixels[nKey] = '#000000';
          }
        });
      });
      return newPixels;
    });
  };

  const applyBlur = () => {
    bakeEffect((px) => {
      const newPixels = {};
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let rSum = 0, gSum = 0, bSum = 0, count = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const key = `${nx},${ny}`;
                if (px[key]) {
                  const { r, g, b } = hexToRgb(px[key]);
                  rSum += r; gSum += g; bSum += b;
                  count++;
                }
              }
            }
          }
          if (count > 0) {
            newPixels[`${x},${y}`] = rgbToHex(
              Math.floor(rSum / count),
              Math.floor(gSum / count),
              Math.floor(bSum / count)
            );
          }
        }
      }
      return newPixels;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-xs select-none border-b border-[#333]">
      {/* Header */}
      <div
        onClick={onToggle}
        className="flex items-center justify-between p-2 bg-[#252526] cursor-pointer hover:bg-[#2a2a2b] transition-colors"
      >
        <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Wand2 size={14} />
          <span className="text-[10px] tracking-wider font-bold">FILTERS</span>
        </div>

        {isOpen && (
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleReset}
              className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
              title="Reset all filters"
            >
              <RefreshCcw size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex-1 flex flex-col min-h-0 p-2 space-y-3 overflow-y-auto custom-scrollbar">
          {/* Tabs */}
          <div className="flex border-b border-[#444]">
            {['adjust', 'effect', 'pixel', 'edge'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1 text-[9px] uppercase font-bold text-center transition-colors ${
                  tab === t
                    ? 'text-indigo-400 border-b-2 border-indigo-400'
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            {tab === 'adjust' && (
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>Brightness</span>
                    <span>{brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-100" max="100"
                    value={brightness}
                    onChange={(e) => handleSliderChange('brightness', Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-[#333] rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>Contrast</span>
                    <span>{contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-100" max="100"
                    value={contrast}
                    onChange={(e) => handleSliderChange('contrast', Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-[#333] rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="flex justify-between text-[9px] text-gray-400">
                    <span>Saturation</span>
                    <span>{saturation}</span>
                  </div>
                  <input
                    type="range"
                    min="-100" max="100"
                    value={saturation}
                    onChange={(e) => handleSliderChange('saturation', Number(e.target.value))}
                    className="w-full accent-indigo-500 h-1 bg-[#333] rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

            {tab === 'effect' && (
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => bakeEffect(getPixelProcessor('invert'))} className="bg-[#333] p-1.5 rounded hover:bg-[#444] text-[10px] text-gray-300">Invert</button>
                <button onClick={() => bakeEffect(getPixelProcessor('grayscale'))} className="bg-[#333] p-1.5 rounded hover:bg-[#444] text-[10px] text-gray-300">Grayscale</button>
                <button onClick={() => bakeEffect(getPixelProcessor('sepia'))} className="bg-[#333] p-1.5 rounded hover:bg-[#444] text-[10px] text-gray-300">Sepia</button>
                <button onClick={applyBlur} className="bg-[#333] p-1.5 rounded hover:bg-[#444] text-[10px] text-gray-300">Box Blur</button>
              </div>
            )}

            {tab === 'pixel' && (
              <div className="grid grid-cols-1 gap-1.5">
                <button onClick={applyDither} className="bg-[#333] p-1.5 rounded hover:bg-[#444] text-[10px] text-gray-300 text-left px-2">Checkerboard Dither</button>
              </div>
            )}

            {tab === 'edge' && (
              <div className="grid grid-cols-1 gap-1.5">
                <button onClick={applyOutline} className="bg-[#333] p-1.5 rounded hover:bg-[#444] text-[10px] text-gray-300 text-left px-2">Add 1px Outline</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;