
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/lib/types'; // Assuming User type is defined here

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void; // Allow setting user directly (e.g., on app load from storage)
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setUser: (user) => set({ user, isAuthenticated: !!user }), // Update isAuthenticated based on user presence
    }),
    {
      name: 'auth-storage', // Name of the item in storage
      storage: createJSONStorage(() => localStorage), // Use localStorage
      // Only persist specific parts if needed (optional)
      // partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      // Rehydrate logic: Ensure state is correctly loaded on app start
       onRehydrateStorage: () => (state) => {
         if (state) {
           // Optional: Add validation here if needed, e.g., check token expiry if storing tokens
            state.setUser(state.user); // Re-set user to ensure isAuthenticated is updated correctly
         }
       }
    }
  )
);

// Function to check if user has required role(s)
export const hasRole = (userRoles: User['role'] | User['role'][] | undefined, requiredRoles: User['role'] | User['role'][]): boolean => {
  if (!userRoles) return false;

  const userRolesArray = Array.isArray(userRoles) ? userRoles : [userRoles];
  const requiredRolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return requiredRolesArray.some(role => userRolesArray.includes(role));
};
