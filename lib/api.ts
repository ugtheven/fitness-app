import { supabase } from "./supabase";

const NORMALIZE_TIMEOUT_MS = 4000;

export type NormalizedName = {
	en: string;
	fr: string;
};

export async function normalizeFoodNames(names: string[]): Promise<(NormalizedName | null)[]> {
	if (names.length === 0) return [];

	try {
		const {
			data: { session },
		} = await supabase.auth.getSession();
		if (!session) return names.map(() => null);

		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), NORMALIZE_TIMEOUT_MS);

		const { data, error } = await supabase.functions.invoke("fitnessapp-normalization", {
			body: { names },
			signal: controller.signal,
		});

		clearTimeout(timer);

		if (error) return names.map(() => null);

		return data.normalized ?? names.map(() => null);
	} catch {
		return names.map(() => null);
	}
}
