import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { FIRST_WEEK, LAST_WEEK, infoForWeek, unlockDate } from './pregnancy';
import { Relation, capitalize, wordsFor } from './relations';

/** Hour of day (local time) when the "new beast" alert goes off. The beast itself unlocks at midnight. */
export const ALERT_HOUR = 8;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('beasts', {
      name: 'New beast alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function getPermission(): Promise<PermissionState> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionState;
}

export async function requestPermission(): Promise<PermissionState> {
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  if (!current.canAskAgain) return 'denied';
  const { status } = await Notifications.requestPermissionsAsync();
  return status as PermissionState;
}

function alertTime(dueDate: Date, week: number): Date {
  const d = unlockDate(dueDate, week);
  d.setHours(ALERT_HOUR, 0, 0, 0);
  return d;
}

function contentFor(week: number, relation: Relation, nickname = ''): Notifications.NotificationContentInput {
  const info = infoForWeek(week);
  const beast = capitalize(wordsFor(relation, nickname).beast);
  const name = info.animal.charAt(0).toLowerCase() + info.animal.slice(1);
  return {
    // Kept discreet on purpose: lock screens are visible to others, so no "baby" or week number here
    title: `New beast unlocked ${info.emoji}`,
    body:
      week === LAST_WEEK
        ? `${beast} is now about the size of ${name}. That's the final one!`
        : `${beast} is now about the size of ${name}. Tap for this week's gross fact.`,
    data: { week },
    ...(Platform.OS === 'android' ? { channelId: 'beasts' } : {}),
  };
}

// Scheduling runs one at a time, so two quick changes never clear and add alerts at the same time
let queue: Promise<unknown> = Promise.resolve();

/** Clears old alerts and schedules one for every beast that is still to come. */
export function scheduleBeastAlerts(dueDate: Date, relation: Relation, nickname = ''): Promise<number> {
  const run = queue.then(() => scheduleNow(dueDate, relation, nickname));
  queue = run.catch(() => 0);
  return run;
}

async function scheduleNow(dueDate: Date, relation: Relation, nickname: string): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if ((await getPermission()) !== 'granted') return 0;
  await ensureAndroidChannel();

  const now = Date.now();
  let count = 0;
  for (let week = FIRST_WEEK; week <= LAST_WEEK; week++) {
    const at = alertTime(dueDate, week);
    if (at.getTime() <= now) continue;
    await Notifications.scheduleNotificationAsync({
      content: contentFor(week, relation, nickname),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
    count++;
  }
  return count;
}

export function cancelBeastAlerts(): Promise<void> {
  const run = queue.then(() => Notifications.cancelAllScheduledNotificationsAsync());
  queue = run.catch(() => undefined);
  return run;
}

/** Sends this week's alert in a few seconds, so you can see what it looks like. */
export async function sendTestAlert(week: number, relation: Relation, nickname = '') {
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: contentFor(Math.min(LAST_WEEK, Math.max(FIRST_WEEK, week)), relation, nickname),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 },
  });
}
