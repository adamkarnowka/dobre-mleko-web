// The session token, shared by the app and the admin dashboard (same origin, same storage key).
// localStorage can be unavailable (private windows, blocked storage): then the token lives in memory only.

const KEY = 'dm-token';
let memory: string | null = null;
const listeners = new Set<(token: string | null) => void>();

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

export function setToken(token: string | null): void {
  memory = token;
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {
    // memory only
  }
  for (const listener of listeners) listener(token);
}

export function onTokenChange(listener: (token: string | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Another tab signed in or out.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) for (const listener of listeners) listener(e.newValue);
  });
}
