import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const SOURCES = {
  buzz: require('../assets/sounds/buzz.wav'),
  squish: require('../assets/sounds/squish.wav'),
  burp: require('../assets/sounds/burp.wav'),
  boing: require('../assets/sounds/boing.wav'),
  pop: require('../assets/sounds/pop.wav'),
  tap: require('../assets/sounds/tap.wav'),
};
export type SoundName = keyof typeof SOURCES;

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let modeSet = false;

/** Plays a short sound effect. Respects the phone's silent switch, and never throws. */
export function playSound(name: SoundName) {
  try {
    if (!modeSet) {
      modeSet = true;
      setAudioModeAsync({ playsInSilentMode: false }).catch(() => {});
    }
    let p = players[name];
    if (!p) {
      p = createAudioPlayer(SOURCES[name]);
      players[name] = p;
    }
    p.seekTo(0);
    p.play();
  } catch {
    // Sound is a bonus; ignore any audio problems
  }
}

const BUGGY = ['🪳', '🐜', '🐝', '🪰', '🦗', '🕷️', '🦂', '🪲', '🐛', '🥚'];
const SLIMY = ['🐌', '🪱', '🐸', '🐟', '🐍', '🦎'];

/** The sound a beast makes when you poke it. */
export function soundFor(emoji: string): SoundName {
  if (BUGGY.includes(emoji)) return 'buzz';
  if (SLIMY.includes(emoji)) return 'squish';
  return 'burp';
}
