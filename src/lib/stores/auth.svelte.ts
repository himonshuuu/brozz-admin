import { getCurrentUser, type CurrentUser } from "$lib/api/auth";

const TOKEN_KEYS = ["token", "authToken", "accessToken"] as const;

function readTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  for (const key of TOKEN_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }
  return null;
}

function writeTokenToStorage(token: string | null) {
  if (typeof window === "undefined") return;
  for (const key of TOKEN_KEYS) window.localStorage.removeItem(key);
  if (token) window.localStorage.setItem("token", token);
}

function createAuthStore() {
  let token = $state<string | null>(null);
  let user = $state<CurrentUser | null>(null);
  let hydrated = $state(false);
  let isAuthenticated = $state(false);

  return {
    get token() { return token; },
    get user() { return user; },
    get hydrated() { return hydrated; },
    get isAuthenticated() { return isAuthenticated; },

    hydrate() {
      const t = readTokenFromStorage();
      token = t;
      hydrated = true;
      isAuthenticated = Boolean(t);
    },

    setToken(t: string | null) {
      writeTokenToStorage(t);
      token = t;
      user = null;
      hydrated = true;
      isAuthenticated = Boolean(t);
    },

    setUser(u: CurrentUser | null) {
      user = u;
    },

    async loadUser() {
      if (!token) return;
      try {
        const res = await getCurrentUser();
        if (!res.success) return;
        user = res.data;
      } catch {
        writeTokenToStorage(null);
        token = null;
        user = null;
        isAuthenticated = false;
      }
    },

    logout() {
      writeTokenToStorage(null);
      token = null;
      user = null;
      hydrated = true;
      isAuthenticated = false;
    },
  };
}

export const authStore = createAuthStore();
