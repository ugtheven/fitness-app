import { GoogleSignin } from "@react-native-google-signin/google-signin";
import type { Session, User } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { type ReactNode, createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

GoogleSignin.configure({
	iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
	webClientId: Constants.expoConfig?.extra?.googleWebClientId,
});

type AuthState = {
	session: Session | null;
	user: User | null;
	loading: boolean;
	signInWithGoogle: () => Promise<void>;
	signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session: s } }) => {
			setSession(s);
			setLoading(false);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, s) => {
			setSession(s);
		});

		return () => subscription.unsubscribe();
	}, []);

	async function signInWithGoogle() {
		await GoogleSignin.hasPlayServices();
		const result = await GoogleSignin.signIn();

		const idToken = result.data?.idToken;
		if (!idToken) throw new Error("No id_token returned from Google");

		const { error } = await supabase.auth.signInWithIdToken({
			provider: "google",
			token: idToken,
		});
		if (error) throw error;
	}

	async function signOut() {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
	}

	return (
		<AuthContext.Provider
			value={{
				session,
				user: session?.user ?? null,
				loading,
				signInWithGoogle,
				signOut,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
