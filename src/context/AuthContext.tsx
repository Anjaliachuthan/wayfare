import React, { createContext, useContext, useMemo, useState } from 'react';

type AuthCtx = {
  user: { email: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      // Mock auth: any valid email/password succeeds after a short delay.
      login: async (email) => {
        await new Promise((r) => setTimeout(r, 700));
        setUser({ email });
      },
      logout: () => setUser(null),
    }),
    [user]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
};
