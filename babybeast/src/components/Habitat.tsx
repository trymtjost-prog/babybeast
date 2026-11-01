import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

type Ambient = 'flies' | 'drip' | 'bubbles' | 'spores' | 'dandruff' | 'glow';
type Prop =
  | { e: string; x: number; b: number; size: number; o?: number; r?: number }
  | { blob: string; x: number; b: number; w: number; h: number; o?: number };

type HabitatDef = {
  name: string;
  bg: string;
  ground: string;
  groundH: number;
  props: Prop[];
  ambient: Ambient[];
  hair?: boolean;
  tiles?: boolean;
  water?: string;
};

// One home per beast, each a bit more disgusting than the real thing. On purpose.
const HABITATS: Record<number, HabitatDef> = {
  4: {
    name: "A greasy fringe",
    bg: '#3B2A1E',
    ground: '#C9A27E',
    groundH: 16, hair: true,
    props: [
      { blob: '#E8E0C8', x: 22, b: 12, w: 10, h: 6, o: 0.8 },
      { blob: '#E8E0C8', x: 64, b: 10, w: 8, h: 5, o: 0.7 },
      { blob: '#B5934F', x: 80, b: 14, w: 16, h: 6, o: 0.6 },
    ],
    ambient: ["dandruff"],
  },
  5: {
    name: "Wet dog blanket",
    bg: '#4A3626',
    ground: '#6B4E36',
    groundH: 20, hair: true,
    props: [
      { e: "🐾", x: 20, b: 14, size: 18, o: 0.6, r: -20 },
      { e: "🦴", x: 70, b: 12, size: 20, o: 0.8, r: 30 },
      { blob: '#3A2A1C', x: 45, b: 10, w: 40, h: 8, o: 0.7 },
    ],
    ambient: ["spores"],
  },
  6: {
    name: "A sweaty armpit",
    bg: '#5A3A33',
    ground: '#7A5246',
    groundH: 18, hair: true,
    props: [
      { blob: '#8FB3C9', x: 30, b: 30, w: 8, h: 10, o: 0.6 },
      { blob: '#8FB3C9', x: 66, b: 44, w: 6, h: 8, o: 0.5 },
      { blob: '#A87A5C', x: 50, b: 10, w: 50, h: 8, o: 0.6 },
    ],
    ambient: ["drip"],
  },
  7: {
    name: "Inside a rotten wall",
    bg: '#3A2C1C',
    ground: '#2A1E12',
    groundH: 18, tiles: true,
    props: [
      { e: "🪵", x: 76, b: 14, size: 34, o: 0.9, r: 0 },
      { blob: '#C9A86A', x: 20, b: 12, w: 30, h: 6, o: 0.6 },
      { blob: '#C9A86A', x: 50, b: 10, w: 18, h: 4, o: 0.5 },
    ],
    ambient: ["spores"],
  },
  8: {
    name: "Overflowing summer bin",
    bg: '#2C2A18',
    ground: '#4A4224',
    groundH: 20,
    props: [
      { e: "🗑️", x: 80, b: 16, size: 40, o: 0.9, r: 0 },
      { e: "🍉", x: 20, b: 12, size: 24, o: 0.85, r: -15 },
      { e: "🧃", x: 50, b: 12, size: 18, o: 0.8, r: 60 },
      { e: "🍦", x: 64, b: 12, size: 18, o: 0.75, r: 150 },
    ],
    ambient: ["flies"],
  },
  9: {
    name: "Steaming manure pile",
    bg: '#29301B',
    ground: '#4E3A1C',
    groundH: 22,
    props: [
      { e: "💩", x: 28, b: 16, size: 40, o: 1, r: 0 },
      { e: "💩", x: 70, b: 14, size: 28, o: 0.9, r: 0 },
      { e: "🍌", x: 86, b: 14, size: 20, o: 0.7, r: 30 },
      { blob: '#6B5320', x: 50, b: 14, w: 60, h: 12, o: 0.6 },
    ],
    ambient: ["flies", "spores"],
  },
  10: {
    name: "Under the fridge",
    bg: '#2B2620',
    ground: '#4A3F2C',
    groundH: 18, tiles: true,
    props: [
      { e: "🍞", x: 12, b: 10, size: 20, o: 0.9, r: -20 },
      { e: "🧀", x: 74, b: 12, size: 18, o: 0.85, r: 15 },
      { blob: '#6B5A1F', x: 40, b: 8, w: 46, h: 10, o: 0.7 },
      { e: "🥫", x: 88, b: 14, size: 22, o: 0.8, r: 70 },
    ],
    ambient: ["drip"],
  },
  11: {
    name: "Wet basement corner",
    bg: '#1F2322',
    ground: '#2E3330',
    groundH: 18, tiles: true,
    props: [
      { e: "📦", x: 78, b: 14, size: 34, o: 0.8, r: 5 },
      { blob: '#1B2A1F', x: 14, b: 60, w: 40, h: 30, o: 0.8 },
      { blob: '#2F4A3A', x: 22, b: 90, w: 24, h: 16, o: 0.7 },
      { blob: '#3E5A6A', x: 40, b: 8, w: 60, h: 8, o: 0.6 },
    ],
    ambient: ["drip"],
  },
  12: {
    name: "Rotting log",
    bg: '#1E2A1C',
    ground: '#3B2A1A',
    groundH: 24,
    props: [
      { e: "🪵", x: 14, b: 18, size: 44, o: 0.95, r: 0 },
      { e: "🍄", x: 34, b: 20, size: 20, o: 1, r: 0 },
      { e: "🍄", x: 82, b: 20, size: 16, o: 0.9, r: 0 },
      { e: "🍂", x: 60, b: 16, size: 18, o: 0.8, r: 40 },
      { e: "🪱", x: 72, b: 6, size: 16, o: 0.8, r: 0 },
    ],
    ambient: ["spores"],
  },
  13: {
    name: "Slimy vegetable patch",
    bg: '#1D2A18',
    ground: '#2A1D12',
    groundH: 24,
    props: [
      { e: "🥬", x: 16, b: 18, size: 30, o: 0.9, r: 0 },
      { e: "🍓", x: 70, b: 18, size: 18, o: 0.85, r: 20 },
      { blob: '#B9C98A', x: 40, b: 22, w: 50, h: 6, o: 0.5 },
      { blob: '#B9C98A', x: 80, b: 30, w: 30, h: 5, o: 0.4 },
    ],
    ambient: ["drip"],
  },
  14: {
    name: "Stagnant swamp",
    bg: '#1C3127',
    ground: '#2F3B1E',
    groundH: 22, water: '#2E4A2C',
    props: [
      { e: "🌿", x: 6, b: 20, size: 34, o: 0.8, r: 0 },
      { e: "🌿", x: 90, b: 18, size: 28, o: 0.7, r: 0 },
      { e: "🦴", x: 58, b: 8, size: 18, o: 0.7, r: 20 },
      { blob: '#7FA34A', x: 30, b: 120, w: 44, h: 8, o: 0.5 },
      { blob: '#7FA34A', x: 70, b: 140, w: 30, h: 6, o: 0.4 },
    ],
    ambient: ["bubbles"],
  },
  15: {
    name: "Behind the oven",
    bg: '#2A2018',
    ground: '#3E2E1E',
    groundH: 18, tiles: true,
    props: [
      { e: "🧀", x: 20, b: 12, size: 20, o: 0.85, r: -10 },
      { blob: '#5A3E1A', x: 50, b: 8, w: 60, h: 10, o: 0.8 },
      { blob: '#6E4A1E', x: 70, b: 60, w: 20, h: 30, o: 0.5 },
      { e: "🍝", x: 82, b: 12, size: 20, o: 0.7, r: 20 },
    ],
    ambient: ["spores"],
  },
  16: {
    name: "Muddy ditch",
    bg: '#2A2A18',
    ground: '#3E3420',
    groundH: 22, water: '#4A3F22',
    props: [
      { e: "🪨", x: 10, b: 18, size: 26, o: 0.9, r: 0 },
      { e: "🌿", x: 84, b: 18, size: 30, o: 0.7, r: 0 },
      { e: "🥫", x: 56, b: 10, size: 18, o: 0.7, r: 80 },
    ],
    ambient: ["bubbles"],
  },
  17: {
    name: "Inside a smelly boot",
    bg: '#1A1410',
    ground: '#2A1E16',
    groundH: 18,
    props: [
      { e: "👢", x: 78, b: 14, size: 46, o: 0.8, r: 0 },
      { e: "🧦", x: 22, b: 12, size: 22, o: 0.8, r: -30 },
      { blob: '#5A6A2A', x: 50, b: 60, w: 40, h: 20, o: 0.25 },
    ],
    ambient: ["spores"],
  },
  18: {
    name: "Mushy leaf litter",
    bg: '#231C12',
    ground: '#3A2A16',
    groundH: 24,
    props: [
      { e: "🍂", x: 10, b: 18, size: 24, o: 0.9, r: 20 },
      { e: "🍂", x: 40, b: 16, size: 20, o: 0.8, r: -30 },
      { e: "🍂", x: 70, b: 18, size: 26, o: 0.85, r: 60 },
      { e: "🍄", x: 88, b: 20, size: 18, o: 0.9, r: 0 },
    ],
    ambient: ["spores"],
  },
  19: {
    name: "Dusty forgotten houseplant",
    bg: '#262A20',
    ground: '#3A3428',
    groundH: 20,
    props: [
      { e: "🪴", x: 76, b: 16, size: 52, o: 0.9, r: 0 },
      { e: "🕸️", x: 4, b: 140, size: 30, o: 0.5, r: 0 },
      { blob: '#8A8A7A', x: 30, b: 12, w: 40, h: 6, o: 0.5 },
    ],
    ambient: ["spores"],
  },
  20: {
    name: "Back-alley bin",
    bg: '#1D221F',
    ground: '#3D4A2A',
    groundH: 20,
    props: [
      { e: "🗑️", x: 82, b: 16, size: 40, o: 0.9, r: 0 },
      { e: "🦴", x: 18, b: 12, size: 18, o: 0.8, r: 25 },
      { e: "🧦", x: 46, b: 12, size: 18, o: 0.75, r: -40 },
      { e: "🍗", x: 64, b: 12, size: 18, o: 0.8, r: 60 },
      { blob: '#5C7A2A', x: 30, b: 8, w: 50, h: 10, o: 0.6 },
    ],
    ambient: ["flies", "drip"],
  },
  21: {
    name: "Damp cave",
    bg: '#17171C',
    ground: '#2A2A30',
    groundH: 18,
    props: [
      { e: "🕸️", x: 2, b: 150, size: 46, o: 0.7, r: 0 },
      { e: "🕸️", x: 82, b: 160, size: 36, o: 0.6, r: 90 },
      { e: "💀", x: 70, b: 14, size: 26, o: 0.85, r: 0 },
      { e: "🦴", x: 22, b: 12, size: 20, o: 0.8, r: -30 },
    ],
    ambient: ["drip"],
  },
  22: {
    name: "Bat cave full of guano",
    bg: '#121218',
    ground: '#3A3428',
    groundH: 26,
    props: [
      { e: "🦇", x: 20, b: 150, size: 24, o: 0.8, r: 180 },
      { e: "🦇", x: 70, b: 160, size: 20, o: 0.7, r: 180 },
      { blob: '#D8D2B8', x: 30, b: 18, w: 60, h: 8, o: 0.7 },
      { blob: '#D8D2B8', x: 70, b: 20, w: 40, h: 6, o: 0.6 },
    ],
    ambient: ["drip"],
  },
  23: {
    name: "Under the garden shed",
    bg: '#1F1B14',
    ground: '#33281A',
    groundH: 22, tiles: true,
    props: [
      { e: "🐌", x: 16, b: 14, size: 18, o: 0.8, r: 0 },
      { e: "🪱", x: 60, b: 8, size: 16, o: 0.8, r: 0 },
      { e: "🍂", x: 84, b: 14, size: 20, o: 0.8, r: 30 },
    ],
    ambient: ["spores"],
  },
  24: {
    name: "Pooped-on statue",
    bg: '#2B2E33',
    ground: '#4A4C50',
    groundH: 20,
    props: [
      { e: "🗿", x: 72, b: 16, size: 60, o: 0.9, r: 0 },
      { blob: '#F2F0E6', x: 74, b: 120, w: 10, h: 6, o: 0.9 },
      { blob: '#F2F0E6', x: 80, b: 90, w: 8, h: 5, o: 0.9 },
      { blob: '#F2F0E6', x: 20, b: 18, w: 14, h: 6, o: 0.8 },
      { e: "🍟", x: 36, b: 14, size: 18, o: 0.7, r: 40 },
    ],
    ambient: ["dandruff"],
  },
  25: {
    name: "Medieval sewer",
    bg: '#1A1D16',
    ground: '#2A2A1C',
    groundH: 18, water: '#3A4224',
    props: [
      { e: "💀", x: 14, b: 14, size: 22, o: 0.7, r: 0 },
      { e: "🦴", x: 50, b: 10, size: 20, o: 0.7, r: 40 },
      { e: "🧀", x: 84, b: 12, size: 18, o: 0.7, r: 0 },
    ],
    ambient: ["bubbles", "drip"],
  },
  26: {
    name: "Fish-gut pier",
    bg: '#18222A',
    ground: '#3A2E24',
    groundH: 22, water: '#203440',
    props: [
      { e: "🐟", x: 30, b: 16, size: 22, o: 0.7, r: 180 },
      { e: "🪝", x: 80, b: 150, size: 26, o: 0.7, r: 0 },
      { blob: '#7A3A3A', x: 56, b: 14, w: 40, h: 8, o: 0.7 },
    ],
    ambient: ["flies"],
  },
  27: {
    name: "Festering compost heap",
    bg: '#241D14',
    ground: '#3A2C18',
    groundH: 24,
    props: [
      { e: "🍌", x: 14, b: 18, size: 22, o: 0.8, r: 60 },
      { e: "🥚", x: 40, b: 16, size: 16, o: 0.7, r: 90 },
      { e: "🥕", x: 64, b: 16, size: 20, o: 0.8, r: -30 },
      { e: "🍂", x: 86, b: 18, size: 20, o: 0.8, r: 10 },
    ],
    ambient: ["spores", "flies"],
  },
  28: {
    name: "Carcass country",
    bg: '#262018',
    ground: '#4A3A22',
    groundH: 22,
    props: [
      { e: "🪨", x: 8, b: 16, size: 30, o: 0.9, r: 0 },
      { e: "🍖", x: 62, b: 16, size: 30, o: 0.9, r: -10 },
      { e: "🦴", x: 40, b: 12, size: 20, o: 0.85, r: 30 },
      { e: "💀", x: 86, b: 16, size: 22, o: 0.8, r: 0 },
    ],
    ambient: ["flies"],
  },
  29: {
    name: "Roadside ditch",
    bg: '#22201A',
    ground: '#3A3A3A',
    groundH: 26,
    props: [
      { e: "🛞", x: 76, b: 18, size: 34, o: 0.85, r: 0 },
      { e: "🥤", x: 24, b: 16, size: 18, o: 0.7, r: 70 },
      { blob: '#E8C840', x: 45, b: 12, w: 30, h: 3, o: 0.6 },
    ],
    ambient: ["flies"],
  },
  30: {
    name: "Sunbaked bone pile",
    bg: '#2F2716',
    ground: '#5A4628',
    groundH: 22,
    props: [
      { e: "🦴", x: 14, b: 14, size: 22, o: 0.85, r: 20 },
      { e: "🦴", x: 44, b: 16, size: 20, o: 0.8, r: -40 },
      { e: "💀", x: 72, b: 16, size: 24, o: 0.85, r: 0 },
      { e: "🪨", x: 88, b: 16, size: 24, o: 0.8, r: 0 },
    ],
    ambient: ["spores"],
  },
  31: {
    name: "The deep, dark sea",
    bg: '#06121F',
    ground: '#0E1E2A',
    groundH: 18,
    props: [
      { e: "🦴", x: 20, b: 10, size: 24, o: 0.6, r: 10 },
      { e: "💀", x: 76, b: 12, size: 22, o: 0.5, r: 0 },
      { blob: '#1E3A4A', x: 50, b: 10, w: 70, h: 10, o: 0.7 },
    ],
    ambient: ["bubbles", "glow"],
  },
  32: {
    name: "Shipwreck graveyard",
    bg: '#081A24',
    ground: '#14303A',
    groundH: 20,
    props: [
      { e: "⚓", x: 78, b: 14, size: 36, o: 0.6, r: 20 },
      { e: "🪸", x: 14, b: 16, size: 28, o: 0.6, r: 0 },
      { e: "💀", x: 50, b: 12, size: 18, o: 0.5, r: 0 },
    ],
    ambient: ["bubbles"],
  },
  33: {
    name: "Raided picnic",
    bg: '#1F261A',
    ground: '#2F3A20',
    groundH: 22,
    props: [
      { e: "🧺", x: 80, b: 16, size: 34, o: 0.85, r: 10 },
      { e: "🍉", x: 18, b: 12, size: 22, o: 0.8, r: -20 },
      { e: "🌭", x: 46, b: 12, size: 18, o: 0.8, r: 40 },
      { e: "🍔", x: 62, b: 12, size: 18, o: 0.75, r: -10 },
    ],
    ambient: ["flies"],
  },
  34: {
    name: "Sargasso slime",
    bg: '#0E2A24',
    ground: '#163A2E',
    groundH: 18, water: '#145040',
    props: [
      { e: "🌿", x: 8, b: 18, size: 34, o: 0.6, r: 0 },
      { e: "🌿", x: 46, b: 20, size: 28, o: 0.5, r: 0 },
      { e: "🌿", x: 86, b: 18, size: 32, o: 0.6, r: 0 },
    ],
    ambient: ["bubbles", "glow"],
  },
  35: {
    name: "Chip-shop rooftop",
    bg: '#2A2F36',
    ground: '#4A4A4E',
    groundH: 20,
    props: [
      { e: "🍟", x: 20, b: 14, size: 22, o: 0.85, r: -20 },
      { e: "📦", x: 72, b: 14, size: 30, o: 0.8, r: 0 },
      { blob: '#F2F0E6', x: 46, b: 14, w: 14, h: 6, o: 0.8 },
    ],
    ambient: ["flies"],
  },
  36: {
    name: "Roadkill buffet",
    bg: '#241A14',
    ground: '#3A3A3A',
    groundH: 24,
    props: [
      { e: "🍖", x: 30, b: 16, size: 30, o: 0.9, r: 20 },
      { e: "🦴", x: 60, b: 12, size: 20, o: 0.85, r: -30 },
      { e: "🛞", x: 86, b: 18, size: 26, o: 0.7, r: 0 },
      { blob: '#6A2A2A', x: 40, b: 12, w: 40, h: 6, o: 0.6 },
    ],
    ambient: ["flies"],
  },
  37: {
    name: "Inside a termite mound",
    bg: '#2E2214',
    ground: '#4A3418',
    groundH: 26,
    props: [
      { blob: '#5A3E1C', x: 70, b: 20, w: 70, h: 120, o: 0.9 },
      { e: "🐜", x: 30, b: 14, size: 14, o: 0.8, r: 0 },
      { e: "🐜", x: 50, b: 60, size: 12, o: 0.7, r: 90 },
      { e: "🐜", x: 76, b: 90, size: 12, o: 0.7, r: 0 },
    ],
    ambient: ["spores"],
  },
  38: {
    name: "The badger latrine",
    bg: '#231B10',
    ground: '#3A2A16',
    groundH: 24,
    props: [
      { e: "💩", x: 24, b: 16, size: 26, o: 0.95, r: 0 },
      { e: "💩", x: 62, b: 16, size: 22, o: 0.9, r: 0 },
      { e: "🕳️", x: 84, b: 10, size: 30, o: 0.8, r: 0 },
    ],
    ambient: ["flies"],
  },
  39: {
    name: "Endless landfill",
    bg: '#24261F',
    ground: '#3E3A2A',
    groundH: 26,
    props: [
      { e: "🗑️", x: 10, b: 16, size: 30, o: 0.8, r: 0 },
      { e: "🥡", x: 36, b: 14, size: 20, o: 0.8, r: 20 },
      { e: "🩴", x: 58, b: 14, size: 20, o: 0.75, r: -30 },
      { e: "🧃", x: 80, b: 14, size: 18, o: 0.8, r: 60 },
      { e: "🦴", x: 92, b: 12, size: 16, o: 0.7, r: 0 },
    ],
    ambient: ["flies", "spores"],
  },
  40: {
    name: "The boss beast's lair",
    bg: '#1B1410',
    ground: '#2E2018',
    groundH: 22,
    props: [
      { e: "💎", x: 14, b: 14, size: 22, o: 0.9, r: 0 },
      { e: "💀", x: 36, b: 14, size: 22, o: 0.8, r: 0 },
      { e: "🔥", x: 4, b: 120, size: 24, o: 0.8, r: 0 },
      { e: "🔥", x: 88, b: 120, size: 24, o: 0.8, r: 0 },
      { e: "🦴", x: 70, b: 12, size: 20, o: 0.8, r: 30 },
    ],
    ambient: ["glow"],
  },
};

