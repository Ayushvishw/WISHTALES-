import type { ReactNode } from "react";
import "./love-posters.css";

/** Shop posters for the anniversary and proposal skins. Drawn around the edges so the name stays readable. */
export const LOVE_ART: Record<string, ReactNode> = {
  timeless: (
    <>
      <defs>
        <radialGradient id="lp-wine" cx="50%" cy="45%" r="70%"><stop offset="0" stopColor="#3a1222" /><stop offset="1" stopColor="#1d0b12" /></radialGradient>
      </defs>
      <rect width="500" height="400" fill="url(#lp-wine)" />
      <rect x="18" y="18" width="464" height="364" fill="none" stroke="#e8b86a" strokeWidth="1.4" />
      <rect x="28" y="28" width="444" height="344" fill="none" stroke="#e8b86a" strokeWidth=".6" opacity=".6" />
      <g className="lp-rings" transform="translate(250 330)">
        <circle cx="-16" r="26" fill="none" stroke="#e8b86a" strokeWidth="7" />
        <circle cx="16" r="26" fill="none" stroke="#f6d7a7" strokeWidth="7" />
        <path d="M16-34l7 6-7 9-7-9z" fill="#fff" />
      </g>
      <path d="M250 62c-6-10-24-8-20 6 3 9 20 18 20 18s17-9 20-18c4-14-14-16-20-6z" fill="#c2185b" />
      <path d="M150 74h70M280 74h70" stroke="#e8b86a" strokeWidth="1" />
      {[[70, 120], [430, 140], [90, 300], [410, 290], [60, 210], [440, 220]].map(([x, y], i) => (
        <path key={i} className="tw" style={{ animationDelay: `${i * 0.4}s` }} d={`M${x} ${y - 7}c1 4 3 6 7 7-4 1-6 3-7 7-1-4-3-6-7-7 4-1 6-3 7-7z`} fill="#f6d7a7" />
      ))}
    </>
  ),
  diary: (
    <>
      <rect width="500" height="400" fill="#f6efe2" />
      <g stroke="#9fb7d9" strokeWidth="1" opacity=".55">{Array.from({ length: 14 }, (_, i) => <line key={i} x1="0" x2="500" y1={60 + i * 26} y2={60 + i * 26} />)}</g>
      <line x1="70" x2="70" y1="0" y2="400" stroke="#e4572e" strokeWidth="1.4" opacity=".6" />
      <g fill="#cfc3ad">{Array.from({ length: 11 }, (_, i) => <circle key={i} cx="28" cy={24 + i * 36} r="7" />)}</g>
      <g transform="translate(400 96) rotate(9)">
        <rect x="-58" y="-66" width="116" height="136" fill="#fffdf6" stroke="#e8dcc5" />
        <rect x="-48" y="-56" width="96" height="92" fill="#79addc" opacity=".55" />
        <circle cx="-10" cy="-22" r="13" fill="#f2a541" opacity=".85" />
        <path d="M-48 36l30-30 20 16 18-12 28 26z" fill="#23395b" opacity=".55" />
        <rect x="-26" y="-78" width="52" height="18" fill="#e4572e" opacity=".55" transform="rotate(-8)" />
      </g>
      <g fill="none" stroke="#e4572e" strokeWidth="2.4" strokeLinecap="round">
        <path className="lp-doodle" d="M110 330c-6-10-24-8-20 6 3 9 20 18 20 18s17-9 20-18c4-14-14-16-20-6z" />
        <path d="M400 330q20-20 40 0t40 0" stroke="#23395b" />
      </g>
      <path d="M96 78l6 12 13 2-10 9 3 13-12-7-12 7 3-13-10-9 13-2z" fill="#f2a541" />
    </>
  ),
  moonlit: (
    <>
      <defs>
        <linearGradient id="lp-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b1026" /><stop offset="1" stopColor="#261f4a" /></linearGradient>
        <radialGradient id="lp-moon"><stop offset="0" stopColor="#fff6d6" /><stop offset=".6" stopColor="#ffe29a" stopOpacity=".25" /><stop offset="1" stopColor="#ffe29a" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="500" height="400" fill="url(#lp-night)" />
      <circle cx="400" cy="90" r="110" fill="url(#lp-moon)" />
      <path d="M408 44a48 48 0 1 0 34 82 40 40 0 1 1-34-82z" fill="#ffe29a" className="lp-glow" />
      <g fill="#fff">{[[40, 50], [120, 90], [220, 40], [300, 80], [60, 180], [470, 210], [340, 170], [180, 120]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1.4 : 2.2} className="tw" style={{ animationDelay: `${i * 0.3}s` }} />)}</g>
      <g stroke="#a9c6ff" strokeWidth="1.2" fill="none" opacity=".8">
        <path d="M70 300l20-20 22 4 16-12 20 20-38 44z" />
      </g>
      <g fill="#c3a6ff">{[[70, 300], [90, 280], [112, 284], [128, 272], [148, 292], [110, 336]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.2" />)}</g>
      <path d="M0 360c60-20 120-24 180-10s120 18 180 4 100-10 140-4v50H0z" fill="#141b3c" opacity=".9" />
    </>
  ),
  cafe: (
    <>
      <rect width="500" height="400" fill="#2b1a12" />
      <g>{Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${i * 50} 0h50v40a25 25 0 0 1-50 0z`} fill={i % 2 ? "#fdf5e8" : "#e07a5f"} />)}</g>
      <g transform="translate(420 380)" fill="none" stroke="#f2cc8f" strokeWidth="2.2" strokeLinejoin="round">
        <path d="M-50 0L-16-150h32L50 0" />
        <path d="M-36-50h72M-26-96h52M-16-150l16-60 16 60" />
        <path d="M-36-50q36-34 72 0" />
      </g>
      <g transform="translate(80 330)">
        <path d="M-34 0h56v14a28 28 0 0 1-56 0z" fill="#fdf5e8" />
        <path d="M22 4c16 0 16 18 0 18" stroke="#fdf5e8" strokeWidth="5" fill="none" />
        <ellipse cx="-6" cy="44" rx="44" ry="6" fill="#e07a5f" />
        <path className="lp-steam" d="M-18-10c-8-12 8-16 0-30M0-10c-8-12 8-16 0-30" stroke="#fdf5e8" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".7" />
      </g>
      {[[60, 120, "#e07a5f"], [440, 150, "#81b29a"], [120, 220, "#f2cc8f"]].map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`} className="bob">
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} rx="6" ry="11" cy="-9" fill={c as string} transform={`rotate(${a})`} />)}
          <circle r="5" fill="#2b1a12" />
        </g>
      ))}
    </>
  ),
  golden: (
    <>
      <rect width="500" height="400" fill="#fbf6ea" />
      <path d="M90 400V170a160 150 0 0 1 320 0v230" fill="none" stroke="#2f6b4f" strokeWidth="14" />
      <path d="M90 400V170a160 150 0 0 1 320 0v230" fill="none" stroke="#b8862b" strokeWidth="2" transform="translate(0 0)" />
      <path d="M108 400V174a142 132 0 0 1 284 0v226" fill="none" stroke="#b8862b" strokeWidth="1" opacity=".6" />
      {[[90, 170], [410, 170], [250, 22]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r="18" fill="#c0576b" />
          <path d="M0-10c7 0 10 6 5 11-4 3-10 1-9-5 1 4 6 4 7 1" stroke="#7d2b3c" strokeWidth="2" fill="none" />
          <path d="M-18 6c-14-2-22 6-22 12 12 0 18-4 22-12zM18 6c14-2 22 6 22 12-12 0-18-4-22-12z" fill="#2f6b4f" />
        </g>
      ))}
      <g fill="#b8862b">{[[40, 60], [460, 70], [30, 330], [470, 320]].map(([x, y], i) => <path key={i} className="tw" style={{ animationDelay: `${i * 0.5}s` }} d={`M${x} ${y - 8}c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z`} />)}</g>
    </>
  ),
  velvet: (
    <>
      <defs>
        <radialGradient id="lp-velvet" cx="50%" cy="40%" r="75%"><stop offset="0" stopColor="#6a1027" /><stop offset=".6" stopColor="#2a0610" /><stop offset="1" stopColor="#14030a" /></radialGradient>
      </defs>
      <rect width="500" height="400" fill="url(#lp-velvet)" />
      <g fill="none" stroke="#f5c86b" strokeWidth="2">
        <path d="M20 70V20h50M480 70V20h-50M20 330v50h50M480 330v50h-50" />
      </g>
      <g transform="translate(250 360)">
        <path d="M-60-40h120l-6 40h-108z" fill="#7a0f2a" />
        <path d="M-64-40q64-70 128 0z" fill="#9b1736" transform="rotate(0)" />
        <ellipse cy="-40" rx="42" ry="9" fill="#3d0612" />
        <g className="lp-ring" transform="translate(0 -62)">
          <circle r="16" fill="none" stroke="#f5c86b" strokeWidth="5" />
          <path d="M0-30l9 8-9 11-9-11z" fill="#eaf6ff" />
        </g>
      </g>
      {[[90, 120], [410, 110], [70, 250], [430, 260], [250, 50]].map(([x, y], i) => (
        <path key={i} className="tw" style={{ animationDelay: `${i * 0.35}s` }} d={`M${x} ${y - 9}c1 6 3 8 9 9-6 1-8 3-9 9-1-6-3-8-9-9 6-1 8-3 9-9z`} fill="#ffb3c1" />
      ))}
    </>
  ),
  nebula: (
    <>
      <rect width="500" height="400" fill="#0d0221" />
      <ellipse cx="120" cy="90" rx="200" ry="120" fill="#9b5de5" opacity=".22" />
      <ellipse cx="420" cy="320" rx="200" ry="120" fill="#ff4ecd" opacity=".18" />
      <ellipse cx="380" cy="80" rx="120" ry="70" fill="#6ae3ff" opacity=".12" />
      <g fill="#fff">{Array.from({ length: 26 }, (_, i) => <circle key={i} cx={(i * 97) % 500} cy={(i * 53) % 400} r={i % 4 ? 1.2 : 2} className="tw" style={{ animationDelay: `${(i % 7) * 0.3}s` }} />)}</g>
      <g className="lp-inf" fill="none" stroke="#ffe066" strokeWidth="1.6" opacity=".9">
        <path d="M250 340c20-24 44-36 64-26s20 36 0 44-44-2-64-18c-20-16-44-28-64-18s-20 36 0 44 44-2 64-26z" />
      </g>
      <g fill="#ffe066">{[[250, 340], [314, 314], [314, 358], [186, 314], [186, 358]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.4" />)}</g>
      <g transform="translate(70 330)"><circle r="22" fill="#6ae3ff" opacity=".85" /><ellipse rx="40" ry="8" fill="none" stroke="#ff4ecd" strokeWidth="3" transform="rotate(-18)" /></g>
    </>
  ),
  blush: (
    <>
      <rect width="500" height="400" fill="#fff1f3" />
      <circle cx="80" cy="70" r="120" fill="#ffd6e0" opacity=".7" />
      <circle cx="440" cy="340" r="140" fill="#ffd6e0" opacity=".7" />
      {[[380, 80, -10], [110, 320, 8]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`} className="bob">
          <rect x="-56" y="-36" width="112" height="72" rx="4" fill="#fffaf6" stroke="#f4a3b7" />
          <path d="M-56-36l56 40 56-40" fill="none" stroke="#f4a3b7" strokeWidth="1.5" />
          <circle cy="4" r="12" fill="#e75480" />
          <path d="M0 0c-2-3-7-2-6 2 1 2 6 5 6 5s5-3 6-5c1-4-4-5-6-2z" fill="#fff" />
        </g>
      ))}
      {[[60, 200], [450, 180], [250, 370]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r="16" fill="#e75480" />
          <path d="M0-9c6 0 9 5 5 9-4 3-9 1-8-4 1 3 5 3 6 1" stroke="#a02c55" strokeWidth="2" fill="none" />
          <path d="M-16 6c-12-2-18 4-18 10 10 0 15-4 18-10zM16 6c12-2 18 4 18 10-10 0-15-4-18-10z" fill="#8bb28a" />
        </g>
      ))}
    </>
  ),
  neon: (
    <>
      <rect width="500" height="400" fill="#07070f" />
      <g fill="#12122a">
        <path d="M0 400V300h40v-40h30v60h30v-90h44v120h26v-60h40v80h30V250h50v150h30v-70h36v70h30v-110h44v110h40V310h30v90z" />
      </g>
      <g fill="#f9f871" opacity=".7">{Array.from({ length: 30 }, (_, i) => <rect key={i} x={10 + ((i * 47) % 480)} y={300 + ((i * 29) % 80)} width="5" height="6" className={i % 5 ? "" : "tw"} />)}</g>
      <g className="lp-neon" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M410 120c-10-18-42-14-36 10 5 16 36 32 36 32s31-16 36-32c6-24-26-28-36-10z" stroke="#ff2a6d" strokeWidth="5" />
        <path d="M410 120c-10-18-42-14-36 10 5 16 36 32 36 32s31-16 36-32c6-24-26-28-36-10z" stroke="#ff2a6d" strokeWidth="14" opacity=".25" />
      </g>
      <path d="M40 60h120" stroke="#05d9e8" strokeWidth="4" strokeLinecap="round" className="lp-neon2" />
      <path d="M40 60h120" stroke="#05d9e8" strokeWidth="12" strokeLinecap="round" opacity=".25" />
      <path d="M40 84h70" stroke="#05d9e8" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  fairy: (
    <>
      <defs>
        <linearGradient id="lp-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f1a26" /><stop offset="1" stopColor="#1c2f25" /></linearGradient>
      </defs>
      <rect width="500" height="400" fill="url(#lp-dusk)" />
      <path d="M-10 40q130 80 260 10t260 20" stroke="#3a4d40" strokeWidth="2" fill="none" />
      {Array.from({ length: 12 }, (_, i) => {
        const x = i * 44 + 6;
        const y = 40 + Math.sin((i / 11) * Math.PI) * 40 - (i > 5 ? 10 : 0);
        return <circle key={i} cx={x} cy={y + 8} r="6" fill="#ffd27f" className="lp-bulb" style={{ animationDelay: `${(i % 4) * 0.4}s` }} />;
      })}
      <g fill="#fff3c4">{[[80, 200], [420, 180], [140, 300], [380, 290], [250, 240], [60, 330], [460, 340]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.4" className="tw" style={{ animationDelay: `${i * 0.35}s` }} />)}</g>
      <path d="M0 400v-40q20-30 30 0 10-40 24-4 12-30 26 0 14-46 28-2 10-30 24 4 16-40 30 0 12-26 28 4 14-40 28 0 10-30 26 2 14-44 30-2 10-30 26 4 16-36 28 0 12-30 28 4 12-40 30-2 14-30 26 4 14-36 28 0 10-26 26 6 14-30 30 0v40z" fill="#0c1610" />
      <g transform="translate(410 300)" className="bob">
        <path d="M-14 0h28l-4 30h-20z" fill="#e9a6b4" opacity=".9" />
        <circle cy="14" r="7" fill="#ffd27f" opacity=".9" />
      </g>
    </>
  ),
};
