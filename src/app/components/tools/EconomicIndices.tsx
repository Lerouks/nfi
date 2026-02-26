import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, RefreshCw, Settings2, Check } from "lucide-react";

// ─── Mock data ───────────────────────────────────────────────────────────────
const LAST_UPDATE = "25 fév. 2026 — 09h00 (WAT)";

type Period = "1S" | "1M" | "1A";

function generateSeries(base: number, volatility: number, points: number, trend = 0) {
  const data: number[] = [];
  let current = base;
  for (let i = 0; i < points; i++) {
    current += (Math.random() - 0.5) * volatility + trend;
    data.push(parseFloat(current.toFixed(2)));
  }
  return data;
}

// Génère les séries dynamiques (appelée à chaque rafraîchissement)
function buildDynamicSeries(): Record<string, Record<Period, number[]>> {
  return {
    inflation: {
      "1S": generateSeries(3.8, 0.15, 7, 0.005),
      "1M": generateSeries(4.0, 0.12, 30, -0.008),
      "1A": [4.5, 4.8, 5.1, 4.9, 4.6, 4.2, 3.9, 4.1, 4.3, 4.0, 3.9, 3.8],
    },
    riz: {
      "1S": generateSeries(440, 4, 7, 0.2),
      "1M": generateSeries(435, 5, 30, 0.3),
      "1A": [400, 410, 415, 420, 425, 428, 430, 432, 435, 438, 440, 440],
    },
    mil: {
      "1S": generateSeries(200, 3, 7, 0.05),
      "1M": generateSeries(198, 4, 30, 0.2),
      "1A": [175, 178, 182, 185, 188, 190, 192, 195, 196, 198, 199, 200],
    },
  };
}

const weekLabels  = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const monthLabels = Array.from({ length: 30 }, (_, i) => `J${i + 1}`);
const yearLabels  = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

const INDICES = [
  {
    id: "inflation",
    label: "Inflation Niger",
    unit: "%",
    icon: TrendingUp,
    color: "#E53E3E",
    current: 3.8,
    prevMonth: 4.1,
    series: {
      "1S": [] as number[],
      "1M": [] as number[],
      "1A": [4.5, 4.8, 5.1, 4.9, 4.6, 4.2, 3.9, 4.1, 4.3, 4.0, 3.9, 3.8],
    } as Record<Period, number[]>,
    description: "Taux d'inflation annuel (INS Niger)",
  },
  {
    id: "essence",
    label: "Essence Super",
    unit: "FCFA/L",
    icon: TrendingUp,
    color: "#F6AD55",
    current: 499,
    prevMonth: 499,
    series: {
      "1S": Array(7).fill(499) as number[],
      "1M": Array(30).fill(499) as number[],
      "1A": Array(12).fill(499) as number[],
    } as Record<Period, number[]>,
    description: "Prix à la pompe — SONIDEP Niamey",
  },
  {
    id: "gasoil",
    label: "Gasoil",
    unit: "FCFA/L",
    icon: TrendingUp,
    color: "#ED8936",
    current: 618,
    prevMonth: 618,
    series: {
      "1S": Array(7).fill(618) as number[],
      "1M": Array(30).fill(618) as number[],
      "1A": Array(12).fill(618) as number[],
    } as Record<Period, number[]>,
    description: "Prix à la pompe — SONIDEP Niamey",
  },
  {
    id: "riz",
    label: "Riz importé (Niamey)",
    unit: "FCFA/kg",
    icon: TrendingUp,
    color: "#00A651",
    current: 440,
    prevMonth: 438,
    series: {
      "1S": [] as number[],
      "1M": [] as number[],
      "1A": [400, 410, 415, 420, 425, 428, 430, 432, 435, 438, 440, 440],
    } as Record<Period, number[]>,
    description: "Prix marché central — riz brisé importé",
  },
  {
    id: "mil",
    label: "Mil (Niamey)",
    unit: "FCFA/kg",
    icon: TrendingUp,
    color: "#9F7AEA",
    current: 200,
    prevMonth: 198,
    series: {
      "1S": [] as number[],
      "1M": [] as number[],
      "1A": [175, 178, 182, 185, 188, 190, 192, 195, 196, 198, 199, 200],
    } as Record<Period, number[]>,
    description: "Prix marché central",
  },
  {
    id: "bceao",
    label: "Taux directeur BCEAO",
    unit: "%",
    icon: TrendingDown,
    color: "#0D1B35",
    current: 3.5,
    prevMonth: 3.5,
    series: {
      "1S": Array(7).fill(3.5)  as number[],
      "1M": [
        4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0,
        3.75, 3.75, 3.75, 3.75, 3.75, 3.75, 3.75,
        3.75, 3.75, 3.5, 3.5, 3.5, 3.5, 3.5,
        3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5,
        3.5, 3.5,
      ] as number[],
      "1A": [4.0, 4.0, 4.0, 3.75, 3.75, 3.75, 3.75, 3.5, 3.5, 3.5, 3.5, 3.5],
    } as Record<Period, number[]>,
    description: "Taux de politique monétaire BCEAO",
  },
];

const PERIOD_LABELS: Record<Period, string[]> = {
  "1S": weekLabels,
  "1M": monthLabels,
  "1A": yearLabels,
};