export function habitatFor(week: number): HabitatDef {
  return HABITATS[week] ?? HABITATS[12];
}

/** The background scene behind the beast. Fills its parent. */
export function Habitat({ week, height }: { week: number; height: number }) {
  const h = habitatFor(week);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: h.bg }]} pointerEvents="none">
      {h.water && <View style={[s.water, { backgroundColor: h.water, top: height * 0.35 }]} />}
      {h.tiles && <Tiles />}
      {h.hair && <Hair height={height} />}
      <View style={[s.ground, { backgroundColor: h.ground, height: h.groundH }]} />
      {h.props.map((p, i) =>
        'blob' in p ? (
          <View
            key={i}
            style={[
              s.blob,
              { left: `${p.x}%`, bottom: p.b, width: p.w, height: p.h, backgroundColor: p.blob, opacity: p.o ?? 1 },
            ]}
          />
        ) : (
          <Text
            key={i}
            style={[
              s.prop,
              {
                left: `${p.x}%`,
                bottom: p.b,
                fontSize: p.size,
                opacity: p.o ?? 1,
                transform: [{ rotate: `${p.r ?? 0}deg` }],
              },
            ]}
          >
            {p.e}
          </Text>
        ),
      )}
      {h.ambient.includes('flies') && (
        <>
          <Fly cx={0.3} cy={height - 70} radius={26} duration={1300} />
          <Fly cx={0.75} cy={height - 60} radius={20} duration={1000} reverse />
        </>
      )}
      {h.ambient.includes('drip') && <Drip x={0.58} height={height} delay={0} />}
      {h.ambient.includes('bubbles') &&
        [0.2, 0.55, 0.85].map((x, i) => <Rise key={i} x={x} height={height} delay={i * 900} char="○" color="#9FC7B8" />)}
      {h.ambient.includes('spores') &&
        [0.15, 0.45, 0.7, 0.9].map((x, i) => (
          <Rise key={i} x={x} height={height} delay={i * 1200} char="•" color="#C9B26A" slow />
        ))}
      {h.ambient.includes('dandruff') &&
        [0.1, 0.35, 0.6, 0.85].map((x, i) => <Drip key={i} x={x} height={height} delay={i * 700} char="•" color="#F2EEE0" slow />)}
      {h.ambient.includes('glow') && <Glow />}
      <Text style={s.label}>📍 {h.name}</Text>
    </View>
  );
}

