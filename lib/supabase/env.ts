const SUPABASE_ENV_ERROR =
  "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";

export class SupabaseEnvError extends Error {
  constructor() {
    super(SUPABASE_ENV_ERROR);
    this.name = "SupabaseEnvError";
    Object.setPrototypeOf(this, SupabaseEnvError.prototype);
  }
}

export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new SupabaseEnvError();
  }

  return { url, anonKey };
}
