import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, Clock, ChevronLeft, Search } from 'lucide-react';
import { storageService } from '../services/storage';

const ProjectGallery = ({ onOpenProject, onNewProject, onBack, showToast }) => {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setProjects(storageService.getAllProjects());
  }, []);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project?")) {
      storageService.deleteProject(id);
      setProjects(storageService.getAllProjects());
      showToast('Project deleted', 'info');
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#181818] text-gray-200 h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#252526] border-b border-[#333] px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[#333] rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">My Projects</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#1e1e1e] border border-[#444] rounded-full pl-9 pr-4 py-1.5 text-sm focus:border-indigo-500 outline-none w-64 transition-colors"
            />
          </div>

          <button
            onClick={onNewProject}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 text-sm shadow-lg shadow-indigo-900/20 transition-all"
          >
            <Plus size={18} /> New Project
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-32 text-neutral-600 gap-4">
              <div className="w-20 h-20 bg-[#252526] rounded-full flex items-center justify-center">
                <ImageIcon size={32} />
              </div>
              <p>No projects found. Create your first masterpiece!</p>
              <button onClick={onNewProject} className="text-indigo-400 hover:underline">
                Create New Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {/* New Project Card */}
              <button
                onClick={onNewProject}
                className="aspect-square rounded-xl border-2 border-dashed border-neutral-700 hover:border-indigo-500 hover:bg-neutral-800/50 transition-all flex flex-col items-center justify-center text-neutral-500 hover:text-indigo-400 gap-3 group"
              >
                <div className="w-14 h-14 rounded-full bg-neutral-800 group-hover:bg-indigo-900/30 flex items-center justify-center transition-colors">
                  <Plus size={28} />
                </div>
                <span className="font-medium text-sm">Create New</span>
              </button>

              {/* Project Cards */}
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  onClick={() => onOpenProject(project.id)}
                  className="group relative aspect-square bg-[#252526] rounded-xl border border-[#333] hover:border-indigo-500/50 hover:shadow-xl transition-all cursor-pointer overflow-hidden flex flex-col"
                >
                  <div className="flex-1 bg-[#1e1e1e] relative pattern-grid flex items-center justify-center overflow-hidden">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-contain p-4 image-pixelated"
                      />
                    ) : (
                      <ImageIcon className="text-neutral-700" size={48} />
                    )}

                    {/* Delete Button */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDelete(e, project.id)}
                        className="p-2 bg-black/60 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-[#2a2a2b] border-t border-[#333]">
                    <h3 className="font-semibold text-gray-100 truncate mb-1 text-sm">
                      {project.name}
                    </h3>
                    <div className="flex justify-between items-center text-[10px] text-gray-500">
                      <span className="bg-[#333] px-1.5 py-0.5 rounded">
                        {project.width}×{project.height}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(project.lastModified).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        .pattern-grid {
          background-image: radial-gradient(#333 1px, transparent 1px);
          background-size: 10px 10px;
        }
        .image-pixelated {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default ProjectGallery;