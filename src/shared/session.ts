import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';
import { api, unwrap, type Session } from './api';
import { getToken, onTokenChange, setToken } from './auth';

/** The current token, re-rendering on sign-in and sign-out (also from other tabs). */
export function useToken(): string | null {
  return useSyncExternalStore(onTokenChange, getToken, () => null);
}

export function useMeta() {
  return useQuery({ queryKey: ['meta'], queryFn: () => unwrap(api.GET('/meta')), staleTime: 5 * 60_000 });
}

/** The signed-in member, or undefined while loading / signed out. */
export function useMe() {
  const token = useToken();
  return useQuery({ queryKey: ['me', token], queryFn: () => unwrap(api.GET('/me')), enabled: !!token });
}

/** Clears cached data whenever the session changes. */
export function useSessionReset() {
  const client = useQueryClient();
  useEffect(() => onTokenChange(() => client.removeQueries({ predicate: (q) => q.queryKey[0] !== 'meta' })), [client]);
}

export async function signInWithGoogle(idToken: string): Promise<Session> {
  const session = await unwrap(api.POST('/auth/google', { body: { id_token: idToken } }));
  setToken(session.token);
  return session;
}

export async function signInDev(email: string): Promise<Session> {
  const session = await unwrap(api.POST('/auth/dev', { body: { email } }));
  setToken(session.token);
  return session;
}

export function signOut() {
  setToken(null);
  try {
    (window as unknown as { google?: GoogleId }).google?.accounts.id.disableAutoSelect();
  } catch {
    // Google Identity Services not loaded
  }
}

interface GoogleId {
  accounts: {
    id: {
      initialize(options: { client_id: string; callback: (r: { credential: string }) => void }): void;
      renderButton(el: HTMLElement, options: Record<string, string | number>): void;
      disableAutoSelect(): void;
    };
  };
}

let gsi: Promise<GoogleId> | null = null;

/** Loads Google Identity Services once. */
export function loadGoogle(): Promise<GoogleId> {
  gsi ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve((window as unknown as { google: GoogleId }).google);
    script.onerror = () => {
      gsi = null;
      reject(new Error('Google sign-in could not be loaded'));
    };
    document.head.append(script);
  });
  return gsi;
}
