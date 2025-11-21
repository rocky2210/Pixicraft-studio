import React, { useState, useRef, useEffect } from 'react';
import { TOOL_ICONS } from '../constants';
import { FlipHorizontal, FlipVertical, ChevronRight } from 'lucide-react';

const Toolbar = ({ 
  activeTool, 
  onSelectTool, 
  mirrorX, 
  mirrorY, 
  onToggleMirrorX, 
  onToggleMirrorY 
}) => {
  const [showShapes, setShowShapes] = useState(false);
  const shapeRef = useRef(null);

  const isShape = (t) => [ 
    'LINE', 'RECTANGLE', 'CIRCLE' 
  ].includes(t);

  const currentShape = isShape(activeTool) ? activeTool : 'RECTANGLE';
  const ShapeIcon = TOOL_ICONS[currentShape];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shapeRef.current && !shapeRef.current.contains(event.target)) {
        setShowShapes(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderToolBtn = (type, title) => {
    const Icon = TOOL_ICONS[type];
    const isActive = activeTool === type;

    return (
      <button
        key={type}
        onClick={() => onSelectTool(type)}
        className={`p-1 rounded transition-all duration-200 group relative flex justify-center ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
            : 'text-gray-400 hover:bg-neutral-700 hover:text-white'
        }`}
        title={title}
      >
        <Icon size={16} />
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-1.5 w-full px-1 items-center">
      {/* Select Tools */}
      <div className="flex flex-col gap-0.5 pb-1.5 border-b border-[#333] w-full">
        <span className="text-[7px] text-gray-600 uppercase font-bold text-center mb-0.5">Select</span>
        {renderToolBtn('SELECT_RECT', "Rectangle Select")}
        {renderToolBtn('MOVE', "Move Canvas")}
      </div>

      {/* Draw Tools */}
      <div className="flex flex-col gap-0.5 py-1.5 w-full">
        <span className="text-[7px] text-gray-600 uppercase font-bold text-center mb-0.5">Draw</span>
        {renderToolBtn('PENCIL', "Pencil")}
        {renderToolBtn('BRUSH', "Brush")}
        {renderToolBtn('ERASER', "Eraser")}
        {renderToolBtn('FILL', "Fill Bucket")}
        {renderToolBtn('SPRAY', "Spray")}
      </div>

      {/* Eyedropper */}
      <div className="flex flex-col gap-0.5 pb-1.5 border-b border-[#333] w-full">
        {renderToolBtn('EYEDROPPER', "Eyedropper")}
      </div>

      {/* Shapes Dropdown */}
      <div className="relative w-full pt-1.5" ref={shapeRef}>
        <button
          onClick={() => {
            onSelectTool(currentShape);
            setShowShapes(!showShapes);
          }}
          className={`p-1 rounded transition-all duration-200 group relative flex justify-center w-full ${
            isShape(activeTool)
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
              : 'text-gray-400 hover:bg-neutral-700 hover:text-white'
          }`}
          title="Shapes"
        >
          <ShapeIcon size={16} />
          <div className="absolute bottom-0 right-0 opacity-50">
            <ChevronRight size={5} />
          </div>
        </button>

        {showShapes && (
          <div className="absolute left-full top-0 ml-2 bg-[#2a2a2b] border border-[#444] rounded shadow-xl p-1 flex flex-col gap-1 z-[100] w-max animate-in slide-in-from-left-2 fade-in duration-150">
            {['LINE', 'RECTANGLE', 'CIRCLE'].map(type => {
              const SIcon = TOOL_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => {
                    onSelectTool(type);
                    setShowShapes(false);
                  }}
                  className={`flex items-center gap-2 p-1.5 rounded hover:bg-indigo-600 hover:text-white transition-colors text-xs ${
                    activeTool === type ? 'bg-indigo-700 text-white' : 'text-gray-400'
                  }`}
                >
                  <SIcon size={14} />
                  <span className="font-medium">
                    {type === 'LINE' ? 'Line' : type.charAt(0) + type.slice(1).toLowerCase()}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Mirror Buttons */}
      <div className="h-px bg-neutral-700 my-1 w-full mt-auto"></div>
      
      <button
        onClick={onToggleMirrorX}
        className={`p-1 rounded transition-colors flex justify-center w-full ${
          mirrorX ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-neutral-700 hover:text-white'
        }`}
        title="Mirror Horizontal"
      >
        <FlipHorizontal size={16} />
      </button>

      <button
        onClick={onToggleMirrorY}
        className={`p-1 rounded transition-colors flex justify-center w-full ${
          mirrorY ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-neutral-700 hover:text-white'
        }`}
        title="Mirror Vertical"
      >
        <FlipVertical size={16} />
      </button>
    </div>
  );
};

export default Toolbar;