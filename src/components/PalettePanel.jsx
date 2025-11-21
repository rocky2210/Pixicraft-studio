import React, { useState, useRef } from 'react';
import { Plus, FolderOpen, Palette, Save, Upload, ChevronDown, ChevronRight } from 'lucide-react';
import Modal from './Modal.jsx';
import PaletteLibraryModal from './PaletteLibraryModal.jsx';
import { storageService } from '../services/storage.js';

const PalettePanel = ({ 
  colors, 
  selectedColor, 
  onSelectColor, 
  onUpdatePalette, 
  showToast, 
  isOpen, 
  onToggle 
}) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleAddColor = () => {
    onUpdatePalette([...colors, '#ffffff']);
    onSelectColor('#ffffff');
  };

  const handleColorChange = (index, newColor) => {
    const newColors = [...colors];
    newColors[index] = newColor;
    onUpdatePalette(newColors);
    onSelectColor(newColor);
  };

  const handleSavePalette = (e) => {
    e.stopPropagation();
    const name = prompt("Enter a name for this palette:");
    if (name) {
      storageService.saveCustomPalette(name, colors);
      showToast('Palette saved to library!', 'success');
    }
  };

  const handleImportClick = (e) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const parsePaletteFile = (content) => {
    const hexPattern = /#([0-9a-fA-F]{3}){1,2}\b|[0-9a-fA-F]{6}\b/g;
    const matches = content.match(hexPattern);
    if (matches) {
      return matches.map(c => c.startsWith('#') ? c : `#${c}`);
    }
    return [];
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (text) {
        const newColors = parsePaletteFile(text);
        if (newColors.length > 0) {
          const unique = Array.from(new Set(newColors));
          onUpdatePalette(unique);
          onSelectColor(unique[0]);

          const paletteName = file.name.replace(/\.[^/.]+$/, "");
          storageService.saveCustomPalette(paletteName, unique);
          showToast(`Imported & saved "${paletteName}"`, 'success');
        } else {
          showToast("No valid hex codes found in file.", 'error');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-xs border-t border-[#333]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".hex,.txt,.pal,.gpl"
      />

      {/* Header */}
      <div 
        className="flex justify-between items-center p-1.5 bg-[#252526] border-b border-[#333] cursor-pointer hover:bg-[#2a2a2b]" 
        onClick={onToggle}
      >
        <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Palette size={12} />
          <span className="text-[9px] tracking-wider font-bold">PALETTE</span>
        </div>

        {isOpen && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleImportClick}
              className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
              title="Import palette file"
            >
              <Upload size={10} />
            </button>
            <button
              onClick={handleSavePalette}
              className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
              title="Save current palette"
            >
              <Save size={10} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsLibraryOpen(true); }}
              className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white transition-colors"
              title="Open palette library"
            >
              <FolderOpen size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Active Color Preview */}
          <div className="px-2 py-1.5 flex items-center gap-2 border-b border-[#333] bg-[#202021] flex-none">
            <div
              className="w-6 h-6 rounded shadow-inner border border-white/20 relative overflow-hidden"
              style={{ backgroundColor: selectedColor }}
            >
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => {
                  const idx = colors.indexOf(selectedColor);
                  if (idx !== -1) handleColorChange(idx, e.target.value);
                  else onSelectColor(e.target.value);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] text-gray-400 font-medium uppercase leading-none mb-0.5">Active</span>
              <span className="text-[10px] font-mono text-indigo-300 uppercase leading-none">{selectedColor}</span>
            </div>
          </div>

          {/* Color Grid */}
          <div className="flex-1 overflow-y-auto p-1.5 custom-scrollbar">
            <div className="grid grid-cols-7 gap-0.5 content-start">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className={`
                    group relative w-full aspect-square rounded-[1px] cursor-pointer border transition-all duration-100
                    ${selectedColor === color 
                      ? 'border-white ring-1 ring-indigo-500 z-10 transform scale-110 shadow' 
                      : 'border-black/40 hover:border-gray-500'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  onClick={() => onSelectColor(color)}
                  title={color}
                >
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </div>
              ))}

              {/* Add Color Button */}
              <button
                onClick={handleAddColor}
                className="w-full aspect-square rounded-[1px] border border-[#444] border-dashed flex items-center justify-center text-gray-500 hover:bg-[#333] hover:text-gray-300 hover:border-gray-400 transition-colors"
                title="Add new color"
              >
                <Plus size={10} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Palette Library Modal */}
      {isLibraryOpen && (
        <Modal title="Palette Library" onClose={() => setIsLibraryOpen(false)}>
          <PaletteLibraryModal
            onSelect={(c) => {
              onUpdatePalette(c);
              onSelectColor(c[0]);
            }}
            onClose={() => setIsLibraryOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default PalettePanel;