function Tiles() {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={`v${i}`} style={[s.tileLine, { left: `${i * 20}%`, top: 0, bottom: 0, width: 1 }]} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <View key={`h${i}`} style={[s.tileLine, { top: i * 52, left: 0, right: 0, height: 1 }]} />
      ))}
    </>
  );
}

function Hair({ height }: { height: number }) {
  return (
    <>
      {Array.from({ length: 14 }, (_, i) => (
        <View
          key={i}
          style={[
            s.hair,
            {
              left: `${(i * 7.3) % 100}%`,
              height: height * (0.6 + ((i * 37) % 30) / 100),
              transform: [{ rotate: `${((i * 13) % 24) - 12}deg` }],
              opacity: 0.35 + ((i * 17) % 30) / 100,
            },
          ]}
        />
      ))}
    </>
  );
}

function useLoop(duration: number, delay = 0, easing = Easing.linear) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([Animated.delay(delay), Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: true })]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, delay, easing]);
  return v;
}

function Fly({ cx, cy, radius, duration, reverse }: { cx: number; cy: number; radius: number; duration: number; reverse?: boolean }) {
  const v = useLoop(duration);
  const rotate = v.interpolate({ inputRange: [0, 1], outputRange: reverse ? ['360deg', '0deg'] : ['0deg', '360deg'] });
  return (
    <Animated.View style={[s.orbit, { left: `${cx * 100}%`, top: cy, transform: [{ rotate }] }]}>
      <Text style={[s.fly, { transform: [{ translateX: radius }] }]}>🪰</Text>
    </Animated.View>
  );
}

