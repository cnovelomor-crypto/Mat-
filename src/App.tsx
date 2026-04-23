import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { AppUser } from './types';
import AuthView from './components/AuthView';
import ParentDashboard from './components/ParentDashboard';
import ChildDashboard from './components/ChildDashboard';
import { motion, AnimatePresence } from 'motion/react';
import Mascot from './components/Mascot';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      setLoading(true);
      if (firebaseUser) {
        setFetchingProfile(true);
        // Set up a listener for the parent user document
        unsubProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const parentData: AppUser = {
              uid: data.uid || firebaseUser.uid,
              email: data.email || firebaseUser.email || '',
              displayName: data.displayName || 'Padre/Madre',
              role: data.role || 'parent',
              points: data.points || 0,
              parentId: data.parentId || null,
              linkingCode: data.linkingCode || null
            };
            setUser(parentData);
            setFetchingProfile(false);
            setLoading(false);
          } else {
            console.log("Profile not found yet, waiting...");
            // Keep fetchingProfile/loading true for a bit to allow creation
          }
        }, (error) => {
          console.error("Profile fetch error:", error);
          setFetchingProfile(false);
          setLoading(false);
        });

        // Safety timeout
        const timeout = setTimeout(() => {
          setFetchingProfile(false);
          setLoading(false);
        }, 8000);

        return () => {
          if (unsubProfile) unsubProfile();
          clearTimeout(timeout);
        };
      } else {
        setUser(null);
        setSelectedProfile(null);
        setFetchingProfile(false);
        setLoading(false);
      }
    });

    return () => {
      unsub();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const handleSelectProfile = (profile: AppUser) => {
    setSelectedProfile(profile);
  };

  const handleBackToProfiles = () => {
    setSelectedProfile(null);
  };

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

  if (!user) return <AuthView />;

  if (!selectedProfile) {
    return <ProfileSelection parent={user} onSelect={handleSelectProfile} />;
  }

  return (
    <AnimatePresence mode="wait">
      {selectedProfile.role === 'parent' ? (
        <motion.div key="parent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
          <ParentDashboard user={user!} onSwitchProfile={handleBackToProfiles} />
        </motion.div>
      ) : (
        <motion.div key="child" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
          <ChildDashboard user={selectedProfile} onBack={handleBackToProfiles} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProfileSelection({ parent, onSelect }: { parent: AppUser, onSelect: (u: AppUser) => void }) {
  const [profiles, setProfiles] = useState<AppUser[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('parentId', '==', parent.uid));
    const unsub = onSnapshot(q, (snap) => {
      setProfiles(snap.docs.map(d => d.data() as AppUser));
    });
    return unsub;
  }, [parent.uid]);

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-6">
      <Mascot message="¿Quién va a usar Matemágicas hoy?" />
      
      <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl w-full">
        {/* Parent Profile */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(parent)}
          className="flex flex-col items-center gap-4 bg-white p-8 rounded-[3rem] border-8 border-blue-100 shadow-xl"
        >
          <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl shadow-inner border-4 border-white overflow-hidden">
            {parent.photoURL ? (
              <img src={parent.photoURL} alt="Papá/Mamá" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              "👨‍🏫"
            )}
          </div>
          <span className="font-black text-slate-700 text-xl">Papá/Mamá</span>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest leading-none">Panel Pro</span>
        </motion.button>

        {/* Child Profiles */}
        {profiles.map(child => (
          <motion.button
            key={child.uid}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(child)}
            className="flex flex-col items-center gap-4 bg-white p-8 rounded-[3rem] border-8 border-orange-100 shadow-xl"
          >
            <div className="w-24 h-24 bg-orange-400 rounded-full flex items-center justify-center text-white text-4xl shadow-inner border-4 border-white overflow-hidden">
              {child.photoURL ? (
                <img src={child.photoURL} alt={child.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                child.displayName[0].toUpperCase()
              )}
            </div>
            <span className="font-black text-slate-700 text-xl">{child.displayName}</span>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest leading-none">Explorador</span>
          </motion.button>
        ))}

        {/* Add Profile Placeholder if fewer kids */}
        {profiles.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 border-4 border-dashed border-slate-200 rounded-[3rem] opacity-50">
            <p className="font-bold text-slate-400 text-center text-sm">Entra al Panel Pro para añadir a tus hijos</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => auth.signOut()}
        className="mt-12 text-slate-400 font-bold hover:text-slate-600 transition-colors flex items-center gap-2"
      >
        Cerrar Sesión 👋
      </button>
    </div>
  );
}
