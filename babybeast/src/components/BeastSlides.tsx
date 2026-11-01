import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WeekInfo, formatLength, formatWeight, shortAnimal } from '../pregnancy';
import { capitalize } from '../relations';
import { C } from '../theme';
import { BeastStage } from './BeastStage';
import { BabyFigure } from './BabyFigure';

const TABS = ['Beast', 'vs Baby 👶'];

/** Roughly how many points make a centimetre on an iPhone screen. Close enough for "about real size". */
const PT_PER_CM = 62;
/** Longest length we can still draw at real size inside the card. */
const MAX_REAL_CM = 4.2;
const PHONE_CM = 14.7;

type Props = {
  info: WeekInfo;
  baby: string; // "your baby", "your grandbaby", or the nickname
  label: string; // "This week your baby is about the size of"
  crown?: boolean;
};

/** Swipeable cards for one week: the live beast with its gross fact, and the beast next to the baby. */
export function BeastSlides({ info, baby, label, crown }: Props) {
  const [w, setW] = useState(0);
  const [page, setPage] = useState(0);
  const ref = useRef<ScrollView>(null);

  const goTo = (i: number) => {
    setPage(i);
    ref.current?.scrollTo({ x: i * w, animated: true });
  };
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (w > 0) setPage(Math.round(e.nativeEvent.contentOffset.x / w));
  };

  return (
    <View style={s.wrap} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <View style={s.tabs} accessibilityRole="tablist">
        {TABS.map((t, i) => (
          <Pressable
            key={t}
            onPress={() => goTo(i)}
            style={[s.tab, page === i && s.tabOn]}
            accessibilityRole="tab"
            accessibilityState={{ selected: page === i }}
          >
            <Text style={[s.tabText, page === i && s.tabTextOn]} numberOfLines={1}>
              {t}
            </Text>
          </Pressable>
        ))}
      </View>

      {w > 0 && (
        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          style={{ width: w }}
        >
          <View style={[s.page, { width: w }]}>
            <Text style={s.cardLabel}>{label}</Text>
            <BeastStage emoji={info.emoji} week={info.week} crown={crown} />
            <Text style={s.beastName}>{info.animal}</Text>
            <View style={s.statsRow}>
              <Stat label="Length" value={formatLength(info.lengthCm)} />
              <Stat label="Weight" value={formatWeight(info.weightG)} />
            </View>
            <Pressable style={s.compare} onPress={() => goTo(1)} accessibilityRole="button" accessibilityLabel={`Compare the ${shortAnimal(info)} with ${baby}`}>
              <Text style={s.compareEmoji}>{info.emoji} = 👶</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.compareTitle}>Same size as {baby}</Text>
                <Text style={s.compareSub}>See how they compare</Text>
              </View>
              <Text style={s.compareArrow}>›</Text>
            </Pressable>
            <View style={s.factBox}>
              <Text style={s.factLabel}>Gross fact 🤢</Text>
              <Text style={s.factText}>{info.fact}</Text>
            </View>
          </View>

          <View style={[s.page, { width: w }]}>
            <SideBySide info={info} baby={baby} />
          </View>

        </ScrollView>
      )}

      <View style={s.dots} accessibilityElementsHidden>
        {TABS.map((t, i) => (
          <View key={t} style={[s.dot, page === i && s.dotOn]} />
        ))}
      </View>
    </View>
  );
}

/** Length in phones (about 14.7 cm each), in words. */
function phoneText(phones: number): string {
  if (phones < 0.3) return 'About a quarter of a phone long';
  if (phones < 0.42) return 'About a third of a phone long';
  if (phones < 0.6) return 'About half a phone long';
  if (phones < 0.85) return 'About three quarters of a phone long';
  if (phones < 1.15) return 'About one phone long';
  return `About ${phones.toFixed(1).replace(/\.0$/, '')} phones long`;
}

