import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { capitalize } from '../relations';
import { C } from '../theme';

type Props = {
  percent: number;
  daysLeft: number;
  emoji: string; // this week's beast
  beast: string; // "your beast", "your grandbeast" ...
};

const DOT = 30;

/** Progress towards birth: the current beast crawls along the track towards the finish. */
export function BirthTrack({ percent, daysLeft, emoji, beast }: Props) {
  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const p = Math.max(0, Math.min(100, percent));

  useEffect(() => {
    if (!w) return;
    Animated.timing(x, {
      toValue: ((w - DOT) * p) / 100,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // drives the fill width too
    }).start();
  }, [w, p, x]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -3, duration: 450, useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  const born = daysLeft <= 0;

  return (
    <View
      style={s.wrap}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(p) }}
      accessibilityLabel={born ? `${capitalize(beast)} has arrived` : `${Math.round(p)} percent, ${daysLeft} days to go`}
    >
      <View style={s.track} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        <View style={s.rail} />
        <Animated.View style={[s.fill, { width: x }]} />
        <Text style={s.finish}>{born ? '🎉' : '🏁'}</Text>
        <Animated.View style={[s.beast, { transform: [{ translateX: x }] }]}>
          <Animated.Text style={[s.beastEmoji, { transform: [{ translateY: bob }] }]}>{emoji}</Animated.Text>
        </Animated.View>
      </View>
      <View style={s.labels}>
        <Text style={s.pct}>{Math.round(p)}% cooked</Text>
        <Text style={s.left}>
          {born ? `${capitalize(beast)} is here!` : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} until ${beast} arrives`}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: 14 },
  track: { height: DOT + 6, justifyContent: 'center' },
  rail: { position: 'absolute', left: DOT / 2, right: DOT / 2, height: 10, borderRadius: 5, backgroundColor: C.line },
  fill: { position: 'absolute', left: DOT / 2, height: 10, borderRadius: 5, backgroundColor: C.accent },
  finish: { position: 'absolute', right: -4, fontSize: 20 },
  beast: { position: 'absolute', left: 0, width: DOT, height: DOT, alignItems: 'center', justifyContent: 'center' },
  beastEmoji: { fontSize: 24 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, gap: 8 },
  pct: { color: C.accent, fontWeight: '800', fontSize: 14 },
  left: { color: C.muted, fontSize: 13, flexShrink: 1, textAlign: 'right' },
});
