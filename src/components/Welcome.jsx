import React from 'react';
import { Plus, FolderOpen, Github, Twitter, Layers, Palette, Wand2, Zap, Heart, Coffee } from 'lucide-react';

const Welcome = ({ onNewProject, onOpenGallery }) => {
  return (
    <div className="flex flex-col h-screen w-full bg-[#171717] text-white relative selection:bg-indigo-500/30">
      
      {/* Background Decoration - Fixed */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.15),transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
            backgroundSize: '40px 40px' 
          }}
        />
      </div>

      {/* Navbar - Fixed */}
      <nav className="fixed top-0 left-0 w-full z-50 px-8 py-4 flex justify-between items-center bg-[#171717]/90 backdrop-blur border-b border-[#333]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <span className="font-bold text-lg">Px</span>
          </div>
          <span className="text-lg font-bold tracking-tight">PixiCraft Studio</span>
        </div>
        <div className="flex gap-4 text-neutral-400">
          <a href="#" className="hover:text-white transition-colors"><Github size={20} /></a>
          <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
        </div>
      </nav>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <main className="relative z-10 flex flex-col items-center justify-start px-4 text-center max-w-5xl mx-auto w-full pt-32 pb-32">
          
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="px-3 py-1 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium uppercase tracking-wider mb-4 inline-block">
              v2.1 Professional Editor
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
              Pixel Art Made <br/> <span className="text-indigo-400">Professional.</span>
            </h1>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              A powerful, layer-based pixel art editor right in your browser. 
              Now with compact UI, improved workflow, and enhanced performance.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 mb-16">
            
            {/* New Project */}
            <button 
              onClick={onNewProject}
              className="group relative p-1 rounded-2xl bg-gradient-to-b from-neutral-700 to-neutral-800 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300"
            >
              <div className="bg-[#1e1e1e] rounded-xl p-8 h-full flex flex-col items-center gap-4 group-hover:bg-[#252526] transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800 group-hover:bg-indigo-500/20 flex items-center justify-center text-neutral-400 group-hover:text-indigo-400 transition-all group-hover:scale-110 duration-300">
                  <Plus size={32} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white mb-1">New Project</span>
                  <span className="text-sm text-neutral-500 group-hover:text-neutral-400">Start from a blank canvas</span>
                </div>
              </div>
            </button>

            {/* My Projects */}
            <button 
              onClick={onOpenGallery}
              className="group relative p-1 rounded-2xl bg-gradient-to-b from-neutral-700 to-neutral-800 hover:from-teal-600 hover:to-emerald-600 transition-all duration-300"
            >
              <div className="bg-[#1e1e1e] rounded-xl p-8 h-full flex flex-col items-center gap-4 group-hover:bg-[#252526] transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800 group-hover:bg-teal-500/20 flex items-center justify-center text-neutral-400 group-hover:text-teal-400 transition-all group-hover:scale-110 duration-300">
                  <FolderOpen size={32} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-white mb-1">My Projects</span>
                  <span className="text-sm text-neutral-500 group-hover:text-neutral-400">Manage your gallery</span>
                </div>
              </div>
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 w-full max-w-4xl border-t border-neutral-800 pt-10 pb-10">
            <div className="flex flex-col items-center gap-2">
              <Layers size={20} className="text-indigo-400" />
              <span className="text-sm font-medium">Multi-Layer</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Zap size={20} className="text-amber-400" />
              <span className="text-sm font-medium">Animation</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Palette size={20} className="text-pink-400" />
              <span className="text-sm font-medium">Palettes</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Wand2 size={20} className="text-teal-400" />
              <span className="text-sm font-medium">FX Filters</span>
            </div>
          </div>

          {/* About Section */}
          <div className="w-full max-w-4xl mt-10 mb-10 bg-[#1e1e1e] rounded-xl border border-[#333] p-8 text-left animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="text-red-500" size={24} />
              <h2 className="text-2xl font-bold text-white">About PixiCraft</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 text-neutral-400 leading-relaxed text-sm">
              <p>
                PixiCraft Studio is built for pixel art enthusiasts and game developers. 
                Whether you are creating sprites for your next indie game or just doodling, 
                we provide the tools you need in a clean, distraction-free environment.
              </p>
              <p>
                Everything runs locally in your browser. Your data is stored on your device using 
                IndexedDB/LocalStorage. We support exporting to PNG, GIF, and MP4 formats, 
                ensuring your art is ready for the world.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t border-[#333] flex items-center gap-2 text-xs text-neutral-500">
              <Coffee size={14} />
              <span>Designed with passion. No sign-up required.</span>
            </div>
          </div>

        </main>
      </div>

      {/* Footer - Fixed */}
      <footer className="fixed bottom-0 left-0 w-full z-50 py-3 text-center text-neutral-600 text-[10px] bg-[#171717]/90 backdrop-blur border-t border-[#222]">
        <p>© 2025 PixiCraft Studio. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Welcome;