function SideBySide({ info, baby }: { info: WeekInfo; baby: string }) {
  const BOX = 100;
  const real = info.lengthCm <= MAX_REAL_CM;
  const phones = info.lengthCm / PHONE_CM;
  const who = capitalize(baby.replace(/^your /, ''));
  return (
    <>
      <Text style={s.slideTitle}>
        {shortAnimal(info)} vs. {baby.startsWith('your ') ? baby.slice(5) : baby}
      </Text>
      <Text style={s.slideSub}>Same size. Spot the differences</Text>
      <View style={s.vsRow}>
        <View style={s.vsCol}>
          <View style={[s.vsBox, { height: BOX }]}>
            <Text style={{ fontSize: BOX * 0.78 }}>{info.emoji}</Text>
          </View>
          <Text style={s.vsLabel}>{shortAnimal(info)}</Text>
        </View>
        <View style={s.eq}>
          <Text style={s.eqSign}>=</Text>
          <Text style={s.eqLen}>{formatLength(info.lengthCm).split(' (')[0]}</Text>
        </View>
        <View style={s.vsCol}>
          <View style={[s.vsBox, { height: BOX }]}>
            <BabyFigure size={BOX * 0.9} />
          </View>
          <Text style={s.vsLabel}>{who}</Text>
        </View>
      </View>
      <View style={s.diffHead}>
        <Text style={s.diffHeadText}>{info.emoji} Beast</Text>
        <Text style={s.diffHeadText}>👶 {who}</Text>
      </View>
      <View style={s.diffs}>
        {info.vs.map(([topic, beastSide, babySide]) => (
          <View key={topic} style={s.diff} accessible accessibilityLabel={`${topic}. Beast: ${beastSide}. Baby: ${babySide}.`}>
            <Text style={s.diffTopic}>{topic}</Text>
            <View style={s.diffRow}>
              <Text style={s.diffText}>{beastSide}</Text>
              <View style={s.diffSplit} />
              <Text style={s.diffText}>{babySide}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={s.factBox}>
        <Text style={s.factLabel}>Meanwhile, in there 🔦</Text>
        <Text style={s.factText}>{info.baby}</Text>
      </View>
      <View style={s.ruler}>
        <View style={s.rulerLine} />
        <Text style={s.rulerText}>both about {formatLength(info.lengthCm)}</Text>
      </View>
      {real ? (
        <View style={s.realRow}>
          <Text style={s.realLabel}>Real size, roughly:</Text>
          <View
            style={[
              s.realBar,
              { width: Math.max(4, info.lengthCm * PT_PER_CM), height: Math.max(4, Math.min(14, info.lengthCm * 18)) },
            ]}
          />
        </View>
      ) : (
        <View style={s.realRow}>
          <Text style={s.realLabel}>{phoneText(phones)}</Text>
          {phones >= 0.85 && <Text style={s.phones}>{'📱'.repeat(Math.round(phones))}</Text>}
        </View>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 999, backgroundColor: C.cardHi, alignItems: 'center' },
  tabOn: { backgroundColor: C.accent },
  tabText: { color: C.muted, fontSize: 12, fontWeight: '700' },
  tabTextOn: { color: C.accentText },
  page: { alignItems: 'center' },

  cardLabel: { color: C.muted, fontSize: 15, textAlign: 'center' },
  beastName: { color: C.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 20, alignSelf: 'stretch' },
  stat: { flex: 1, backgroundColor: C.cardHi, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  statValue: { color: C.text, fontSize: 17, fontWeight: '700' },
  statLabel: { color: C.muted, fontSize: 13, marginTop: 2 },

  factBox: { marginTop: 16, alignSelf: 'stretch', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.line },
  factLabel: { color: C.accent, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  factText: { color: C.text, fontSize: 16, lineHeight: 23, marginTop: 6 },
  slideTitle: { color: C.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  slideSub: { color: C.muted, fontSize: 14, textAlign: 'center', marginTop: 2, marginBottom: 14 },

  vsRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', justifyContent: 'center', gap: 8 },
  vsCol: { flex: 1, alignItems: 'center' },
  vsBox: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: C.cardHi, borderRadius: 18 },
  vsLabel: { color: C.text, fontSize: 15, fontWeight: '700', marginTop: 8 },
  eq: { alignItems: 'center', width: 54 },
  eqSign: { color: C.accent, fontSize: 30, fontWeight: '900', lineHeight: 32 },
  eqLen: { color: C.accent, fontSize: 12, fontWeight: '800' },
  compare: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', marginTop: 16, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  compareEmoji: { fontSize: 22 },
  compareTitle: { color: C.accentText, fontSize: 15, fontWeight: '800' },
  compareSub: { color: C.accentText, fontSize: 13, opacity: 0.75 },
  compareArrow: { color: C.accentText, fontSize: 26, fontWeight: '800' },
  diffs: { alignSelf: 'stretch', marginTop: 6, gap: 8 },
  diffHead: { flexDirection: 'row', alignSelf: 'stretch', marginTop: 16, paddingHorizontal: 12 },
  diffHeadText: { flex: 1, textAlign: 'center', color: C.muted, fontSize: 12, fontWeight: '800' },
  diff: { backgroundColor: C.cardHi, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  diffTopic: { color: C.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  diffRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10 },
  diffText: { flex: 1, color: C.text, fontSize: 14, lineHeight: 19, textAlign: 'center' },
  diffSplit: { width: 1, alignSelf: 'stretch', backgroundColor: C.line },
  ruler: { alignSelf: 'stretch', alignItems: 'center', marginTop: 14 },
  rulerLine: { alignSelf: 'stretch', height: 2, backgroundColor: C.line },
  rulerText: { color: C.muted, fontSize: 13, marginTop: 6 },
  realRow: { alignItems: 'center', marginTop: 14, gap: 8 },
  realLabel: { color: C.text, fontSize: 14, fontWeight: '700' },
  realBar: { backgroundColor: C.accent, borderRadius: 3 },
  phones: { fontSize: 26, letterSpacing: 2 },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.line },
  dotOn: { backgroundColor: C.accent, width: 16 },
});
