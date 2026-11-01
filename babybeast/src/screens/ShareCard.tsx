import { RefObject, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { LAST_WEEK, formatLength, formatWeight, infoForWeek, shortAnimal } from '../pregnancy';
import { BabyFigure } from '../components/BabyFigure';
import { photoUri } from '../photos';
import { Relation, wordsFor } from '../relations';
import { C, ui } from '../theme';


/** One Instagram/Snapchat story-sized image: the beast = the baby, and three ways they differ. */
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = week !== null;
  // Fit a 9:16 card on screen with room for the controls below it
  const cardW = Math.min(winW - 48, (winH * 0.5 * 9) / 16);
  const cardH = (cardW * 16) / 9;

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
    } catch (e) {
      setError(`Couldn't make the image. ${e instanceof Error ? e.message : ''}`.trim());
    } finally {
      setBusy(false);
    }
  };

  const cardProps = { week: week ?? 4, photoFile: withPhoto ? photoFile : undefined, relation, nickname, w: cardW, h: cardH };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={ui.screen} edges={['top', 'bottom']}>
        <View style={ui.header}>
          <Text style={ui.headerTitle}>Share</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={ui.link}>Close</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.body}>
          <StoryCard cardRef={ref} {...cardProps} />

          <View style={s.controls}>
            {photoFile && <Toggle label="Include bump photo" value={withPhoto} onChange={setWithPhoto} />}
            {error && <Text style={{ color: C.danger, textAlign: 'center' }}>{error}</Text>}
            <Pressable style={ui.primaryBtn} onPress={share} disabled={busy}>
              {busy ? <ActivityIndicator color={C.accentText} /> : <Text style={ui.primaryBtnText}>Share image</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function StoryCard({
  cardRef,
  week,
  photoFile,
  relation,
  nickname,
  w,
  h,
}: {
  cardRef: RefObject<View | null>;
  week: number;
  photoFile?: string;
  relation: Relation;
  nickname: string;
  w: number;
  h: number;
}) {
  const info = infoForWeek(week);
  const k = w / 360; // font scale
  const pct = Math.min(100, Math.round((week / LAST_WEEK) * 100));
  const weeksLeft = Math.max(0, LAST_WEEK - week);
  const m = info.animal.match(/^(A|An) /);
  const article = m ? m[1].toLowerCase() : '';
  const name = shortAnimal(info); // "(minus the tail)" doesn't fit on a story
  const rows = info.vs.slice(0, photoFile ? 2 : 3);

  return (
    <View ref={cardRef} collapsable={false} style={[s.card, { width: w, height: h, padding: 24 * k }]}>
      <Text style={[s.week, { fontSize: 15 * k }]}>{`WEEK ${week}`}</Text>

      {photoFile ? (
        <View style={[s.photoWrap, { borderRadius: 20 * k, marginTop: 14 * k }]}>
          <Image source={{ uri: photoUri(photoFile) }} style={s.photo} />
          <View style={[s.badge, { height: 64 * k, borderRadius: 32 * k, right: 12 * k, bottom: 12 * k, paddingHorizontal: 14 * k }]}>
            <Text style={{ fontSize: 30 * k }}>{`${info.emoji} = 👶`}</Text>
          </View>
        </View>
      ) : (
        <View style={[s.match, { gap: 10 * k }]}>
          <Text style={{ fontSize: 96 * k }}>{info.emoji}</Text>
          <Text style={[s.eqSign, { fontSize: 40 * k, lineHeight: 44 * k }]}>=</Text>
          <BabyFigure size={104 * k} />
        </View>
      )}

      <View style={{ marginTop: 10 * k }}>
        <Text style={[s.lead, { fontSize: 16 * k }]}>
          {wordsFor(relation, nickname).shareBaby} is the size of {article}
        </Text>
        <Text style={[s.name, { fontSize: 30 * k, lineHeight: 34 * k }]}>{name}</Text>
        <Text style={[s.stats, { fontSize: 13 * k, marginTop: 4 * k }]}>
          {formatLength(info.lengthCm)} · {formatWeight(info.weightG)} ·{' '}
          <Text style={{ color: C.accent }}>{pct}% cooked</Text>
          {weeksLeft > 0 ? ` · ${weeksLeft} ${weeksLeft === 1 ? 'week' : 'weeks'} to go` : ''}
        </Text>

        {rows.length > 0 && (
          <View style={{ marginTop: 12 * k, gap: 6 * k }}>
            <View style={{ flexDirection: 'row', paddingHorizontal: 8 * k }}>
              <Text style={[s.vsHead, { fontSize: 11 * k }]}>{info.emoji} Beast</Text>
              <Text style={[s.vsHead, { fontSize: 11 * k }]}>👶 Baby</Text>
            </View>
            {rows.map(([topic, a, b]) => (
              <View key={topic} style={[s.vsRow, { borderRadius: 12 * k, padding: 8 * k }]}>
                <Text style={[s.vsTopic, { fontSize: 10 * k }]}>{topic.toUpperCase()}</Text>
                <View style={{ flexDirection: 'row', gap: 8 * k, marginTop: 2 * k }}>
                  <Text style={[s.vsText, { fontSize: 12 * k, lineHeight: 16 * k }]}>{a}</Text>
                  <Text style={[s.vsText, { fontSize: 12 * k, lineHeight: 16 * k }]}>{b}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </View>

    </View>
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
  body: { alignItems: 'center', gap: 16, paddingBottom: 32 },
  card: { backgroundColor: C.bg, borderRadius: 24, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  week: { color: C.accent, fontWeight: '800', letterSpacing: 2 },
  photoWrap: { flex: 1, overflow: 'hidden', backgroundColor: C.card },
  photo: { width: '100%', height: '100%' },
  badge: { position: 'absolute', minWidth: 76, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },
  lead: { color: C.muted, fontWeight: '600' },
  name: { color: C.text, fontWeight: '800' },
  stats: { color: C.muted, fontWeight: '600' },
  controls: { alignSelf: 'stretch', gap: 10, paddingHorizontal: 24 },
  match: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  vsRow: { backgroundColor: C.card },
  vsHead: { flex: 1, color: C.muted, fontWeight: '800' },
  eqSign: { color: C.accent, fontWeight: '900' },
  vsTopic: { color: C.accent, fontWeight: '800', letterSpacing: 1 },
  vsText: { flex: 1, color: C.text },
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
