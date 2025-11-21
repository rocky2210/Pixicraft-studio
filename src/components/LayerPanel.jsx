import React, { useState, useRef } from 'react';
import { 
  Eye, EyeOff, Plus, Trash2, Copy, Layers, Lock, Unlock, 
  Folder, FolderOpen, CheckSquare, Square, FolderInput, 
  FolderOutput, ArrowUp, ArrowDown, ChevronDown, ChevronRight 
} from 'lucide-react';
import { BLEND_MODES } from '../constants.js';
import LayerPreview from './LayerPreview.jsx';

const LayerPanel = ({ 
  layers, 
  activeLayerId, 
  onSelectLayer, 
  onUpdateLayers, 
  onMoveLayer, 
  width, 
  height, 
  isOpen, 
  onToggle 
}) => {
  const [editingId, setEditingId] = useState(null);
  const editInputRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // --- Recursive Helpers ---
  const findLayerAndParent = (list, id) => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { item: list[i], parent: list };
      if (list[i].children) {
        const res = findLayerAndParent(list[i].children, id);
        if (res) return res;
      }
    }
    return null;
  };

  const updateTree = (list, id, update) => {
    return list.map(l => {
      if (l.id === id) return { ...l, ...update };
      if (l.children) return { ...l, children: updateTree(l.children, id, update) };
      return l;
    });
  };

  const extractLayers = (list, ids) => {
    let kept = [];
    let removed = [];
    for (const l of list) {
      if (ids.has(l.id)) {
        removed.push(l);
      } else {
        if (l.children) {
          const res = extractLayers(l.children, ids);
          kept.push({ ...l, children: res.kept });
          removed.push(...res.removed);
        } else {
          kept.push(l);
        }
      }
    }
    return { kept, removed };
  };

  const getNextLayerName = (rootLayers) => {
    let maxNum = 0;
    const scan = (list) => {
      list.forEach(l => {
        const match = l.name.match(/^Layer (\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
        if (l.children) scan(l.children);
      });
    };
    scan(rootLayers);
    return `Layer ${maxNum + 1}`;
  };

  // --- Operations ---
  const addLayer = (e) => {
    e.stopPropagation();
    const name = getNextLayerName(layers);
    const newLayer = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'layer',
      name,
      visible: true,
      locked: false,
      blendMode: 'source-over',
      opacity: 1,
      pixels: {}
    };
    onUpdateLayers([newLayer, ...layers]);
    onSelectLayer(newLayer.id);
  };

  const toggleSelection = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const groupSelected = (e) => {
    e.stopPropagation();
    if (selectedIds.size === 0) return;
    const { kept, removed } = extractLayers(layers, selectedIds);
    if (removed.length === 0) return;

    const group = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'group',
      name: 'Group',
      visible: true,
      locked: false,
      blendMode: 'source-over',
      opacity: 1,
      expanded: true,
      pixels: {},
      children: removed
    };
    onUpdateLayers([group, ...kept]);
    setSelectedIds(new Set());
    onSelectLayer(group.id);
  };

  const ungroupSelected = (e) => {
    e.stopPropagation();
    const recurse = (list) => {
      let res = [];
      list.forEach(l => {
        if (selectedIds.has(l.id) && l.type === 'group') {
          if (l.children) res.push(...l.children);
        } else {
          const newItem = { ...l };
          if (newItem.children) newItem.children = recurse(newItem.children);
          res.push(newItem);
        }
      });
      return res;
    };
    onUpdateLayers(recurse(layers));
    setSelectedIds(new Set());
  };

  const deleteLayer = (id) => {
    const result = extractLayers(layers, new Set([id]));
    if (result.kept.length === 0) return;
    onUpdateLayers(result.kept);
  };

  const toggleVisibility = (id) => {
    const item = findLayerAndParent(layers, id)?.item;
    onUpdateLayers(updateTree(layers, id, { visible: !item?.visible }));
  };

  const toggleLock = (id) => {
    const item = findLayerAndParent(layers, id)?.item;
    onUpdateLayers(updateTree(layers, id, { locked: !item?.locked }));
  };

  const toggleExpand = (id) => {
    const item = findLayerAndParent(layers, id)?.item;
    if (item && item.type === 'group') {
      onUpdateLayers(updateTree(layers, id, { expanded: !item.expanded }));
    }
  };

  const duplicateLayer = (layer) => {
    const copy = JSON.parse(JSON.stringify(layer));
    copy.id = Math.random().toString(36).substr(2, 9);
    copy.name += " (Copy)";
    onUpdateLayers([copy, ...layers]);
  };

  const activeLayerData = findLayerAndParent(layers, activeLayerId)?.item;
  const hasGroupSelected = Array.from(selectedIds).some(id => {
    const res = findLayerAndParent(layers, id);
    return res && res.item.type === 'group';
  });

  const updateOpacity = (val) => {
    if (activeLayerId) onUpdateLayers(updateTree(layers, activeLayerId, { opacity: val }));
  };

  const updateBlendMode = (val) => {
    if (activeLayerId) onUpdateLayers(updateTree(layers, activeLayerId, { blendMode: val }));
  };

  const startEditing = (id) => {
    setEditingId(id);
    setTimeout(() => editInputRef.current?.focus(), 10);
  };

  const saveName = (id, newName) => {
    if (newName.trim()) {
      onUpdateLayers(updateTree(layers, id, { name: newName.trim() }));
    }
    setEditingId(null);
  };

  const renderLayerItem = (layer, depth = 0) => {
    const isSelected = selectedIds.has(layer.id);
    const isActive = activeLayerId === layer.id;
    const isGroup = layer.type === 'group';

    return (
      <React.Fragment key={layer.id}>
        <div
          onClick={() => onSelectLayer(layer.id)}
          className={`
            group flex items-center gap-1 p-1 rounded cursor-pointer border relative overflow-hidden transition-all
            ${isActive 
              ? 'bg-[#3a3a42] border-indigo-500/60' 
              : 'bg-[#252526] border-transparent hover:bg-[#2a2a2b] hover:border-[#444]'
            }
          `}
          style={{ marginLeft: `${depth * 8}px` }}
        >
          {depth > 0 && <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-[#333] -ml-1" />}

          <div 
            onClick={(e) => toggleSelection(layer.id, e)}
            className={`transition-colors p-0.5 rounded hover:bg-white/5 ${isSelected ? 'text-indigo-400' : 'text-gray-600 hover:text-gray-400'}`}
          >
            {isSelected ? <CheckSquare size={10} /> : <Square size={10} />}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }}
            className={`${layer.visible ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-400'} transition-colors p-0.5`}
          >
            {layer.visible ? <Eye size={10} /> : <EyeOff size={10} />}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); toggleLock(layer.id); }}
            className={`p-0.5 transition-colors ${layer.locked ? 'text-amber-500' : 'text-gray-600 hover:text-gray-300'}`}
          >
            {layer.locked ? <Lock size={9} /> : <Unlock size={9} />}
          </button>

          {isGroup ? (
            <button onClick={(e) => { e.stopPropagation(); toggleExpand(layer.id); }} className="text-indigo-300 hover:text-indigo-100">
              {layer.expanded ? <FolderOpen size={12} /> : <Folder size={12} />}
            </button>
          ) : (
            <div className="scale-75 origin-left">
              <LayerPreview layer={layer} width={width} height={height} />
            </div>
          )}

          <div className="flex-1 min-w-0" onDoubleClick={() => startEditing(layer.id)}>
            {editingId === layer.id ? (
              <input
                ref={editInputRef}
                type="text"
                defaultValue={layer.name}
                onBlur={(e) => saveName(layer.id, e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(layer.id, e.currentTarget.value); }}
                className="bg-black text-white text-[9px] px-1 py-0.5 rounded outline-none border border-indigo-500 w-full"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className={`truncate text-[10px] font-medium select-none block ${isActive ? 'text-gray-100' : 'text-gray-400'}`}>
                {layer.name}
              </span>
            )}
          </div>

          <div className="flex gap-0.5 items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); duplicateLayer(layer); }}
              className="p-1 hover:bg-[#333] rounded text-gray-500 hover:text-gray-300"
              title="Duplicate"
            >
              <Copy size={9} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
              className="p-1 hover:bg-red-900/30 rounded text-gray-500 hover:text-red-400"
              title="Delete"
            >
              <Trash2 size={9} />
            </button>
          </div>
        </div>

        {isGroup && layer.expanded && layer.children && (
          <div className="flex flex-col gap-0.5 mt-0.5">
            {layer.children.map(child => renderLayerItem(child, depth + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-xs select-none">
      {/* Header */}
      <div
        className="flex items-center justify-between p-1.5 bg-[#252526] border-b border-[#333] cursor-pointer hover:bg-[#2a2a2b]"
        onClick={onToggle}
      >
        <div className="flex items-center gap-1.5 text-gray-300 font-semibold">
          {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <Layers size={12} />
          <span className="text-[9px] tracking-wider font-bold">LAYERS</span>
        </div>

        {isOpen && (
          <div className="flex gap-0.5 items-center" onClick={e => e.stopPropagation()}>
            {activeLayerId && (
              <div className="flex gap-0.5 mr-1 border-r border-[#444] pr-1">
                <button onClick={() => onMoveLayer(activeLayerId, 'up')} className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white" title="Move Up">
                  <ArrowUp size={10} />
                </button>
                <button onClick={() => onMoveLayer(activeLayerId, 'down')} className="p-1 hover:bg-[#333] rounded text-gray-400 hover:text-white" title="Move Down">
                  <ArrowDown size={10} />
                </button>
              </div>
            )}

            {/* Group/Ungroup */}
            <div className="flex gap-0.5 mr-1 border-r border-[#444] pr-1">
              <button onClick={groupSelected} disabled={selectedIds.size === 0} className={`p-1 rounded transition-colors ${selectedIds.size > 0 ? 'hover:bg-[#333] text-gray-400 hover:text-white' : 'text-gray-700 cursor-default'}`} title="Group Selected">
                <FolderInput size={10} />
              </button>
              <button onClick={ungroupSelected} disabled={selectedIds.size === 0} className={`p-1 rounded transition-colors ${selectedIds.size > 0 ? 'hover:bg-[#333] text-gray-400 hover:text-white' : 'text-gray-700 cursor-default'}`} title="Ungroup Selected">
                <FolderOutput size={10} />
              </button>
            </div>

            <button
              onClick={addLayer}
              className="flex items-center gap-1 px-1.5 py-0.5 ml-0.5 bg-indigo-700 hover:bg-indigo-600 rounded text-white text-[9px] transition-colors"
              title="New Layer"
            >
              <Plus size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Active Layer Properties */}
          {activeLayerData && (
            <div className="px-2 py-1.5 border-b border-[#333] bg-[#202021] space-y-1.5 flex-none">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex flex-col flex-1">
                  <select
                    value={activeLayerData.blendMode || 'source-over'}
                    onChange={(e) => updateBlendMode(e.target.value)}
                    className="w-full bg-[#111] text-gray-300 text-[9px] border border-[#444] rounded px-1 py-0.5 outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                    {BLEND_MODES.map(mode => (
                      <option key={mode.value} value={mode.value}>{mode.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1 bg-[#111] border border-[#444] rounded px-1 py-0.5 w-12">
                  <input
                    type="number"
                    min="0" max="100"
                    value={Math.round(activeLayerData.opacity * 100)}
                    onChange={(e) => updateOpacity(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) / 100)}
                    className="w-full bg-transparent text-gray-300 text-[9px] outline-none text-center"
                  />
                  <span className="text-gray-500 text-[8px]">%</span>
                </div>
              </div>
              <input
                type="range"
                min="0" max="1" step="0.01"
                value={activeLayerData.opacity}
                onChange={(e) => updateOpacity(parseFloat(e.target.value))}
                className="w-full h-0.5 bg-[#333] rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          )}

          {/* Layer List */}
          <div className="flex-1 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
            {layers.map(l => renderLayerItem(l))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerPanel;