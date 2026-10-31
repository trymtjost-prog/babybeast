import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { playSound, soundFor } from '../sounds';
import { C } from '../theme';
import { Habitat } from './Habitat';

/** How each beast moves around its little terrarium. */
type Motion = 'crawl' | 'hop' | 'fly' | 'slide' | 'slither' | 'swim' | 'scurry' | 'roll' | 'still';

const MOTION_BY_WEEK: Record<number, Motion> = {
  4: 'still', 5: 'hop', 6: 'crawl', 7: 'crawl', 8: 'fly', 9: 'fly', 10: 'crawl', 11: 'slither', 12: 'crawl',
  13: 'slide', 14: 'slide', 15: 'scurry', 16: 'hop', 17: 'crawl', 18: 'slither', 19: 'crawl', 20: 'scurry',
  21: 'crawl', 22: 'crawl', 23: 'roll', 24: 'fly', 25: 'scurry', 26: 'scurry', 27: 'slither', 28: 'crawl',
  29: 'scurry', 30: 'slither', 31: 'swim', 32: 'swim', 33: 'scurry', 34: 'swim', 35: 'fly', 36: 'scurry',
  37: 'slither', 38: 'scurry', 39: 'fly', 40: 'roll',
};

// Pixels per second while moving
const SPEED: Record<Motion, number> = {
  crawl: 70, hop: 90, fly: 220, slide: 14, slither: 55, swim: 60, scurry: 260, roll: 120, still: 0,
};

const H = 210;
const SIZE = 76;

type Fx = { id: number; x: number; y: number; e: string; kind: 'trail' | 'bubble' | 'puff' };

/** The week's beast, alive: it wanders around and reacts when you poke it. */
export function BeastStage({ emoji, week, crown }: { emoji: string; week: number; crown?: boolean }) {
  const motion: Motion = MOTION_BY_WEEK[week] ?? 'crawl';
  const ground = motion === 'hop' || motion === 'scurry' || motion === 'roll' || motion === 'slither' || motion === 'slide';

  const [w, setW] = useState(0);
  const [poked, setPoked] = useState(false);
  const [fx, setFx] = useState<Fx[]>([]);

  // Outer layer moves with the JS driver (so we always know where the beast is),
  // inner layer handles flipping, wiggling and hopping on the native driver.
  const pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const cur = useRef({ x: 0, y: 0 });
  const flip = useRef(new Animated.Value(1)).current;
  const wave = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const big = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const squash = useRef(new Animated.Value(1)).current;
  const spinTurns = useRef(0);

  const alive = useRef(true);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fxId = useRef(0);

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => alive.current && fn(), ms);
    timers.current.push(t);
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const addFx = (e: string, kind: Fx['kind']) => {
    const id = ++fxId.current;
    const { x, y } = cur.current;
    setFx((f) => [...f.slice(-16), { id, x, y, e, kind }]);
    // Not tracked in `timers`, so a poke never leaves old effects stuck on screen
    setTimeout(() => alive.current && setFx((f) => f.filter((p) => p.id !== id)), 1700);
  };

  const maxX = Math.max(0, w - SIZE);
  const maxY = H - SIZE;
  const rand = (a: number, b: number) => a + Math.random() * (b - a);

  const pickTarget = () => {
    const x = rand(0, maxX);
    if (ground) return { x, y: maxY - rand(0, 8) };
    if (motion === 'swim') return { x, y: rand(20, maxY - 10) };
    return { x, y: rand(0, maxY) };
  };

  const face = (dx: number) => {
    // Most animal emoji face left, so flip them when they head right
    if (Math.abs(dx) > 4) Animated.timing(flip, { toValue: dx > 0 ? -1 : 1, duration: 140, useNativeDriver: true }).start();
  };

  const moveTo = (to: { x: number; y: number }, duration: number, easing: (v: number) => number, done?: () => void) => {
    face(to.x - cur.current.x);
    Animated.timing(pos, { toValue: to, duration, easing, useNativeDriver: false }).start(({ finished }) => {
      if (finished) done?.();
    });
  };

  const wander = () => {
    if (!alive.current || busy.current || motion === 'still') return;
    const to = pickTarget();
    const dist = Math.hypot(to.x - cur.current.x, to.y - cur.current.y);
    const dur = Math.max(250, (dist / SPEED[motion]) * 1000);

    if (motion === 'hop') {
      Animated.loop(Animated.timing(hop, { toValue: 1, duration: 380, useNativeDriver: true }), {
        iterations: Math.max(1, Math.round(dur / 380)),
      }).start();
    }
    if (motion === 'roll') {
      const dir = to.x > cur.current.x ? 1 : -1;
      spinTurns.current += (dir * dist) / (Math.PI * SIZE);
      Animated.timing(spin, { toValue: spinTurns.current, duration: dur, easing: Easing.linear, useNativeDriver: true }).start();
    }
    if (motion === 'slide') for (let t = 0; t < dur; t += 450) later(() => addFx('💧', 'trail'), t);
    if (motion === 'swim') for (let t = 300; t < dur; t += 900) later(() => addFx('🫧', 'bubble'), t);

    const easing =
      motion === 'scurry' ? Easing.out(Easing.cubic) : motion === 'fly' ? Easing.inOut(Easing.sin) : Easing.inOut(Easing.quad);
    moveTo(to, dur, easing, () => {
      const pause = motion === 'fly' ? rand(150, 600) : motion === 'scurry' ? rand(900, 2200) : rand(500, 1800);
      later(wander, pause);
    });
  };

  // Start the show once we know how wide the terrarium is
  useEffect(() => {
    if (!w) return;
    alive.current = true;
    const id = pos.addListener((v) => (cur.current = v));
    const start = { x: maxX / 2, y: ground ? maxY : maxY / 2 };
    pos.setValue(start);
    cur.current = start;

    const waveMs: Record<Motion, number> = {
      crawl: 160, hop: 1200, fly: 120, slide: 1800, slither: 900, swim: 1800, scurry: 300, roll: 1200, still: 2200,
    };
    const loop = Animated.loop(
      Animated.timing(wave, { toValue: 1, duration: waveMs[motion], easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    later(wander, 700);

    return () => {
      alive.current = false;
      clearTimers();
      loop.stop();
      pos.stopAnimation();
      pos.removeListener(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w]);

  const poke = () => {
    if (busy.current) return;
    busy.current = true;
    setPoked(true);
    clearTimers();
    pos.stopAnimation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const sound = motion === 'hop' || motion === 'swim' ? 'boing' : soundFor(emoji);
    playSound(sound);

    const resume = (ms = 900) =>
      later(() => {
        busy.current = false;
        wander();
      }, ms);
    const { x, y } = cur.current;

    switch (motion) {
      case 'crawl':
      case 'scurry': {
        // Panic and run to the far side
        addFx('💨', 'puff');
        const to = { x: x > maxX / 2 ? rand(0, maxX * 0.15) : rand(maxX * 0.85, maxX), y: ground ? maxY : rand(0, maxY) };
        moveTo(to, 380, Easing.out(Easing.quad), () => resume(1200));
        break;
      }
      case 'fly': {
        // Zoom off the top and come back somewhere else
        moveTo({ x: rand(0, maxX), y: -SIZE - 30 }, 300, Easing.in(Easing.quad), () => {
          pos.setValue({ x: rand(0, maxX), y: -SIZE - 30 });
          later(() => moveTo(pickTarget(), 700, Easing.out(Easing.back(1.5)), () => resume(400)), 700);
        });
        break;
      }
      case 'slither': {
        // Strike forward and recoil
        const dir = x > maxX / 2 ? -1 : 1;
        face(dir);
        moveTo({ x: Math.min(maxX, Math.max(0, x + dir * 70)), y }, 120, Easing.out(Easing.quad), () =>
          moveTo({ x, y }, 450, Easing.inOut(Easing.quad), () => resume(800)),
        );
        break;
      }
      case 'slide': {
        // Retract into a sad little blob
        Animated.sequence([
          Animated.timing(squash, { toValue: 0.5, duration: 250, useNativeDriver: true }),
          Animated.delay(1100),
          Animated.timing(squash, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start(() => resume(300));
        break;
      }
      case 'swim':
      case 'hop': {
        // Big jump with a splash or a thud
        addFx(motion === 'swim' ? '💦' : '💨', 'puff');
        big.setValue(0);
        Animated.timing(big, { toValue: 1, duration: 750, easing: Easing.linear, useNativeDriver: true }).start(() =>
          resume(400),
        );
        break;
      }
      case 'roll': {
        // Curl up and roll across
        const to = { x: x > maxX / 2 ? 0 : maxX, y: maxY };
        const dist = Math.abs(to.x - x);
        spinTurns.current += ((to.x > x ? 1 : -1) * dist) / (Math.PI * SIZE) + (to.x > x ? 1 : -1);
        Animated.timing(spin, { toValue: spinTurns.current, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
        moveTo(to, 900, Easing.out(Easing.quad), () => resume(900));
        break;
      }
      default: {
        // The egg just wobbles
        Animated.sequence([
          Animated.timing(squash, { toValue: 1.15, duration: 90, useNativeDriver: true }),
          Animated.spring(squash, { toValue: 1, friction: 3, useNativeDriver: true }),
        ]).start(() => resume(200));
      }
    }
  };

  // Inner wiggle depends on how the beast moves
  const jitter =
    motion === 'crawl' || motion === 'fly' || motion === 'scurry'
      ? wave.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-5deg', '5deg', '-5deg'] })
      : motion === 'still'
        ? wave.interpolate({ inputRange: [0, 0.8, 0.85, 0.9, 0.95, 1], outputRange: ['0deg', '0deg', '8deg', '-8deg', '4deg', '0deg'] })
        : wave.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-3deg', '3deg', '-3deg'] });
  const bob =
    motion === 'slither' || motion === 'swim'
      ? wave.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -7, 0, 7, 0] })
      : motion === 'fly'
        ? wave.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -4, 0] })
        : wave.interpolate({ inputRange: [0, 1], outputRange: [0, 0] });
  const hopY = hop.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -28, 0] });
  const bigY = big.interpolate({ inputRange: [0, 0.45, 0.9, 1], outputRange: [0, -110, 0, 0] });
  const rotate = spin.interpolate({ inputRange: [-1, 1], outputRange: ['-360deg', '360deg'] });
  const stretch = wave.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.08, 1] });

  return (
    <View style={s.wrap}>
    <View style={s.stage} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      <Habitat week={week} height={H} />
      {fx.map((p) => (
        <FxSprite key={p.id} fx={p} />
      ))}
      {w > 0 && (
        <Animated.View style={[s.beast, { transform: [{ translateX: pos.x }, { translateY: pos.y }] }]}>
          <Pressable onPress={poke} hitSlop={16} accessibilityRole="button" accessibilityLabel="Poke the beast">
            <Animated.View
              style={{
                transform: [
                  { translateY: Animated.add(Animated.add(bob, hopY), bigY) },
                  { scaleX: Animated.multiply(flip, motion === 'slide' ? stretch : 1) },
                  { scaleY: squash },
                  { rotate: jitter },
                  { rotate },
                ],
              }}
            >
              {crown && <Text style={s.crown}>👑</Text>}
              <Text style={s.emoji}>{emoji}</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      )}
    </View>
    <Text style={[s.hint, poked && { opacity: 0 }]}>Poke it 👆</Text>
    </View>
  );
}

function FxSprite({ fx }: { fx: Fx }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [a]);
  const isBubble = fx.kind === 'bubble';
  const isPuff = fx.kind === 'puff';
  return (
    <Animated.Text
      style={[
        s.fx,
        {
          left: fx.x + SIZE / 2 - 10,
          top: fx.y + (isBubble ? 0 : SIZE - 22),
          opacity: a.interpolate({ inputRange: [0, 0.2, 1], outputRange: [isPuff ? 1 : 0.8, isPuff ? 1 : 0.8, 0] }),
          transform: [
            { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, isBubble ? -90 : isPuff ? -10 : 0] }) },
            { scale: a.interpolate({ inputRange: [0, 1], outputRange: isPuff ? [0.6, 1.8] : [1, 0.6] }) },
          ],
        },
      ]}
    >
      {fx.e}
    </Animated.Text>
  );
}

const s = StyleSheet.create({
  wrap: { alignSelf: 'stretch', marginTop: 12, marginBottom: 4 },
  stage: { alignSelf: 'stretch', height: H, borderRadius: 18, overflow: 'hidden', backgroundColor: C.cardHi },
  beast: { position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 58, lineHeight: 70, textAlign: 'center' },
  crown: { position: 'absolute', top: -22, alignSelf: 'center', fontSize: 28 },
  fx: { position: 'absolute', fontSize: 18 },
  hint: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 6 },
});
