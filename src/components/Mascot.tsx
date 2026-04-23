import { motion } from 'motion/react';

interface MascotProps {
  message?: string;
  expression?: 'happy' | 'thinking' | 'excited' | 'sad';
}

export default function Mascot({ message, expression = 'happy' }: MascotProps) {
  const getEmoji = () => {
    switch (expression) {
      case 'happy': return '😊';
      case 'thinking': return '🤔';
      case 'excited': return '🤩';
      case 'sad': return '😢';
      default: return '👋';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div
        animate={{
          y: [0, -10, 0],
          rotate: [0, -2, 2, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "easeInOut"
        }}
        className="text-8xl mb-4 cursor-pointer select-none"
      >
        <div className="bg-white rounded-full p-6 shadow-xl border-4 border-blue-100">
          <span className="block transform hover:scale-110 transition-transform">{getEmoji()}</span>
        </div>
      </motion.div>
      
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white p-4 rounded-2xl kid-shadow border-4 border-slate-900 max-w-xs text-center"
        >
          <p className="font-bold text-lg">{message}</p>
          {/* Bubble tail */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-slate-900"></div>
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white"></div>
        </motion.div>
      )}
    </div>
  );
}
