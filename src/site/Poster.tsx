import type { ReactNode } from "react";
import { LOVE_ART } from "./LovePosters";

/** Each story skin's shop poster: a little scene drawn behind the name, so no two cards look alike. */
const ART: Record<string, ReactNode> = {
  starlit: (
    <>
      <rect width="500" height="400" fill="#12071a" />
      <circle cx="390" cy="92" r="70" fill="#ffc95e" opacity=".14" />
      <path d="M392 50a44 44 0 1 0 32 76 36 36 0 1 1-32-76z" fill="#ffc95e" />
      <g fill="#fff">
        {[[40, 40], [120, 70], [210, 30], [300, 60], [60, 300], [450, 260], [160, 350], [420, 360], [260, 330], [30, 170]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i % 3 ? 1.6 : 2.4} className="tw" style={{ animationDelay: `${i * 0.37}s` }} />
        ))}
      </g>
      <path d="M50 300l30-30 30 10 30-10 30 30-60 60z" fill="none" stroke="#ff5c8a" strokeWidth="1.4" opacity=".7" />
      <g fill="#ff5c8a">
        {[[50, 300], [80, 270], [110, 280], [140, 270], [170, 300], [110, 360]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" />)}
      </g>
    </>
  ),
  royal: (
    <>
      <rect width="500" height="400" fill="#1a0910" />
      <pattern id="dam" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M25 6c8 8 8 30 0 38-8-8-8-30 0-38z" fill="#b3264d" opacity=".25" />
      </pattern>
      <rect width="500" height="400" fill="url(#dam)" />
      <rect x="16" y="16" width="468" height="368" fill="none" stroke="#f3cf8e" strokeWidth="2" />
      <rect x="26" y="26" width="448" height="348" fill="none" stroke="#f3cf8e" strokeWidth=".8" />
      <g transform="translate(250 330)" fill="#b3264d">
        <circle r="18" fill="#e8a598" />
        <path d="M0-14c10 0 14 10 6 16-6 4-14 0-12-8 2 6 8 6 10 2" fill="none" stroke="#b3264d" strokeWidth="2" />
        <path d="M-22 6c-18-4-28 6-30 14 14 2 24-2 30-14zM22 6c18-4 28 6 30 14-14 2-24-2-30-14z" fill="#5d7a3a" />
      </g>
      <path d="M190 64h120M230 56l20-12 20 12" stroke="#f3cf8e" strokeWidth="1.5" fill="none" />
    </>
  ),
  arcade: (
    <>
      <rect width="500" height="400" fill="#0a0a1f" />
      <defs>
        <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe600" /><stop offset="1" stopColor="#ff2e88" /></linearGradient>
      </defs>
      <circle cx="250" cy="240" r="96" fill="url(#sun)" />
      <g fill="#0a0a1f">{[200, 218, 234, 248, 260, 272].map((y, i) => <rect key={i} x="140" y={y} width="220" height={3 + i} />)}</g>
      <rect y="262" width="500" height="138" fill="#0a0a1f" />
      <g stroke="#ff2e88" strokeWidth="1.4" opacity=".85" className="grid">
        {[270, 284, 302, 326, 358, 398].map((y) => <line key={y} x1="0" x2="500" y1={y} y2={y} />)}
        {[-400, -250, -120, 0, 120, 250, 400].map((d) => <line key={d} x1={250 + d * 0.15} y1="262" x2={250 + d * 1.4} y2="400" />)}
      </g>
      <text x="24" y="40" fill="#00e5ff" fontFamily="'Press Start 2P', monospace" fontSize="13">PLAYER 1</text>
      <text x="476" y="40" fill="#ffe600" fontFamily="'Press Start 2P', monospace" fontSize="13" textAnchor="end">♥♥♥</text>
    </>
  ),
  ocean: (
    <>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1d3557" /><stop offset=".55" stopColor="#ff7e67" /><stop offset="1" stopColor="#ffd166" /></linearGradient>
      </defs>
      <rect width="500" height="400" fill="url(#sky)" />
      <circle cx="250" cy="250" r="70" fill="#ffd166" />
      <g className="waves">
        <path d="M0 260c40-14 80-14 125 0s85 14 125 0 85-14 125 0 85 14 125 0 85-14 125 0v140H0z" fill="#2ec4b6" opacity=".55" />
        <path d="M0 290c40-14 80-14 125 0s85 14 125 0 85-14 125 0 85 14 125 0 85-14 125 0v110H0z" fill="#15406a" />
        <path d="M0 330c40-12 80-12 125 0s85 12 125 0 85-12 125 0 85 12 125 0 85-12 125 0v70H0z" fill="#0e2a47" />
      </g>
      <path d="M90 90q8-8 16 0q8-8 16 0M370 60q6-6 12 0q6-6 12 0" stroke="#1d3557" strokeWidth="2.4" fill="none" />
    </>
  ),
  garden: (
    <>
      <rect width="500" height="400" fill="#e8f2e1" />
      <g transform="translate(250 200)">
        <circle r="128" fill="none" stroke="#4f9a5b" strokeWidth="3" />
        {Array.from({ length: 16 }, (_, i) => (
          <g key={i} transform={`rotate(${i * 22.5}) translate(0 -128)`}>
            {i % 2 ? (
              <path d="M0 0c-12-6-14-20-4-26 10 6 10 20 4 26z" fill="#4f9a5b" />
            ) : (
              <g>
                {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} rx="6" ry="11" cy="-9" fill={i % 4 ? "#f6a9bd" : "#d9577a"} transform={`rotate(${a})`} />)}
                <circle r="5" fill="#e3a224" />
              </g>
            )}
          </g>
        ))}
      </g>
    </>
  ),
  galaxy: (
    <>
      <rect width="500" height="400" fill="#050816" />
      <circle cx="140" cy="280" r="160" fill="#8f75ff" opacity=".18" />
      <g fill="#fff">{[[40, 50], [110, 120], [300, 40], [440, 90], [460, 320], [250, 360], [380, 220], [60, 360]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" className="tw" style={{ animationDelay: `${i * 0.4}s` }} />)}</g>
      <g transform="translate(395 300) rotate(-18)">
        <circle r="46" fill="#4cc9f0" />
        <ellipse rx="86" ry="16" fill="none" stroke="#ffd166" strokeWidth="5" />
        <path d="M-46 0a46 46 0 0 0 92 0" fill="#3aa5c9" />
      </g>
      <g className="rocket" transform="translate(96 110) rotate(40)">
        <path d="M0-30c12 10 12 34 0 50-12-16-12-40 0-50z" fill="#e9ecff" />
        <circle cy="-6" r="5" fill="#4cc9f0" />
        <path d="M-8 14l-10 12h12zM8 14l10 12H6z" fill="#8f75ff" />
        <path d="M-5 22q5 18 10 0" fill="#ffd166" />
      </g>
      <g fill="none" stroke="#4cc9f0" strokeWidth="2">
        <path d="M18 46V18h28M482 46V18h-28M18 354v28h28M482 354v28h-28" />
      </g>
    </>
  ),
  desi: (
    <>
      <rect width="500" height="400" fill="#2b0a14" />
      <g transform="translate(250 230)" fill="none" stroke="#ffd166" opacity=".35">
        {[150, 120, 90, 60].map((r) => <circle key={r} r={r} strokeDasharray={r / 10 + " 6"} />)}
        {Array.from({ length: 12 }, (_, i) => <ellipse key={i} rx="16" ry="58" cy="-80" transform={`rotate(${i * 30})`} stroke="#e0218a" />)}
      </g>
      <path d="M0 8q62 30 125 0t125 0 125 0 125 0" stroke="#4a7a2a" strokeWidth="3" fill="none" />
      {Array.from({ length: 13 }, (_, i) => (
        <g key={i} transform={`translate(${i * 41 + 4} ${14 + Math.abs(Math.sin(i * 0.78)) * 12})`}>
          <circle r="9" fill={i % 2 ? "#ffd166" : "#ff9f1c"} />
          <line y1="9" y2="34" stroke="#ff9f1c" strokeWidth="1.5" />
          <circle cy="38" r="4" fill="#e0218a" />
        </g>
      ))}
      {[90, 410].map((x) => (
        <g key={x} transform={`translate(${x} 340)`}>
          <path d="M-26 0h52q-6 22-26 22T-26 0z" fill="#ff9f1c" />
          <path d="M0-30c10 12 8 24 0 28-8-4-10-16 0-28z" fill="#ffd166" className="flame" />
        </g>
      ))}
    </>
  ),
  candy: (
    <>
      <rect width="500" height="400" fill="#ffc2e2" />
      <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="6" fill="#fff" opacity=".7" /><circle cx="30" cy="30" r="6" fill="#fff" opacity=".7" />
      </pattern>
      <rect width="500" height="400" fill="url(#dots)" />
      {[[70, 300, "#ff1f8f"], [430, 290, "#00a8e8"], [440, 90, "#ff9f00"]].map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${i * 20 - 15})`} className="bob">
          <rect x="-4" y="30" width="8" height="90" rx="4" fill="#fff" />
          <circle r="40" fill={c as string} stroke="#fff" strokeWidth="6" />
          <path d="M0 0m-26 0a26 26 0 0 1 52 0a20 20 0 0 1-40 0a14 14 0 0 1 28 0" fill="none" stroke="#fff" strokeWidth="6" />
        </g>
      ))}
      <g transform="translate(70 80) rotate(-20)">
        <rect x="-34" y="-16" width="68" height="32" rx="16" fill="#00a8e8" stroke="#fff" strokeWidth="5" />
        <path d="M-34 0l-20-14v28zM34 0l20-14v28z" fill="#ff9f00" />
      </g>
    </>
  ),
  gala: (
    <>
      <rect width="500" height="400" fill="#0d0d0d" />
      <g transform="translate(250 400)" opacity=".5">
        {Array.from({ length: 19 }, (_, i) => <path key={i} d="M0 0L-14-420h28z" fill="#d4af37" opacity={i % 2 ? 0.12 : 0.28} transform={`rotate(${i * 10 - 90})`} />)}
      </g>
      <g fill="none" stroke="#d4af37" strokeWidth="1.6">
        <path d="M20 20h460v360H20z" />
        <path d="M32 32h436v336H32z" strokeWidth=".8" />
        <path d="M20 70h40l12-12V20M480 70h-40l-12-12V20M20 330h40l12 12v38M480 330h-40l-12 12v38" />
        <path d="M200 60h100M215 52h70M230 44h40" />
      </g>
      <path d="M250 352l8 12-8 12-8-12z" fill="#d4af37" />
    </>
  ),
  scrapbook: (
    <>
      <rect width="500" height="400" fill="#d8bf94" />
      <pattern id="kraft" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="3" r=".9" fill="#7a5a34" opacity=".25" /><circle cx="6" cy="6" r=".7" fill="#fff" opacity=".3" /></pattern>
      <rect width="500" height="400" fill="url(#kraft)" />
      <g transform="translate(370 120) rotate(8)">
        <rect x="-62" y="-70" width="124" height="148" fill="#fbf5e6" />
        <rect x="-52" y="-60" width="104" height="100" fill="#2f6f73" opacity=".7" />
        <circle cx="-14" cy="-20" r="16" fill="#e3a224" opacity=".8" />
        <path d="M-52 40l34-34 24 20 18-14 28 28z" fill="#33241a" opacity=".55" />
        <rect x="-28" y="-82" width="56" height="20" fill="#a8402a" opacity=".55" transform="rotate(-6)" />
      </g>
      <g transform="translate(96 300) rotate(-10)">
        <rect x="-50" y="-40" width="100" height="80" fill="#f3e6cc" />
        <path d="M-40-20h80M-40-4h70M-40 12h76M-40 28h50" stroke="#a8402a" strokeWidth="1" opacity=".4" />
        <rect x="-60" y="-50" width="40" height="16" fill="#2f6f73" opacity=".5" transform="rotate(-30)" />
      </g>
      <path d="M40 60l10 4-8 7 2 10-9-5-9 5 2-10-8-7 10-4 5-9z" fill="#a8402a" />
      <path d="M30 380c80-20 160 10 240-6s140-14 200 0" stroke="#33241a" strokeWidth="2" strokeDasharray="8 6" fill="none" />
    </>
  ),
};

Object.assign(ART, LOVE_ART);

export function hasPoster(skin?: string) {
  return !!skin && skin in ART;
}

export function Poster({ skin }: { skin: string }) {
  return (
    <svg className={`tc-poster pz-${skin}`} viewBox="0 0 500 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {ART[skin]}
    </svg>
  );
}
