"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const hydrated = useAuthStore((s) => s.hydrated);
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
	const hydrate = useAuthStore((s) => s.hydrate);
	const user = useAuthStore((s) => s.user);
	const loadUser = useAuthStore((s) => s.loadUser);

	useEffect(() => {
		if (!hydrated) hydrate();
	}, [hydrated, hydrate]);

	useEffect(() => {
		if (!hydrated) return;
		if (isAuthenticated) return;
		// Remember where the user wanted to go, so we can redirect back after login.
		try {
			const intentionalLogout =
				window.sessionStorage.getItem("intentionalLogout") === "1";
			if (intentionalLogout) {
				window.sessionStorage.removeItem("intentionalLogout");
			}
			if (
				!intentionalLogout &&
				pathname &&
				pathname !== "/login" &&
				pathname !== "/signup"
			) {
				window.sessionStorage.setItem("postLoginRedirect", pathname);
			}
		} catch {
			// ignore storage errors
		}
		router.replace("/login");
	}, [hydrated, isAuthenticated, router, pathname]);

	useEffect(() => {
		if (!hydrated || !isAuthenticated) return;
		if (user) return;
		void loadUser();
	}, [hydrated, isAuthenticated, user, loadUser]);

	if (!hydrated || !isAuthenticated || !user) {
		// Simple blank state while we check auth; can be replaced with a spinner later.
		return null;
	}

	return <>{children}</>;
}
