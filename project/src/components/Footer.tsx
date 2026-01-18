import { Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-slate-800/50 bg-slate-950/90 backdrop-blur-xl mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size={40} showText={false} blackBg={true} />
            <div>
              <p className="text-lg font-black text-white italic">MY TARGET</p>
              <p className="text-xs text-slate-500">mytarget.ai</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-slate-800 transition-opacity duration-500">
            <div className="w-8 h-8 rounded-xl bg-orange-600/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-500 leading-tight">Ideato e sviluppato da</p>
              <p className="text-sm font-black text-orange-500 tracking-wide">HYTECH srl</p>
            </div>
          </div>

          <div className="text-center md:text-right">
            <p className="text-xs text-slate-600">© 2026 MY TARGET</p>
            <p className="text-xs text-slate-600 mt-1">Tutti i diritti riservati</p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-900 text-center">
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            {t('footerSlogan').includes('<bold>') ? (
              <>
                {t('footerSlogan').split('<bold>')[0]} <span className="text-orange-500 font-bold">{t('footerSlogan').split('<bold>')[1]?.replace('</bold>', '')}</span>
              </>
            ) : (
              t('footerSlogan')
            )}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <a href="/privacy" className="hover:text-orange-500 transition-colors underline-offset-4 hover:underline">
              {t('privacyPolicy')}
            </a>
            <span className="text-slate-700">|</span>
            <a href="/cookie-policy" className="hover:text-orange-500 transition-colors underline-offset-4 hover:underline">
              {t('cookiePolicy')}
            </a>
            <span className="text-slate-700">|</span>
            <a href="/termini" className="hover:text-orange-500 transition-colors underline-offset-4 hover:underline">
              {t('terminiCondizioni')}
            </a>
            <span className="text-slate-700">|</span>
            <a href="/contatti" className="hover:text-orange-500 transition-colors underline-offset-4 hover:underline">
              {t('contatti')}
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-900 text-xs text-slate-500 text-center md:text-left">
          <p>
            HYTECH srl<br />
            Via Donatori di Sangue, 48<br />
            25020 San Paolo (BS)<br />
            P.IVA: 04332900986 • REA: BS-606605 • PEC: <a href="mailto:hytechsrl@legalmail.it" className="hover:text-orange-500 transition-colors underline-offset-4 hover:underline">hytechsrl@legalmail.it</a><br />
            Foro competente: Brescia
          </p>
        </div>
      </div>
    </footer>
  );
}
