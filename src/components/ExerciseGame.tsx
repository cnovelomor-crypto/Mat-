import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, ArrowRight, Home, Info } from 'lucide-react';
import Mascot from './Mascot';

interface GameProps {
  category: string;
  onFinish: (stars: number, category: string, score: number, total: number) => void;
  onCancel: () => void;
}

export default function ExerciseGame({ category, onFinish, onCancel }: GameProps) {
  const [step, setStep] = useState<'tutorial' | 'playing' | 'result'>('tutorial');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<number[]>([]); // Tracks attempts per question
  const [correctOnFirstTry, setCorrectOnFirstTry] = useState<boolean[]>([]);
  const [shake, setShake] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [lastCorrect, setLastCorrect] = useState(false);

  const totalQuestions = 5;

  useEffect(() => {
    generateQuestions();
    setAttempts(new Array(totalQuestions).fill(0));
    setCorrectOnFirstTry(new Array(totalQuestions).fill(false));
  }, [category]);

  const generateQuestions = () => {
    const newQs = [];
    for (let i = 0; i < totalQuestions; i++) {
      let q, a, options;
      if (category === 'sumas') {
        const n1 = Math.floor(Math.random() * 20) + 1;
        const n2 = Math.floor(Math.random() * 20) + 1;
        q = `${n1} + ${n2}`;
        a = n1 + n2;
      } else if (category === 'restas') {
        const n1 = Math.floor(Math.random() * 30) + 10;
        const n2 = Math.floor(Math.random() * (n1 - 1)) + 1;
        q = `${n1} - ${n2}`;
        a = n1 - n2;
      } else if (category === 'multiplicaciones') {
        const n1 = Math.floor(Math.random() * 9) + 1;
        const n2 = Math.floor(Math.random() * 10) + 1;
        q = `${n1} x ${n2}`;
        a = n1 * n2;
      } else if (category === 'divisiones') {
        const n2 = Math.floor(Math.random() * 9) + 2; // Divisor 2-10
        const a_val = Math.floor(Math.random() * 9) + 1; // Result 1-9
        const n1 = n2 * a_val; // Dividend
        q = `${n1} ÷ ${n2}`;
        a = a_val;
      } else if (category === 'figuras') {
        const shapes = [
          { name: 'Triángulo', sides: 3 },
          { name: 'Cuadrado', sides: 4 },
          { name: 'Pentágono', sides: 5 },
          { name: 'Hexágono', sides: 6 },
          { name: 'Círculo', sides: 0 },
          { name: 'Rectángulo', sides: 4 }
        ];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        q = `¿Cuántos lados tiene un ${shape.name}?`;
        a = shape.sides;
      } else {
        q = "2 + 2";
        a = 4;
      }
      
      // Generate options
      const optSet = new Set([a]);
      while (optSet.size < 4) {
        let noise;
        if (a === 0) noise = Math.floor(Math.random() * 5) + 1;
        else noise = Math.floor(Math.random() * (a > 5 ? 10 : 6)) - (a > 5 ? 5 : 2);
        
        const opt = a + noise;
        if (opt >= 0 && opt !== a) {
          optSet.add(opt);
        } else if (optSet.size < 4) {
          optSet.add(a + optSet.size + 1);
        }
      }
      options = Array.from(optSet).sort(() => Math.random() - 0.5);
      newQs.push({ q, a, options });
    }
    setQuestions(newQs);
  };

  const checkAnswer = (selected: number) => {
    const isCorrect = selected === questions[questionIndex].a;
    const currentAttempts = [...attempts];
    currentAttempts[questionIndex] += 1;
    setAttempts(currentAttempts);

    if (isCorrect && currentAttempts[questionIndex] === 1) {
      const firstTry = [...correctOnFirstTry];
      firstTry[questionIndex] = true;
      setCorrectOnFirstTry(firstTry);
    }

    setLastCorrect(isCorrect);
    setShowFeedback(isCorrect ? 'correct' : 'wrong');
    
    if (isCorrect) {
      setTimeout(() => {
        if (questionIndex + 1 < totalQuestions) {
          setQuestionIndex(v => v + 1);
          setShowFeedback('none');
        } else {
          setStep('result');
        }
      }, 1000);
    } else {
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setShowFeedback('none');
      }, 500);
    }
  };

  const getTutorial = () => {
    switch (category) {
      case 'sumas': return "Sumar es como juntar juguetes. ¡A ver cuántos tienes en total!";
      case 'restas': return "Restar es como quitar caramelos de una bolsa. ¡Cuenta los que quedan!";
      case 'multiplicaciones': return "Multiplicar es sumar el mismo número varias veces rápido. ¡Poder matemático!";
      case 'divisiones': return "Dividir es repartir en partes iguales. ¡Como repartir pizza con amigos!";
      case 'figuras': return "Las figuras tienen lados. ¡Cuenta las líneas que forman cada forma!";
      default: return "¡Vamos a aprender matemáticas jugando!";
    }
  };

  if (step === 'tutorial') {
    return (
      <div className="flex flex-col items-center gap-8 py-4">
        <Mascot message={getTutorial()} expression="happy" />
        <div className="bg-white p-8 rounded-[2.5rem] border-4 border-blue-50 shadow-xl max-w-sm text-center relative overflow-hidden">
          <h3 className="text-3xl font-black mb-4 flex items-center justify-center gap-2 text-slate-700">
            <Info className="text-secondary" /> Misión {category.toUpperCase()}
          </h3>
          <p className="text-slate-500 mb-8 font-bold leading-tight">Observa bien la pregunta y elige la respuesta correcta para ganar muchas estrellas.</p>
          <button 
            onClick={() => setStep('playing')}
            className="w-full bg-success text-white font-black p-5 rounded-2xl border-b-4 border-green-700 text-xl hover:bg-green-400 transition-colors uppercase tracking-widest active:translate-y-1 active:border-b-0 shadow-lg"
          >
            ¡Empezar Misión!
          </button>
          <div className="absolute top-0 right-0 p-2 opacity-5 text-4xl">🚀</div>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    const firstTryCount = correctOnFirstTry.filter(v => v).length;
    const score = firstTryCount;
    const stars = score * 5; // Max 25 stars for 5/5
    return (
      <div className="flex flex-col items-center gap-8 py-4">
        <Mascot message={score === 5 ? "¡ERES UN GENIO! ¡Todas a la primera!" : score >= 3 ? "¡Muy bien! Sigue practicando para ser un maestro." : "¡Buen intento! Vamos a intentarlo de nuevo pronto."} expression={score >= 3 ? "excited" : "happy"} />
        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="bg-white p-10 rounded-[3rem] border-4 border-blue-100 shadow-2xl text-center relative overflow-hidden">
          <h2 className="text-4xl font-black mb-4 text-primary tracking-tighter drop-shadow-sm uppercase">Resultado</h2>
          <div className="text-8xl mb-6 star-pulse drop-shadow-lg">⭐</div>
          <p className="text-3xl font-black mb-4 text-slate-700">{score} de {totalQuestions} A la primera</p>
          <p className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest">+ {stars} Estrellitas ganadas</p>
          <button 
            onClick={() => onFinish(stars, category, score, totalQuestions)}
            className="w-full bg-primary text-white font-black p-5 rounded-2xl border-b-4 border-yellow-600 text-xl hover:bg-yellow-400 transition-all uppercase active:translate-y-1 active:border-b-0 shadow-lg"
          >
            Guardar Estrellas
          </button>
          <div className="absolute bottom-0 left-0 p-4 opacity-5 text-6xl">✨</div>
        </motion.div>
      </div>
    );
  }

  const current = questions[questionIndex];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center text-xs font-black bg-white border-4 border-blue-50 px-6 py-3 rounded-2xl shadow-md text-slate-400 uppercase tracking-widest">
        <button onClick={onCancel} className="p-1 hover:text-soft-red transition-colors"><Home size={20}/></button>
        <span>Misión: {questionIndex + 1} de {totalQuestions}</span>
        <div className="w-5"></div>
      </div>

      <div className="flex justify-center gap-3">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div key={i} className={`w-10 h-10 rounded-xl border-4 flex items-center justify-center transition-all ${i < questionIndex ? 'bg-success border-green-200 text-white shadow-md' : i === questionIndex ? 'bg-primary border-yellow-200 text-white animate-pulse shadow-lg scale-110' : 'bg-white border-slate-100 text-slate-300'}`}>
            {i < questionIndex ? <Check size={20} strokeWidth={4} /> : <span className="font-black">{i + 1}</span>}
          </div>
        ))}
      </div>

      <motion.div 
        animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
        className="bg-white rounded-[2.5rem] border-4 border-blue-100 shadow-xl text-center py-16 relative overflow-hidden"
      >
        <h3 className="text-7xl font-black text-slate-700 tracking-wider">
          {current.q} = ?
        </h3>
        <div className="absolute bottom-4 right-4 opacity-5 text-8xl pointer-events-none select-none">🧩</div>
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        {current.options.map((opt: number, idx: number) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => checkAnswer(opt)}
            className="p-10 bg-white border-4 border-blue-50 rounded-[2rem] text-5xl font-black text-slate-700 shadow-lg hover:border-secondary hover:text-secondary transition-all active:translate-y-1 active:shadow-none"
          >
            {opt}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {showFeedback !== 'none' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className={`fixed inset-0 flex items-center justify-center z-50 pointer-events-none bg-slate-900/10 backdrop-blur-[2px]`}
          >
            <div className={`p-16 rounded-full shadow-2xl flex items-center justify-center text-white border-8 border-white/50 ${showFeedback === 'correct' ? 'bg-success' : 'bg-soft-red'}`}>
              {showFeedback === 'correct' ? <Check size={120} strokeWidth={5} /> : <X size={120} strokeWidth={5} />}
            </div>
            {showFeedback === 'correct' && <ConfettiOverlay />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConfettiOverlay() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
       {Array.from({ length: 30 }).map((_, i) => (
         <motion.div
           key={i}
           initial={{ top: -20, left: `${Math.random() * 100}%`, rotate: 0 }}
           animate={{ top: '120%', left: `${Math.random() * 100}%`, rotate: 360 }}
           transition={{ duration: 1.5, ease: "linear", delay: Math.random() * 0.2 }}
           className={`absolute w-3 h-3 rounded-sm ${['bg-primary', 'bg-secondary', 'bg-accent', 'bg-pink-400'][Math.floor(Math.random() * 4)]}`}
         />
       ))}
    </div>
  );
}
