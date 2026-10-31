import { useEffect, useState } from 'react';
import { Keyboard, Linking, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDate } from '../pregnancy';
import { encodePartnerCode, partnerLink } from '../partner';
import { PermissionState, getPermission, sendTestAlert } from '../notifications';
import { JOIN_RELATIONS, Relation, RelationInfo, relationInfo } from '../relations';
import { C, ui } from '../theme';

export function Settings({
  visible,
  dueDate,
  currentWeek,
  relation,
  nickname,
  onChangeNickname,
  onChangeRelation,
  alertsOn,
  onToggleAlerts,
  onChangeDueDate,
  onClose,
}: {
  visible: boolean;
  dueDate: Date;
  currentWeek: number;
  relation: Relation;
  nickname: string;
  onChangeNickname: (n: string) => void;
  onChangeRelation: (r: Relation) => void;
  alertsOn: boolean;
  onToggleAlerts: (on: boolean) => Promise<PermissionState>;
  onChangeDueDate: () => void;
  onClose: () => void;
}) {
  const [permission, setPermission] = useState<PermissionState>('undetermined');
  const [testSent, setTestSent] = useState(false);
  const code = encodePartnerCode(dueDate);
  // 'anyone' is for group chats: no relation in the link, everyone picks their own when they join
  const [inviteAs, setInviteAs] = useState<Relation | 'anyone'>('anyone');
  const invitee = inviteAs === 'anyone' ? null : relationInfo(inviteAs);
  const me = relationInfo(relation);
  const [nick, setNick] = useState(nickname);
  const [nickSaved, setNickSaved] = useState(false);
  const saveNick = () => {
    Keyboard.dismiss();
    const n = nick.trim();
    if (n !== nickname) onChangeNickname(n);
    setNickSaved(true);
  };

  useEffect(() => {
    if (visible) {
      setTestSent(false);
      getPermission().then(setPermission).catch(() => {});
    }
  }, [visible]);

  const sendInvite = () =>
    Share.share({
      message: invitee
        ? `${invitee.invite} 🪳\n\n` +
          `Follow along on Babybeast: get the app, tap "Got an invite code?" and enter ${code}, ` +
          `then pick "${invitee.label}".\n\n` +
          `Already have the app? Open this: ${partnerLink(dueDate, invitee.id)}`
        : `We've got a beast on the way! 🪳\n\n` +
          `Follow along on Babybeast: get the app, tap "Got an invite code?" and enter ${code}. ` +
          `Then pick who you are to the beast, and it'll get its own name just for you.\n\n` +
          `Already have the app? Open this: ${partnerLink(dueDate)}`,
    }).catch(() => {});

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={ui.screen} edges={['top', 'bottom']}>
        <View style={ui.header}>
          <Text style={ui.headerTitle}>Settings</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={ui.link}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={[s.box, s.row]}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Due date</Text>
              <Text style={s.sub}>{formatDate(dueDate)}</Text>
            </View>
            <Pressable onPress={onChangeDueDate} hitSlop={8} accessibilityRole="button">
              <Text style={ui.link}>Change</Text>
            </Pressable>
          </View>

          <View style={s.box}>
            <Text style={s.title}>Nickname</Text>
            <Text style={s.sub}>
              Give the beast a name, and the app uses it everywhere: "Bob is now the size of a toad". Leave it empty
              to keep it anonymous.
            </Text>
            <View style={s.nickRow}>
              <TextInput
                value={nick}
                onChangeText={(t) => {
                  setNick(t);
                  setNickSaved(false);
                }}
                onSubmitEditing={saveNick}
                placeholder="e.g. Bob"
                placeholderTextColor={C.muted}
                maxLength={20}
                autoCorrect={false}
                returnKeyType="done"
                style={[s.input, { flex: 1 }]}
                accessibilityLabel="Nickname"
              />
              <Pressable
                style={[s.saveBtn, nick.trim() === nickname && s.saveBtnOff]}
                onPress={saveNick}
                disabled={nick.trim() === nickname}
                accessibilityRole="button"
              >
                <Text style={s.saveBtnText}>Save</Text>
              </Pressable>
            </View>
            {nickSaved && <Text style={s.saved}>Saved ✓</Text>}
          </View>

          {relation !== 'parent' && (
            <View style={s.box}>
              <Text style={s.title}>You're following as</Text>
              <Chips options={JOIN_RELATIONS} value={relation} onChange={(r) => r !== 'anyone' && onChangeRelation(r)} />
              <Text style={s.sub}>You follow {me.beast}. Change this if you picked the wrong one.</Text>
            </View>
          )}

          <View style={[s.box, s.row]}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>New beast alerts</Text>
              <Text style={s.sub}>A notification at 8 am the day each beast unlocks.</Text>
            </View>
            <Switch
              value={alertsOn && permission !== 'denied'}
              onValueChange={async (on) => setPermission(await onToggleAlerts(on))}
              trackColor={{ true: C.accent, false: C.line }}
              thumbColor={Platform.OS === 'android' ? C.text : undefined}
              accessibilityLabel="New beast alerts"
            />
          </View>
          {alertsOn && permission === 'denied' && (
            <Pressable onPress={() => Linking.openSettings()} style={s.warnBox}>
              <Text style={s.warnText}>
                Notifications are turned off for Babybeast. Tap here to open Settings and allow them.
              </Text>
            </Pressable>
          )}
          {alertsOn && permission === 'granted' && (
            <Pressable
              style={ui.secondaryBtn}
              onPress={async () => {
                await sendTestAlert(currentWeek, relation, nickname);
                setTestSent(true);
              }}
            >
              <Text style={ui.secondaryBtnText}>
                {testSent ? 'Sent! Lock your phone and wait 5 seconds' : 'Send me a test alert'}
              </Text>
            </Pressable>
          )}

          <View style={s.box}>
            <Text style={s.title}>Invite family and friends</Text>
            <Text style={s.sub}>
              Everyone you invite gets the same countdown and beast alerts, with their own beast name. The code
              only contains the due date. Bump photos are never shared.
            </Text>
            <Text style={[s.sub, { color: C.text, marginTop: 4 }]}>Who are you inviting?</Text>
            <Chips options={JOIN_RELATIONS} value={inviteAs} onChange={setInviteAs} anyone />
            <Text style={s.preview}>
              {invitee
                ? `${invitee.emoji} They'll follow ${invitee.beast}`
                : '👥 Everyone picks who they are when they join'}
            </Text>
            <Text style={s.code} selectable accessibilityLabel={`Invite code ${code.split('').join(' ')}`}>
              {code}
            </Text>
            <Pressable style={ui.primaryBtn} onPress={sendInvite}>
              <Text style={ui.primaryBtnText}>Send invite</Text>
            </Pressable>
          </View>

          <Text style={[ui.small, { textAlign: 'center' }]}>
            Everything stays on this phone. Babybeast doesn't collect any data.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Chips({
  options,
  value,
  onChange,
  anyone,
}: {
  options: RelationInfo[];
  value: Relation | 'anyone';
  onChange: (r: Relation | 'anyone') => void;
  anyone?: boolean;
}) {
  return (
    <View style={s.chips}>
      {anyone && (
        <Pressable
          onPress={() => onChange('anyone')}
          style={[s.chip, value === 'anyone' && s.chipOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: value === 'anyone' }}
        >
          <Text style={[s.chipText, value === 'anyone' && s.chipTextOn]}>👥 Group or anyone</Text>
        </Pressable>
      )}
      {options.map((r) => (
        <Pressable
          key={r.id}
          onPress={() => onChange(r.id)}
          style={[s.chip, value === r.id && s.chipOn]}
          accessibilityRole="button"
          accessibilityState={{ selected: value === r.id }}
        >
          <Text style={[s.chipText, value === r.id && s.chipTextOn]}>
            {r.emoji} {r.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: 20, paddingTop: 4, paddingBottom: 48, gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: C.line, paddingVertical: 8, paddingHorizontal: 12 },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { color: C.text, fontWeight: '600', fontSize: 13 },
  chipTextOn: { color: C.accentText },
  preview: { color: C.accent, fontWeight: '700', fontSize: 14, marginTop: 4 },
  box: { backgroundColor: C.card, borderRadius: 14, padding: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: C.text, fontSize: 16, fontWeight: '700' },
  sub: { color: C.muted, fontSize: 13, lineHeight: 18 },
  code: {
    color: C.accent,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
    paddingVertical: 8,
    fontVariant: ['tabular-nums'],
  },
  input: {
    backgroundColor: C.cardHi,
    color: C.text,
    fontSize: 17,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  nickRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  saveBtn: { backgroundColor: C.accent, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  saveBtnOff: { opacity: 0.4 },
  saveBtnText: { color: C.accentText, fontWeight: '800', fontSize: 15 },
  saved: { color: C.accent, fontSize: 13, fontWeight: '700' },
  warnBox: { borderRadius: 12, borderWidth: 1, borderColor: C.danger, padding: 12 },
  warnText: { color: C.danger, fontSize: 14, lineHeight: 19 },
});
