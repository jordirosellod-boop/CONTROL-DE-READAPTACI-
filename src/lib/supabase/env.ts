// Projecte de Supabase de l'app (compartit amb tnt-talent; taules amb prefix ra_).
// La clau publicable no és secreta: és la que fa servir qualsevol client i l'RLS
// protegeix les dades. Es pot canviar sense tocar el codi amb les variables
// NEXT_PUBLIC_RA_SUPABASE_URL i NEXT_PUBLIC_RA_SUPABASE_KEY.
// (Les antigues NEXT_PUBLIC_SUPABASE_* s'ignoren a propòsit: apuntaven al projecte vell.)
const DEFAULT_URL = "https://goloukjoyzfvexslbxpv.supabase.co";
const DEFAULT_KEY = "sb_publishable_BHV_Ik4zYKabEtlvmMRoAw_TgqUr7aL";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_RA_SUPABASE_URL || DEFAULT_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_RA_SUPABASE_KEY || DEFAULT_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
