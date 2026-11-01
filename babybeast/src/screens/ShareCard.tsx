import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { LAST_WEEK, formatLength, formatWeight, infoForWeek } from '../pregnancy';
import { Habitat } from '../components/Habitat';
import { photoUri } from '../photos';
import { Relation, wordsFor } from '../relations';
import { C, ui } from '../theme';

type Extra = 'fact' | 'vs';
const EXTRAS: { id: Extra; label: string }[] = [
  { id: 'fact', label: 'Gross fact' },
  { id: 'vs', label: 'vs Baby' },
];

/** Instagram/Snapchat story-sized image of a week's beast, optionally with the bump photo. */
export function ShareCard({
  week,
  photoFile,
  relation,
  nickname = '',
  onClose,
}: {
  week: number | null;
  photoFile?: string;
  relation: Relation;
  nickname?: string;
  onClose: () => void;
}) {
  const ref = useRef<View>(null);
  const { width: winW, height: winH } = useWindowDimensions();
  const [withPhoto, setWithPhoto] = useState(true);
  const [secret, setSecret] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extra, setExtra] = useState<Extra>('fact');
  const [stageH, setStageH] = useState(0);

  const visible = week !== null;
  const info = infoForWeek(week ?? 4);
  const usePhoto = !!photoFile && withPhoto;
  // Secret mode only ever shows the gross fact: vs Baby gives the game away
  const shownExtra: Extra = secret ? 'fact' : extra;
  const wk = week ?? 4;
  const pct = Math.min(100, Math.round((wk / LAST_WEEK) * 100));
  const weeksLeft = Math.max(0, LAST_WEEK - wk);
  const m = info.animal.match(/^(A|An) (.*)$/);
  const article = m ? m[1].toLowerCase() : '';
  const name = m ? m[2] : info.animal;

  // Fit a 9:16 card on screen with room for the controls below it
  const cardW = Math.min(winW - 48, (winH * 0.55 * 9) / 16);
  const cardH = (cardW * 16) / 9;
  const k = cardW / 360; // font scale

  const share = async () => {
    setError(null);
    setBusy(true);
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: 1920 });
      if (!(await Sharing.isAvailableAsync())) {
        setError("Sharing isn't available on this device.");
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share your beast' });
    } catch {
      setError("Couldn't make the image. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={ui.screen} edges={['top', 'bottom']}>
        <View style={ui.header}>
          <Text style={ui.headerTitle}>Share</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={ui.link}>Close</Text>
          </Pressable>
        </View>

        <View style={s.body}>
          <View ref={ref} collapsable={false} style={[s.card, { width: cardW, height: cardH, padding: 24 * k }]}>
            <Text style={[s.week, { fontSize: 15 * k }]}>{secret ? 'THIS WEEK' : `WEEK ${week}`}</Text>

            {usePhoto ? (
              <View style={[s.photoWrap, { borderRadius: 20 * k, marginTop: 14 * k }]}>
                <Image source={{ uri: photoUri(photoFile!) }} style={s.photo} />
                <View style={[s.badge, { width: 76 * k, height: 76 * k, borderRadius: 38 * k, right: 12 * k, bottom: 12 * k }]}>
                  <Text style={{ fontSize: 44 * k }}>{info.emoji}</Text>
                </View>
              </View>
            ) : (
              <View
                style={[s.stage, { borderRadius: 20 * k, marginTop: 14 * k }]}
                onLayout={(e) => setStageH(e.nativeEvent.layout.height)}
              >
                {stageH > 0 && <Habitat week={wk} height={stageH} />}
                <Text style={{ fontSize: 120 * k }}>{info.emoji}</Text>
              </View>
            )}

            <View style={{ marginTop: 14 * k }}>
              <Text style={[s.lead, { fontSize: 16 * k }]}>
                {secret ? wordsFor(relation).shareBeast : wordsFor(relation, nickname).shareBaby} is the size of {article}
              </Text>
              <Text style={[s.name, { fontSize: 30 * k, lineHeight: 34 * k }]}>{name.replace(/^./, (c) => c.toUpperCase())}</Text>
              {!secret && (
                <Text style={[s.stats, { fontSize: 14 * k, marginTop: 4 * k }]}>
                  {formatLength(info.lengthCm)} · {formatWeight(info.weightG)}
                </Text>
              )}

              {!secret && (
                <View style={{ marginTop: 12 * k }}>
                  <View style={{ height: 22 * k, justifyContent: 'center' }}>
                    <View style={[s.rail, { height: 7 * k, borderRadius: 4 * k, left: 10 * k, right: 10 * k }]} />
                    <View
                      style={[
                        s.railFill,
                        { height: 7 * k, borderRadius: 4 * k, left: 10 * k, width: `${pct * 0.9}%` },
                      ]}
                    />
                    <Text style={{ position: 'absolute', right: -2 * k, fontSize: 14 * k }}>🏁</Text>
                    <Text style={{ position: 'absolute', left: `${pct * 0.9}%`, fontSize: 18 * k }}>{info.emoji}</Text>
                  </View>
                  <Text style={[s.stats, { fontSize: 13 * k, marginTop: 2 * k }]}>
                    <Text style={{ color: C.accent }}>{pct}% cooked</Text>
                    {weeksLeft > 0 ? ` · ${weeksLeft} ${weeksLeft === 1 ? 'week' : 'weeks'} to go` : ' · Due now!'}
                  </Text>
                </View>
              )}

              {shownExtra === 'fact' && (
                <Text style={[s.fact, { fontSize: 14 * k, lineHeight: 20 * k, marginTop: 12 * k }]}>🤢 {info.fact}</Text>
              )}
              {shownExtra === 'vs' && (
                <View style={{ marginTop: 12 * k, gap: 6 * k }}>
                  {info.vs.slice(0, usePhoto ? 1 : 2).map(([topic, a, b]) => (
                    <View key={topic} style={[s.vsRow, { borderRadius: 12 * k, padding: 8 * k }]}>
                      <Text style={[s.vsTopic, { fontSize: 10 * k }]}>{topic.toUpperCase()}</Text>
                      <View style={{ flexDirection: 'row', gap: 8 * k, marginTop: 2 * k }}>
                        <Text style={[s.vsText, { fontSize: 12 * k, lineHeight: 16 * k }]}>
                          {info.emoji} {a}
                        </Text>
                        <Text style={[s.vsText, { fontSize: 12 * k, lineHeight: 16 * k }]}>👶 {b}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <Text style={[s.brand, { fontSize: 13 * k, marginTop: 18 * k }]}>🪳 babybeast</Text>
          </View>

          <View style={s.controls}>
            {!secret && (
              <View style={s.chips} accessibilityRole="radiogroup">
                {EXTRAS.map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() => setExtra(e.id)}
                    style={[s.chip, extra === e.id && s.chipOn]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: extra === e.id }}
                  >
                    <Text style={[s.chipText, extra === e.id && s.chipTextOn]}>{e.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {photoFile && <Toggle label="Include bump photo" value={withPhoto} onChange={setWithPhoto} />}
            <Toggle label="Secret mode (just beast, no week)" value={secret} onChange={setSecret} />
            {error && <Text style={{ color: C.danger, textAlign: 'center' }}>{error}</Text>}
            <Pressable style={ui.primaryBtn} onPress={share} disabled={busy}>
              {busy ? <ActivityIndicator color={C.accentText} /> : <Text style={ui.primaryBtnText}>Share image</Text>}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.toggle}>
      <Text style={s.toggleText}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: C.accent, false: C.line }} accessibilityLabel={label} />
    </View>
  );
}

const s = StyleSheet.create({
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  card: { backgroundColor: C.bg, borderRadius: 24, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  week: { color: C.accent, fontWeight: '800', letterSpacing: 2 },
  photoWrap: { flex: 1, overflow: 'hidden', backgroundColor: C.card },
  photo: { width: '100%', height: '100%' },
  badge: { position: 'absolute', backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  lead: { color: C.muted, fontWeight: '600' },
  name: { color: C.text, fontWeight: '800' },
  stats: { color: C.muted, fontWeight: '600' },
  fact: { color: C.text },
  brand: { color: C.muted, fontWeight: '700' },
  controls: { alignSelf: 'stretch', gap: 10 },
  stage: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  rail: { position: 'absolute', backgroundColor: C.line },
  railFill: { position: 'absolute', backgroundColor: C.accent },
  vsRow: { backgroundColor: C.card },
  vsTopic: { color: C.accent, fontWeight: '800', letterSpacing: 1 },
  vsText: { flex: 1, color: C.text },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: C.card, alignItems: 'center' },
  chipOn: { backgroundColor: C.accent },
  chipText: { color: C.muted, fontWeight: '700', fontSize: 14 },
  chipTextOn: { color: C.accentText },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toggleText: { color: C.text, fontSize: 15, fontWeight: '600', flex: 1, marginRight: 12 },
});
