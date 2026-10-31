import { StyleSheet } from 'react-native';

export const C = {
  bg: '#14201A',
  card: '#1E2E25',
  cardHi: '#26392E',
  text: '#EEF3E8',
  muted: '#9DB0A2',
  accent: '#B8E05A',
  accentText: '#14201A',
  danger: '#F08A6C',
  line: '#33473A',
};

/** Styles shared by several screens. Screen-specific styles live next to each screen. */
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { color: C.text, fontSize: 22, fontWeight: '800' },
  link: { color: C.accent, fontSize: 17, fontWeight: '600' },
  card: { backgroundColor: C.card, borderRadius: 20, padding: 20 },
  muted: { color: C.muted, fontSize: 15 },
  small: { color: C.muted, fontSize: 12, lineHeight: 17 },
  primaryBtn: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: C.accentText, fontWeight: '800', fontSize: 17 },
  secondaryBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.line,
  },
  secondaryBtnText: { color: C.text, fontWeight: '700', fontSize: 16 },
  ghostBtn: { paddingVertical: 12, alignItems: 'center' },
  ghostBtnText: { color: C.muted, fontWeight: '600', fontSize: 16 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { color: C.text, fontSize: 18 },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  sheetTitle: { color: C.text, fontSize: 22, fontWeight: '800' },
});
