import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user] = useState({ id: "dev-user" });
  const [perfil] = useState({
    id: "dev-user",
    nome: "Dev Admin",
    email: "dev@dev.com",
    nivel_acesso: "diretor",
    clube_id: "clube-fake-id",
    clubes: { nome: "Clube Teste" },
  });

  const signIn = async () => null;
  const signUp = async () => null;
  const signOut = async () => {};
  const canEdit = () => true;
  const isDiretor = () => true;

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        loading: false,
        signIn,
        signUp,
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
