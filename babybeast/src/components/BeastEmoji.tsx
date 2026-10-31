import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { playSound, soundFor } from '../sounds';

type Trick = 'jump' | 'spin' | 'shake' | 'scuttle' | 'grow';
const TRICKS: Trick[] = ['jump', 'spin', 'shake', 'scuttle', 'grow'];
const DURATION: Record<Trick, number> = { jump: 700, spin: 800, shake: 600, scuttle: 1500, grow: 800 };

/** The week's beast: breathes on its own and does a random trick when you poke it. */
export function BeastEmoji({ emoji, size = 110, crown }: { emoji: string; size?: number; crown?: boolean }) {
  const breathe = useRef(new Animated.Value(0)).current;
  const t = useRef(new Animated.Value(0)).current;
  const [trick, setTrick] = useState<Trick>('jump');
  const busy = useRef(false);
  const [poked, setPoked] = useState(false);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const poke = () => {
    if (busy.current) return;
    busy.current = true;
    setPoked(true);
    const next = TRICKS.filter((x) => x !== trick)[Math.floor(Math.random() * (TRICKS.length - 1))];
    setTrick(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    playSound(next === 'jump' ? 'boing' : soundFor(emoji));
    t.setValue(0);
    Animated.timing(t, { toValue: 1, duration: DURATION[next], easing: Easing.out(Easing.quad), useNativeDriver: true }).start(
      () => {
        busy.current = false;
      },
    );
  };

  const idleScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const idleTilt = breathe.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });

  const zero = t.interpolate({ inputRange: [0, 1], outputRange: [0, 0] });
  const one = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1] });
  const noTurn = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '0deg'] });

  const translateY =
    trick === 'jump' ? t.interpolate({ inputRange: [0, 0.35, 0.7, 0.85, 1], outputRange: [0, -70, 0, -12, 0] }) : zero;
  const translateX =
    trick === 'shake'
      ? t.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: [0, -16, 16, -10, 10, 0] })
      : trick === 'scuttle'
        ? t.interpolate({ inputRange: [0, 0.48, 0.49, 0.51, 1], outputRange: [0, 260, 260, -260, 0] })
        : zero;
  const rotate =
    trick === 'spin' ? t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) : noTurn;
  const scale =
    trick === 'grow' ? t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.7, 1] }) : one;

  return (
    <Pressable onPress={poke} accessibilityRole="button" accessibilityLabel="Poke the beast" hitSlop={20}>
      <Animated.View
        style={{
          transform: [
            { translateX },
            { translateY },
            { rotate },
            { rotate: idleTilt },
            { scale: Animated.multiply(scale, idleScale) },
          ],
        }}
      >
        {crown && <Text style={s.crown}>👑</Text>}
        <Text style={[s.emoji, { fontSize: size, lineHeight: size * 1.2 }]}>{emoji}</Text>
      </Animated.View>
      {!poked && <Text style={s.hint}>Poke me 👆</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  emoji: { textAlign: 'center' },
  crown: { fontSize: 40, textAlign: 'center', marginBottom: -18 },
  hint: { color: '#9DB0A2', fontSize: 12, textAlign: 'center', marginTop: -4 },
});
