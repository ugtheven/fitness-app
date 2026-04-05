import { i18n } from "./i18n";

export type OffProduct = {
	barcode: string;
	name: string;
	caloriesPer100g: number | null;
	proteinPer100g: number | null;
	carbsPer100g: number | null;
	fatPer100g: number | null;
	imageUrl: string | null;
};

const BASE_URL = "https://world.openfoodfacts.net";
const TIMEOUT_MS = 5000;

function parseNutriment(value: unknown): number | null {
	if (typeof value === "number" && !Number.isNaN(value)) return value;
	return null;
}

// biome-ignore lint/suspicious/noExplicitAny: OFF API response shape is untyped
function parseProduct(raw: any, lang?: string): OffProduct | null {
	if (!raw || !raw.product_name) return null;
	const n = raw.nutriments ?? {};
	const localizedName = lang ? raw[`product_name_${lang}`] : null;
	return {
		barcode: String(raw.code ?? raw._id ?? ""),
		name: localizedName || raw.product_name,
		caloriesPer100g: parseNutriment(n["energy-kcal_100g"]),
		proteinPer100g: parseNutriment(n.proteins_100g),
		carbsPer100g: parseNutriment(n.carbohydrates_100g),
		fatPer100g: parseNutriment(n.fat_100g),
		imageUrl: raw.image_url ?? null,
	};
}

async function fetchWithTimeout(url: string): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		return await fetch(url, { signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

function getLang(): string {
	return i18n.language?.slice(0, 2) ?? "en";
}

export async function searchByName(query: string): Promise<OffProduct[]> {
	const encoded = encodeURIComponent(query.trim());
	if (!encoded) return [];
	const lang = getLang();
	const url = `${BASE_URL}/cgi/search.pl?search_terms=${encoded}&search_simple=1&action=process&json=1&page_size=20&lc=${lang}`;
	try {
		const res = await fetchWithTimeout(url);
		if (!res.ok) return [];
		const data = await res.json();
		const products: OffProduct[] = [];
		for (const raw of data?.products ?? []) {
			const parsed = parseProduct(raw, lang);
			if (parsed?.barcode) products.push(parsed);
		}
		return products;
	} catch {
		return [];
	}
}

export async function searchByBarcode(barcode: string): Promise<OffProduct | null> {
	const lang = getLang();
	const url = `${BASE_URL}/api/v2/product/${encodeURIComponent(barcode)}`;
	try {
		const res = await fetchWithTimeout(url);
		if (!res.ok) return null;
		const data = await res.json();
		if (data.status !== 1) return null;
		return parseProduct(data.product, lang);
	} catch {
		return null;
	}
}
