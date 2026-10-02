import type { Season } from './seasons';

/**
 * What the Hijri season brings to every garden: lanterns strung for Ramadan, more light in
 * its last ten nights, bunting for Eid, warm light through the first days of Dhul Hijjah,
 * and the new crescent at the turn of the year.
 */
export function SeasonSky({ season, y, lit, glow, night, motion }: { season: Season; y: number; lit: number; glow: string; night: boolean; motion: boolean }) {
  const sag = (x: number) => y + Math.sin((x / 400) * Math.PI) * 14;
  const string = `M-4 ${y} Q200 ${y + 28} 404 ${y}`;
  if (season === 'ramadan' || season === 'lastTen') {
    const xs = Array.from({ length: 10 }, (_, i) => 20 + i * 40);
    const colours = ['#e2b33c', '#c8283a', '#2f8a6e', '#2f5fa8'];
    const on = Math.max(lit, season === 'lastTen' ? 0.4 : 0.15);
    return <g className="lg-season">
      {season === 'lastTen' && night && <rect width="400" height="300" fill="#ffd66b" opacity=".07" className="lg-bloom" />}
      <path d={string} stroke="#3d3226" strokeWidth=".6" fill="none" />
      {xs.map((x, i) => {
        const top = sag(x); const drop = 6 + (i % 3) * 5;
        return <g key={x} transform={`translate(${x} ${top.toFixed(1)})`}>
          <line y2={drop} stroke="#3d3226" strokeWidth=".4" />
          <g transform={`translate(0 ${drop})`}><g className="lg-lantern" style={{ animationDelay: `${i * 0.3}s` }}>
            <circle className="lg-flicker" cy="6" r="10" fill={glow} opacity={on} />
            <path d="M-1.6 0 H1.6 L3 2 H-3 Z" fill="#9a7420" />
            <path d="M-3 2 L-3.6 8 L0 11 L3.6 8 L3 2 Z" fill={colours[i % 4]} opacity=".9" />
            <path d="M-3 2 L-3.6 8 L0 11 L3.6 8 L3 2 Z" fill="#ffe6a0" opacity={on * 0.7} />
            <path d="M0 2 V11" stroke="#9a7420" strokeWidth=".4" />
          </g></g>
        </g>;
      })}
    </g>;
  }
  if (season === 'eidFitr' || season === 'eidAdha') {
    const colours = ['#2f8a6e', '#e2b33c', '#f6f1e6', '#c8283a'];
    return <g className="lg-season">
      <path d={string} stroke="#5a4632" strokeWidth=".6" fill="none" />
      {Array.from({ length: 22 }, (_, i) => {
        const x = 8 + i * 18.4; const top = sag(x);
        return <path key={i} d={`M${(x - 5).toFixed(1)} ${top.toFixed(1)} L${(x + 5).toFixed(1)} ${(top + 0.4).toFixed(1)} L${x.toFixed(1)} ${(top + 10).toFixed(1)} Z`} fill={colours[i % 4]} className={motion ? 'lg-flower' : undefined} style={{ animationDelay: `${-i * 0.4}s` }} />;
      })}
    </g>;
  }
  if (season === 'dhulHijjah' || season === 'arafah') {
    const strength = season === 'arafah' ? 0.16 : 0.09;
    return <g className="lg-season" opacity={night ? 0.5 : 1}>
      {[-34, -18, -4, 10, 24, 38].map((a, i) => <path key={a} d="M200 -20 L188 320 L212 320 Z" transform={`rotate(${a} 200 -20)`} fill="#ffe2a0" opacity={strength * (i % 2 ? 0.7 : 1)} />)}
    </g>;
  }
  if (season === 'newYear') {
    // The new crescent, thin and low in the west.
    return <g className="lg-season" transform="translate(150 46)">
      <circle r="14" fill={glow} opacity=".35" />
      <path d="M0 -8 A8 8 0 1 0 0 8 A6.6 6.6 0 1 1 0 -8 Z" transform="rotate(-30)" fill="#f6f0d8" opacity={night ? 1 : 0.7} />
    </g>;
  }
  return null;
}
