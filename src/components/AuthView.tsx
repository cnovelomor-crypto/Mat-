import { useState } from 'react';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import Mascot from './Mascot';
import { motion } from 'motion/react';
import { LogIn, UserPlus } from 'lucide-react';

export default function AuthView() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'parent' | 'child'>('parent');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: name,
          role: role,
          points: role === 'child' ? 0 : null,
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Padre',
          role: 'parent', // Default to parent for google sign in
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-yellow-50">
      <Mascot message={isRegister ? "¡Hola! ¿Quieres empezar la aventura?" : "¡Qué bueno verte de nuevo!"} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mt-8 bubble"
      >
        <h1 className="text-4xl font-black text-center text-primary mb-2 tracking-tight drop-shadow-sm">MATEMÁGICAS</h1>
        <h2 className="text-xl font-bold text-center mb-6 text-slate-400">
          {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h2>

        {error && <p className="bg-red-50 text-soft-red p-3 rounded-xl mb-4 text-sm font-medium border border-red-100">{error}</p>}

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-bold mb-1 text-slate-500">Nombre</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none transition-colors bg-slate-50"
                placeholder="Ej: Papá Luis o Juanito"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-500">Correo</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none transition-colors bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1 text-slate-500">Contraseña</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none transition-colors bg-slate-50"
            />
          </div>

          {isRegister && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole('parent')}
                className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${role === 'parent' ? 'bg-secondary border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
              >
                Soy Padre
              </button>
              <button
                type="button"
                onClick={() => setRole('child')}
                className={`flex-1 p-3 rounded-xl border-2 font-bold transition-all ${role === 'child' ? 'bg-accent border-orange-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
              >
                Soy Niño
              </button>
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full p-4 bg-primary text-white rounded-2xl font-black text-xl kid-button border-yellow-600 flex items-center justify-center gap-2 hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            {loading ? 'Cargando...' : isRegister ? <><UserPlus size={24} /> Registrarme</> : <><LogIn size={24} /> Entrar</>}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <button 
            onClick={signInWithGoogle}
            className="w-full p-3 bg-white border-2 border-slate-100 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors text-slate-600"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Entrar con Google
          </button>

          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="w-full text-center font-bold text-secondary hover:underline"
          >
            {isRegister ? '¿Ya tienes cuenta? Entra aquí' : '¿Eres nuevo? Crea tu cuenta'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
