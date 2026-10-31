import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FIRST_WEEK, WEEKS, formatShortDate, unlockDate } from '../pregnancy';
import { PhotoMap } from '../storage';
import { C, ui } from '../theme';

export function shortName(animal: string): string {
  return animal.replace(/^(A|An|The) /, '').replace(/ \(.*\)$/, '');
}

export function Beastiary({
  visible,
  dueDate,
  unlocked,
  photos,
  onClose,
  onPick,
}: {
  visible: boolean;
  dueDate: Date;
  unlocked: number;
  photos: PhotoMap;
  onClose: () => void;
  onPick: (week: number) => void;
}) {
  const collected = Math.max(0, unlocked - FIRST_WEEK + 1);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={ui.screen} edges={['top', 'bottom']}>
        <View style={ui.header}>
          <View>
            <Text style={ui.headerTitle}>Beastiary</Text>
            <Text style={ui.muted}>
              {collected} of {WEEKS.length} beasts collected
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={ui.link}>Done</Text>
          </Pressable>
        </View>
        <FlatList
          data={WEEKS}
          numColumns={3}
          keyExtractor={(w) => String(w.week)}
          contentContainerStyle={s.grid}
          columnWrapperStyle={{ gap: 10 }}
          renderItem={({ item }) => {
            const locked = item.week > unlocked;
            const isNext = item.week === Math.max(FIRST_WEEK, unlocked + 1);
            const isNow = item.week === unlocked;
            return (
              <Pressable
                onPress={() => onPick(item.week)}
                disabled={locked && !isNext}
                style={[s.tile, isNow && s.tileNow, locked && s.tileLocked]}
                accessibilityLabel={locked ? `Week ${item.week}, locked` : `Week ${item.week}, ${item.animal}`}
              >
                <Text style={s.week}>{item.week}</Text>
                {!locked && photos[item.week] && <View style={s.photoDot} />}
                <Text style={[s.emoji, locked && s.emojiLocked]}>{locked ? '?' : item.emoji}</Text>
                <Text style={[s.name, locked && { color: C.muted }]} numberOfLines={2}>
                  {locked ? formatShortDate(unlockDate(dueDate, item.week)) : shortName(item.animal)}
                </Text>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  grid: { padding: 16, gap: 10 },
  tile: {
    flex: 1,
    aspectRatio: 0.8,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileNow: { borderWidth: 2, borderColor: C.accent },
  tileLocked: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.line, borderStyle: 'dashed' },
  week: { position: 'absolute', top: 8, left: 10, color: C.muted, fontSize: 12, fontWeight: '700' },
  photoDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  emoji: { fontSize: 40 },
  emojiLocked: { color: C.line, fontWeight: '800', fontSize: 36 },
  name: { color: C.text, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 6 },
});
