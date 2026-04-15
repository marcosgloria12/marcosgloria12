import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchPerfil(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchPerfil(session.user.id);
      else {
        setPerfil(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPerfil = async (userId) => {
    const { data } = await supabase
      .from("perfis")
      .select("*, clubes(*)")
      .eq("id", userId)
      .single();
    setPerfil(data);
    setLoading(false);
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error;
  };

  const signUp = async (
    email,
    password,
    nome,
    clubeId = null,
    nivel = "membro",
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome, nivel_acesso: nivel } },
    });
    if (error) return error;

    if (clubeId && data.user) {
      await supabase
        .from("perfis")
        .update({ clube_id: clubeId })
        .eq("id", data.user.id);
    }

    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const canEdit = () =>
    ["admin", "diretor", "secretario"].includes(perfil?.nivel_acesso);

  const isDiretor = () => ["admin", "diretor"].includes(perfil?.nivel_acesso);

  const isAdmin = () => perfil?.nivel_acesso === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        loading,
        signIn,
        signUp,
        signOut,
        canEdit,
        isDiretor,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
