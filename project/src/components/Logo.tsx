import React from 'react';

/**
 * Componente Logo "MY TARGET" - Versione Sniper Precision (Movimento Ampliato)
 * - Linee del mirino fisse per trasmettere stabilità.
 * - Nucleo arancione con movimento "drift" più ampio e visibile.
 * - Simula il puntamento di precisione con fluttuazioni organiche.
 */
const TacticalLogo = ({ size = 64, showText = true, blackBg = false, className = "" }) => {
  // Durata del ciclo per un movimento fluido e calmo
  const driftDur = "7s";

  return (
    <div className={`flex items-center gap-4 group select-none ${className}`}>
      <div className={`relative flex items-center justify-center ${blackBg ? 'bg-black rounded-lg p-2' : ''}`}>
        {/* Effetto Glow di sfondo (Aura termica) - solo se non c'è sfondo nero */}
        {!blackBg && <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full animate-pulse"></div>}

        {/* SVG del Mirino */}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          {/* Griglia circolare di precisione statica */}
          <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="0.5" className={blackBg ? "text-slate-500/20" : "text-slate-900/10"} />
          <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="0.5" className={blackBg ? "text-slate-500/10" : "text-slate-900/5"} strokeDasharray="2 4" />

          {/* Assi di puntamento FISSI (Riferimento balistico) */}
          <g className="text-orange-500">
            <line x1="50" y1="8" x2="50" y2="28" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <line x1="50" y1="72" x2="50" y2="92" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <line x1="8" y1="50" x2="28" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <line x1="72" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* Nucleo Centrale con Movimento "Sniper Drift" Ampliato */}
          <circle r="7.5" fill="#f97316">
            {/* Movimento X: Deriva più ampia (range 45-55 invece di 48-52) */}
            <animate
              attributeName="cx"
              values="50;45;54;50;50;55;46;50"
              keyTimes="0;0.15;0.35;0.5;0.65;0.8;0.9;1"
              dur={driftDur}
              repeatCount="indefinite"
            />
            {/* Movimento Y: Deriva più ampia e asincrona */}
            <animate
              attributeName="cy"
              values="50;55;46;50;50;45;53;50"
              keyTimes="0;0.2;0.4;0.55;0.7;0.85;0.95;1"
              dur={driftDur}
              repeatCount="indefinite"
            />

            {/* Micro-pulsazione del raggio: cambia dimensione durante il movimento */}
            <animate
              attributeName="r"
              values="6.5;8.5;8.5;6.5"
              keyTimes="0;0.45;0.55;1"
              dur={driftDur}
              repeatCount="indefinite"
            />

            {/* Variazione opacità per simulare la profondità/messa a fuoco */}
            <animate
              attributeName="opacity"
              values="1;0.7;1;1"
              keyTimes="0;0.5;0.7;1"
              dur={driftDur}
              repeatCount="indefinite"
            />
          </circle>

          {/* Punto focale centrale assoluto (fisso per riferimento visivo) */}
          <circle cx="50" cy="50" r="1.2" fill="currentColor" className={blackBg ? "text-slate-500/60" : "text-slate-900/40"} />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <h1 className="text-3xl font-black italic tracking-tighter leading-none text-orange-500 uppercase">
            MY TARGET
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-400">
              High Precision Tracking
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TacticalLogo;
