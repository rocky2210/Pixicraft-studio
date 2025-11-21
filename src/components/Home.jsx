import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, Clock } from 'lucide-react';
import { storageService } from '../../services/storage';

const Home = ({ onOpenProject, onNewProject, showToast }) => {
  const [projects, setProjects] = useState([]);

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

  return (
    <div className="flex-1 bg-[#181818] text-gray-200 p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
              Px
            </div>
            Pixel Studio
          </h1>
          <button
            onClick={onNewProject}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition-all"
          >
            <Plus size={20} /> New Project
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Quick Create Card */}
          <button
            onClick={onNewProject}
            className="aspect-square rounded-xl border-2 border-dashed border-neutral-700 hover:border-indigo-500 hover:bg-neutral-800/50 transition-all flex flex-col items-center justify-center text-neutral-500 hover:text-indigo-400 gap-3 group"
          >
            <div className="w-16 h-16 rounded-full bg-neutral-800 group-hover:bg-indigo-900/30 flex items-center justify-center transition-colors">
              <Plus size={32} />
            </div>
            <span className="font-medium">Create New</span>
          </button>

          {/* Project Cards */}
          {projects.map(project => (
            <div
              key={project.id}
              onClick={() => onOpenProject(project.id)}
              className="group relative aspect-square bg-[#252526] rounded-xl border border-[#333] hover:border-indigo-500/50 hover:shadow-xl transition-all cursor-pointer overflow-hidden flex flex-col"
            >
              {/* Thumbnail */}
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

                {/* Delete Button (hover) */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDelete(e, project.id)}
                    className="p-2 bg-black/60 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition-colors"
                    title="Delete project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Info Footer */}
              <div className="p-4 bg-[#2a2a2b] border-t border-[#333]">
                <h3 className="font-semibold text-gray-100 truncate mb-1">
                  {project.name}
                </h3>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{project.width}×{project.height}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(project.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="text-center mt-20 text-neutral-600">
            <p className="text-lg">No projects yet. Start creating!</p>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .pattern-grid {
          background-image: radial-gradient(#333 1px, transparent 1px);
          background-size: 10px 10px;
        }
        .image-pixelated {
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
      `}</style>
    </div>
  );
};

export default Home;