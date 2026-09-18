import { useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { GEO } from "../data/geo";
import { STATE_KEYS, STATES } from "../data/states";

const VIEWBOX = { width: 880, height: 960 };
const projectX = (longitude: number) => (longitude - 67.2) * 28;
const projectY = (latitude: number) => (37.6 - latitude) * 30;

function ringsFor(key: string): number[][] {
  const geometry = GEO[key];
  if (!geometry) return [];
  return Array.isArray(geometry[0]) ? geometry as number[][] : [geometry as number[]];
}
function pathFor(key: string): string {
  return ringsFor(key).map((ring) => {
    let path = "";
    for (let index = 0; index < ring.length; index += 2) path += `${index ? "L" : "M"}${projectX(ring[index]).toFixed(1)},${projectY(ring[index + 1]).toFixed(1)} `;
    return `${path}Z`;
  }).join(" ");
}
function centerFor(key: string) {
  const points = ringsFor(key).flat();
  const xs = points.filter((_, index) => index % 2 === 0).map(projectX);
  const ys = points.filter((_, index) => index % 2 === 1).map(projectY);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

export function IndiaMap({ selectedState, highlightedStates = [], onSelectState }: { selectedState?: string | null; highlightedStates?: string[]; onSelectState?: (stateId: string) => void }) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const centers = useMemo(() => Object.fromEntries(STATE_KEYS.map((key) => [key, centerFor(key)])), []);
  const orderedKeys = useMemo(() => [...STATE_KEYS].sort((a, b) => ringsFor(b).flat().length - ringsFor(a).flat().length), []);
  const activate = (key: string) => setHoveredState(key);
  const clear = () => setHoveredState(null);
  const choose = (key: string) => onSelectState?.(key);
  return <div className={`india-map${hoveredState ? " has-hover" : ""}`}>
    <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} role="group" aria-label="Interactive map of India">
      <defs>
        <pattern id="state-hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(28)"><line x1="0" y1="0" x2="0" y2="8" stroke="var(--state-color, #b64232)" strokeWidth="2" opacity=".75" /></pattern>
        <filter id="map-glow"><feGaussianBlur stdDeviation="2.4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <g className="map-graticule" aria-hidden="true">{[70, 75, 80, 85, 90, 95].map((longitude) => <line key={`lon-${longitude}`} x1={projectX(longitude)} y1="40" x2={projectX(longitude)} y2="936" />)}{[10, 15, 20, 25, 30, 35].map((latitude) => <line key={`lat-${latitude}`} x1="0" y1={projectY(latitude)} x2="880" y2={projectY(latitude)} />)}</g>
      <g className="map-states">{orderedKeys.map((key, index) => {
        const meta = STATES[key]; const d = pathFor(key); const isActive = selectedState === key || highlightedStates.includes(key); const isSmall = key === "delhi" || key === "lakshadweep" || key === "andaman-nicobar";
        const stateStyle = { "--state-color": meta.a, "--draw-delay": `${index * 18}ms` } as CSSProperties;
        const handlers = { onMouseEnter: () => activate(key), onMouseLeave: clear, onFocus: () => activate(key), onBlur: clear, onClick: () => choose(key), onKeyDown: (event: KeyboardEvent<SVGPathElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(key); } } };
        return <g key={key} style={stateStyle}>
          <path className={`map-state${isActive ? " is-active" : ""}${hoveredState === key ? " is-hovered" : ""}`} d={d} pathLength="1" style={stateStyle} {...handlers} tabIndex={0} role="button" aria-label={`${meta.plain ?? meta.name}${isActive ? ", stories available" : ""}`} />
          <path className={`map-hitbox${isSmall ? " is-small" : ""}`} d={d} {...handlers} tabIndex={-1} aria-hidden="true" />
        </g>;
      })}</g>
      {hoveredState && <g className="map-label" pointerEvents="none" filter="url(#map-glow)">
        <circle cx={centers[hoveredState].x} cy={centers[hoveredState].y} r="4" />
        <rect x={centers[hoveredState].x + 10} y={centers[hoveredState].y - 28} width="170" height="30" rx="2" />
        <text x={centers[hoveredState].x + 20} y={centers[hoveredState].y - 9}>{STATES[hoveredState].plain ?? STATES[hoveredState].name}</text>
      </g>}
    </svg>
  </div>;
}
