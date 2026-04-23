import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { AppUser } from './types';
import AuthView from './components/AuthView';
import ParentDashboard from './components/ParentDashboard';
import ChildDashboard from './components/ChildDashboard';
import { motion, AnimatePresence } from 'motion/react';
import Mascot from './components/Mascot';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setFetchingProfile(true);
        // Set up a listener for the user document
        const unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as AppUser);
            setFetchingProfile(false);
            setLoading(false);
          } else {
            // Still waiting for profile creation
            setUser(null);
            // We don't set loading to false yet, we wait for the doc
          }
        }, (error) => {
          console.error("Profile fetch error:", error);
          setFetchingProfile(false);
          setLoading(false);
        });

        // Fail-safe: if after 10 seconds we don't have a profile, let the user know or show auth
        const timeout = setTimeout(() => {
          if (fetchingProfile) {
            setFetchingProfile(false);
            setLoading(false);
          }
        }, 10000);

        return () => {
          unsubProfile();
          clearTimeout(timeout);
        };
      } else {
        setUser(null);
        setFetchingProfile(false);
        setLoading(false);
      }
    });

    return unsub;
  }, []);

  if (loading || fetchingProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Mascot expression="thinking" />
        <motion.p 
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="mt-4 font-bold text-slate-400 uppercase tracking-widest text-sm"
        >
          Cargando Magia...
        </motion.p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <AuthView />
        </motion.div>
      ) : user.role === 'parent' ? (
        <motion.div key="parent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ParentDashboard />
        </motion.div>
      ) : (
        <motion.div key="child" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ChildDashboard user={user} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
