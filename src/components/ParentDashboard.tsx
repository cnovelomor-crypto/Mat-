import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AppUser, ParentNotification, Redemption, Reward } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Gift, Bell, CheckCircle, TrendingUp, LogOut } from 'lucide-react';
import Mascot from './Mascot';

export default function ParentDashboard({ user, onSwitchProfile }: { user: AppUser, onSwitchProfile: () => void }) {
  const [children, setChildren] = useState<AppUser[]>([]);
  const [notifications, setNotifications] = useState<ParentNotification[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childCode, setChildCode] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'rewards' | 'stats'>('overview');
  const [editingPhotoUser, setEditingPhotoUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen for linked children
    const qChildren = query(collection(db, 'users'), where('parentId', '==', auth.currentUser.uid));
    const unsubChildren = onSnapshot(qChildren, (snapshot) => {
      setChildren(snapshot.docs.map(d => ({ ...d.data() as AppUser })));
    }, (err) => console.warn("Parent children listener error:", err));

    // Listen for notifications
    const qNotifs = query(collection(db, 'notifications'), where('parentId', '==', auth.currentUser.uid));
    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
      setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() as ParentNotification })).sort((a, b) => b.timestamp - a.timestamp));
    }, (err) => console.warn("Parent notifications listener error:", err));

    // Listen for redemptions
    const qRedemptions = query(collection(db, 'redemptions'), where('parentId', '==', auth.currentUser.uid), where('status', '==', 'pending'));
    const unsubRedemptions = onSnapshot(qRedemptions, (snapshot) => {
      setRedemptions(snapshot.docs.map(d => ({ id: d.id, ...d.data() as Redemption })));
    }, (err) => console.warn("Parent redemptions listener error:", err));

    return () => {
      unsubChildren();
      unsubNotifs();
      unsubRedemptions();
    };
  }, []);

  const confirmLink = async (childId: string) => {
    try {
      await updateDoc(doc(db, 'users', childId), {
        parentId: auth.currentUser!.uid
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createChild = async (name: string) => {
    if (!auth.currentUser) return;
    try {
      const childrenRef = collection(db, 'users');
      const newChildDoc = doc(childrenRef);
      const childId = newChildDoc.id;
      
      await setDoc(newChildDoc, {
        uid: childId,
        displayName: name,
        role: 'child',
        parentId: auth.currentUser.uid,
        points: 0,
        email: null,
        createdAt: new Date().toISOString()
      });
      setShowAddChild(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const completeRedemption = async (id: string) => {
    try {
      await updateDoc(doc(db, 'redemptions', id), { status: 'completed' });
    } catch (err: any) {
      console.error("Error completing redemption:", err);
    }
  };

  const updatePhoto = async (userId: string, photoURL: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { photoURL });
      setEditingPhotoUser(null);
    } catch (err: any) {
      console.error("Error updating photo:", err);
    }
  };

  const addCustomReward = async (title: string, cost: number) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'rewards'), {
        title,
        cost,
        icon: '🎁',
        isCustom: true,
        parentId: auth.currentUser.uid,
        createdAt: new Date().toISOString()
      });
      alert("¡Premio guardado con éxito!");
    } catch (err: any) {
      console.error("Error creating reward:", err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-yellow-50 overflow-hidden">
      {/* Sidebar - Aside */}
      <aside className="w-full md:w-64 bg-white md:rounded-r-3xl p-6 flex flex-col items-center border-r-4 border-blue-50 shadow-xl z-20 overflow-y-auto">
        <button 
          onClick={() => setEditingPhotoUser(user)}
          className="relative group w-24 h-24 mb-4"
        >
          <div className="w-full h-full bg-blue-100 rounded-full border-4 border-secondary overflow-hidden flex items-center justify-center text-4xl shadow-inner">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Users className="text-secondary" />
            )}
          </div>
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus size={24} className="text-white" />
          </div>
        </button>
        <h2 className="font-black text-xl mb-1 text-slate-700">{user.displayName}</h2>
        <p className="text-slate-400 text-sm mb-8 font-bold text-center">Gestoría Familiar</p>
        
        <nav className="w-full space-y-3">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`nav-button ${activeTab === 'overview' ? 'nav-button-active' : ''}`}
          >
            <Users size={20} /> Hijos
          </button>
          <button 
            onClick={() => setActiveTab('rewards')}
            className={`nav-button ${activeTab === 'rewards' ? 'nav-button-active' : ''}`}
          >
            <Gift size={20} /> Premios
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`nav-button ${activeTab === 'stats' ? 'nav-button-active' : ''}`}
          >
            <TrendingUp size={20} /> Estadísticas
          </button>
          
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 p-4 bg-slate-100 text-slate-500 font-bold rounded-2xl border-b-4 border-slate-200 hover:bg-slate-200 transition-all mt-10"
          >
            <LogOut size={20} /> Salir
          </button>

          <button 
            onClick={onSwitchProfile}
            className="w-full text-center mt-4 text-xs font-bold text-slate-400 hover:text-primary transition-colors"
          >
            👤 Cambiar Perfil
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
        <div className="flex-1 flex flex-col gap-6 p-6 w-full max-w-7xl mx-auto">
          <header className="min-h-20 bg-white rounded-3xl border-4 border-blue-100 px-8 py-4 flex flex-col md:flex-row items-center justify-between shadow-lg gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-700">Dashboard Parental</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Estado del Reino</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowAddChild(true)}
                className="bg-primary text-white font-black px-6 py-2 rounded-xl kid-button border-yellow-600 text-sm hover:bg-yellow-400 transition-colors"
              >
                + Añadir Hijo
              </button>
              <button 
                onClick={() => setActiveTab('overview')}
                className="bg-slate-100 font-bold px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Principal
              </button>
            </div>
          </header>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} key="overview" className="space-y-6 h-full flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-[400px]">
                    {/* Children List */}
                    <div className="flex flex-col">
                      <div className="bg-white rounded-3xl border-4 border-blue-50 p-8 shadow-xl flex-1 flex flex-col">
                        <h3 className="text-xl font-black text-slate-700 mb-6 underline decoration-primary decoration-4">Mis Matemágicos</h3>
                        {children.length === 0 ? (
                          <div className="text-center py-12 opacity-50 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex-1 flex items-center justify-center">
                            <div>
                              <p className="font-bold text-slate-400">Aún no has añadido perfiles para tus hijos.</p>
                              <button onClick={() => setShowAddChild(true)} className="text-primary mt-2 hover:underline">Haz clic aquí para empezar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 custom-scrollbar">
                            {children.map(child => (
                              <div key={child.uid} className="bg-blue-50/50 p-4 rounded-2xl border-2 border-blue-100 flex items-center justify-between gap-4 hover:bg-blue-50 transition-colors">
                                <div className="flex items-center gap-4">
                                  <button 
                                    onClick={() => setEditingPhotoUser(child)}
                                    className="relative group w-14 h-14"
                                  >
                                    <div className="w-full h-full bg-secondary rounded-full flex items-center justify-center text-white text-xl font-black shadow-md overflow-hidden border-2 border-white">
                                      {child.photoURL ? (
                                        <img src={child.photoURL} alt={child.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      ) : (
                                        child.displayName[0].toUpperCase()
                                      )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Plus size={16} className="text-white" />
                                    </div>
                                  </button>
                                  <div>
                                    <h4 className="font-black text-slate-700">{child.displayName}</h4>
                                    <p className="text-sm font-bold text-yellow-500">⭐ {child.points} Estrellitas</p>
                                  </div>
                                </div>
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white px-2 py-1 rounded-md">Activo</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pending Rewards */}
                    <div className="bg-pink-50 rounded-3xl border-4 border-pink-100 p-8 shadow-xl flex flex-col h-full">
                      <h3 className="text-xl font-black text-pink-700 mb-4 flex items-center gap-2">
                         Premios <span className="bg-pink-200 text-pink-700 px-2 py-0.5 rounded-full text-xs">{redemptions.length}</span>
                      </h3>
                      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                        {redemptions.length === 0 ? (
                          <div className="bg-white/50 p-4 rounded-xl text-center border-2 border-dashed border-pink-200 h-full flex items-center justify-center">
                             <p className="text-xs font-bold text-pink-400">Todo al día 🎉</p>
                          </div>
                        ) : (
                          redemptions.map(red => (
                            <div key={red.id} className="bg-white p-3 rounded-xl border-b-4 border-pink-200 flex items-center justify-between gap-2 shadow-sm">
                              <div className="overflow-hidden">
                                <p className="font-black text-slate-700 truncate">{red.rewardTitle}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                                  {children.find(c => c.uid === red.childId)?.displayName}
                                </p>
                              </div>
                              <button 
                                onClick={() => completeRedemption(red.id!)}
                                className="shrink-0 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                title="Marcar como cumplido"
                              >
                                <CheckCircle size={16} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="bg-white rounded-3xl border-4 border-orange-50 p-8 shadow-xl">
                    <h3 className="text-xl font-black text-slate-700 mb-4">Actividad del Reino</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {notifications.map(notif => (
                        <div key={notif.id} className="p-4 bg-orange-50/50 rounded-2xl border-2 border-orange-100 flex gap-4">
                          <div className="w-10 h-10 bg-orange-200 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                            <Bell size={20} />
                          </div>
                          <div>
                            <p className="font-black text-slate-700">{notif.childName}</p>
                            <p className="text-sm font-medium text-slate-600 leading-tight">{notif.message}</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-2">
                               {notif.timestamp ? new Date(notif.timestamp.seconds * 1000).toLocaleTimeString() : 'Ahora mismo'}
                            </p>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="col-span-full py-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 font-bold text-slate-400">
                          No hay noticias nuevas.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

            {activeTab === 'rewards' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key="rewards" className="h-full">
                <div className="bg-white rounded-3xl border-4 border-pink-100 p-8 shadow-xl h-full flex flex-col items-center justify-center text-center">
                  <Gift size={64} className="text-pink-400 mb-4" />
                  <h3 className="text-2xl font-black text-slate-700 mb-2">Editor de Premios</h3>
                  <p className="text-slate-500 font-bold mb-8 max-w-md">Diseña tus propios cupones mágicos y asigna el esfuerzo que valen.</p>
                  <div className="max-w-md w-full">
                    <RewardCreator onSave={addCustomReward} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key="stats" className="h-full">
                <div className="bg-white rounded-3xl border-4 border-indigo-100 p-8 shadow-xl h-full flex flex-col items-center justify-center text-center">
                  <TrendingUp size={64} className="text-indigo-400 mb-4" />
                  <h3 className="text-2xl font-black text-slate-700 mb-2">Análisis de Progreso</h3>
                  <p className="text-slate-500 font-bold mb-8 max-w-md">Gráficas avanzadas para ver qué temas se le dan mejor y cuáles necesitan más práctica.</p>
                  <div className="w-full bg-slate-50 rounded-2xl border-4 border-dashed border-indigo-100 h-48 flex items-center justify-center">
                    <p className="font-black text-indigo-200 uppercase tracking-widest text-2xl">Construyendo...</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>

    <AnimatePresence>
        {showAddChild && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2.5rem] border-8 border-blue-100 p-8 w-full max-w-sm shadow-2xl relative overflow-hidden">
              <div className="text-center relative z-10">
                <h3 className="text-3xl font-black text-slate-700 mb-2">Nuevo Hijo</h3>
                <p className="text-slate-400 font-bold mb-8 text-sm">Escribe el nombre de tu peque para empezar su aventura.</p>
                
                <input 
                  type="text"
                  placeholder="Ej: Juanito"
                  value={childCode} // Reusing childCode state for name for simplicity
                  onChange={e => setChildCode(e.target.value)}
                  className="w-full p-4 mb-4 text-center text-4xl font-black rounded-2xl border-4 border-slate-100 focus:border-primary outline-none shadow-inner bg-slate-50"
                />
                
                {error && <p className="bg-red-50 text-soft-red p-3 rounded-xl mb-4 text-xs font-bold border border-red-100">{error}</p>}
                
                <div className="space-y-3">
                  <button onClick={() => createChild(childCode)} className="w-full p-4 bg-primary text-white font-black rounded-2xl kid-button border-yellow-600 text-lg hover:bg-yellow-400 transition-colors uppercase">
                    Crear Perfil
                  </button>
                  <button onClick={() => setShowAddChild(false)} className="w-full p-3 text-slate-400 font-black text-sm uppercase tracking-widest hover:text-slate-600 transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {editingPhotoUser && (
          <PhotoModal 
            user={editingPhotoUser} 
            onSave={updatePhoto} 
            onClose={() => setEditingPhotoUser(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, label, icon, onClick }: { active: boolean, label: string, icon: any, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${active ? 'bg-primary text-white shadow-lg lg:scale-105' : 'bg-white text-slate-400'}`}
    >
      {icon} {label}
    </button>
  );
}

function PhotoModal({ user, onSave, onClose }: { user: AppUser, onSave: (uid: string, url: string) => void, onClose: () => void }) {
  const [url, setUrl] = useState(user.photoURL || '');
  const avatars = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Buddy',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sasha',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo'
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-[60] backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] border-8 border-purple-100 p-8 w-full max-w-md shadow-2xl">
        <h3 className="text-2xl font-black text-slate-700 mb-6 text-center">Cambiar Foto de {user.displayName}</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          {avatars.map((av, i) => (
            <button 
              key={i} 
              onClick={() => setUrl(av)}
              className={`w-full aspect-square rounded-2xl border-4 transition-all overflow-hidden bg-slate-50 ${url === av ? 'border-primary ring-4 ring-primary/20' : 'border-slate-100 opacity-60 hover:opacity-100'}`}
            >
              <img src={av} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-black text-slate-400 mb-2 block uppercase tracking-widest">O pega un enlace de foto</label>
            <input 
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://ejemplo.com/mifoto.jpg"
              className="w-full p-4 rounded-2xl border-4 border-slate-100 focus:border-primary outline-none font-medium text-sm"
            />
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => onSave(user.uid, url)} 
              className="flex-1 p-4 bg-primary text-white font-black rounded-2xl shadow-lg border-b-4 border-yellow-600 hover:bg-yellow-400 transition-all uppercase tracking-widest"
            >
              Guardar
            </button>
            <button 
              onClick={onClose}
              className="p-4 text-slate-400 font-black hover:text-slate-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function RewardCreator({ onSave }: { onSave: (title: string, cost: number) => void }) {
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState(50);

  const handleSave = () => {
    if (!title) return alert("Ponle un nombre al premio");
    onSave(title, Number(cost));
    setTitle('');
    setCost(50);
  };

  return (
    <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border-4 border-slate-100 shadow-inner">
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Nombre del Premio</label>
          <input 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: 1 hora de videojuego" 
            className="w-full p-4 rounded-xl border-2 border-slate-200 outline-none focus:border-primary font-bold text-slate-700" 
          />
        </div>
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Estrellas Necesarias (⭐)</label>
          <input 
            type="number" 
            value={cost}
            onChange={e => setCost(Number(e.target.value))}
            placeholder="50" 
            className="w-full p-4 rounded-xl border-2 border-slate-200 outline-none focus:border-primary font-black text-primary text-xl" 
          />
        </div>
      </div>
      <button 
        onClick={handleSave}
        className="w-full p-4 bg-accent text-white rounded-2xl font-black shadow-lg kid-button border-orange-600 hover:bg-orange-400 transition-all uppercase tracking-widest"
      >
        Guardar Premio Mágico
      </button>
    </div>
  );
}
