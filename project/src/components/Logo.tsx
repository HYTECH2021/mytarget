interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'color' | 'white';
}

export function Logo({ className = '', size = 32, variant = 'color' }: LogoProps) {
  const isWhite = variant === 'white';

  return (
    <div className={`relative inline-block ${className}`}>
      <style>
        {`
          @keyframes axis-north {
            0%, 100% { transform: translateY(0); }
            30% { transform: translateY(8px); }
            60% { transform: translateY(-2px); }
          }
          @keyframes axis-south {
            0%, 100% { transform: translateY(0); }
            35% { transform: translateY(-8px); }
            65% { transform: translateY(2px); }
          }
          @keyframes axis-west {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(8px); }
            55% { transform: translateX(-2px); }
          }
          @keyframes axis-east {
            0%, 100% { transform: translateX(0); }
            40% { transform: translateX(-8px); }
            70% { transform: translateX(2px); }
          }
          @keyframes core-glow {
            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px #f97316); opacity: 1; }
            30% { transform: scale(1.15); filter: drop-shadow(0 0 15px #f97316); opacity: 0.9; }
            80% { transform: scale(0.98); filter: drop-shadow(0 0 3px #f97316); }
          }
          @keyframes scan-line-move {
            0% { transform: translateY(-45px); opacity: 0; }
            50% { opacity: 0.4; }
            100% { transform: translateY(45px); opacity: 0; }
          }
          .logo-animate-north { animation: axis-north 4.5s ease-in-out infinite; }
          .logo-animate-south { animation: axis-south 4.8s ease-in-out infinite; }
          .logo-animate-west { animation: axis-west 4.2s ease-in-out infinite; }
          .logo-animate-east { animation: axis-east 5s ease-in-out infinite; }
          .logo-animate-core { animation: core-glow 4s ease-in-out infinite; }
          .logo-scan-line { animation: scan-line-move 3.5s linear infinite; }
          .logo-container {
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .logo-container:hover {
            transform: scale(1.02);
            background-color: rgba(0, 0, 0, 0.4);
          }
        `}
      </style>

      <div
        className="relative flex items-center justify-center bg-black/30 rounded-full border border-slate-800/50 logo-container"
        style={{ width: size, height: size }}
      >
        <div
          className="absolute bg-gradient-to-r from-transparent via-orange-500/30 to-transparent logo-scan-line"
          style={{
            width: '75%',
            height: '1px',
          }}
        />

        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <circle
            cx="50"
            cy="50"
            r="32"
            stroke="white"
            strokeWidth="0.5"
            className="opacity-10"
          />

          <g stroke="#f97316" strokeWidth="3.5" strokeLinecap="round">
            <path d="M50 5V22" className="logo-animate-north" />
            <path d="M50 78V95" className="logo-animate-south" />
            <path d="M5 50H22" className="logo-animate-west" />
            <path d="M78 50H95" className="logo-animate-east" />
          </g>

          <g className="logo-animate-core">
            <circle cx="50" cy="50" r="7.5" fill="#f97316" />
            <circle
              cx="50"
              cy="50"
              r="16"
              stroke="#f97316"
              strokeWidth="0.5"
              className="opacity-20"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
