import { motion } from 'framer-motion';
import { Target, Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/50 bg-slate-950/90 backdrop-blur-xl mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center"
            >
              <Target className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <p className="text-lg font-black text-white italic">MY TARGET</p>
              <p className="text-xs text-slate-500">mytarget.ai</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-slate-800"
          >
            <div className="w-8 h-8 rounded-xl bg-orange-600/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-500 leading-tight">Ideato e sviluppato da</p>
              <p className="text-sm font-black text-orange-500 tracking-wide">HYTECH srl</p>
            </div>
          </motion.div>

          <div className="text-center md:text-right">
            <p className="text-xs text-slate-600">© 2026 MY TARGET</p>
            <p className="text-xs text-slate-600 mt-1">Tutti i diritti riservati</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-900 text-center">
          <p className="text-xs text-slate-600 leading-relaxed">
            Smetti di cercare. <span className="text-orange-500 font-bold">Fatti trovare.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
