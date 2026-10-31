import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  dueDate: 'babybeast.dueDate',
  alertsOn: 'babybeast.alertsOn',
  photos: 'babybeast.photos',
  relation: 'babybeast.relation',
};

export async function loadDueDate(): Promise<Date | null> {
  const v = await AsyncStorage.getItem(KEYS.dueDate);
  return v ? new Date(v) : null;
}

export async function saveDueDate(d: Date | null) {
  if (d) await AsyncStorage.setItem(KEYS.dueDate, d.toISOString());
  else await AsyncStorage.removeItem(KEYS.dueDate);
}

export async function loadRelation(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.relation);
}

export async function saveRelation(r: string) {
  await AsyncStorage.setItem(KEYS.relation, r);
}

export async function loadAlertsOn(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEYS.alertsOn)) !== 'false';
}

export async function saveAlertsOn(on: boolean) {
  await AsyncStorage.setItem(KEYS.alertsOn, String(on));
}

/** Week number -> file name inside the app's photo folder. */
export type PhotoMap = Record<number, string>;

export async function loadPhotoMap(): Promise<PhotoMap> {
  try {
    return JSON.parse((await AsyncStorage.getItem(KEYS.photos)) ?? '{}');
  } catch {
    return {};
  }
}

export async function savePhotoMap(map: PhotoMap) {
  await AsyncStorage.setItem(KEYS.photos, JSON.stringify(map));
}
