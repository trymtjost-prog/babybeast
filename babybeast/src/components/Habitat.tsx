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

// Every habitat is a bit more disgusting than the real thing. On purpose.
const HABITATS: Record<string, HabitatDef> = {
  scalp: {
    name: "Someone's scalp",
    bg: '#3B2A1E',
    ground: '#C9A27E',
    groundH: 16,
    hair: true,
    props: [
      { blob: '#E8E0C8', x: 22, b: 12, w: 10, h: 6, o: 0.8 },
      { blob: '#E8E0C8', x: 64, b: 10, w: 8, h: 5, o: 0.7 },
      { blob: '#B5934F', x: 80, b: 14, w: 16, h: 6, o: 0.6 },
    ],
    ambient: ['dandruff'],
  },
  kitchen: {
    name: 'Under the fridge',
    bg: '#2B2620',
    ground: '#4A3F2C',
    groundH: 18,
    tiles: true,
    props: [
      { e: '🍞', x: 12, b: 10, size: 20, o: 0.9, r: -20 },
      { e: '🧀', x: 74, b: 12, size: 18, o: 0.85, r: 15 },
      { blob: '#6B5A1F', x: 40, b: 8, w: 46, h: 10, o: 0.7 },
      { e: '🥫', x: 88, b: 14, size: 22, o: 0.8, r: 70 },
    ],
    ambient: ['drip'],
  },
  manure: {
    name: 'Steaming manure pile',
    bg: '#29301B',
    ground: '#4E3A1C',
    groundH: 22,
    props: [
      { e: '💩', x: 28, b: 16, size: 40 },
      { e: '💩', x: 70, b: 14, size: 28, o: 0.9 },
      { e: '🍌', x: 86, b: 14, size: 20, o: 0.7, r: 30 },
      { blob: '#6B5320', x: 50, b: 14, w: 60, h: 12, o: 0.6 },
    ],
    ambient: ['flies', 'spores'],
  },
  log: {
    name: 'Rotting log',
    bg: '#1E2A1C',
    ground: '#3B2A1A',
    groundH: 24,
    props: [
      { e: '🪵', x: 14, b: 18, size: 44, o: 0.95 },
      { e: '🍄', x: 34, b: 20, size: 20 },
      { e: '🍄', x: 82, b: 20, size: 16, o: 0.9 },
      { e: '🍂', x: 60, b: 16, size: 18, o: 0.8, r: 40 },
      { e: '🪱', x: 72, b: 6, size: 16, o: 0.8 },
    ],
    ambient: ['spores'],
  },
  swamp: {
    name: 'Stagnant swamp',
    bg: '#1C3127',
    ground: '#2F3B1E',
    groundH: 22,
    water: '#2E4A2C',
    props: [
      { e: '🌿', x: 6, b: 20, size: 34, o: 0.8 },
      { e: '🌿', x: 90, b: 18, size: 28, o: 0.7 },
      { e: '🦴', x: 58, b: 8, size: 18, o: 0.7, r: 20 },
      { blob: '#7FA34A', x: 30, b: 120, w: 44, h: 8, o: 0.5 },
      { blob: '#7FA34A', x: 70, b: 140, w: 30, h: 6, o: 0.4 },
    ],
    ambient: ['bubbles'],
  },
  cave: {
    name: 'Damp cave',
    bg: '#17171C',
    ground: '#2A2A30',
    groundH: 18,
    props: [
      { e: '🕸️', x: 2, b: 150, size: 46, o: 0.7 },
      { e: '🕸️', x: 82, b: 160, size: 36, o: 0.6, r: 90 },
      { e: '💀', x: 70, b: 14, size: 26, o: 0.85 },
      { e: '🦴', x: 22, b: 12, size: 20, o: 0.8, r: -30 },
    ],
    ambient: ['drip'],
  },
  sewer: {
    name: 'Back-alley bin',
    bg: '#1D221F',
    ground: '#3D4A2A',
    groundH: 20,
    props: [
      { e: '🗑️', x: 82, b: 16, size: 40, o: 0.9 },
      { e: '🦴', x: 18, b: 12, size: 18, o: 0.8, r: 25 },
      { e: '🧦', x: 46, b: 12, size: 18, o: 0.75, r: -40 },
      { e: '🍗', x: 64, b: 12, size: 18, o: 0.8, r: 60 },
      { blob: '#5C7A2A', x: 30, b: 8, w: 50, h: 10, o: 0.6 },
    ],
    ambient: ['flies', 'drip'],
  },
  deep: {
    name: 'The deep, dark sea',
    bg: '#06121F',
    ground: '#0E1E2A',
    groundH: 18,
    props: [
      { e: '🦴', x: 20, b: 10, size: 24, o: 0.6, r: 10 },
      { e: '💀', x: 76, b: 12, size: 22, o: 0.5 },
      { blob: '#1E3A4A', x: 50, b: 10, w: 70, h: 10, o: 0.7 },
    ],
    ambient: ['bubbles', 'glow'],
  },
  carcass: {
    name: 'Carcass country',
    bg: '#262018',
    ground: '#4A3A22',
    groundH: 22,
    props: [
      { e: '🪨', x: 8, b: 16, size: 30, o: 0.9 },
      { e: '🍖', x: 62, b: 16, size: 30, o: 0.9, r: -10 },
      { e: '🦴', x: 40, b: 12, size: 20, o: 0.85, r: 30 },
      { e: '💀', x: 86, b: 16, size: 22, o: 0.8 },
    ],
    ambient: ['flies'],
  },
};

const HABITAT_BY_WEEK: Record<number, keyof typeof HABITATS> = {
  4: 'scalp', 5: 'scalp', 6: 'scalp', 7: 'kitchen', 8: 'manure', 9: 'manure', 10: 'kitchen', 11: 'kitchen',
  12: 'log', 13: 'log', 14: 'swamp', 15: 'sewer', 16: 'swamp', 17: 'cave', 18: 'log', 19: 'log', 20: 'sewer',
  21: 'cave', 22: 'log', 23: 'carcass', 24: 'sewer', 25: 'sewer', 26: 'sewer', 27: 'log', 28: 'carcass',
  29: 'sewer', 30: 'carcass', 31: 'deep', 32: 'deep', 33: 'sewer', 34: 'swamp', 35: 'sewer', 36: 'carcass',
  37: 'carcass', 38: 'carcass', 39: 'sewer', 40: 'carcass',
};

export function habitatFor(week: number): HabitatDef {
  return HABITATS[HABITAT_BY_WEEK[week] ?? 'log'];
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
