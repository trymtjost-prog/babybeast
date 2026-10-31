import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIRST_WEEK, infoForWeek } from '../pregnancy';
import { PhotoMap } from '../storage';
import { PhotoSource, deleteWeekPhoto, photoUri, pickPhoto, saveWeekPhoto } from '../photos';
import { C, ui } from '../theme';
import { shortName } from './Beastiary';

export function Diary({
  visible,
  unlocked,
  photos,
  onClose,
  onChange,
  onShare,
}: {
  visible: boolean;
  unlocked: number;
  photos: PhotoMap;
  onClose: () => void;
  onChange: (map: PhotoMap) => void;
  onShare: (week: number) => void;
}) {
  const weeks: number[] = [];
  for (let w = unlocked; w >= FIRST_WEEK; w--) weeks.push(w);
  const count = weeks.filter((w) => photos[w]).length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={ui.screen} edges={['top', 'bottom']}>
        <View style={ui.header}>
          <View>
            <Text style={ui.headerTitle}>Bump diary</Text>
            <Text style={ui.muted}>
              {count} {count === 1 ? 'photo' : 'photos'} · one per beast
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={ui.link}>Done</Text>
          </Pressable>
        </View>

        {weeks.length === 0 ? (
          <View style={[ui.center, { flex: 1, padding: 32 }]}>
            <Text style={[ui.muted, { textAlign: 'center' }]}>
              Your first beast unlocks in week {FIRST_WEEK}. That's when the diary opens.
            </Text>
          </View>
        ) : (
          <FlatList
            data={weeks}
            numColumns={2}
            keyExtractor={(w) => String(w)}
            contentContainerStyle={s.grid}
            columnWrapperStyle={{ gap: 12 }}
            ListFooterComponent={
              <Text style={[ui.small, { textAlign: 'center', marginTop: 12 }]}>
                Photos are stored only on this phone.
              </Text>
            }
            renderItem={({ item }) => (
              <DiaryTile
                week={item}
                fileName={photos[item]}
                current={item === unlocked}
                onChange={onChange}
                onShare={() => onShare(item)}
              />
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function DiaryTile({
  week,
  fileName,
  current,
  onChange,
  onShare,
}: {
  week: number;
  fileName?: string;
  current: boolean;
  onChange: (map: PhotoMap) => void;
  onShare: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const info = infoForWeek(week);

  const add = async (source: PhotoSource) => {
    setBusy(true);
    try {
      const uri = await pickPhoto(source);
      if (uri) onChange(await saveWeekPhoto(week, uri));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      onChange(await deleteWeekPhoto(week));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[s.tile, current && s.tileNow]}>
      <View style={s.tileHead}>
        <Text style={s.week}>Week {week}</Text>
        <Text style={s.beast} numberOfLines={1}>
          {info.emoji} {shortName(info.animal)}
        </Text>
      </View>

      <View style={s.photoBox}>
        {busy ? (
          <ActivityIndicator color={C.accent} />
        ) : fileName ? (
          <Image source={{ uri: photoUri(fileName) }} style={s.photo} accessibilityLabel={`Bump photo, week ${week}`} />
        ) : (
          <Text style={s.empty}>📷</Text>
        )}
      </View>

      {fileName ? (
        <View style={s.actions}>
          <SmallBtn label="Share" onPress={onShare} strong />
          <SmallBtn label="Remove" onPress={remove} />
        </View>
      ) : (
        <View style={s.actions}>
          <SmallBtn label="Camera" onPress={() => add('camera')} strong />
          <SmallBtn label="Library" onPress={() => add('library')} />
        </View>
      )}
    </View>
  );
}

function SmallBtn({ label, onPress, strong }: { label: string; onPress: () => void; strong?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[s.smallBtn, strong && s.smallBtnStrong]} accessibilityRole="button">
      <Text style={[s.smallBtnText, strong && { color: C.accentText }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  grid: { padding: 16, gap: 12 },
  tile: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 10, gap: 8, maxWidth: '50%' },
  tileNow: { borderWidth: 2, borderColor: C.accent },
  tileHead: { gap: 2 },
  week: { color: C.text, fontWeight: '800', fontSize: 15 },
  beast: { color: C.muted, fontSize: 12 },
  photoBox: {
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: C.cardHi,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  empty: { fontSize: 32, opacity: 0.5 },
  actions: { flexDirection: 'row', gap: 6 },
  smallBtn: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: C.line },
  smallBtnStrong: { backgroundColor: C.accent, borderColor: C.accent },
  smallBtnText: { color: C.text, fontWeight: '700', fontSize: 13 },
});
