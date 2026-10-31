import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  FIRST_WEEK,
  LAST_WEEK,
  formatCountdown,
  formatDate,
  formatLength,
  formatWeight,
  MILESTONES,
  infoForWeek,
  progressFromDueDate,
  unlockDate,
  weeksAndDaysText,
} from '../pregnancy';
import { PermissionState } from '../notifications';
import { Relation, capitalize, wordsFor } from '../relations';
import { PhotoMap, loadPhotoMap, loadSeenWeek, saveSeenWeek } from '../storage';
import { BeastStage } from '../components/BeastStage';
import { BeastReveal } from '../components/BeastReveal';
import { photoUri } from '../photos';
import { C, ui } from '../theme';
import { Beastiary } from './Beastiary';
import { Diary } from './Diary';
import { ShareCard } from './ShareCard';
import { Settings } from './Settings';

export function Home({
  dueDate,
  relation,
  nickname,
  onChangeNickname,
  onChangeRelation,
  onChangeDueDate,
  alertsOn,
  onToggleAlerts,
}: {
  dueDate: Date;
  relation: Relation;
  nickname: string;
  onChangeNickname: (n: string) => void;
  onChangeRelation: (r: Relation) => void;
  onChangeDueDate: () => void;
  alertsOn: boolean;
  onToggleAlerts: (on: boolean) => Promise<PermissionState>;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const [photos, setPhotos] = useState<PhotoMap>({});
  const [seenWeek, setSeenWeek] = useState<number | null>(null);
  useEffect(() => {
    loadPhotoMap().then(setPhotos).catch(() => {});
    loadSeenWeek().then(setSeenWeek).catch(() => setSeenWeek(0));
  }, []);

  const progress = progressFromDueDate(dueDate, now);
  const unlocked = Math.min(LAST_WEEK, progress.week); // below FIRST_WEEK means nothing unlocked yet
  const nextWeek = unlocked < LAST_WEEK ? Math.max(FIRST_WEEK, unlocked + 1) : null;
  const nextUnlock = nextWeek ? unlockDate(dueDate, nextWeek) : null;
  const countdown = nextUnlock ? formatCountdown(nextUnlock.getTime() - now.getTime()) : null;
  const homeWeek = unlocked >= FIRST_WEEK ? unlocked : FIRST_WEEK;

  const [shownWeek, setShownWeek] = useState(homeWeek);
  const [sheet, setSheet] = useState<'beastiary' | 'diary' | 'settings' | null>(null);
  const [shareWeek, setShareWeek] = useState<number | null>(null);

  // Jump to the new beast when a week unlocks while the app is open
  const prevUnlocked = useRef(unlocked);
  useEffect(() => {
    if (unlocked !== prevUnlocked.current) {
      prevUnlocked.current = unlocked;
      if (unlocked >= FIRST_WEEK) setShownWeek(unlocked);
    }
  }, [unlocked]);

  const isLocked = shownWeek > unlocked;
  const isCurrent = shownWeek === unlocked;
  const maxBrowsable = nextWeek ?? LAST_WEEK;
  const info = infoForWeek(shownWeek);
  const born = progress.daysLeft < 0;
  const shownPhoto = photos[shownWeek];
  const rel = wordsFor(relation, nickname);
  const isParent = relation === 'parent';
  const hasDiary = relation === 'parent' || relation === 'partner';
  const milestone = MILESTONES[unlocked];
  // A newly unlocked beast arrives as an egg that has to be hatched first
  const needsHatch = isCurrent && unlocked >= FIRST_WEEK && seenWeek !== null && unlocked > seenWeek;
  const hatched = () => {
    setSeenWeek(unlocked);
    saveSeenWeek(unlocked).catch(() => {});
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={ui.header}>
        <View>
          <Text style={ui.headerTitle}>Babybeast</Text>
          {!isParent && (
            <Text style={s.following}>
              {rel.emoji} Following {rel.beast}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconBtn label="Beastiary" icon="▦" onPress={() => setSheet('beastiary')} />
          {hasDiary && <IconBtn label="Bump diary" icon="📷" onPress={() => setSheet('diary')} />}
          <IconBtn label="Settings" icon="⚙︎" onPress={() => setSheet('settings')} />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={ui.card}>
          <Text style={s.weekBig}>
            {progress.week}+{progress.dayOfWeek}
          </Text>
          <Text style={s.weekWords}>{weeksAndDaysText(progress.week, progress.dayOfWeek)}</Text>
          <Text style={ui.muted}>
            {born
              ? `Due date was ${formatDate(dueDate)}`
              : progress.daysLeft === 0
                ? 'Due today!'
                : `${progress.daysLeft} ${progress.daysLeft === 1 ? 'day' : 'days'} to go (due ${formatDate(dueDate)})`}
          </Text>
          <View style={s.bar}>
            <View style={[s.barFill, { width: `${progress.percent}%` }]} />
          </View>
        </View>

        {isLocked ? (
          <View style={s.beastCard}>
            <Text style={s.cardLabel}>Next beast unlocks in</Text>
            <Text style={s.lockEmoji} accessibilityElementsHidden>
              🔒
            </Text>
            {countdown && (
              <View
                style={s.countRow}
                accessible
                accessibilityLabel={`${countdown.d} days, ${countdown.h} hours, ${countdown.m} minutes`}
              >
                <CountUnit value={countdown.d} label="days" />
                <CountUnit value={countdown.h} label="hours" />
                <CountUnit value={countdown.m} label="min" />
                <CountUnit value={countdown.s} label="sec" />
              </View>
            )}
            <Text style={[ui.muted, { marginTop: 16, textAlign: 'center' }]}>
              Week {shownWeek} unlocks on {nextUnlock ? formatDate(nextUnlock) : ''}.{'\n'}
              {capitalize(rel.beast)} is cooking up something gross.
            </Text>
          </View>
        ) : needsHatch ? (
          <View style={s.beastCard}>
            <Text style={s.hatchTitle}>{milestone ? milestone.title : 'A new beast has arrived! 🎉'}</Text>
            <Text style={s.cardLabel}>Week {unlocked} is here. Something is wriggling inside...</Text>
            <BeastReveal key={unlocked} emoji={info.emoji} extra={milestone?.extra} onDone={hatched} />
          </View>
        ) : (
          <View style={s.beastCard}>
            <Text style={s.cardLabel}>
              {isCurrent
                ? `This week ${rel.baby} is about the size of`
                : `In week ${shownWeek} ${rel.baby} was about the size of`}
            </Text>
            <BeastStage key={shownWeek} emoji={info.emoji} week={shownWeek} crown={shownWeek === LAST_WEEK} />
            <Text style={s.beastName}>{info.animal}</Text>

            <View style={s.statsRow}>
              <Stat label="Length" value={formatLength(info.lengthCm)} />
              <Stat label="Weight" value={formatWeight(info.weightG)} />
            </View>

            <View style={s.factBox}>
              <Text style={s.factLabel}>Gross fact</Text>
              <Text style={s.factText}>{info.fact}</Text>
            </View>

            {shownPhoto && (
              <Pressable style={s.photoRow} onPress={() => setSheet('diary')}>
                <Image source={{ uri: photoUri(shownPhoto) }} style={s.thumb} />
                <Text style={[ui.muted, { flex: 1 }]}>Your bump in week {shownWeek}</Text>
              </Pressable>
            )}

            <Pressable style={[ui.primaryBtn, s.shareBtn]} onPress={() => setShareWeek(shownWeek)}>
              <Text style={ui.primaryBtnText}>Share this beast</Text>
            </Pressable>
          </View>
        )}

        {hasDiary && isCurrent && !shownPhoto && !needsHatch && (
          <Pressable style={s.prompt} onPress={() => setSheet('diary')} accessibilityRole="button">
            <Text style={s.promptText}>📸 Add this week's bump photo</Text>
          </Pressable>
        )}

        {!isLocked && !needsHatch && countdown && (
          <Pressable style={s.teaser} onPress={() => nextWeek && setShownWeek(nextWeek)} accessibilityRole="button">
            <Text style={s.teaserText}>
              🔒 Next beast in{' '}
              <Text style={s.teaserTime}>
                {countdown.d > 0 ? `${countdown.d}d ` : ''}
                {countdown.h}h {countdown.m}m
              </Text>
            </Text>
          </Pressable>
        )}

        <View style={s.navRow}>
          <NavBtn label="‹ Previous" disabled={shownWeek <= FIRST_WEEK} onPress={() => setShownWeek((w) => w - 1)} />
          {shownWeek !== homeWeek && <NavBtn label="This week" onPress={() => setShownWeek(homeWeek)} />}
          <NavBtn label="Next ›" disabled={shownWeek >= maxBrowsable} onPress={() => setShownWeek((w) => w + 1)} />
        </View>

        <Text style={[ui.small, { textAlign: 'center' }]}>
          Up to week 19, length is measured crown to rump. From week 20, crown to heel. Rough averages, not
          medical advice.
        </Text>
      </ScrollView>

      <Beastiary
        visible={sheet === 'beastiary'}
        dueDate={dueDate}
        unlocked={unlocked}
        photos={photos}
        onClose={() => setSheet(null)}
        onPick={(w) => {
          setShownWeek(w);
          setSheet(null);
        }}
      />
      <Diary
        visible={sheet === 'diary'}
        unlocked={unlocked}
        photos={photos}
        onClose={() => setSheet(null)}
        onChange={setPhotos}
        onShare={(w) => {
          setSheet(null);
          // Let the diary close before the share sheet opens
          setTimeout(() => setShareWeek(w), 400);
        }}
      />
      <Settings
        visible={sheet === 'settings'}
        dueDate={dueDate}
        currentWeek={homeWeek}
        relation={relation}
        nickname={nickname}
        onChangeNickname={onChangeNickname}
        onChangeRelation={onChangeRelation}
        alertsOn={alertsOn}
        onToggleAlerts={onToggleAlerts}
        onChangeDueDate={onChangeDueDate}
        onClose={() => setSheet(null)}
      />
      <ShareCard
        week={shareWeek}
        photoFile={shareWeek !== null ? photos[shareWeek] : undefined}
        relation={relation}
        nickname={nickname}
        onClose={() => setShareWeek(null)}
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

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={s.countUnit}>
      <Text style={s.countValue}>{String(value).padStart(2, '0')}</Text>
      <Text style={s.countLabel}>{label}</Text>
    </View>
  );
}

function NavBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[s.navBtn, disabled && { opacity: 0.35 }]}
      accessibilityRole="button"
    >
      <Text style={s.navBtnText}>{label}</Text>
    </Pressable>
  );
}

function IconBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={ui.iconBtn} accessibilityLabel={label} accessibilityRole="button" hitSlop={6}>
      <Text style={ui.iconBtnText}>{icon}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  following: { color: C.accent, fontSize: 13, fontWeight: '700', marginTop: 2 },
  content: { padding: 20, paddingTop: 4, paddingBottom: 48, gap: 16 },
  weekWords: { color: C.muted, fontSize: 14, marginTop: -2, marginBottom: 4 },
  weekBig: { color: C.text, fontSize: 44, fontWeight: '800' },
  bar: { height: 8, borderRadius: 4, backgroundColor: C.line, marginTop: 14, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: C.accent },

  beastCard: { backgroundColor: C.card, borderRadius: 24, padding: 24, alignItems: 'center', overflow: 'hidden' },
  beastEmojiWrap: { marginVertical: 12 },
  hatchTitle: { color: C.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  cardLabel: { color: C.muted, fontSize: 15, textAlign: 'center' },
  beastEmoji: { fontSize: 110, marginVertical: 12 },
  beastName: { color: C.text, fontSize: 26, fontWeight: '800', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 20, alignSelf: 'stretch' },
  stat: { flex: 1, backgroundColor: C.cardHi, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  statValue: { color: C.text, fontSize: 17, fontWeight: '700' },
  statLabel: { color: C.muted, fontSize: 13, marginTop: 2 },
  factBox: { marginTop: 16, alignSelf: 'stretch', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.line },
  factLabel: { color: C.accent, fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  factText: { color: C.text, fontSize: 16, lineHeight: 23, marginTop: 6 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch', marginTop: 16 },
  thumb: { width: 54, height: 72, borderRadius: 10, backgroundColor: C.cardHi },
  shareBtn: { alignSelf: 'stretch', marginTop: 16 },

  lockEmoji: { fontSize: 72, marginVertical: 16 },
  countRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  countUnit: { flex: 1, backgroundColor: C.cardHi, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  countValue: { color: C.accent, fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums'] },
  countLabel: { color: C.muted, fontSize: 12, marginTop: 2 },

  prompt: { backgroundColor: C.card, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  promptText: { color: C.text, fontSize: 16, fontWeight: '700' },
  teaser: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
  },
  teaserText: { color: C.muted, fontSize: 15, fontWeight: '600' },
  teaserTime: { color: C.accent, fontWeight: '800', fontVariant: ['tabular-nums'] },

  navRow: { flexDirection: 'row', gap: 12 },
  navBtn: { flex: 1, backgroundColor: C.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  navBtnText: { color: C.text, fontWeight: '700', fontSize: 16 },
});
