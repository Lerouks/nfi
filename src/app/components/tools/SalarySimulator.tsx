import { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Calculator, Plus, Trash2, Info, ChevronDown, ChevronUp, Briefcase } from "lucide-react";

// ─── Constantes fiscales Niger CGI 2025 ───────────────────────────────────────
const ITS_TRANCHES = [
  { min: 0,       max: 25_000,  taux: 0    },
  { min: 25_000,  max: 50_000,  taux: 0.01 },
  { min: 50_000,  max: 100_000, taux: 0.15 },
  { min: 100_000, max: 150_000, taux: 0.19 },
  { min: 150_000, max: 300_000, taux: 0.25 },
  { min: 300_000, max: Infinity, taux: 0.35 },
];

const CNSS_SALARIE_TAUX    = 0.0525;    // 5,25 %
const CNSS_PLAFOND         = 800_000;   // plafond mensuel
const CNSS_PATRONALE_TAUX  = 0.154;     // 15,4 %
const TAXE_APPRENTISSAGE   = 0.02;      // 2 %
const REDUCTION_MARIE      = 0.10;      // 10 %
const REDUCTION_ENFANT     = 0.05;      // 5 % / enfant, max 3 enfants
const REDUCTION_MAX        = 0.30;      // plafond global

// ─── Types ────────────────────────────────────────────────────────────────────
interface Avantages {
  logementPieces: number;
  electricite:    boolean;
  eau:            boolean;
  vehicule:       boolean;
  telephone:      boolean;
  nourriture:     boolean;
}

interface Famille { marie: boolean; nbEnfants: number; }

interface Scenario {
  id: string; label: string; brut: string;
  avantages: Avantages; famille: Famille;
}

const AVANTAGE_OPTIONS: { field: keyof Omit<Avantages, "logementPieces">; label: string; amount: string }[] = [
  { field: "electricite", label: "Électricité",        amount: "50 000" },
  { field: "eau",         label: "Eau",                amount: "15 000" },
  { field: "vehicule",    label: "Véhicule de fonction", amount: "20 000" },
  { field: "telephone",   label: "Téléphone",          amount: "20 000" },
  { field: "nourriture",  label: "Nourriture",         amount: "25 000" },
];

const DEF_AV: Avantages = {
  logementPieces: 0, electricite: false, eau: false,
  vehicule: false, telephone: false, nourriture: false,
};
const DEF_FAM: Famille = { marie: false, nbEnfants: 0 };
const DEF_SC: Scenario = {
  id: "1", label: "Scénario 1", brut: "150000",
  avantages: { ...DEF_AV }, famille: { ...DEF_FAM },
};

// ─── Logique de calcul ────────────────────────────────────────────────────────
function calculerITS(base: number): number {
  let impot = 0;
  for (const t of ITS_TRANCHES) {
    if (base <= t.min) break;
    impot += (Math.min(base, t.max) - t.min) * t.taux;
  }
  return Math.max(0, impot);
}

