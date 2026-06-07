import { useMemo } from "react";
import type { PlacedAsset, Scenario } from "../types/game";
import type { SimulationResult, ReplayEvent } from "../types/results";
import { ASSET_CATALOGUE, THREAT_LABEL } from "../config/assetCatalogue";
import { useTooltip } from "./Tooltip";

type Tooltip = ReturnType<typeof useTooltip>;

interface Props {
  scenario: Scenario;
  placed: PlacedAsset[];
  tooltip: Tooltip;
  // Build mode
  selectedAsset?: string | null;
  onPlace?: (nodeId: string) => void;
  onRemove?: (instanceId: string) => void;
  // Run mode
  result?: SimulationResult;
  tick?: number;
}

const VIEW_W = 560;
const VIEW_H = 480;

export function MapView({
  scenario,
  placed,
  tooltip,
  selectedAsset,
  onPlace,
  onRemove,
  result,
  tick = -1,
}: Props) {
  const replayMode = !!result;
  const nodeById = useMemo(
    () => new Map(scenario.map.nodes.map((n) => [n.id, n])),
    [scenario]
  );
  const defendedByNode = useMemo(
    () => new Map(scenario.defendedAssets.map((d) => [d.nodeId, d])),
    [scenario]
  );
  const placedByNode = useMemo(() => {
    const m = new Map<string, PlacedAsset[]>();
    for (const p of placed) {
      if (!m.has(p.nodeId)) m.set(p.nodeId, []);
      m.get(p.nodeId)!.push(p);
    }
    return m;
  }, [placed]);

  const sensorNodes = useMemo(() => {
    const s = new Set<string>();
    for (const p of placed)
      if (ASSET_CATALOGUE[p.type].stage.includes("sense")) s.add(p.nodeId);
    return s;
  }, [placed]);

  const events: ReplayEvent[] = result?.events ?? [];
  const activeEvents = replayMode
    ? events.filter((e) => e.t <= tick && e.t > tick - 3)
    : [];

  // Threat positions interpolated along routes.
  const threatPositions = useMemo(() => {
    if (!replayMode) return [];
    const routes = new Map<string, string[]>();
    let idx = 0;
    for (const w of scenario.threatWaves)
      for (const th of w.threats) routes.set(`t${idx++}`, th.route);

    const spawn = new Map<string, number>();
    for (const e of events) if (e.kind === "spawn") spawn.set(e.threatId, e.t);

    const out: { id: string; x: number; y: number; state: string }[] = [];
    spawn.forEach((spawnT, id) => {
      const route = routes.get(id) ?? [];
      if (route.length === 0) return;
      const elapsed = tick - spawnT;
      if (elapsed < 0) return;
      const term = events.find(
        (e) =>
          e.threatId === id &&
          (e.kind === "engage_hit" || e.kind === "consequence") &&
          e.t <= tick
      );
      const prog = Math.min(1, elapsed / 5);
      const segCount = Math.max(1, route.length - 1);
      const fpos = prog * segCount;
      const seg = Math.min(route.length - 2, Math.floor(fpos));
      const localT = route.length > 1 ? fpos - seg : 0;
      const a = nodeById.get(route[Math.max(0, seg)]);
      const b = nodeById.get(route[Math.min(route.length - 1, seg + 1)]) ?? a;
      if (!a || !b) return;
      const x = a.x + (b.x - a.x) * localT;
      const y = a.y + (b.y - a.y) * localT;
      let state = "moving";
      if (term?.kind === "engage_hit" && elapsed >= 4) state = "stopped";
      else if (term?.kind === "consequence" && elapsed >= 6) state = "leaked";
      // hide tracks well after resolution
      if (elapsed > 9) return;
      out.push({ id, x, y, state });
    });
    return out;
  }, [replayMode, events, tick, scenario, nodeById]);

  const pulseNodes = new Set(
    activeEvents
      .filter((e) => ["detect", "engage_attempt", "engage_hit"].includes(e.kind))
      .map((e) => e.nodeId)
  );
  const overloadNodes = new Set(
    activeEvents.filter((e) => e.kind === "overload").map((e) => e.nodeId)
  );

  const handleNodeClick = (nodeId: string) => {
    if (replayMode) return;
    onPlace?.(nodeId);
  };

  const armed = !replayMode && !!selectedAsset;

  return (
    <svg className="map" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="Synthetic defence map">
      <defs>
        <radialGradient id="islandGrad" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#13242e" />
          <stop offset="100%" stopColor="#0a141b" />
        </radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>

      <path
        d="M180,40 Q300,20 360,70 Q470,90 470,180 Q500,260 430,330 Q450,430 330,450 Q200,470 150,400 Q70,380 80,290 Q40,200 110,150 Q120,70 180,40 Z"
        fill="url(#islandGrad)" stroke="#1f3340" strokeWidth="1.5" opacity="0.9"
      />

      {scenario.map.links.map(([a, b], i) => {
        const na = nodeById.get(a); const nb = nodeById.get(b);
        if (!na || !nb) return null;
        return <line key={`l${i}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke="#243845" strokeWidth="1.2" strokeDasharray="2 5" />;
      })}

      {scenario.map.nodes.map((n) => {
        if (!sensorNodes.has(n.id)) return null;
        const pulsing = pulseNodes.has(n.id);
        return (
          <g key={`cov${n.id}`}>
            <circle cx={n.x} cy={n.y} r={pulsing ? 56 : 48} fill="none" stroke="#1c8f99" strokeWidth="1" opacity={pulsing ? 0.5 : 0.28}>
              {pulsing && <animate attributeName="r" values="40;62;40" dur="1.2s" repeatCount="indefinite" />}
            </circle>
            <circle cx={n.x} cy={n.y} r="32" fill="#1c8f99" opacity="0.06" />
          </g>
        );
      })}

      {replayMode && activeEvents.filter((e) => e.kind === "classify").map((e, i) => {
        const n = nodeById.get(e.nodeId ?? "");
        if (!n) return null;
        return <circle key={`c2${i}`} cx={n.x} cy={n.y} r="20" fill="none" stroke="#9d8cff" strokeWidth="1.5" opacity="0.7"><animate attributeName="r" values="14;26" dur="0.8s" /><animate attributeName="opacity" values="0.7;0" dur="0.8s" /></circle>;
      })}

      {scenario.map.nodes.map((n) => {
        const defended = defendedByNode.get(n.id);
        const here = placedByNode.get(n.id) ?? [];
        const overload = overloadNodes.has(n.id);
        const ttBody = defended
          ? `Protected site: ${defended.name}. Military value ${defended.operationalValue}, public impact ${defended.publicConsequence}, built-in resilience ${defended.baselineResilience}.`
          : here.length
          ? `${here.length} layer(s) placed here. ${replayMode ? "" : "Click to add the selected layer, or click the numbered badge to remove one."}`
          : "Map node. Select a layer, then click here to place it.";
        return (
          <g
            key={n.id}
            style={{ cursor: replayMode ? "default" : "pointer" }}
            onClick={() => handleNodeClick(n.id)}
            {...tooltip.bind(n.name, ttBody)}
          >
            <circle cx={n.x} cy={n.y} r={defended ? 13 : 9}
              fill={defended ? "#15303a" : "#13202a"}
              stroke={overload ? "#ff6b6b" : armed ? "#46d6e0" : defended ? "#2a6b78" : "#2a3d4d"}
              strokeWidth={armed ? 2 : 1.5}
            >
              {armed && <animate attributeName="opacity" values="1;0.55;1" dur="1.4s" repeatCount="indefinite" />}
            </circle>
            {defended && <text x={n.x} y={n.y + 4.5} textAnchor="middle" fontSize="13" fill="#46d6e0">{"\u2605"}</text>}
            {here.length > 0 && (
              <g
                style={{ cursor: replayMode ? "default" : "pointer" }}
                onClick={(ev) => {
                  if (replayMode) return;
                  ev.stopPropagation();
                  onRemove?.(here[here.length - 1].instanceId);
                }}
              >
                <circle cx={n.x + 12} cy={n.y - 12} r="8" fill="#46d6e0" />
                <text x={n.x + 12} y={n.y - 8.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#04222a" fontFamily="var(--mono)">{here.length}</text>
              </g>
            )}
            <text x={n.x} y={n.y + (defended ? 28 : 22)} textAnchor="middle" fontSize="10.5" fill="#9fb3c0" fontFamily="var(--mono)">{n.name}</text>
            {defended && <text x={n.x} y={n.y + 40} textAnchor="middle" fontSize="9.5" fill="#46d6e0" fontWeight="600">{defended.name}</text>}
          </g>
        );
      })}

      {threatPositions.map((p) => (
        <g key={`th${p.id}`}>
          <circle cx={p.x} cy={p.y} r="5"
            fill={p.state === "stopped" ? "#5fd39a" : p.state === "leaked" ? "#ff6b6b" : "#ff8a4c"}
            filter="url(#glow)">
            {p.state === "moving" && <animate attributeName="opacity" values="0.6;1;0.6" dur="0.7s" repeatCount="indefinite" />}
          </circle>
          {p.state === "stopped" && <circle cx={p.x} cy={p.y} r="10" fill="none" stroke="#5fd39a" strokeWidth="1.5" opacity="0.6" />}
          {p.state === "leaked" && <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="11" fill="#ff6b6b" fontWeight="700">{"\u2715"}</text>}
        </g>
      ))}

      {replayMode && activeEvents.filter((e) => e.kind === "consequence").map((e, i) => {
        const n = nodeById.get(e.nodeId ?? "");
        if (!n) return null;
        return <text key={`con${i}`} x={n.x} y={n.y - 20} textAnchor="middle" fontSize="13" fontWeight="700" fill="#ff6b6b" fontFamily="var(--mono)">{e.label}</text>;
      })}

      {replayMode && activeEvents.filter((e) => e.kind === "spawn").map((e, i) => {
        const n = nodeById.get(e.nodeId ?? "");
        if (!n) return null;
        return <text key={`sp${i}`} x={n.x} y={n.y - 16} textAnchor="middle" fontSize="9" fill="#ff8a4c" fontFamily="var(--mono)">{THREAT_LABEL[(e.label ?? "") as keyof typeof THREAT_LABEL] ? e.label : e.label}</text>;
      })}
    </svg>
  );
}
