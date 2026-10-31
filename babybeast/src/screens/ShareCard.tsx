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
import { formatLength, formatWeight, infoForWeek } from '../pregnancy';
import { photoUri } from '../photos';
import { Relation, relationInfo } from '../relations';
import { C, ui } from '../theme';

/** Instagram/Snapchat story-sized image of a week's beast, optionally with the bump photo. */
export function ShareCard({
  week,
  photoFile,
  relation,
  onClose,
}: {
  week: number | null;
  photoFile?: string;
  relation: Relation;
  onClose: () => void;
}) {
  const ref = useRef<View>(null);
  const { width: winW, height: winH } = useWindowDimensions();
  const [withPhoto, setWithPhoto] = useState(true);
  const [secret, setSecret] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = week !== null;
  const info = infoForWeek(week ?? 4);
  const usePhoto = !!photoFile && withPhoto;
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
              <View style={[s.center, { flex: 1 }]}>
                <Text style={{ fontSize: 150 * k }}>{info.emoji}</Text>
              </View>
            )}

            <View style={{ marginTop: 16 * k }}>
              <Text style={[s.lead, { fontSize: 16 * k }]}>
                {secret ? relationInfo(relation).shareBeast : relationInfo(relation).shareBaby} is the size of {article}
              </Text>
              <Text style={[s.name, { fontSize: 32 * k, lineHeight: 36 * k }]}>{name.replace(/^./, (c) => c.toUpperCase())}</Text>
              {!secret && (
                <Text style={[s.stats, { fontSize: 14 * k, marginTop: 6 * k }]}>
                  {formatLength(info.lengthCm)} · {formatWeight(info.weightG)}
                </Text>
              )}
              {!usePhoto && (
                <Text style={[s.fact, { fontSize: 14 * k, lineHeight: 20 * k, marginTop: 14 * k }]}>{info.fact}</Text>
              )}
            </View>

            <Text style={[s.brand, { fontSize: 13 * k, marginTop: 18 * k }]}>🪳 babybeast</Text>
          </View>

          <View style={s.controls}>
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
  center: { alignItems: 'center', justifyContent: 'center' },
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
