import { Pencil, Eraser, PaintBucket, Pipette, Move, Minus, Square, Circle, SprayCan, MousePointer2, Brush } from 'lucide-react';

export const DEFAULT_WIDTH = 32;
export const DEFAULT_HEIGHT = 32;
export const MAX_DIMENSION = 128;

export const DEFAULT_PALETTE = [
  '#000000', '#1a1c2c', '#5d275d', '#b13e53', '#ef7d57',
  '#ffcd75', '#a7f070', '#38b764', '#257179', '#29366f',
  '#3b5dc9', '#41a6f6', '#73eff7', '#f4f4f4', '#94b0c2',
  '#566c86', '#333c57', '#ffffff', '#9badb7'
];

export const PALETTE_PRESETS = [
  {
    name: 'Pico-8',
    colors: ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA']
  },
  {
    name: 'Gameboy',
    colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
  },
  {
    name: 'CGA',
    colors: ['#000000', '#555555', '#FFFFFF', '#AA0000', '#FF5555', '#AA5500', '#FFFF55', '#00AA00', '#55FF55', '#00AAAA', '#55FFFF', '#0000AA', '#5555FF', '#AA00AA', '#FF55FF']
  },
  {
    name: 'Commodore 64',
    colors: ['#000000', '#FFFFFF', '#880000', '#AAFFEE', '#CC44CC', '#00CC55', '#0000AA', '#EEEE77', '#DD8855', '#664400', '#FF7777', '#333333', '#777777', '#AAFF66', '#0088FF', '#BBBBBB']
  }
];

export const TOOL_ICONS = {
  PENCIL: Pencil,
  BRUSH: Brush,
  ERASER: Eraser,
  FILL: PaintBucket,
  EYEDROPPER: Pipette,
  LINE: Minus,
  RECTANGLE: Square,
  CIRCLE: Circle,
  MOVE: Move,
  SPRAY: SprayCan,
  SELECT_RECT: MousePointer2,
};

export const BLEND_MODES = [
  { label: 'Normal', value: 'source-over' },
  { label: 'Multiply', value: 'multiply' },
  { label: 'Screen', value: 'screen' },
  { label: 'Overlay', value: 'overlay' },
  { label: 'Darken', value: 'darken' },
  { label: 'Lighten', value: 'lighten' },
  { label: 'Add', value: 'lighter' },
  { label: 'Difference', value: 'difference' },
];

export const PRESETS = [
  { name: '16x16 (Sprite)', w: 16, h: 16 },
  { name: '32x32 (Standard)', w: 32, h: 32 },
  { name: '64x64 (Scene)', w: 64, h: 64 },
  { name: '128x128 (Large)', w: 128, h: 128 },
];