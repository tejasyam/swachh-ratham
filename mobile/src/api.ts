import AsyncStorage from "@react-native-async-storage/async-storage";

// Backend base URL. Use your computer Wi-Fi IP for Expo Go on a real phone,
// 10.0.2.2 for Android emulator, or 127.0.0.1 for Expo web/iOS simulator.
export const API_URL = "http://192.168.18.11:8000";
const TOKEN_KEY = "swachh_ratham_token";

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string | null) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Central fetch wrapper injects JWT auth and normalizes API errors for screens.
  const token = await getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
}
