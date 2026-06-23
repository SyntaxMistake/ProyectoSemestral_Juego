import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_TOP_SCORE = "sheepgame:topscore";
const KEY_HISTORY = "sheepgame:history";
const MAX_HISTORY = 30;

export async function loadTopScore() {
  try {
    const val = await AsyncStorage.getItem(KEY_TOP_SCORE);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export async function saveTopScore(score) {
  try {
    await AsyncStorage.setItem(KEY_TOP_SCORE, String(score));
  } catch {}
}

export async function loadHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveSession(record) {
  try {
    const existing = await loadHistory();
    const updated = [record, ...existing].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify(updated));
  } catch {}
}
