import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPerfil = async (userId) => {
    const { data } = await supabase
      .from("perfis")
      .select("*, clubes(*)")
      .eq("id", userId)
      .single();
    setPerfil(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadPerfil(session.user.id);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadPerfil(session.user.id);
      else setPerfil(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error;
  };

  const signUp = async (email, password) => {
    const { erro } = await supabase.auth.signUp({
      email,
      password,
    });
    return error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const canEdit = () => {
    return ["diretor", "secretario"].includes(perfil?.nivel_acesso);
  };

  const isDiretor = () => perfil?.nivel_acesso === "diretor";

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        loading,
        signUp,
        signIn,
        signOut,
        canEdit,
        isDiretor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
