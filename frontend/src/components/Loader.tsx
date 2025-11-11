import { motion } from 'framer-motion';

export default function Loader({ text = 'Betöltés...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <motion.div
        className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <p className="mt-4 text-gray-400">{text}</p>
    </div>
  );
}
