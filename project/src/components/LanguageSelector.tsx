import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export function LanguageSelector() {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'it', label: t('italiano') },
    { code: 'en', label: t('english') },
    { code: 'fr', label: t('francais') },
    { code: 'es', label: t('espanol') },
  ];

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm"
        aria-label={t('lingua')}
      >
        <Languages className="w-4 h-4" />
        <span className="hidden sm:inline">{languages.find(l => l.code === i18n.language)?.label || 'IT'}</span>
      </button>
      <div className="absolute right-0 mt-2 w-40 rounded-xl bg-slate-800 border border-slate-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-full text-left px-4 py-2 text-sm first:rounded-t-xl last:rounded-b-xl hover:bg-slate-700 transition-colors ${
              i18n.language === lang.code
                ? 'text-orange-400 font-semibold bg-slate-700/50'
                : 'text-slate-300'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
