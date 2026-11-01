import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WeekInfo, formatLength, formatWeight } from '../pregnancy';
import { capitalize } from '../relations';
import { C } from '../theme';
import { BeastStage } from './BeastStage';

const TABS = ['Beast', 'vs Baby'];

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

function SideBySide({ info, baby }: { info: WeekInfo; baby: string }) {
  const BOX = 100;
  const real = info.lengthCm <= MAX_REAL_CM;
  const phones = info.lengthCm / PHONE_CM;
  return (
    <>
      <Text style={s.slideTitle}>Beast vs. baby</Text>
      <Text style={s.slideSub}>Same length. Spot the differences</Text>
      <View style={s.vsRow}>
        <View style={s.vsCol}>
          <View style={[s.vsBox, { height: BOX }]}>
            <Text style={{ fontSize: BOX * 0.78 }}>{info.emoji}</Text>
          </View>
          <Text style={s.vsLabel}>The beast</Text>
        </View>
        <Text style={s.vs}>vs</Text>
        <View style={s.vsCol}>
          <View style={[s.vsBox, { height: BOX }]}>
            <BabyFigure size={BOX * 0.9} />
          </View>
          <Text style={s.vsLabel}>{capitalize(baby.replace(/^your /, ''))}</Text>
        </View>
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
          <Text style={s.realLabel}>
            {phones < 1.15 ? 'About one phone long' : `About ${phones.toFixed(1).replace(/\.0$/, '')} phones long`}
          </Text>
          <Text style={s.phones}>{'📱'.repeat(Math.max(1, Math.round(phones)))}</Text>
        </View>
      )}
    </>
  );
}

/** A soft, simple curled-up baby, drawn with plain shapes so it stays cute at any size. */
function BabyFigure({ size }: { size: number }) {
  const skin = '#F2B8A8';
  const shade = '#E29A88';
  return (
    <View style={{ width: size, height: size }} accessibilityLabel="Baby" accessible>
      <View
        style={{
          position: 'absolute',
          left: size * 0.12,
          top: size * 0.32,
          width: size * 0.58,
          height: size * 0.62,
          borderRadius: size * 0.3,
          backgroundColor: skin,
          transform: [{ rotate: '-25deg' }],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: size * 0.38,
          top: size * 0.04,
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size * 0.25,
          backgroundColor: skin,
        }}
      />
      {/* closed eye */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.62,
          top: size * 0.26,
          width: size * 0.1,
          height: size * 0.05,
          borderBottomWidth: 2,
          borderColor: '#8A5548',
          borderRadius: size * 0.05,
        }}
      />
      {/* arm */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.46,
          top: size * 0.5,
          width: size * 0.26,
          height: size * 0.12,
          borderRadius: size * 0.06,
          backgroundColor: shade,
          transform: [{ rotate: '-35deg' }],
        }}
      />
      {/* leg */}
      <View
        style={{
          position: 'absolute',
          left: size * 0.3,
          top: size * 0.78,
          width: size * 0.36,
          height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: shade,
        }}
      />
    </View>
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
  vs: { color: C.accent, fontSize: 18, fontWeight: '900' },
  diffs: { alignSelf: 'stretch', marginTop: 14, gap: 8 },
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
