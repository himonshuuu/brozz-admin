import { create } from "zustand";
import type { CurrentUser } from "@/lib/api/auth";
import { getCurrentUser } from "@/lib/api/auth";

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
	// Normalize to the primary key to keep everything consistent.
	for (const key of TOKEN_KEYS) window.localStorage.removeItem(key);
	if (token) window.localStorage.setItem("token", token);
}

type State = {
	token: string | null;
	user: CurrentUser | null;
	hydrated: boolean;
	isAuthenticated: boolean;
	hydrate: () => void;
	setToken: (token: string | null) => void;
	setUser: (user: CurrentUser | null) => void;
	loadUser: () => Promise<void>;
	logout: () => void;
};

export const useAuthStore = create<State>((set, get) => ({
	token: null,
	user: null,
	hydrated: false,
	isAuthenticated: false,

	hydrate: () => {
		const token = readTokenFromStorage();
		set({ token, hydrated: true, isAuthenticated: Boolean(token) });
	},

	setUser: (user: CurrentUser | null) => {
		set({ user });
	},

	setToken: (token) => {
		writeTokenToStorage(token);
		set({ token, user: null, hydrated: true, isAuthenticated: Boolean(token) });
	},

	loadUser: async () => {
		const token = get().token;
		if (!token) return;
		try {
			const res = await getCurrentUser();
			if (!res.success) return;
			set({ user: res.data });
		} catch {
			// If /auth/me fails (e.g., token expired), log out.
			writeTokenToStorage(null);
			set({ token: null, user: null, isAuthenticated: false });
		}
	},

	logout: () => {
		writeTokenToStorage(null);
		set({ token: null, user: null, hydrated: true, isAuthenticated: false });
	},
}));
