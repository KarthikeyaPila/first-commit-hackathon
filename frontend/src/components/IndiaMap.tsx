import { useMemo, useState, type CSSProperties } from "react";
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
    for (let index = 0; index < ring.length; index += 2) {
      path += `${index ? "L" : "M"}${projectX(ring[index]).toFixed(1)},${projectY(ring[index + 1]).toFixed(1)} `;
    }
    return `${path}Z`;
  }).join(" ");
}

function centerFor(key: string): { x: number; y: number } {
  const points = ringsFor(key).flat();
  const xs = points.filter((_, index) => index % 2 === 0).map(projectX);
  const ys = points.filter((_, index) => index % 2 === 1).map(projectY);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

export function IndiaMap({
  selectedState,
  highlightedStates = [],
  onSelectState,
}: {
  selectedState?: string | null;
  highlightedStates?: string[];
  onSelectState?: (stateId: string) => void;
}) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const centers = useMemo(() => Object.fromEntries(STATE_KEYS.map((key) => [key, centerFor(key)])), []);
  const orderedKeys = useMemo(() => [...STATE_KEYS].sort((a, b) => ringsFor(b).flat().length - ringsFor(a).flat().length), []);

  return (
    <div className={`india-map${hoveredState ? " has-hover" : ""}`}>
      <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} role="group" aria-label="Interactive map of India">
        <g className="map-graticule" aria-hidden="true">
          {[70, 75, 80, 85, 90, 95].map((longitude) => <line key={`lon-${longitude}`} x1={projectX(longitude)} y1="40" x2={projectX(longitude)} y2="936" />)}
          {[10, 15, 20, 25, 30, 35].map((latitude) => <line key={`lat-${latitude}`} x1="0" y1={projectY(latitude)} x2="880" y2={projectY(latitude)} />)}
        </g>
        <g className="map-states">
          {orderedKeys.map((key) => {
            const meta = STATES[key];
            const isActive = selectedState === key || highlightedStates.includes(key);
            return (
              <path
                key={key}
                className={`map-state${isActive ? " is-active" : ""}${hoveredState === key ? " is-hovered" : ""}`}
                d={pathFor(key)}
                style={{ "--state-color": meta.a } as CSSProperties}
                tabIndex={0}
                role="button"
                aria-label={`${meta.plain ?? meta.name}${isActive ? ", stories available" : ""}`}
                onMouseEnter={() => setHoveredState(key)}
                onMouseLeave={() => setHoveredState(null)}
                onFocus={() => setHoveredState(key)}
                onBlur={() => setHoveredState(null)}
                onClick={() => onSelectState?.(key)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectState?.(key); } }}
              />
            );
          })}
        </g>
        {hoveredState && (
          <g className="map-label" pointerEvents="none">
            <circle cx={centers[hoveredState].x} cy={centers[hoveredState].y} r="5" />
            <text x={centers[hoveredState].x + 10} y={centers[hoveredState].y - 8}>{STATES[hoveredState].plain ?? STATES[hoveredState].name}</text>
          </g>
        )}
      </svg>
    </div>
  );
}
