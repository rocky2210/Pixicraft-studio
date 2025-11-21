// src/services/storage.js
import { PALETTE_PRESETS } from "@/constants";
const PROJECT_PREFIX = 'px_proj_';
const METADATA_KEY = 'px_projects_meta';
const PALETTES_KEY = 'px_custom_palettes';

export const storageService = {
  // --- Projects ---
  getAllProjects: () => {
    try {
      const raw = localStorage.getItem(METADATA_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load project list', e);
      return [];
    }
  },

  getProject: (id) => {
    try {
      const raw = localStorage.getItem(PROJECT_PREFIX + id);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to load project', e);
      return null;
    }
  },

  saveProject: (project) => {
    try {
      // Save full project data
      localStorage.setItem(PROJECT_PREFIX + project.id, JSON.stringify(project));

      // Update metadata index
      const projects = storageService.getAllProjects();
      const meta = {
        id: project.id,
        name: project.name,
        width: project.width,
        height: project.height,
        lastModified: Date.now(),
        thumbnail: project.thumbnail || null,
        fps: project.fps
      };

      const existingIdx = projects.findIndex(p => p.id === project.id);
      if (existingIdx >= 0) {
        projects[existingIdx] = meta;
      } else {
        projects.unshift(meta); // newest first
      }

      localStorage.setItem(METADATA_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save project', e);
      alert('Save failed — your browser storage might be full.');
    }
  },

  deleteProject: (id) => {
    try {
      localStorage.removeItem(PROJECT_PREFIX + id);
      const updated = storageService.getAllProjects().filter(p => p.id !== id);
      localStorage.setItem(METADATA_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete project', e);
    }
  },

  // --- Custom Palettes ---
  getCustomPalettes: () => {
    try {
      const raw = localStorage.getItem(PALETTES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to load palettes', e);
      return [];
    }
  },

  saveCustomPalette: (name, colors) => {
    try {
      const palettes = storageService.getCustomPalettes();
      const newPalette = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        colors
      };
      palettes.push(newPalette);
      localStorage.setItem(PALETTES_KEY, JSON.stringify(palettes));
    } catch (e) {
      console.error('Failed to save palette', e);
    }
  },

  deleteCustomPalette: (id) => {
    try {
      const updated = storageService.getCustomPalettes().filter(p => p.id !== id);
      localStorage.setItem(PALETTES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete palette', e);
    }
  }
};