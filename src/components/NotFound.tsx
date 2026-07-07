import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none no-print">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center text-text-secondary mb-6"
      >
        <Compass className="w-8 h-8 stroke-[1.5]" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-4xl font-extrabold font-display tracking-tight text-text-bright"
      >
        404 - Page Not Found
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-text-secondary mt-2 max-w-sm mx-auto leading-relaxed"
      >
        The page you are looking for doesn't exist or was moved to another location.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <Button onClick={() => navigate('/')} className="flex items-center gap-2 font-semibold">
          <Home className="w-4 h-4" /> Back to Safety
        </Button>
      </motion.div>
    </div>
  );
}
