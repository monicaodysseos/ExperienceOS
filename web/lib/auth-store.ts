import { create } from "zustand";
import { api, type User } from "./api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: 'participant' | 'provider' | 'hr_manager';
    gdpr_accepted: boolean;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    await api.login(email, password);
    const user = await api.getMe();
    set({ user, isAuthenticated: true });
  },

  register: async (data) => {
    const result = await api.register(data);
    set({ user: result.user, isAuthenticated: true });
  },

  logout: async () => {
    await api.logout();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    try {
      const user = await api.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