function calculer(sc: Scenario) {
  const bruBase = Math.max(0, parseFloat(sc.brut.replace(/\s/g, "")) || 0);

  // Avantages en nature
  const avLog  = sc.avantages.logementPieces > 0
    ? Math.min(sc.avantages.logementPieces * 20_000, bruBase / 3)
    : 0;
  const avElec = sc.avantages.electricite ? 50_000 : 0;
  const avEau  = sc.avantages.eau         ? 15_000 : 0;
  const avVeh  = sc.avantages.vehicule    ? 20_000 : 0;
  const avTel  = sc.avantages.telephone   ? 20_000 : 0;
  const avNour = sc.avantages.nourriture  ? 25_000 : 0;
  const totalAv = avLog + avElec + avEau + avVeh + avTel + avNour;

  const brutTotal = bruBase + totalAv;

  // CNSS salarié (5,25 %, plafond 800 000)
  const cnss = Math.min(brutTotal, CNSS_PLAFOND) * CNSS_SALARIE_TAUX;

  // Base ITS = Brut − CNSS
  const baseITS = Math.max(0, brutTotal - cnss);
  const itsBrut = calculerITS(baseITS);

  // Réductions familiales
  const redMarie   = sc.famille.marie ? REDUCTION_MARIE : 0;
  const redEnfants = Math.min(sc.famille.nbEnfants * REDUCTION_ENFANT, REDUCTION_ENFANT * 3);
  const redTotale  = Math.min(redMarie + redEnfants, REDUCTION_MAX);
  const redMontant = Math.round(itsBrut * redTotale);
  const itsNet     = Math.max(0, itsBrut - redMontant);

  const netMensuel = Math.max(0, brutTotal - cnss - itsNet);

  // Coût employeur
  const patronale     = brutTotal * CNSS_PATRONALE_TAUX;
  const apprentissage = brutTotal * TAXE_APPRENTISSAGE;
  const coutEmployeur = brutTotal + patronale + apprentissage;

  return {
    bruBase, totalAv, avDetails: { avLog, avElec, avEau, avVeh, avTel, avNour },
    brutTotal, cnss, baseITS, itsBrut,
    redTotale, redMontant, itsNet, netMensuel,
    patronale, apprentissage, coutEmployeur,
    tauxEffectif: brutTotal > 0 ? ((cnss + itsNet) / brutTotal) * 100 : 0,
    plafonneeCNSS: brutTotal > CNSS_PLAFOND,
  };
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n)) + " FCFA";

const COLORS = ["#00A651", "#E53E3E", "#0D1B35"];

interface TooltipEntry { name: string; value: number; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipEntry[]; }

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border rounded-xl shadow-lg px-4 py-3 text-sm" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
      <p className="text-gray-600">{payload[0].name}</p>
      <p className="text-[#0D1B35] font-semibold">{fmt(payload[0].value)}</p>
    </div>
  );
};

function ResultRow({ label, value, color = "text-[#0D1B35]", bold = false, sub }: {
  label: string; value: string; color?: string; bold?: boolean; sub?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <div className="min-w-0">
        <span className={`text-sm text-gray-600 ${bold ? "font-semibold" : ""}`}>{label}</span>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <span className={`text-sm shrink-0 ${color} ${bold ? "font-bold" : "font-medium"}`}>{value}</span>
    </div>
  );
}