function Drip({
  x,
  height,
  delay,
  char = '💧',
  color,
  slow,
}: {
  x: number;
  height: number;
  delay: number;
  char?: string;
  color?: string;
  slow?: boolean;
}) {
  const v = useLoop(slow ? 4200 : 1800, delay, Easing.in(Easing.quad));
  return (
    <Animated.Text
      style={[
        s.particle,
        {
          left: `${x * 100}%`,
          top: 0,
          color,
          fontSize: char === '💧' ? 14 : 10,
          opacity: v.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] }),
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, height - 20] }) }],
        },
      ]}
    >
      {char}
    </Animated.Text>
  );
}

function Rise({
  x,
  height,
  delay,
  char,
  color,
  slow,
}: {
  x: number;
  height: number;
  delay: number;
  char: string;
  color: string;
  slow?: boolean;
}) {
  const v = useLoop(slow ? 5000 : 2600, delay, Easing.out(Easing.quad));
  return (
    <Animated.Text
      style={[
        s.particle,
        {
          left: `${x * 100}%`,
          bottom: 10,
          color,
          fontSize: slow ? 8 : 12,
          opacity: v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.8, 0.6, 0] }),
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -(height - 30)] }) },
            { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 8, -4] }) },
          ],
        },
      ]}
    >
      {char}
    </Animated.Text>
  );
}

