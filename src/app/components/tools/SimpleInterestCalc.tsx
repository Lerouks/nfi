import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Percent, Info } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

// ─── InputField local (évite le bug du 0 à la suppression) ───────────────────
function InputField({
  label, value, onChange, min = 0, max, step = 1, suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  const [local, setLocal] = useState(String(value));

  useEffect(() => { setLocal(String(value)); }, [value]);

  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={local}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            setLocal(e.target.value);
            const n = parseFloat(e.target.value);
            if (!isNaN(n)) onChange(n);
          }}
          onBlur={() => {
            const n = parseFloat(local);
            if (isNaN(n) || local.trim() === "") {
              setLocal(String(min));
              onChange(min);
            }
          }}
          className="w-full px-3 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] pr-12"
          style={{ borderColor: "rgba(0,0,0,0.12)" }}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, highlight = false }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-4 border ${highlight ? "shadow-md" : ""}`}
      style={{
        background: highlight ? "rgba(0,166,81,0.06)" : "white",
        borderColor: highlight ? "rgba(0,166,81,0.25)" : "rgba(0,0,0,0.06)",
      }}
    >
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-sm" style={{ color: highlight ? "#00A651" : "#0D1B35" }}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function SimpleInterestCalc() {
  const [principal, setPrincipal] = useState(500_000);
  const [rate,      setRate]      = useState(5);
  const [duration,    setDuration]    = useState(24);
  const [durationStr, setDurationStr] = useState("24"); // état string pour l'input
  const [unit,      setUnit]      = useState<"mois" | "années">("mois");

  // Conversion automatique quand on change d'unité (cohérence avec LoanSimulator)
  const handleUnitChange = (newUnit: "mois" | "années") => {
    if (newUnit === unit) return;
    if (newUnit === "années") {
      const years = Math.max(1, Math.round(duration / 12));
      setDuration(years);
      setDurationStr(String(years));
    } else {
      const months = duration * 12;
      setDuration(months);
      setDurationStr(String(months));
    }
    setUnit(newUnit);
  };

  // Convertit en mois pour le calcul
  const totalMonths = unit === "années" ? duration * 12 : duration;

  // Intérêt simple : I = P × r × t   (r en annuel, t en années)
  const totalYears   = totalMonths / 12;
  const totalInterest = principal * (rate / 100) * totalYears;
  const totalAmount   = principal + totalInterest;
  const monthlyInterest = totalInterest / Math.max(1, totalMonths);

  // Tableau annuel pour le graphique
  const chartData = useMemo(() => {
    const years = Math.ceil(totalYears);
    return Array.from({ length: years }, (_, i) => {
      const y = i + 1;
      const t = Math.min(y, totalYears);
      const interest = principal * (rate / 100) * t;
      return {
        label: `An ${y}`,
        Capital: principal,
        Intérêts: Math.round(interest),
      };
    });
  }, [principal, rate, totalYears]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00A651]/10 flex items-center justify-center">
          <Percent size={20} className="text-[#00A651]" />
        </div>
        <div>
          <h2 className="text-[#0D1B35]" style={{ fontSize: "1.4rem" }}>
            Simulateur d'Intérêt Simple
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Calculez les intérêts sur un capital avec la formule I = P × r × t
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <Info size={15} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          L'intérêt simple se calcule uniquement sur le capital de départ, contrairement à l'intérêt composé. Il est souvent utilisé pour les prêts à court terme et les obligations.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Paramètres */}
        <div className="lg:col-span-2 space-y-4 bg-gray-50 rounded-2xl p-5 border" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <InputField
            label="Capital initial (FCFA)"
            value={principal}
            onChange={setPrincipal}
            min={0}
            step={50000}
            suffix="FCFA"
          />
          <InputField
            label="Taux d'intérêt annuel (%)"
            value={rate}
            onChange={(v) => setRate(Math.min(100, Math.max(0.1, v)))}
            min={0.1}
            max={100}
            step={0.1}
            suffix="%"
          />

          {/* Durée + unité */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Durée</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={durationStr}
                  min={1}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setDurationStr(raw);
                    const n = parseInt(raw);
                    if (!isNaN(n) && n > 0) setDuration(n);
                  }}
                  onBlur={() => {
                    const n = parseInt(durationStr);
                    if (isNaN(n) || n <= 0 || durationStr.trim() === "") {
                      setDurationStr("1");
                      setDuration(1);
                    } else {
                      setDurationStr(String(n));
                      setDuration(n);
                    }
                  }}
                  className="w-full px-3 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                />
              </div>
              <div className="flex gap-1 p-1 bg-white border rounded-xl" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                {(["mois", "années"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => handleUnitChange(u)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                      unit === u ? "bg-[#0D1B35] text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Formule */}
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Formule appliquée</p>
            <p className="text-sm font-mono text-[#0D1B35]">
              I = {fmt(principal)} × {rate}% × {totalYears.toFixed(2)} ans
            </p>
            <p className="text-sm font-mono text-[#00A651] mt-1">
              I = <strong>{fmt(Math.round(totalInterest))} FCFA</strong>
            </p>
          </div>
        </div>

        {/* Résultats */}
        <div className="lg:col-span-3 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KPICard
              label="Capital de départ"
              value={fmt(principal) + " FCFA"}
            />
            <KPICard
              label="Intérêts totaux"
              value={fmt(Math.round(totalInterest)) + " FCFA"}
              sub={`${rate}% / an sur ${totalYears.toFixed(1)} an(s)`}
            />
            <KPICard
              label="Montant final"
              value={fmt(Math.round(totalAmount)) + " FCFA"}
              highlight
            />
          </div>

          {/* Gain mensuel */}
          <div className="flex items-center gap-4 bg-[#0D1B35] rounded-2xl p-4">
            <div className="flex-1">
              <p className="text-gray-400 text-xs mb-0.5">Intérêt mensuel moyen</p>
              <p className="text-white font-bold">{fmt(Math.round(monthlyInterest))} FCFA / mois</p>
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-xs mb-0.5">Durée totale</p>
              <p className="text-white font-bold">{totalMonths} mois ({totalYears.toFixed(1)} an{totalYears >= 2 ? "s" : ""})</p>
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-xs mb-0.5">Rendement total</p>
              <p className="text-[#00A651] font-bold">+{principal > 0 ? ((totalInterest / principal) * 100).toFixed(1) : "0"}%</p>
            </div>
          </div>

          {/* Graphique */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <p className="text-xs text-gray-400 mb-4">Décomposition Capital / Intérêts par année</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number, name: string) => [fmt(v) + " FCFA", name]}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Capital"   fill="#0D1B35" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Intérêts" fill="#00A651" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tableau annuel */}
          <details className="bg-gray-50 rounded-2xl border" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <summary className="px-5 py-3.5 cursor-pointer text-sm text-gray-600 select-none">
              Tableau annuel détaillé
            </summary>
            <div className="px-5 pb-4 overflow-x-auto">
              <table className="w-full text-xs text-gray-600 min-w-[360px]">
                <thead>
                  <tr className="border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    <th className="text-left py-2">Période</th>
                    <th className="text-right py-2">Intérêts de l'année</th>
                    <th className="text-right py-2">Intérêts cumulés</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.ceil(totalYears) }, (_, i) => {
                    const y       = i + 1;
                    const t       = Math.min(y, totalYears);
                    const tPrev   = Math.min(y - 1, totalYears);
                    const cumul   = principal * (rate / 100) * t;
                    const annual  = principal * (rate / 100) * (t - tPrev);
                    return (
                      <tr key={y} className="border-b last:border-0" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                        <td className="py-2 font-medium text-[#0D1B35]">Année {y}</td>
                        <td className="text-right py-2">+{fmt(Math.round(annual))} FCFA</td>
                        <td className="text-right py-2 text-[#00A651]">+{fmt(Math.round(cumul))} FCFA</td>
                        <td className="text-right py-2 font-semibold text-[#0D1B35]">
                          {fmt(Math.round(principal + cumul))} FCFA
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}