import { useEffect, useState } from 'react';
import { getMe, logout as logoutApi } from '../api/auth';
import { AuthContext } from './auth-context';

function normalizeUser(payload) {
  const source = payload?.user ?? payload;

  if (!source) {
    return null;
  }

  const rawPhoto =
    source.avatar ??
    source.photoURL ??
    source.photoUrl ??
    source.photo ??
    source.picture ??
    source.image ??
    source.profilePic ??
    source.profilePicture ??
    source.photos?.[0]?.value ??
    source.photos?.[0]?.url;

  return {
    ...source,
    name: source.name ?? source.displayName ?? source.email ?? 'User',
    avatar: typeof rawPhoto === 'string' ? rawPhoto : null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((res) => setUser(normalizeUser(res.data)))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await logoutApi();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
