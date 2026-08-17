import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: string;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Fetch the authoritative role from the backend DB (not JWT metadata). */
async function resolveRole(session: Session | null): Promise<string> {
  if (!session) return '';
  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return (session.user.user_metadata?.role as string) ?? '';
    const data = await res.json();
    return data.role ?? '';
  } catch {
    return (session.user.user_metadata?.role as string) ?? '';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: '',
    loading: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const role = await resolveRole(session);
      setState({ user: session?.user ?? null, session, role, loading: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const role = await resolveRole(session);
      setState({ user: session?.user ?? null, session, role, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const role = await resolveRole(data.session);
    setState({ user: data.session?.user ?? null, session: data.session, role, loading: false });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, session: null, role: '', loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
