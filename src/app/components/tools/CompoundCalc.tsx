import { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Plus, Trash2, Info } from "lucide-react";

// ─── Types & helpers ──────────────────────────────────────────────────────────
type Freq = "mensuelle" | "trimestrielle" | "annuelle";

const FREQ_MAP: Record<Freq, number> = {
  mensuelle:     12,
  trimestrielle:  4,
  annuelle:       1,
};

function calcCompound(
  principal: number,
  rateAnnual: number,
  years: number,
  freq: Freq,
  monthly = 0
) {
  const n = FREQ_MAP[freq];
  const r = rateAnnual / 100 / n;
  const data: { year: number; capital: number; interets: number; total: number }[] = [];

  for (let y = 0; y <= years; y++) {
    const periods = y * n;
    const capitalGrowth = principal * Math.pow(1 + r, periods);
    const monthlyFV =
      monthly > 0 && r > 0
        ? (monthly * (Math.pow(1 + r, periods) - 1)) / r
        : monthly * periods;
    const total    = capitalGrowth + monthlyFV;
    const interets = total - principal - monthly * periods;

    data.push({
      year:     y,
      capital:  Math.round(principal + monthly * periods),
      interets: Math.round(Math.max(0, interets)),
      total:    Math.round(total),
    });
  }
  return data;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

const COLORS_SCENARIOS = ["#00A651", "#0D1B35", "#E53E3E"];

interface Scenario {
  id: string;
  label: string;
  principal: number;
  rate: number;
  years: number;
  freq: Freq;
  monthly: number;
}

const DEFAULT: Scenario = {
  id: "1",
  label: "Scénario 1",
  principal: 1_000_000,
  rate: 8,
  years: 10,
  freq: "annuelle",
  monthly: 0,
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border rounded-xl shadow-lg px-4 py-3 text-sm min-w-[180px]" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
        <p className="text-gray-400 text-xs mb-2">Année {label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.stroke || p.fill, fontSize: 12 }}>{p.name}</span>
            <span className="font-semibold text-gray-800" style={{ fontSize: 12 }}>
              {fmt(p.value)} FCFA
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── InputField avec gestion de l'état string local ──────────────────────────
// Évite le bug du "0" quand l'utilisateur vide le champ pour retaper un nombre.
function InputField({
  label, type, value, onChange, min, max, step,
}: {
  label: string;
  type: "text" | "number";
  value: string | number;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  // On garde un état string local pour permettre de vider le champ librement
  const [localVal, setLocalVal] = useState(String(value));

  // Synchronise si le parent change la valeur depuis l'extérieur
  useEffect(() => {
    setLocalVal(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalVal(raw);
    if (type === "text") {
      onChange(raw);
    } else {
      // On propage uniquement si la valeur est un nombre valide (pas vide, pas -)
      const num = parseFloat(raw);
      if (!isNaN(num)) onChange(raw);
    }
  };

  const handleBlur = () => {
    if (type === "number") {
      const num = parseFloat(localVal);
      if (isNaN(num) || localVal.trim() === "") {
        // Remet la valeur minimale ou 0 si le champ est vide à la perte de focus
        const fallback = String(min ?? 0);
        setLocalVal(fallback);
        onChange(fallback);
      }
    }
  };

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={localVal}
        onChange={handleChange}
        onBlur={handleBlur}
        min={min}
        max={max}
        step={step}
        className="w-full px-3 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
        style={{ borderColor: "rgba(0,0,0,0.12)" }}
      />
    </div>
  );
}

function KPICard({
  label, value, color, highlight = false,
}: {
  label: string;
  value: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-3.5 border ${highlight ? "shadow-md" : ""}`}
      style={{
        borderColor: highlight ? color + "44" : "rgba(0,0,0,0.06)",
        background: highlight ? color + "08" : "white",
      }}
    >
      <p className="text-xs text-gray-500 mb-1 leading-tight">{label}</p>
      <p className="font-bold text-sm leading-tight" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function CompoundCalc() {
  const [scenarios, setScenarios] = useState<Scenario[]>([DEFAULT]);
  const [activeId, setActiveId]   = useState("1");
  const [compareMode, setCompare] = useState(false);

  const addScenario = () => {
    if (scenarios.length >= 3) return;
    const id = Date.now().toString();
    const n  = scenarios.length + 1;
    setScenarios((s) => [
      ...s,
      { ...DEFAULT, id, label: `Scénario ${n}`, rate: DEFAULT.rate + n * 2 },
    ]);
    setActiveId(id);
    setCompare(true);
  };

  const remove = (id: string) => {
    if (scenarios.length === 1) return;
    const next = scenarios.filter((s) => s.id !== id);
    setScenarios(next);
    setActiveId(next[0].id);
    if (next.length === 1) setCompare(false);
  };

  const update = <K extends keyof Scenario>(id: string, field: K, value: Scenario[K]) => {
    setScenarios((s) => s.map((sc) => (sc.id === id ? { ...sc, [field]: value } : sc)));
  };

  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0];

  const allData = useMemo(
    () =>
      scenarios.map((sc) => ({
        ...sc,
        series: calcCompound(sc.principal, sc.rate, sc.years, sc.freq, sc.monthly),
      })),
    [scenarios]
  );

  const activeData = allData.find((d) => d.id === activeId) ?? allData[0];
  const finalYear  = activeData.series[activeData.series.length - 1];

  const maxYears = Math.max(...scenarios.map((s) => s.years));
  const compareData = useMemo(() => {
    return Array.from({ length: maxYears + 1 }, (_, y) => {
      const point: Record<string, any> = { year: y };
      allData.forEach((d) => {
        point[d.label] = d.series[y]?.total ?? d.series[d.series.length - 1].total;
      });
      return point;
    });
  }, [allData, maxYears]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00A651]/10 flex items-center justify-center">
          <TrendingUp size={20} className="text-[#00A651]" />
        </div>
        <div>
          <h2 className="text-[#0D1B35]" style={{ fontSize: "1.4rem" }}>
            Calculatrice d'Intérêt Composé
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Visualisez la croissance de vos investissements dans le temps</p>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800">
          La puissance des intérêts composés : vos intérêts génèrent eux-mêmes des intérêts. Plus la durée est longue, plus l'effet est spectaculaire.
        </p>
      </div>

      {/* Tabs scénarios */}
      <div className="flex items-center gap-2 flex-wrap">
        {scenarios.map((sc, idx) => (
          <button
            key={sc.id}
            onClick={() => setActiveId(sc.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-all ${
              activeId === sc.id
                ? "text-white border-transparent"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#00A651] hover:text-[#00A651]"
            }`}
            style={activeId === sc.id ? { background: COLORS_SCENARIOS[idx % 3] } : {}}
          >
            {sc.label}
            {scenarios.length > 1 && activeId === sc.id && (
              <span
                onClick={(e) => { e.stopPropagation(); remove(sc.id); }}
                className="cursor-pointer opacity-70 hover:opacity-100"
              >
                <Trash2 size={11} />
              </span>
            )}
          </button>
        ))}
        {scenarios.length < 3 && (
          <button
            onClick={addScenario}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm border border-dashed border-gray-300 text-gray-500 hover:border-[#00A651] hover:text-[#00A651] transition-all"
          >
            <Plus size={14} /> Comparer
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Paramètres */}
        <div className="lg:col-span-2 space-y-4 bg-gray-50 rounded-2xl p-5 border" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <InputField
            label="Nom du scénario"
            type="text"
            value={active.label}
            onChange={(v) => update(active.id, "label", v)}
          />
          <InputField
            label="Capital initial (FCFA)"
            type="number"
            value={active.principal}
            onChange={(v) => update(active.id, "principal", Math.max(0, Number(v)))}
            min={0}
            step={100000}
          />
          <InputField
            label="Taux d'intérêt annuel (%)"
            type="number"
            value={active.rate}
            onChange={(v) => update(active.id, "rate", Math.min(50, Math.max(0.1, Number(v))))}
            min={0.1}
            max={50}
            step={0.1}
          />
          <InputField
            label="Durée (années)"
            type="number"
            value={active.years}
            onChange={(v) => update(active.id, "years", Math.min(50, Math.max(1, Math.round(Number(v)))))}
            min={1}
            max={50}
          />
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Fréquence de capitalisation</label>
            <div className="flex gap-1.5 flex-wrap">
              {(["mensuelle", "trimestrielle", "annuelle"] as Freq[]).map((f) => (
                <button
                  key={f}
                  onClick={() => update(active.id, "freq", f)}
                  className={`flex-1 py-2 text-xs rounded-xl border transition-all ${
                    active.freq === f
                      ? "bg-[#0D1B35] text-white border-[#0D1B35]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <InputField
            label="Versement mensuel optionnel (FCFA)"
            type="number"
            value={active.monthly}
            onChange={(v) => update(active.id, "monthly", Math.max(0, Number(v)))}
            min={0}
            step={5000}
          />
        </div>

        {/* Résultats + graphique */}
        <div className="lg:col-span-3 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <KPICard label="Capital + versements" value={fmt(finalYear.capital) + " FCFA"} color="#0D1B35" />
            <KPICard label="Intérêts générés"     value={fmt(finalYear.interets) + " FCFA"} color="#00A651" />
            <KPICard label="Total final"           value={fmt(finalYear.total) + " FCFA"} color="#00A651" highlight />
          </div>

          {/* Multiplicateur */}
          {active.principal > 0 && (
            <div className="text-center bg-gradient-to-r from-[#00A651]/5 to-[#0D1B35]/5 rounded-2xl py-4 border" style={{ borderColor: "rgba(0,166,81,0.15)" }}>
              <p className="text-xs text-gray-500 mb-1">Votre investissement sera multiplié par</p>
              <p className="font-black" style={{ fontSize: "2.5rem", color: "#00A651", lineHeight: 1 }}>
                ×{(finalYear.total / active.principal).toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">en {active.years} ans à {active.rate} % / an</p>
            </div>
          )}

          {/* Graphique scénario actif */}
          {!compareMode && (
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <p className="text-xs text-gray-400 mb-4">Évolution sur {active.years} ans</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={activeData.series}>
                  <defs>
                    <linearGradient id="gCapital" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0D1B35" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0D1B35" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="gInterets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00A651" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00A651" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={(v) => `An ${v}`} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="capital" name="Capital + versements" stroke="#0D1B35" strokeWidth={1.5} fill="url(#gCapital)" />
                  <Area type="monotone" dataKey="total"   name="Total avec intérêts"  stroke="#00A651" strokeWidth={2}   fill="url(#gInterets)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Graphique comparaison */}
          {compareMode && scenarios.length > 1 && (
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <p className="text-xs text-gray-400 mb-4">Comparaison des scénarios (Total final)</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={compareData}>
                  <defs>
                    {scenarios.map((sc, i) => (
                      <linearGradient key={sc.id} id={`gc${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={COLORS_SCENARIOS[i]} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={COLORS_SCENARIOS[i]} stopOpacity={0.01} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={(v) => `An ${v}`} />
                  <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: number) => [fmt(v) + " FCFA"]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  {scenarios.map((sc, i) => (
                    <Area
                      key={sc.id}
                      type="monotone"
                      dataKey={sc.label}
                      stroke={COLORS_SCENARIOS[i]}
                      strokeWidth={2}
                      fill={`url(#gc${i})`}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table détaillée */}
          <details className="bg-gray-50 rounded-2xl border" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <summary className="px-5 py-3.5 cursor-pointer text-sm text-gray-600 select-none">
              Tableau de croissance annuel détaillé
            </summary>
            <div className="px-5 pb-4 overflow-x-auto">
              <table className="w-full text-xs text-gray-600 min-w-[400px]">
                <thead>
                  <tr className="border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    <th className="text-left py-2">Année</th>
                    <th className="text-right py-2">Capital versé</th>
                    <th className="text-right py-2">Intérêts cumulés</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {activeData.series
                    .filter((_, i) => i % (activeData.series.length > 20 ? 5 : 1) === 0 || i === activeData.series.length - 1)
                    .map((row) => (
                      <tr key={row.year} className="border-b last:border-0" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                        <td className="py-2 font-medium text-[#0D1B35]">Année {row.year}</td>
                        <td className="text-right py-2">{fmt(row.capital)} FCFA</td>
                        <td className="text-right py-2 text-[#00A651]">+{fmt(row.interets)} FCFA</td>
                        <td className="text-right py-2 font-semibold text-[#0D1B35]">{fmt(row.total)} FCFA</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}