import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { PhotoMap, loadPhotoMap, savePhotoMap } from './storage';

// Photos are copied into the app's own documents folder so they survive even if the user
// deletes them from the camera roll. We store only the file name, because the absolute path
// to the documents folder can change between app updates on iOS.
const DIR = `${FileSystem.documentDirectory}bump/`;

export function photoUri(fileName: string): string {
  return DIR + fileName;
}

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
}

export type PhotoSource = 'camera' | 'library';

/** Lets the user take or pick a photo. Returns null if they cancel or say no to access. */
export async function pickPhoto(source: PhotoSource): Promise<string | null> {
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.8,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0].uri;
}

export async function saveWeekPhoto(week: number, tempUri: string): Promise<PhotoMap> {
  await ensureDir();
  const map = await loadPhotoMap();
  if (map[week]) await FileSystem.deleteAsync(photoUri(map[week]), { idempotent: true });
  const fileName = `week-${week}-${Date.now()}.jpg`;
  await FileSystem.copyAsync({ from: tempUri, to: photoUri(fileName) });
  const next = { ...map, [week]: fileName };
  await savePhotoMap(next);
  return next;
}

export async function deleteWeekPhoto(week: number): Promise<PhotoMap> {
  const map = await loadPhotoMap();
  if (map[week]) await FileSystem.deleteAsync(photoUri(map[week]), { idempotent: true });
  const next = { ...map };
  delete next[week];
  await savePhotoMap(next);
  return next;
}
