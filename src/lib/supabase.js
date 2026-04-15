import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getCurrentPerfil = async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await supabase
    .from("perfis")
    .select("*, clubes(*)")
    .eq("id", user.id)
    .single();
  return data;
};
