import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { CHART_DATA } from "../data/mockData";
import { useMarketData } from "../../lib/siteData";

export function BRVMChart() {
  const items = useMarketData();
  const brvm = items.find((i) => i.name.toLowerCase().includes("brvm"));

  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-gray-900 font-semibold text-sm">BRVM Composite</h3>
          <p className="text-[11px] text-gray-400">Évolution sur 7 mois</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {brvm ? brvm.value.toLocaleString("fr-FR") : "342.15"}
          </div>
          <div className={`text-xs font-semibold ${brvm ? (brvm.change_abs >= 0 ? "text-green-600" : "text-red-600") : "text-green-600"}`}>
            {brvm ? brvm.change_pct : "+8.3%"}
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={CHART_DATA.brvm} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} domain={["dataMin - 10", "dataMax + 10"]} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            formatter={(v: number) => [v.toLocaleString("fr-FR"), "BRVM"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#00A651"
            strokeWidth={2.5}
            dot={{ fill: "#00A651", r: 3 }}
            activeDot={{ r: 5, fill: "#008c44" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GDPChart() {
  const items = useMarketData();
  const pib = items.find((i) => i.name.toLowerCase().includes("pib") || i.name.toLowerCase().includes("gdp") || i.name.toLowerCase().includes("croissance"));

  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-gray-900 font-semibold text-sm">{pib ? pib.name : "Croissance PIB 2026 (prévisions)"}</h3>
          <p className="text-[11px] text-gray-400">Pays de l'espace UEMOA + Guinée</p>
        </div>
        {pib && (
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{pib.value.toLocaleString("fr-FR")}{pib.unit ? ` ${pib.unit}` : ""}</div>
            <div className={`text-xs font-semibold ${pib.change_abs >= 0 ? "text-green-600" : "text-red-600"}`}>{pib.change_pct}</div>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={CHART_DATA.gdpGrowth} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="country" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            formatter={(v: number) => [`${v}%`, "Croissance PIB"]}
          />
          <Bar dataKey="value" fill="#00A651" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InvestmentChart() {
  const items = useMarketData();
  const inv = items.find((i) => i.name.toLowerCase().includes("invest") || i.name.toLowerCase().includes("flux"));

  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-gray-900 font-semibold text-sm">{inv ? inv.name : "Flux d'investissements en Afrique"}</h3>
          <p className="text-[11px] text-gray-400">Par origine (milliards USD)</p>
        </div>
        {inv && (
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{inv.value.toLocaleString("fr-FR")}{inv.unit ? ` ${inv.unit}` : ""}</div>
            <div className={`text-xs font-semibold ${inv.change_abs >= 0 ? "text-green-600" : "text-red-600"}`}>{inv.change_pct}</div>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={CHART_DATA.investment} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} unit="B" />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="china" name="Chine" fill="#D4A017" radius={[2, 2, 0, 0]} />
          <Bar dataKey="europe" name="Europe" fill="#00A651" radius={[2, 2, 0, 0]} />
          <Bar dataKey="usa" name="USA" fill="#0D1B35" radius={[2, 2, 0, 0]} />
          <Bar dataKey="other" name="Autres" fill="#9ca3af" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}