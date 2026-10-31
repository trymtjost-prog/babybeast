import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { addDays, dueDateFromLastPeriod, formatDate } from '../pregnancy';
import { decodePartnerCode } from '../partner';
import { JOIN_RELATIONS, Relation, isRelation } from '../relations';
import { C, ui } from '../theme';

type Mode = 'due' | 'period' | 'code';

export function Setup({
  onDone,
  initialCode,
  initialRelation,
}: {
  onDone: (due: Date, relation: Relation) => void;
  initialCode?: string | null;
  initialRelation?: string | null;
}) {
  const today = new Date();
  const [mode, setMode] = useState<Mode>(initialCode ? 'code' : 'period');
  const [date, setDate] = useState<Date>(() => addDays(today, -80));
  const [androidOpen, setAndroidOpen] = useState(false);
  const [code, setCode] = useState(initialCode ?? '');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [relation, setRelation] = useState<Relation | null>(
    isRelation(initialRelation) && initialRelation !== 'parent' ? initialRelation : null,
  );

  const bounds =
    mode === 'period'
      ? { min: addDays(today, -300), max: today }
      : { min: addDays(today, -21), max: addDays(today, 280) };

  const switchMode = (m: Mode) => {
    setMode(m);
    if (m === 'due') setDate(addDays(today, 200));
    if (m === 'period') setDate(addDays(today, -80));
  };

  const onChange = (e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') setAndroidOpen(false);
    if (e.type === 'set' && d) setDate(d);
  };

  const submit = () => {
    if (mode === 'code') {
      const d = decodePartnerCode(code);
      if (!d || d < addDays(today, -21) || d > addDays(today, 280)) {
        setCodeError("That code doesn't look right. It should look like BEAST-22QM.");
        return;
      }
      if (!relation) {
        setCodeError('Pick who you are to the beast.');
        return;
      }
      onDone(d, relation);
      return;
    }
    onDone(mode === 'due' ? date : dueDateFromLastPeriod(date), 'parent');
  };

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Text style={s.bigEmoji}>🪳</Text>
      <Text style={s.title}>Babybeast</Text>
      <Text style={s.lead}>
        Follow your pregnancy week by week, compared to things you'd really rather not find in your bed.
      </Text>

      {mode === 'code' ? (
        <>
          <Text style={s.label}>Enter the code you were sent</Text>
          <TextInput
            value={code}
            onChangeText={(t) => {
              setCode(t);
              setCodeError(null);
            }}
            placeholder="BEAST-XXXX"
            placeholderTextColor={C.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            style={s.input}
            returnKeyType="done"
            onSubmitEditing={submit}
            accessibilityLabel="Partner code"
          />

          <Text style={[s.label, { marginTop: 8 }]}>Who are you to the beast?</Text>
          <View style={s.chips}>
            {JOIN_RELATIONS.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => {
                  setRelation(r.id);
                  setCodeError(null);
                }}
                style={[s.chip, relation === r.id && s.chipOn]}
                accessibilityRole="button"
                accessibilityState={{ selected: relation === r.id }}
              >
                <Text style={[s.chipText, relation === r.id && s.chipTextOn]}>
                  {r.emoji} {r.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {codeError && <Text style={s.error}>{codeError}</Text>}
        </>
      ) : (
        <>
          <Text style={s.label}>First day of your last period</Text>

          {Platform.OS === 'ios' ? (
            <View style={s.pickerBox}>
              <DateTimePicker
                key={mode}
                value={date}
                mode="date"
                display="inline"
                themeVariant="dark"
                accentColor={C.accent}
                minimumDate={bounds.min}
                maximumDate={bounds.max}
                onChange={onChange}
              />
            </View>
          ) : (
            <>
              <Pressable style={s.dateBtn} onPress={() => setAndroidOpen(true)} accessibilityRole="button">
                <Text style={s.dateBtnText}>{formatDate(date)}</Text>
              </Pressable>
              {androidOpen && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  minimumDate={bounds.min}
                  maximumDate={bounds.max}
                  onChange={onChange}
                />
              )}
            </>
          )}
        </>
      )}

      <Pressable style={ui.primaryBtn} onPress={submit}>
        <Text style={ui.primaryBtnText}>{mode === 'code' ? 'Join the countdown' : 'Show me the beast'}</Text>
      </Pressable>

      <Pressable style={ui.ghostBtn} onPress={() => switchMode(mode === 'code' ? 'period' : 'code')}>
        <Text style={s.switchText}>
          {mode === 'code' ? 'Enter a date instead' : 'Got an invite code?'}
        </Text>
      </Pressable>

      <Text style={[ui.small, { textAlign: 'center', marginTop: 12 }]}>
        Babybeast is just for fun. Sizes are rough averages and are not medical advice. Talk to your
        midwife or doctor about anything to do with your pregnancy.
      </Text>
    </ScrollView>
  );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.segmentBtn, active && s.segmentBtnActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[s.segmentText, active && s.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 24, paddingTop: 40, gap: 14 },
  bigEmoji: { fontSize: 72, textAlign: 'center' },
  title: { color: C.text, fontSize: 36, fontWeight: '800', textAlign: 'center' },
  lead: { color: C.muted, fontSize: 17, lineHeight: 24, textAlign: 'center', marginBottom: 12 },
  label: { color: C.muted, fontSize: 15, textAlign: 'center' },
  segment: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 14, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: C.cardHi },
  segmentText: { color: C.muted, fontWeight: '600', fontSize: 14, textAlign: 'center' },
  segmentTextActive: { color: C.text },
  pickerBox: { backgroundColor: C.card, borderRadius: 16, padding: 8, overflow: 'hidden' },
  dateBtn: {
    backgroundColor: C.card,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.line,
  },
  dateBtnText: { color: C.text, fontSize: 20, fontWeight: '700' },
  input: {
    backgroundColor: C.card,
    color: C.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 3,
    borderRadius: 14,
    paddingVertical: 16,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: C.line,
  },
  error: { color: C.danger, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: C.line, paddingVertical: 9, paddingHorizontal: 14 },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { color: C.text, fontWeight: '600', fontSize: 14 },
  chipTextOn: { color: C.accentText },
  switchText: { color: C.accent, fontWeight: '600', fontSize: 15 },
});