function Stepper({ value, min = 0, max = 10, onChange }: {
  value: number; min?: number; max?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 rounded-lg border flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-base"
        style={{ borderColor: "rgba(0,0,0,0.12)" }}
      >−</button>
      <span className="text-sm font-semibold text-[#0D1B35] w-6 text-center">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 rounded-lg border flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors text-base"
        style={{ borderColor: "rgba(0,0,0,0.12)" }}
      >+</button>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function SalarySimulator() {
  const [scenarios, setScenarios] = useState<Scenario[]>([DEF_SC]);
  const [activeTab, setActiveTab] = useState("1");
  const [showAv, setShowAv]       = useState(false);
  const [showEmp, setShowEmp]     = useState(false);

  const addScenario = () => {
    if (scenarios.length >= 3) return;
    const id = Date.now().toString();
    const n  = scenarios.length + 1;
    setScenarios((s) => [...s, { ...DEF_SC, id, label: `Scénario ${n}`, brut: String(150_000 + n * 50_000) }]);
    setActiveTab(id);
  };

  const removeScenario = (id: string) => {
    const next = scenarios.filter((sc) => sc.id !== id);
    setScenarios(next);
    setActiveTab(next[0].id);
  };

  const updateField = (id: string, field: keyof Pick<Scenario, "label" | "brut">, value: string) =>
    setScenarios((s) => s.map((sc) => sc.id === id ? { ...sc, [field]: value } : sc));

  const updateAv = (id: string, field: keyof Avantages, value: boolean | number) =>
    setScenarios((s) => s.map((sc) =>
      sc.id === id ? { ...sc, avantages: { ...sc.avantages, [field]: value } } : sc
    ));

  const updateFam = (id: string, field: keyof Famille, value: boolean | number) =>
    setScenarios((s) => s.map((sc) =>
      sc.id === id ? { ...sc, famille: { ...sc.famille, [field]: value } } : sc
    ));

  const results = useMemo(() => scenarios.map((sc) => ({ ...sc, calc: calculer(sc) })), [scenarios]);
  const active  = results.find((r) => r.id === activeTab) ?? results[0];

  const pieData = [
    { name: "Salaire net",  value: Math.round(active.calc.netMensuel) },
    { name: "ITS net",      value: Math.round(active.calc.itsNet) },
    { name: "CNSS salarié", value: Math.round(active.calc.cnss) },
  ].filter((d) => d.value > 0);

  const barData = results.map((r) => ({
    name: r.label,
    "Net":  Math.round(r.calc.netMensuel),
    "ITS":  Math.round(r.calc.itsNet),
    "CNSS": Math.round(r.calc.cnss),
  }));

  const hasAv = active.calc.totalAv > 0;
  const hasRed = active.calc.redMontant > 0;

  const familleLabel = [
    active.famille.marie ? "Marié(e) −10%" : "",
    active.famille.nbEnfants > 0
      ? `${active.famille.nbEnfants} enfant(s) −${Math.min(active.famille.nbEnfants * 5, 15)}%`
      : "",
  ].filter(Boolean).join(" · ");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00A651]/10 flex items-center justify-center">
          <Calculator size={20} className="text-[#00A651]" />
        </div>
        <div>
          <h2 className="text-[#0D1B35]" style={{ fontSize: "1.4rem" }}>
            Simulateur de Salaire Net — Niger
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">ITS + CNSS · Barème CGI 2025</p>
        </div>
      </div>

      {/* Avertissement */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <Info size={15} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          Barème ITS mensuel CGI 2025 — CNSS salarié 5,25 % (plafond 800 000 FCFA).
          Les réductions familiales sont estimées (Marié : −10 %, par enfant : −5 %, plafond 30 %).
          Résultats indicatifs — consultez un fiscaliste pour toute décision.
        </p>
      </div>

      {/* Tabs scénarios */}
      <div className="flex items-center gap-2 flex-wrap">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            onClick={() => setActiveTab(sc.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-all ${
              activeTab === sc.id
                ? "bg-[#00A651] text-white border-[#00A651]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#00A651] hover:text-[#00A651]"
            }`}
          >
            {sc.label}
            {scenarios.length > 1 && activeTab === sc.id && (
              <span onClick={(e) => { e.stopPropagation(); removeScenario(sc.id); }} className="ml-1 text-white/80 hover:text-white cursor-pointer">
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

      {/* Grille principale */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* ── Gauche : Paramètres ── */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl p-5 border space-y-4" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Paramètres</p>

            {/* Nom */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Nom du scénario</label>
              <input
                type="text"
                value={active.label}
                onChange={(e) => updateField(active.id, "label", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                style={{ borderColor: "rgba(0,0,0,0.12)" }}
              />
            </div>

            {/* Salaire de base */}
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Salaire de base brut mensuel</label>
              <div className="relative">
                <input
                  type="number"
                  value={active.brut}
                  onChange={(e) => updateField(active.id, "brut", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] pr-16"
                  style={{ borderColor: "rgba(0,0,0,0.12)" }}
                  min={0}
                  step={5000}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">FCFA</span>
              </div>
            </div>

            {/* Situation familiale */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Situation familiale</p>
              <div className="flex gap-2 mb-3">
                {(["Célibataire", "Marié(e)"] as const).map((s, i) => (
                  <button
                    key={s}
                    onClick={() => updateFam(active.id, "marie", i === 1)}
                    className={`flex-1 py-2 text-sm rounded-xl border transition-all ${
                      active.famille.marie === (i === 1)
                        ? "bg-[#0D1B35] text-white border-[#0D1B35]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >{s}</button>
                ))}
              </div>
              <div className="flex items-center justify-between bg-white rounded-xl border px-4 py-2.5" style={{ borderColor: "rgba(0,0,0,0.10)" }}>
                <div>
                  <p className="text-xs text-gray-700">Enfants à charge</p>
                  {active.famille.nbEnfants > 0 && (
                    <p className="text-[10px] text-[#00A651]">
                      Réduction −{Math.min(active.famille.nbEnfants * 5, 15)} %
                    </p>
                  )}
                </div>
                <Stepper
                  value={active.famille.nbEnfants}
                  min={0} max={5}
                  onChange={(v) => updateFam(active.id, "nbEnfants", v)}
                />
              </div>
            </div>
          </div>

          {/* Avantages en nature (accordéon) */}
          <div className="bg-gray-50 rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <button
              onClick={() => setShowAv(!showAv)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-medium text-gray-700">Avantages en nature</span>
                {hasAv && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#00A651]/10 text-[#00A651]">
                    +{fmt(active.calc.totalAv)}
                  </span>
                )}
              </div>
              {showAv ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {showAv && (
              <div className="px-5 pb-5 space-y-2.5 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <p className="text-xs text-gray-400 pt-3">Forfaits CGI 2025 — intégrés au brut imposable</p>

                {/* Logement (stepper) */}
                <div className="flex items-center justify-between bg-white rounded-xl border px-4 py-3" style={{ borderColor: "rgba(0,0,0,0.10)" }}>
                  <div>
                    <p className="text-xs text-gray-700">Logement de fonction</p>
                    <p className="text-[10px] text-gray-400">20 000 FCFA/pièce · max ⅓ salaire de base</p>
                    {active.avantages.logementPieces > 0 && (
                      <p className="text-[10px] text-[#00A651] font-medium mt-0.5">= {fmt(active.calc.avDetails.avLog)}</p>
                    )}
                  </div>
                  <Stepper
                    value={active.avantages.logementPieces}
                    min={0} max={8}
                    onChange={(v) => updateAv(active.id, "logementPieces", v)}
                  />
                </div>

                {/* Cases à cocher */}
                {AVANTAGE_OPTIONS.map(({ field, label, amount }) => (
                  <label
                    key={field}
                    className="flex items-center justify-between bg-white rounded-xl border px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "rgba(0,0,0,0.10)" }}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={active.avantages[field]}
                        onChange={(e) => updateAv(active.id, field, e.target.checked)}
                        className="w-4 h-4 accent-[#00A651] cursor-pointer"
                      />
                      <span className="text-xs text-gray-700">{label}</span>
                    </div>
                    <span className="text-xs text-gray-400">{amount} FCFA</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Droite : Résultats ── */}
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Salaire net",  value: fmt(active.calc.netMensuel),  color: "#00A651", hl: true  },
              { label: "ITS net",      value: fmt(active.calc.itsNet),      color: "#E53E3E", hl: false },
              { label: "CNSS (5,25%)", value: fmt(active.calc.cnss),        color: "#0D1B35", hl: false },
            ].map(({ label, value, color, hl }) => (
              <div key={label} className="rounded-2xl p-3.5 border" style={{
                background:   hl ? "rgba(0,166,81,0.06)" : "white",
                borderColor:  hl ? "rgba(0,166,81,0.25)" : "rgba(0,0,0,0.06)",
              }}>
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className="font-bold text-sm" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Détail du calcul */}
          <div className="bg-white rounded-2xl border divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            {/* Brut */}
            <div className="px-5 py-4 space-y-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Détail du calcul</p>
              <ResultRow label="Salaire de base" value={fmt(active.calc.bruBase)} />
              {hasAv && (
                <ResultRow
                  label="+ Avantages en nature"
                  value={fmt(active.calc.totalAv)}
                  color="text-[#00A651]"
                  sub="logement, électricité, véhicule…"
                />
              )}
              <div className="pt-1 border-t mt-1" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <ResultRow label="Brut total imposable" value={fmt(active.calc.brutTotal)} bold />
              </div>
            </div>

            {/* CNSS + ITS */}
            <div className="px-5 py-4 space-y-0">
              <ResultRow
                label={`− CNSS salarié 5,25 %${active.calc.plafonneeCNSS ? " (plafonné)" : ""}`}
                value={fmt(active.calc.cnss)}
                color="text-red-500"
                sub={active.calc.plafonneeCNSS ? `Plafond 800 000 FCFA appliqué` : undefined}
              />
              <ResultRow label="= Base ITS" value={fmt(active.calc.baseITS)} sub="Brut − CNSS" />
              <ResultRow label="ITS brut (barème)" value={fmt(active.calc.itsBrut)} color="text-red-500" />
              {hasRed && (
                <ResultRow
                  label={`+ Réduction familiale (${(active.calc.redTotale * 100).toFixed(0)} %)`}
                  value={fmt(active.calc.redMontant)}
                  color="text-[#00A651]"
                  sub={familleLabel}
                />
              )}
              <ResultRow label="− ITS net" value={fmt(active.calc.itsNet)} color="text-red-500" bold />
            </div>

            {/* Net */}
            <div className="px-5 py-4 space-y-0">
              <ResultRow
                label="Salaire net mensuel"
                value={fmt(active.calc.netMensuel)}
                color="text-[#00A651]"
                bold
              />
              <ResultRow
                label="Taux de prélèvement effectif"
                value={`${active.calc.tauxEffectif.toFixed(1)} %`}
                color="text-orange-600"
              />
            </div>
          </div>

          {/* Graphique */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <p className="text-xs text-gray-400 mb-1">Répartition mensuelle du salaire brut</p>
            <ResponsiveContainer width="100%" height={185}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span style={{ fontSize: 11, color: "#374151" }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comparaison multi-scénarios */}
      {scenarios.length > 1 && (
        <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <p className="text-xs text-gray-500 mb-4">Comparaison des scénarios (mensuel, FCFA)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickFormatter={(v) => (v / 1000).toFixed(0) + "k"} />
              <Tooltip
                formatter={(value: number, name: string) => [fmt(value), name]}
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Net"  name="Salaire net"  fill="#00A651" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ITS"  name="ITS net"      fill="#E53E3E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="CNSS" name="CNSS salarié" fill="#0D1B35" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Coût employeur */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <button
          onClick={() => setShowEmp(!showEmp)}
          className="w-full flex items-center justify-between px-5 py-4 transition-colors"
          style={{ background: "#0D1B35" }}
        >
          <div className="flex items-center gap-2.5">
            <Briefcase size={14} className="text-white" />
            <span className="text-sm font-medium text-white">Coût total pour l'employeur</span>
            {!showEmp && (
              <span className="text-xs text-gray-400">= {fmt(active.calc.coutEmployeur)}</span>
            )}
          </div>
          {showEmp
            ? <ChevronUp size={15} className="text-gray-400" />
            : <ChevronDown size={15} className="text-gray-400" />
          }
        </button>

        {showEmp && (
          <div className="bg-white px-5 py-4 space-y-0">
            <ResultRow label="Salaire brut total"           value={fmt(active.calc.brutTotal)} />
            <ResultRow label="+ CNSS patronale (15,4 %)"    value={fmt(active.calc.patronale)} color="text-red-500" />
            <ResultRow label="+ Taxe d'apprentissage (2 %)" value={fmt(active.calc.apprentissage)} color="text-red-500" />
            <div className="border-t pt-3 mt-2" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
              <ResultRow
                label="Coût mensuel total employeur"
                value={fmt(active.calc.coutEmployeur)}
                color="text-[#0D1B35]"
                bold
              />
            </div>
          </div>
        )}
      </div>

      {/* Barème ITS (détail) */}
      <details className="bg-gray-50 rounded-2xl border" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <summary className="px-5 py-3.5 cursor-pointer text-sm text-gray-600 select-none">
          Barème ITS Niger — CGI 2025 (tranches mensuelles)
        </summary>
        <div className="px-5 pb-4">
          <table className="w-full text-xs text-gray-600">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <th className="text-left py-2">Tranche mensuelle</th>
                <th className="text-right py-2">Taux</th>
              </tr>
            </thead>
            <tbody>
              {ITS_TRANCHES.map((t, i) => (
                <tr key={i} className="border-b last:border-0" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                  <td className="py-2">
                    {i === ITS_TRANCHES.length - 1
                      ? `Au-delà de ${t.min.toLocaleString("fr-FR")} FCFA`
                      : `${t.min.toLocaleString("fr-FR")} – ${t.max.toLocaleString("fr-FR")} FCFA`}
                  </td>
                  <td className="text-right py-2 font-semibold text-[#0D1B35]">
                    {(t.taux * 100).toFixed(0)} %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-400 mt-3">CNSS salarié : 5,25 % (plafond 800 000 FCFA/mois) · CNSS patronale : 15,4 % · Taxe apprentissage : 2 %</p>
        </div>
      </details>
    </div>
  );
}