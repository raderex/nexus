
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      org: null,
      theme: 'light',
      sidebarOpen: true,

      setAuth: (token, refreshToken, user) => {
        set({ token, refreshToken, user });
        localStorage.setItem('nexus-auth', JSON.stringify({ token, refreshToken }));
      },
      setUser: user => set({ user }),
      setOrg: org => set({ org }),
      logout: () => {
        set({ token: null, refreshToken: null, user: null });
        localStorage.removeItem('nexus-auth');
      },
      toggleTheme: () => set(s => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    { name: 'nexus-store', partialize: s => ({ token: s.token, refreshToken: s.refreshToken, user: s.user, org: s.org, theme: s.theme }) }
  )
);
