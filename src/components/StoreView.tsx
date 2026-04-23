import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Star, ShoppingBag, Send } from 'lucide-react';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

const PREBUILT_REWARDS = [
  { id: 'h1', title: 'Cita de Helado 🍦', cost: 40, icon: '🍦' },
  { id: 'h2', title: 'Partido de Fútbol / Jugar con Papá ⚽', cost: 50, icon: '⚽' },
  { id: 'h3', title: 'Paseo al Parque 🎡', cost: 30, icon: '🎡' },
  { id: 'h4', title: 'Noche de Película 🎬', cost: 60, icon: '🎬' },
  { id: 'h5', title: 'Cuento Extra 📖', cost: 20, icon: '📖' },
  { id: 'h6', title: 'Hacer manualidades juntos 🎨', cost: 35, icon: '🎨' },
];

export default function StoreView({ points, onClose, parentId, childId, childDisplayName }: { points: number, onClose: () => void, parentId: string, childId: string, childDisplayName: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleRedeem = async (reward: any) => {
    if (points < reward.cost) return;
    if (!childId) return;
    
    setLoading(true);
    try {
      // 1. Subtract points
      await updateDoc(doc(db, 'users', childId), {
        points: increment(-reward.cost)
      });

      // 2. Create redemption record
      await addDoc(collection(db, 'redemptions'), {
        childId: childId,
        rewardId: reward.id,
        rewardTitle: reward.title,
        status: 'pending',
        timestamp: serverTimestamp(),
        parentId: parentId || ''
      });

      // 3. Notify parent
      if (parentId) {
        await addDoc(collection(db, 'notifications'), {
          parentId: parentId,
          childName: childDisplayName || 'Hijo',
          message: `🎁 ¡Tienes un regalo pendiente! Canjeó el cupón: '${reward.title}'.`,
          timestamp: serverTimestamp(),
          read: false
        });
      }

      setSuccess(`¡GENIAL! Canjeaste: ${reward.title}`);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl mb-6 shadow-xl border-4 border-blue-50">
        <h2 className="text-2xl font-black text-secondary flex items-center gap-3">
          <ShoppingBag size={32} /> TIENDA MÁGICA
        </h2>
        <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"><X size={28} /></button>
      </div>

      <div className="bg-primary p-6 rounded-3xl text-white flex justify-between items-center card-shadow mb-8 uppercase tracking-widest relative overflow-hidden">
        <div className="relative z-10 flex flex-col">
          <span className="font-bold opacity-80 text-sm">Tus Ahorros</span>
          <span className="text-4xl font-black flex items-center gap-2">
            ⭐ {points}
          </span>
        </div>
        <div className="absolute right-[-20px] top-[-20px] text-9xl opacity-20 pointer-events-none select-none">✨</div>
      </div>

      {success ? (
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-green-50 rounded-3xl border-4 border-green-200 p-10 text-center shadow-xl">
          <div className="text-6xl mb-4">🌈</div>
          <p className="text-2xl font-black text-green-700">{success}</p>
          <p className="text-slate-500 mt-2 font-bold">¡Dile a tus papás que revisen su aplicación!</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PREBUILT_REWARDS.map(reward => (
            <div key={reward.id} className="bg-white p-5 rounded-3xl border-4 border-blue-50 flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow cursor-default group relative overflow-hidden">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl group-hover:scale-110 transition-transform">{reward.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-700 leading-tight mb-1 truncate">{reward.title}</h4>
                  <div className="flex items-center gap-1 text-yellow-500 font-black text-lg">
                     {reward.cost} <span className="text-xs uppercase tracking-tighter">Estrellitas</span>
                  </div>
                </div>
              </div>
              
              <button
                disabled={points < reward.cost || loading}
                onClick={() => handleRedeem(reward)}
                className={`w-full py-3 rounded-2xl font-black transition-all border-b-4 uppercase ${
                  points >= reward.cost 
                    ? 'bg-pink-500 text-white border-pink-700 hover:bg-pink-400 active:translate-y-1 active:border-b-0 active:shadow-none' 
                    : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
                }`}
              >
                {loading ? '...' : points >= reward.cost ? '¡Lo quiero!' : `Faltan ${reward.cost - points}`}
              </button>
            </div>
          ))}
        </div>
      )}

      {!parentId && (
        <p className="text-center text-slate-400 text-xs font-black uppercase tracking-widest bg-white/50 p-2 rounded-xl border border-dashed border-slate-200">
          ⚠️ Debes estar vinculado a un padre para que reciba tus canjes.
        </p>
      )}
    </div>
  );
}