function Glow() {
  const v = useLoop(2400, 0, Easing.inOut(Easing.sin));
  return (
    <>
      {[
        [0.15, 40],
        [0.5, 80],
        [0.82, 50],
      ].map(([x, top], i) => (
        <Animated.View
          key={i}
          style={[
            s.glow,
            {
              left: `${(x as number) * 100}%`,
              top: top as number,
              opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: i % 2 ? [0.2, 0.8, 0.2] : [0.7, 0.15, 0.7] }),
            },
          ]}
        />
      ))}
    </>
  );
}

const s = StyleSheet.create({
  ground: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  water: { position: 'absolute', left: 0, right: 0, bottom: 0, opacity: 0.7 },
  blob: { position: 'absolute', borderRadius: 999 },
  prop: { position: 'absolute' },
  tileLine: { position: 'absolute', backgroundColor: '#000', opacity: 0.35 },
  hair: { position: 'absolute', bottom: 0, width: 2, backgroundColor: '#1A120C', borderRadius: 1 },
  orbit: { position: 'absolute', width: 0, height: 0 },
  fly: { position: 'absolute', fontSize: 12, top: -8, left: -6 },
  particle: { position: 'absolute' },
  glow: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#9FE8FF' },
  label: { position: 'absolute', left: 10, top: 8, color: '#EEF3E8', opacity: 0.7, fontSize: 11, fontWeight: '700' },
});
