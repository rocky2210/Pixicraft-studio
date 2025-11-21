import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { PALETTE_PRESETS } from '../constants.js';
import { storageService } from '../services/storage.js';

const PaletteLibraryModal = ({ onSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState('presets');
  const [customPalettes, setCustomPalettes] = useState(storageService.getCustomPalettes());

  const handleDelete = (id) => {
    storageService.deleteCustomPalette(id);
    setCustomPalettes(storageService.getCustomPalettes());
  };

  const renderPaletteCard = (name, colors, onDelete) => (
    <div
      key={name}
      className="bg-[#2a2a2b] border border-[#444] rounded-lg p-3 cursor-pointer hover:border-indigo-500 transition-colors group relative"
      onClick={() => {
        onSelect(colors);
        onClose();
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-medium text-gray-200 text-sm">{name}</span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete palette"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-0.5">
        {colors.map((c, i) => (
          <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[500px]">
      {/* Tabs */}
      <div className="flex border-b border-[#444] mb-4">
        <button
          onClick={() => setActiveTab('presets')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'presets'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'custom'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          My Palettes
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-2 gap-3">
          {activeTab === 'presets' ? (
            PALETTE_PRESETS.map(p => renderPaletteCard(p.name, p.colors))
          ) : customPalettes.length > 0 ? (
            customPalettes.map(p => renderPaletteCard(p.name, p.colors, () => handleDelete(p.id)))
          ) : (
            <div className="col-span-2 text-center text-gray-500 mt-10 text-sm">
              No custom palettes saved yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaletteLibraryModal;