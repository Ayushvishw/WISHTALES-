/** Animated illustrations, one per occasion. Animation lives in site.css under .scene-*. */

export const OCCASION_LOOK: Record<string, { a: string; b: string; line: string; blurb: string }> = {
  birthday: { a: "#ff6b9a", b: "#ffc861", line: "Balloons, games, candles and a letter they open one surprise at a time.", blurb: "10 templates" },
  anniversary: { a: "#ff4d6d", b: "#ffb4a2", line: "Every year you've shared, in one story they can relive.", blurb: "Coming soon" },
  friendship: { a: "#4fd1c5", b: "#ffd166", line: "Inside jokes, old photos, and a thank-you they won't forget.", blurb: "Coming soon" },
  proposal: { a: "#b388ff", b: "#ff8fab", line: "Build up to the question. They tap Yes at the end.", blurb: "Coming soon" },
  wedding: { a: "#ff9f1c", b: "#e63946", line: "Blessings, memories and a toast from far away.", blurb: "Coming soon" },
  "mothers-day": { a: "#ff8fab", b: "#ffd6a5", line: "Thank her for everything, in her favourite colours.", blurb: "Coming soon" },
  "fathers-day": { a: "#5aa9e6", b: "#7fc8a9", line: "For the man who never says it first.", blurb: "Coming soon" },
};

export function Scene({ slug }: { slug: string }) {
  switch (slug) {
    case "birthday":
      return (
        <svg viewBox="0 0 200 160" className="scene scene-bday" aria-hidden="true">
          <g className="sb-balloons">
            <g className="b1"><ellipse cx="40" cy="40" rx="15" ry="19" fill="#ff6b9a" /><path d="M40 59q-4 14 2 34" stroke="#fff" strokeOpacity=".5" fill="none" /></g>
            <g className="b2"><ellipse cx="164" cy="34" rx="13" ry="17" fill="#8b7bff" /><path d="M164 51q4 14-2 34" stroke="#fff" strokeOpacity=".5" fill="none" /></g>
            <g className="b3"><ellipse cx="148" cy="62" rx="11" ry="14" fill="#ffc861" /><path d="M148 76q-3 10 1 22" stroke="#fff" strokeOpacity=".5" fill="none" /></g>
          </g>
          <rect x="58" y="96" width="84" height="44" rx="8" fill="#ffe3ec" />
          <rect x="58" y="96" width="84" height="12" rx="6" fill="#ff6b9a" />
          <path d="M58 106q7 8 14 0t14 0 14 0 14 0 14 0 14 0" stroke="#ff6b9a" strokeWidth="6" fill="none" strokeLinecap="round" />
          <rect x="50" y="138" width="100" height="6" rx="3" fill="#fff" opacity=".85" />
          {[78, 100, 122].map((x, i) => (
            <g key={x}>
              <rect x={x - 3} y="76" width="6" height="20" rx="2" fill="#fff" />
              <path className={`flame f${i}`} d={`M${x} 62c5 6 5 10 0 13-5-3-5-7 0-13z`} fill="#ffc861" />
            </g>
          ))}
        </svg>
      );
    case "anniversary":
      return (
        <svg viewBox="0 0 200 160" className="scene scene-anni" aria-hidden="true">
          <circle className="ring r1" cx="84" cy="88" r="30" fill="none" stroke="#ffc861" strokeWidth="9" />
          <circle className="ring r2" cx="118" cy="88" r="30" fill="none" stroke="#ffe0a3" strokeWidth="9" />
          <path className="gem" d="M118 50l8 8-8 10-8-10z" fill="#bfe9ff" />
          {[[40, 40], [160, 46], [150, 130], [46, 128]].map(([x, y], i) => (
            <path key={i} className={`hrt h${i}`} d={`M${x} ${y + 6}c-6-4-10-8-8-12 2-3 6-3 8 0 2-3 6-3 8 0 2 4-2 8-8 12z`} fill="#ff4d6d" />
          ))}
        </svg>
      );
    case "friendship":
      return (
        <svg viewBox="0 0 200 160" className="scene scene-friend" aria-hidden="true">
          <g className="orbit">
            <circle cx="100" cy="80" r="44" fill="none" stroke="#fff" strokeOpacity=".18" strokeDasharray="3 6" />
            <circle className="o1" cx="56" cy="80" r="16" fill="#4fd1c5" />
            <circle className="o2" cx="144" cy="80" r="16" fill="#ffd166" />
          </g>
          <path d="M84 80c0-10 16-10 16 0 0-10 16-10 16 0 0 12-16 20-16 20s-16-8-16-20z" fill="#ff6b9a" className="beat" />
        </svg>
      );
    case "proposal":
      return (
        <svg viewBox="0 0 200 160" className="scene scene-prop" aria-hidden="true">
          <path className="lid" d="M62 84V64a8 8 0 0 1 8-8h60a8 8 0 0 1 8 8v20z" fill="#7b4fd6" />
          <rect x="58" y="84" width="84" height="48" rx="8" fill="#9b6dff" />
          <rect x="72" y="92" width="56" height="30" rx="6" fill="#2b1a4a" />
          <circle cx="100" cy="98" r="12" fill="none" stroke="#ffd166" strokeWidth="5" />
          <path className="gem" d="M100 74l9 8-9 12-9-12z" fill="#e0f4ff" />
          {[[60, 40], [146, 36], [168, 96], [32, 100]].map(([x, y], i) => (
            <path key={i} className={`spark s${i}`} d={`M${x} ${y - 8}c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8z`} fill="#fff" />
          ))}
        </svg>
      );
    case "wedding":
      return (
        <svg viewBox="0 0 200 160" className="scene scene-wed" aria-hidden="true">
          <path d="M44 150V70q56-56 112 0v80" fill="none" stroke="#e63946" strokeWidth="8" />
          <path className="garland" d="M44 74q56 40 112 0" fill="none" stroke="#ff9f1c" strokeWidth="9" strokeDasharray="1 10" strokeLinecap="round" />
          {[60, 80, 100, 120, 140].map((x, i) => (
            <g key={x} className={`hang h${i}`}>
              <path d={`M${x} ${90 - Math.abs(100 - x) * 0.3}v${22 + (i % 2) * 8}`} stroke="#ffd166" strokeWidth="2" />
              <circle cx={x} cy={114 - Math.abs(100 - x) * 0.3 + (i % 2) * 8} r="5" fill="#ff9f1c" />
            </g>
          ))}
          <path className="diya" d="M86 144h28q-2 8-14 8t-14-8z" fill="#ffc861" />
          <path className="flame" d="M100 128c4 5 4 9 0 12-4-3-4-7 0-12z" fill="#ffd166" />
        </svg>
      );
    case "mothers-day":
      return (
        <svg viewBox="0 0 200 160" className="scene scene-mom" aria-hidden="true">
          {[[70, 70, "#ff8fab"], [100, 54, "#ffd6a5"], [130, 70, "#ff6b9a"], [86, 92, "#ffc8dd"], [116, 92, "#ffafcc"]].map(([x, y, c], i) => (
            <g key={i} className={`fl f${i}`} style={{ transformOrigin: `${x}px ${y}px` }}>
              {Array.from({ length: 6 }, (_, k) => (
                <ellipse key={k} cx={x as number} cy={(y as number) - 9} rx="6" ry="10" fill={c as string} transform={`rotate(${k * 60} ${x} ${y})`} />
              ))}
              <circle cx={x as number} cy={y as number} r="5" fill="#fff3c4" />
            </g>
          ))}
          <path d="M100 150l-24-40h48z" fill="#7fc8a9" />
          <path d="M86 120h28" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case "fathers-day":
      return (
        <svg viewBox="0 0 200 160" className="scene scene-dad" aria-hidden="true">
          <path d="M70 40h60v26a30 30 0 0 1-60 0z" fill="#ffd166" />
          <path d="M70 46H54q0 24 18 26M130 46h16q0 24-18 26" stroke="#ffd166" strokeWidth="6" fill="none" />
          <rect x="92" y="94" width="16" height="20" fill="#ffc861" />
          <rect x="74" y="114" width="52" height="12" rx="4" fill="#5aa9e6" />
          <path className="star" d="M100 46l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#fff" />
          {[[42, 120], [160, 112], [150, 30]].map(([x, y], i) => (
            <circle key={i} className={`dot d${i}`} cx={x} cy={y} r="4" fill="#7fc8a9" />
          ))}
        </svg>
      );
    default:
      return null;
  }
}
