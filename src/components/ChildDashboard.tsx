import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AppUser, Reward, Redemption } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Trophy, ShoppingBag, Settings, Calculator, Shapes, Plus, Minus, X, Percent, LogOut } from 'lucide-react';
import Mascot from './Mascot';
import ExerciseGame from './ExerciseGame';
import StoreView from './StoreView';

export default function ChildDashboard({ user }: { user: AppUser }) {
  const [points, setPoints] = useState(user.points || 0);
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'store' | 'linking'>('lobby');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [linkingCode, setLinkingCode] = useState(user.linkingCode || '');

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snap) => {
      const data = snap.data() as AppUser;
      if (data) {
        setPoints(data.points || 0);
        setLinkingCode(data.linkingCode || '');
      }
    });
    return unsub;
  }, []);

  const generateLinkingCode = async () => {
    if (!auth.currentUser) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { linkingCode: code });
  };

  const startExercise = (category: any) => {
    setSelectedCategory(category);
    setGameState('playing');
  };

  const handleFinishGame = async (stars: number, category: string, score: number, total: number) => {
    if (!auth.currentUser) return;
    
    // Update local and remote points
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      points: increment(stars)
    });

    // Log the result
    await addDoc(collection(db, 'exerciseResults'), {
      childId: auth.currentUser.uid,
      category,
      score,
      totalQuestions: total,
      starsEarned: stars,
      timestamp: serverTimestamp()
    });

    // Notify parent if linked
    if (user.parentId) {
      await addDoc(collection(db, 'notifications'), {
        parentId: user.parentId,
        childName: user.displayName,
        message: `¡Logró ${score}/${total} en ${category.toUpperCase()} y ganó ${stars} estrellitas!`,
        timestamp: serverTimestamp(),
        read: false
      });
    }

    setGameState('lobby');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-yellow-50 overflow-hidden">
      {/* Sidebar - Aside */}
      <aside className="w-full md:w-64 bg-white md:rounded-r-3xl p-6 flex flex-col items-center border-r-4 border-blue-50 shadow-xl z-20 overflow-y-auto">
        <div className="w-24 h-24 bg-orange-100 rounded-full border-4 border-accent mb-4 overflow-hidden flex items-center justify-center text-4xl shadow-inner">
          {user.displayName[0].toUpperCase()}
        </div>
        <h2 className="font-black text-xl mb-1 text-slate-700">¡Hola, {user.displayName}!</h2>
        <p className="text-slate-400 text-sm mb-8 font-bold">Nivel: Explorador</p>
        
        <nav className="w-full space-y-3">
          <button 
            onClick={() => setGameState('lobby')}
            className={`nav-button ${gameState === 'lobby' ? 'nav-button-active' : ''}`}
          >
            <span>🎮</span> Juegos
          </button>
          <button 
            className={`nav-button`}
          >
            <span>🏆</span> Logros
          </button>
          <button 
            onClick={() => setGameState('store')}
            className={`nav-button ${gameState === 'store' ? 'nav-button-active' : ''}`}
          >
            <span>🎁</span> Tienda
          </button>
          
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 p-4 bg-blue-500 text-white font-bold rounded-2xl border-b-4 border-blue-700 hover:bg-blue-600 transition-all mt-10"
          >
            <LogOut size={20} /> Salir
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto custom-scrollbar">
        <header className="min-h-20 bg-white rounded-3xl border-4 border-blue-100 px-8 py-4 flex flex-col md:flex-row items-center justify-between shadow-lg gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-400 p-2 rounded-xl text-white font-black star-pulse">⭐</div>
            <div className="text-2xl font-black text-yellow-500">{points} <span className="text-sm uppercase tracking-wider text-slate-400">Estrellitas</span></div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex gap-1 mr-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-3 h-3 rounded-full ${i <= 2 ? 'bg-green-400' : 'bg-slate-200'}`}></div>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Misión Diaria</span>
          </div>
        </header>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {gameState === 'lobby' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} key="lobby" className="h-full flex flex-col gap-6">
                <div className="bg-white rounded-3xl border-4 border-green-100 p-8 shadow-xl relative overflow-hidden flex-1">
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-3xl font-black text-slate-700">¿Qué vamos a aprender?</h3>
                    <span className="bg-green-100 text-green-700 font-bold px-4 py-2 rounded-full text-sm">+10 Puntos Mágicos</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ExerciseCard 
                      icon="➕" 
                      label="Sumas Locas" 
                      category="sumas" 
                      color="blue" 
                      progress={80} 
                      onClick={() => startExercise('sumas')} 
                      description="¡Para ser un experto!"
                    />
                    <ExerciseCard 
                      icon="➖" 
                      label="Restas Rápidas" 
                      category="restas" 
                      color="orange" 
                      progress={30} 
                      onClick={() => startExercise('restas')} 
                      description="¡Desaparece números!"
                    />
                    <ExerciseCard 
                      icon="✖️" 
                      label="Multi-Poderes" 
                      category="multiplicaciones" 
                      color="purple" 
                      progress={0} 
                      onClick={() => startExercise('multiplicaciones')} 
                      description="¡Números gigantes!"
                    />
                    <ExerciseCard 
                      icon="📐" 
                      label="Figuras" 
                      category="figuras" 
                      color="green" 
                      progress={0} 
                      onClick={() => startExercise('figuras')} 
                      description="¡Dibuja con mate!"
                    />
                  </div>
                  
                  <div className="absolute bottom-4 right-4 opacity-10 text-8xl pointer-events-none select-none">🎲</div>
                </div>

                {!user.parentId && (
                  <div className="bg-indigo-600 rounded-3xl p-6 shadow-xl relative overflow-hidden flex items-center gap-4 text-white">
                    <div className="text-4xl shrink-0">🤖</div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase opacity-70 tracking-widest leading-none mb-1">Código de Héroe</p>
                      <h3 className="text-2xl font-black tracking-widest">{linkingCode || '...'}</h3>
                    </div>
                    {linkingCode ? (
                       <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-indigo-500 rounded-full opacity-30"></div>
                    ) : (
                      <button onClick={generateLinkingCode} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-xs font-bold transition-colors">OBTENER</button>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {gameState === 'playing' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="playing" className="h-full">
                <ExerciseGame 
                  category={selectedCategory} 
                  onFinish={handleFinishGame}
                  onCancel={() => setGameState('lobby')}
                />
              </motion.div>
            )}

            {gameState === 'store' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} key="store" className="h-full">
                <StoreView 
                  points={points} 
                  onClose={() => setGameState('lobby')} 
                  parentId={user.parentId || ''}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function ExerciseCard({ icon, label, description, color, progress, onClick }: { icon: string, label: string, description: string, color: string, progress: number, onClick: () => void }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    green: 'bg-green-50 border-green-200 text-green-800',
  };
  
  const progColors: Record<string, string> = {
    blue: 'bg-blue-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
  };

  return (
    <div 
      onClick={onClick}
      className={`${colors[color] || 'bg-slate-50'} p-6 rounded-3xl border-4 cursor-pointer hover:scale-105 hover:shadow-lg transition-all flex flex-col h-full`}
    >
      <div className="text-4xl mb-2">{icon}</div>
      <h4 className="text-xl font-black mb-1">{label}</h4>
      <p className="text-sm opacity-70 mb-4 font-bold">{description}</p>
      <div className="mt-auto h-2 w-full bg-black/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={`h-full ${progColors[color] || 'bg-slate-500'}`}
        />
      </div>
    </div>
  );
}

