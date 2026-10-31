import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { C } from '../theme';
import { playSound } from '../sounds';

const TAPS_TO_HATCH = 3;
const PARTICLES = 12;

/** A wobbling egg you tap to hatch. Calls onDone once the beast has popped out. */
export function BeastReveal({ emoji, extra = [], onDone }: { emoji: string; extra?: string[]; onDone: () => void }) {
  const [taps, setTaps] = useState(0);
  const [hatched, setHatched] = useState(false);
  const wobble = useRef(new Animated.Value(0)).current;
  const egg = useRef(new Animated.Value(1)).current;
  const beast = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const idle = useRef<Animated.CompositeAnimation | null>(null);

  // The egg wobbles now and then while it waits
  useEffect(() => {
    idle.current = Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: -1, duration: 220, useNativeDriver: true }),
        Animated.timing(wobble, { toValue: 0, duration: 110, useNativeDriver: true }),
        Animated.delay(1300),
      ]),
    );
    idle.current.start();
    return () => idle.current?.stop();
  }, [wobble]);

  const shake = (strength: number) =>
    Animated.sequence([
      Animated.timing(wobble, { toValue: strength, duration: 60, useNativeDriver: true }),
      Animated.timing(wobble, { toValue: -strength, duration: 120, useNativeDriver: true }),
      Animated.timing(wobble, { toValue: strength * 0.6, duration: 100, useNativeDriver: true }),
      Animated.timing(wobble, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]);

  const tap = () => {
    if (hatched) return;
    idle.current?.stop();
    const n = taps + 1;
    setTaps(n);
    if (n < TAPS_TO_HATCH) {
      playSound('tap');
      Haptics.impactAsync(n === 1 ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      Animated.parallel([
        shake(1 + n),
        Animated.sequence([
          Animated.timing(egg, { toValue: 1.12, duration: 90, useNativeDriver: true }),
          Animated.spring(egg, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]),
      ]).start();
      return;
    }
    setHatched(true);
    playSound('pop');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.sequence([
      shake(4),
      Animated.parallel([
        Animated.timing(egg, { toValue: 0, duration: 220, easing: Easing.in(Easing.back(2)), useNativeDriver: true }),
        Animated.timing(burst, { toValue: 1, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(beast, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
      ]),
    ]).start(() => setTimeout(onDone, 700));
  };

  const rotate = wobble.interpolate({ inputRange: [-6, 6], outputRange: ['-60deg', '60deg'] });

  return (
    <Pressable onPress={tap} style={s.wrap} accessibilityRole="button" accessibilityLabel="Tap the egg to hatch the new beast">
      <View style={s.stage}>
        {Array.from({ length: extra.length ? PARTICLES * 2 : PARTICLES }).map((_, i) => {
          const count = extra.length ? PARTICLES * 2 : PARTICLES;
          const a = (i / count) * Math.PI * 2;
          const dist = 110 + (i % 3) * 25;
          const symbol = extra.length && i % 2 ? extra[i % extra.length] : emoji;
          return (
            <Animated.Text
              key={i}
              style={[
                s.particle,
                {
                  opacity: burst.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                  transform: [
                    { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * dist] }) },
                    {
                      translateY: burst.interpolate({
                        inputRange: [0, 0.6, 1],
                        outputRange: [0, Math.sin(a) * dist, Math.sin(a) * dist + 40],
                      }),
                    },
                    { scale: burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1, 0.6] }) },
                  ],
                },
              ]}
            >
              {symbol}
            </Animated.Text>
          );
        })}
        <Animated.Text style={[s.big, { opacity: egg, transform: [{ rotate }, { scale: egg }] }]}>
          {taps >= 2 && !hatched ? '🐣' : '🥚'}
        </Animated.Text>
        <Animated.Text
          style={[
            s.big,
            s.abs,
            {
              opacity: beast,
              transform: [
                { scale: beast.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
                { rotate: beast.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] }) },
              ],
            },
          ]}
        >
          {emoji}
        </Animated.Text>
      </View>
      <Text style={s.hint}>
        {hatched
          ? 'It hatched!'
          : taps === 0
            ? 'Tap the egg to hatch it'
            : `Keep tapping! ${'●'.repeat(taps)}${'○'.repeat(TAPS_TO_HATCH - taps)}`}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', alignSelf: 'stretch', paddingVertical: 12 },
  stage: { width: 200, height: 170, alignItems: 'center', justifyContent: 'center' },
  big: { fontSize: 110, lineHeight: 132, textAlign: 'center' },
  abs: { position: 'absolute' },
  particle: { position: 'absolute', fontSize: 30 },
  hint: { color: C.accent, fontWeight: '700', fontSize: 16, marginTop: 8 },
});
