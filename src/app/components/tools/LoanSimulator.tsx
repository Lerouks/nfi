import { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Banknote, Info, AlertCircle } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

/**
 * Mensualité constante (méthode française).
 * Retourne 0 si les paramètres sont invalides (évite Infinity / NaN).
 */
function calcMonthly(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  const pow = Math.pow(1 + r, months);
  if (!isFinite(pow) || pow === 1) return 0;
  return (principal * r * pow) / (pow - 1);
}

// ─── InputField ───────────────────────────────────────────────────────────────
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
          className="w-full px-3 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] pr-14"
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

// ─── KPICard ──────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, highlight = false, warn = false }: {
  label: string; value: string; sub?: string; highlight?: boolean; warn?: boolean;
}) {
  const color = warn ? "#E53E3E" : highlight ? "#00A651" : "#0D1B35";
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{
        background: highlight ? "rgba(0,166,81,0.06)" : warn ? "rgba(229,62,62,0.05)" : "white",
        borderColor: highlight ? "rgba(0,166,81,0.25)" : warn ? "rgba(229,62,62,0.2)" : "rgba(0,0,0,0.06)",
      }}
    >
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-sm" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function LoanSimulator() {
  const [amount,       setAmount]       = useState(5_000_000);
  const [rate,         setRate]         = useState(7);
  const [durationVal,  setDurationVal]  = useState(5);
  const [durationStr,  setDurationStr]  = useState("5");
  const [durationUnit, setDurationUnit] = useState<"mois" | "années">("années");

  // Conversion automatique quand on change d'unité
  const handleUnitChange = (newUnit: "mois" | "années") => {
    if (newUnit === durationUnit) return;
    if (newUnit === "années") {
      const years = Math.max(1, Math.round(durationVal / 12));
      setDurationVal(years);
      setDurationStr(String(years));
    } else {
      const months = durationVal * 12;
      setDurationVal(months);
      setDurationStr(String(months));
    }
    setDurationUnit(newUnit);
  };

  const totalMonths = durationUnit === "années" ? durationVal * 12 : durationVal;

  const monthly       = useMemo(() => {
    const m = calcMonthly(amount, rate, totalMonths);
    return isFinite(m) && !isNaN(m) ? m : 0;
  }, [amount, rate, totalMonths]);
  const totalRepaid   = totalMonths > 0 ? monthly * totalMonths : 0;
  const totalInterest = Math.max(0, totalRepaid - amount);
  const costRatio     = amount > 0 && totalRepaid > 0 ? (totalInterest / amount) * 100 : 0;

  const amortData = useMemo(() => {
    const r = rate / 100 / 12;
    let balance = amount;
    const result: { label: string; Capital: number; Solde: number }[] = [];

    if (totalMonths <= 12) {
      // Granularité mensuelle pour les courtes durées
      for (let month = 1; month <= totalMonths; month++) {
        const interest = balance * r;
        const capital  = monthly - interest;
        balance = Math.max(0, balance - capital);
        result.push({
          label:   `M${month}`,
          Capital: Math.round(amount - balance),
          Solde:   Math.round(balance),
        });
      }
    } else {
      // Granularité annuelle pour les longues durées
      for (let month = 1; month <= totalMonths; month++) {
        const interest = balance * r;
        const capital  = monthly - interest;
        balance = Math.max(0, balance - capital);
        if (month % 12 === 0 || month === totalMonths) {
          result.push({
            label:   `An ${Math.ceil(month / 12)}`,
            Capital: Math.round(amount - balance),
            Solde:   Math.round(balance),
          });
        }
      }
    }
    return result;
  }, [amount, rate, totalMonths, monthly]);

  const amortTable = useMemo(() => {
    const r = rate / 100 / 12;
    let balance = amount;
    const rows: { month: number; monthly: number; interest: number; principal: number; balance: number }[] = [];
    for (let m = 1; m <= totalMonths; m++) {
      const interest  = balance * r;
      const principal = monthly - interest;
      balance = Math.max(0, balance - principal);
      rows.push({ month: m, monthly: Math.round(monthly), interest: Math.round(interest), principal: Math.round(principal), balance: Math.round(balance) });
    }
    return rows;
  }, [amount, rate, totalMonths, monthly]);

  const displayRows = useMemo(() => {
    if (amortTable.length <= 9) return amortTable;
    return [...amortTable.slice(0, 3), null, ...amortTable.slice(-3)];
  }, [amortTable]);

  const isHighCost = costRatio > 50;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0D1B35]/10 flex items-center justify-center">
          <Banknote size={20} className="text-[#0D1B35]" />
        </div>
        <div>
          <h2 className="text-[#0D1B35]" style={{ fontSize: "1.4rem" }}>
            Simulateur d'Emprunt
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Calculez vos mensualités et le coût total de votre crédit
          </p>
        </div>
      </div>

      {isHighCost ? (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700">
            Attention : le coût total des intérêts représente <strong>{costRatio.toFixed(0)}%</strong> du capital emprunté. Vérifiez les conditions du prêt.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
          <Info size={15} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800">
            Ce simulateur utilise le calcul des <strong>mensualités constantes</strong> (méthode française), standard dans la plupart des banques africaines.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        {/* ── Paramètres ── */}
        <div className="lg:col-span-2 space-y-4 bg-gray-50 rounded-2xl p-5 border" style={{ borderColor: "rgba(0,0,0,0.06)" }}>

          <InputField
            label="Montant de l'emprunt (FCFA)"
            value={amount}
            onChange={(v) => setAmount(Math.max(0, v))}
            min={0}
            step={500_000}
            suffix="FCFA"
          />

          <InputField
            label="Taux d'intérêt annuel (%)"
            value={rate}
            onChange={(v) => setRate(Math.min(50, Math.max(0, v)))}
            min={0}
            max={50}
            step={0.1}
            suffix="%"
          />

          {/* ── Durée + toggle mois / années ── */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Durée de remboursement</label>
            <div className="flex gap-2">
              {/* champ numérique */}
              <input
                type="number"
                value={durationStr}
                min={1}
                step={1}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDurationStr(raw);
                  const n = parseInt(raw, 10);
                  if (!isNaN(n) && n > 0) setDurationVal(n);
                }}
                onBlur={() => {
                  const n = parseInt(durationStr, 10);
                  if (isNaN(n) || n <= 0 || durationStr.trim() === "") {
                    setDurationStr("1");
                    setDurationVal(1);
                  } else {
                    setDurationStr(String(n));
                    setDurationVal(n);
                  }
                }}
                className="flex-1 min-w-0 px-3 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />

              {/* toggle mois / années */}
              <div
                className="flex shrink-0 gap-1 p-1 bg-white border rounded-xl"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              >
                {(["mois", "années"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => handleUnitChange(u)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-all whitespace-nowrap ${
                      durationUnit === u
                        ? "bg-[#0D1B35] text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Barre décomposition ── */}
          <div className="bg-white rounded-xl border p-4 space-y-2" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Décomposition du remboursement</p>
            <div className="w-full h-3 rounded-full overflow-hidden bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (amount / (totalRepaid || 1)) * 100)}%`,
                  background: "#0D1B35",
                }}
              />
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#0D1B35" }} />
                Capital {amount > 0 ? ((amount / totalRepaid) * 100).toFixed(0) : 0}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-400" />
                Intérêts {amount > 0 ? (100 - (amount / totalRepaid) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* ── Résultats ── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <KPICard
              label="Mensualité"
              value={fmt(Math.round(monthly)) + " FCFA"}
              sub="par mois"
              highlight
            />
            <KPICard
              label="Intérêts totaux"
              value={fmt(Math.round(totalInterest)) + " FCFA"}
              sub={`${costRatio.toFixed(1)}% du capital`}
              warn={isHighCost}
            />
            <KPICard
              label="Coût total du crédit"
              value={fmt(Math.round(totalRepaid)) + " FCFA"}
              sub={`sur ${totalMonths} mois`}
            />
          </div>

          {/* Graphique */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <p className="text-xs text-gray-400 mb-4">Capital remboursé vs Solde restant dû</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={amortData}>
                <defs>
                  <linearGradient id="gCapL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00A651" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00A651" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gSolde" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#0D1B35" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0D1B35" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
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
                <Area type="monotone" dataKey="Capital" name="Capital remboursé" stroke="#00A651" strokeWidth={2} fill="url(#gCapL)" />
                <Area type="monotone" dataKey="Solde"   name="Solde restant dû"  stroke="#0D1B35" strokeWidth={1.5} fill="url(#gSolde)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tableau d'amortissement */}
          <details className="bg-gray-50 rounded-2xl border" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <summary className="px-5 py-3.5 cursor-pointer text-sm text-gray-600 select-none">
              Tableau d'amortissement mensuel
            </summary>
            <div className="px-5 pb-4 overflow-x-auto">
              <table className="w-full text-xs text-gray-600 min-w-[420px]">
                <thead>
                  <tr className="border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    <th className="text-left py-2">Mois</th>
                    <th className="text-right py-2">Mensualité</th>
                    <th className="text-right py-2">Capital</th>
                    <th className="text-right py-2">Intérêts</th>
                    <th className="text-right py-2">Solde restant</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, i) =>
                    row === null ? (
                      <tr key={`sep-${i}`}>
                        <td colSpan={5} className="text-center py-2 text-gray-300">⋯</td>
                      </tr>
                    ) : (
                      <tr key={row.month} className="border-b last:border-0" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                        <td className="py-2 font-medium text-[#0D1B35]">Mois {row.month}</td>
                        <td className="text-right py-2">{fmt(row.monthly)} FCFA</td>
                        <td className="text-right py-2 text-[#0D1B35]">{fmt(row.principal)} FCFA</td>
                        <td className="text-right py-2 text-red-500">{fmt(row.interest)} FCFA</td>
                        <td className="text-right py-2 font-semibold">{fmt(row.balance)} FCFA</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}