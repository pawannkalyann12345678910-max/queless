import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  fbSignOut, 
  onAuthStateChanged
} from '../config/firebase';
import type { FirebaseUser } from '../config/firebase';
import { api } from '../services/api';
import type { User, UserRole, Organization, StaffAssignment } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  adminOrgs: Organization[];
  staffAssignments: StaffAssignment[];
  needsProfileCompletion: boolean;
  signInWithGoogle: () => Promise<UserRole | null>;
  signOut: () => Promise<void>;
  updateProfile: (displayName: string, phone: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [adminOrgs, setAdminOrgs] = useState<Organization[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync auth state with backend — does NOT touch localStorage on its own
  const syncWithBackend = async (firebaseUser?: any): Promise<{ role: UserRole; user: User } | null> => {
    try {
      const res = await api.verifyAuth();
      setUser(res.user);
      const resolvedRole = res.role as UserRole;
      setRole(resolvedRole);
      setAdminOrgs(res.adminOrgs || []);
      setStaffAssignments(res.staffAssignments || []);

      // Persist the FULL, complete user object (with PROFILE_COMPLETE, PHONE, etc.)
      localStorage.setItem('queless_user_session', JSON.stringify(res.user));

      return { role: resolvedRole, user: res.user };
    } catch (err) {
      console.error('Backend auth sync error:', err);
      if (firebaseUser) {
        const tempUser: User = {
          USER_ID: firebaseUser.uid || firebaseUser.USER_ID,
          EMAIL: firebaseUser.email || firebaseUser.EMAIL || '',
          DISPLAY_NAME: firebaseUser.displayName || firebaseUser.DISPLAY_NAME || 'User',
          PHOTO_URL: firebaseUser.photoURL || firebaseUser.PHOTO_URL || '',
          PROFILE_COMPLETE: 0,
          ROLE: 'CUSTOMER'
        };
        setUser(tempUser);
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Restore session from localStorage immediately (avoids flash)
    const saved = localStorage.getItem('queless_user_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setRole(parsed.ROLE || 'CUSTOMER');
        // Re-sync with backend to get latest role/profile data
        syncWithBackend(parsed);
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    // 2. Listen for Firebase auth state changes
    // Only sync if there's a Firebase user AND no existing local session
    // (avoids re-wiping PROFILE_COMPLETE on every page refresh)
    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const existingSession = localStorage.getItem('queless_user_session');
          if (!existingSession) {
            // Fresh sign-in or session was cleared — sync from backend
            await syncWithBackend(fbUser);
          }
          // If session already exists, syncWithBackend was already called above
          // from the localStorage restore path — no need to call again
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const signInWithGoogle = async (): Promise<UserRole | null> => {
    setLoading(true);
    try {
      if (!auth || !googleProvider) {
        throw new Error('Firebase Auth is not initialized. Please verify your Firebase project credentials in .env');
      }

      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      // Write a minimal placeholder so the Bearer token can be sent
      const sessionUser: Partial<User> = {
        USER_ID: fbUser.uid,
        EMAIL: fbUser.email || '',
        DISPLAY_NAME: fbUser.displayName || 'User',
        PHOTO_URL: fbUser.photoURL || ''
      };
      localStorage.setItem('queless_user_session', JSON.stringify(sessionUser));

      // Sync and overwrite with full profile (PROFILE_COMPLETE, PHONE, ROLE, etc.)
      const syncResult = await syncWithBackend(fbUser);
      return syncResult ? syncResult.role : 'CUSTOMER';
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      alert(err.message || 'Google Authentication failed. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (auth) await fbSignOut(auth);
    } catch (e) {
      console.warn('SignOut notice:', e);
    }
    localStorage.removeItem('queless_user_session');
    setUser(null);
    setRole('CUSTOMER');
    setAdminOrgs([]);
    setStaffAssignments([]);
  };

  const updateProfile = async (displayName: string, phone: string) => {
    const res = await api.updateProfile(displayName, phone);
    setUser(res.user);
    // Persist the full updated user so PROFILE_COMPLETE=1 is saved
    const updatedSession = { ...user, ...res.user, PROFILE_COMPLETE: 1 };
    localStorage.setItem('queless_user_session', JSON.stringify(updatedSession));
  };

  const refreshAuth = async () => {
    await syncWithBackend(user);
  };

  // Only show profile modal if user is logged in AND profile is genuinely incomplete
  const needsProfileCompletion = !!user && (user.PROFILE_COMPLETE === 0 || !user.PHONE || user.PHONE.trim() === '');

  return (
    <AuthContext.Provider value={{
      user,
      role,
      loading,
      adminOrgs,
      staffAssignments,
      needsProfileCompletion,
      signInWithGoogle,
      signOut,
      updateProfile,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
