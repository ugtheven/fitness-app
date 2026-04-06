import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Public keys — safe to inline (protected by Row Level Security)
const SUPABASE_URL = "https://cmwipdheqsnlcirxargz.supabase.co";
const SUPABASE_ANON_KEY =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtd2lwZGhlcXNubGNpcnhhcmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MTU5MDEsImV4cCI6MjA5MDk5MTkwMX0.3KpRgqP2R35OypA_okVEaV0IFDhFoGRw3Oj6LNVltXk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	auth: {
		storage: AsyncStorage,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});