interface TooltipEntry { dataKey: string; name: string; value: number; stroke: string; unit?: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string; }

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border rounded-xl shadow-lg px-4 py-3 text-sm" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.stroke }} className="font-semibold">
            {p.name}: {p.value} {p.unit}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function EconomicIndices() {
  const [period, setPeriod] = useState<Period>("1M");
  const [selectedIds, setSelectedIds] = useState<string[]>(["inflation", "bceao"]);
  const [showSelector, setShowSelector] = useState(false);
  const [dynamicSeries, setDynamicSeries] = useState(() => buildDynamicSeries());

  const refresh = () => setDynamicSeries(buildDynamicSeries());

  const toggleIndex = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]
    );
  };

  const chartData = useMemo(() => {
    const labels = PERIOD_LABELS[period];
    return labels.map((label, i) => {
      const point: Record<string, number | string> = { label };
      INDICES.filter((idx) => selectedIds.includes(idx.id)).forEach((idx) => {
        const series = dynamicSeries[idx.id]?.[period] ?? idx.series[period];
        point[idx.id] = series[i] ?? series[series.length - 1];
      });
      return point;
    });
  }, [period, selectedIds, dynamicSeries]);

  const selectedIndices = INDICES.filter((idx) => selectedIds.includes(idx.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00A651]/10 flex items-center justify-center">
            <TrendingUp size={20} className="text-[#00A651]" />
          </div>
          <div>
            <h2 className="text-[#0D1B35]" style={{ fontSize: "1.4rem" }}>
              Indices Économiques Niger
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Mise à jour : {LAST_UPDATE}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border text-gray-600 hover:bg-gray-50 transition-all"
            style={{ borderColor: "rgba(0,0,0,0.1)" }}
          >
            <RefreshCw size={13} /> Actualiser
          </button>
          <div className="relative">
            <button
              onClick={() => setShowSelector(!showSelector)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border text-gray-600 hover:bg-gray-50 transition-all"
              style={{ borderColor: "rgba(0,0,0,0.1)" }}
            >
              <Settings2 size={13} /> Indicateurs ({selectedIds.length})
            </button>
            {showSelector && (
              <div
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border py-2 z-20"
                style={{ borderColor: "rgba(0,0,0,0.1)" }}
              >
                {INDICES.map((idx) => (
                  <button
                    key={idx.id}
                    onClick={() => toggleIndex(idx.id)}
                    className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: idx.color }} />
                      <span className="text-gray-700">{idx.label}</span>
                    </div>
                    {selectedIds.includes(idx.id) && <Check size={14} className="text-[#00A651]" />}
                  </button>
                ))}
                <button
                  onClick={() => setShowSelector(false)}
                  className="w-full mt-1 px-4 py-2 text-xs text-center text-gray-400 hover:text-gray-600 border-t transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {INDICES.map((idx) => {
          const diff = idx.current - idx.prevMonth;
          const isUp = diff > 0;
          const isFlat = diff === 0;
          const Icon = isUp ? TrendingUp : TrendingDown;
          return (
            <button
              key={idx.id}
              onClick={() => toggleIndex(idx.id)}
              className={`text-left rounded-2xl p-4 border transition-all ${
                selectedIds.includes(idx.id)
                  ? "bg-white shadow-md"
                  : "bg-gray-50 opacity-60"
              }`}
              style={{
                borderColor: selectedIds.includes(idx.id) ? idx.color + "44" : "rgba(0,0,0,0.06)",
                borderLeftWidth: selectedIds.includes(idx.id) ? 3 : 1,
                borderLeftColor: selectedIds.includes(idx.id) ? idx.color : undefined,
              }}
            >
              <p className="text-xs text-gray-500 mb-1 leading-tight">{idx.label}</p>
              <p className="font-bold" style={{ color: idx.color, fontSize: "1.1rem" }}>
                {idx.current} {idx.unit}
              </p>
              <div className={`flex items-center gap-0.5 mt-1 ${isFlat ? "text-gray-400" : isUp ? "text-red-500" : "text-green-600"}`}>
                {!isFlat && <Icon size={11} />}
                <span style={{ fontSize: 10 }}>
                  {isFlat ? "Stable" : `${isUp ? "+" : ""}${diff.toFixed(2)} ${idx.unit}`}
                </span>
              </div>
              <p className="text-gray-400 mt-1" style={{ fontSize: 10 }}>{idx.description}</p>
            </button>
          );
        })}
      </div>

      {/* Période */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 mr-1">Période :</span>
        {(["1S", "1M", "1A"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-all ${
              period === p
                ? "bg-[#0D1B35] text-white border-[#0D1B35]"
                : "text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {p === "1S" ? "1 semaine" : p === "1M" ? "1 mois" : "1 an"}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <p className="text-xs text-gray-400 mb-4">
          {selectedIndices.map((i) => i.label).join(" · ")} — Évolution sur {period === "1S" ? "1 semaine" : period === "1M" ? "1 mois" : "1 an"}
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#9CA3AF" }}
              interval={period === "1M" ? 4 : 0}
            />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} width={45} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => {
                const idx = INDICES.find((i) => i.id === value);
                return <span style={{ fontSize: 11, color: "#374151" }}>{idx?.label ?? value}</span>;
              }}
            />
            {selectedIndices.map((idx) => (
              <Line
                key={idx.id}
                type="monotone"
                dataKey={idx.id}
                name={idx.id}
                stroke={idx.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
                unit={idx.unit}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sources */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <span>Sources : INS Niger, BCEAO, OPAM, SONIDEP — Données indicatives</span>
      </div>
    </div>
  );
}