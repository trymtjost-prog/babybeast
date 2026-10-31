import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { formatDate, startOfDay } from './src/pregnancy';
import { decodePartnerCode, parseJoinUrl } from './src/partner';
import { Relation, isRelation } from './src/relations';
import { PermissionState, cancelBeastAlerts, getPermission, requestPermission, scheduleBeastAlerts } from './src/notifications';
import { loadAlertsOn, loadDueDate, loadRelation, saveAlertsOn, saveDueDate, saveRelation } from './src/storage';
import { C, ui } from './src/theme';
import { Setup } from './src/screens/Setup';
import { Home } from './src/screens/Home';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Root />
    </SafeAreaProvider>
  );
}

function Root() {
  const [loading, setLoading] = useState(true);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [alertsOn, setAlertsOn] = useState(true);
  const [relation, setRelation] = useState<Relation>('parent');
  const [pendingJoin, setPendingJoin] = useState<{ code: string; relation: string | null } | null>(null);
  const url = Linking.useURL();

  useEffect(() => {
    Promise.all([loadDueDate(), loadAlertsOn(), loadRelation()])
      .then(([d, on, r]) => {
        const rel: Relation = isRelation(r) ? r : 'parent';
        setAlertsOn(on);
        setRelation(rel);
        if (d) {
          setDueDate(d);
          // Re-sync on every launch, in case the time zone or permission changed
          if (on) scheduleBeastAlerts(d, rel).catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (d: Date | null, rel: Relation = relation) => {
    setDueDate(d);
    setRelation(rel);
    await saveDueDate(d);
    await saveRelation(rel);
    if (d) {
      if (alertsOn) {
        await requestPermission().catch(() => 'denied');
        await scheduleBeastAlerts(d, rel).catch(() => 0);
      }
    } else {
      await cancelBeastAlerts().catch(() => {});
    }
  };

  // Invite links: babybeast://join/BEAST-XXXX?as=grandparent
  useEffect(() => {
    if (loading) return;
    const join = parseJoinUrl(url);
    if (!join) return;
    const shared = decodePartnerCode(join.code);
    if (!shared) return;
    if (!dueDate) {
      setPendingJoin(join);
      return;
    }
    if (startOfDay(shared).getTime() === startOfDay(dueDate).getTime()) return;
    Alert.alert(
      'Join this countdown?',
      `This invite has the due date ${formatDate(shared)}. Yours is ${formatDate(dueDate)}.`,
      [
        { text: 'Keep mine', style: 'cancel' },
        {
          text: 'Use the shared date',
          onPress: () => save(shared, isRelation(join.relation) && join.relation !== 'parent' ? join.relation : relation),
        },
      ],
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, loading]);

  const toggleAlerts = async (on: boolean): Promise<PermissionState> => {
    setAlertsOn(on);
    await saveAlertsOn(on);
    if (!on) {
      await cancelBeastAlerts().catch(() => {});
      return getPermission();
    }
    const p = await requestPermission();
    if (p === 'granted' && dueDate) await scheduleBeastAlerts(dueDate, relation);
    return p;
  };

  if (loading) {
    return (
      <View style={[ui.screen, ui.center]}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={ui.screen} edges={['top', 'left', 'right']}>
      {dueDate ? (
        <Home
          dueDate={dueDate}
          relation={relation}
          onChangeRelation={(r) => save(dueDate, r)}
          onChangeDueDate={() => save(null)}
          alertsOn={alertsOn}
          onToggleAlerts={toggleAlerts}
        />
      ) : (
        <Setup
          key={pendingJoin?.code ?? 'setup'}
          initialCode={pendingJoin?.code}
          initialRelation={pendingJoin?.relation}
          onDone={(d, r) => {
            setPendingJoin(null);
            save(d, r);
          }}
        />
      )}
    </SafeAreaView>
  );
}
