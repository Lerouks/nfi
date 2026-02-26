import { TrendingUp, TrendingDown } from "lucide-react";
import { MARKET_DATA } from "../data/mockData";

export function MarketOverview() {
  return (
    <section className="bg-white border rounded-xl p-5 shadow-sm" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
      <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-[#00A651]" />
        Marchés en temps réel
      </h3>

      {/* Indices */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Indices boursiers</p>
        <div className="space-y-2">
          {MARKET_DATA.indices.map((idx) => {
            const isUp = idx.change >= 0;
            return (
              <div key={idx.name} className="flex items-center justify-between">
                <span className="text-xs text-gray-700 truncate flex-1 mr-2">{idx.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-900 tabular-nums">
                    {idx.value.toLocaleString("fr-FR")}
                  </span>
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? "text-green-600" : "text-red-600"}`}>
                    {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {idx.percent}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Currencies */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Devises</p>
        <div className="space-y-2">
          {MARKET_DATA.currencies.map((c) => {
            const isUp = c.change >= 0;
            return (
              <div key={c.pair} className="flex items-center justify-between">
                <span className="text-xs text-gray-700 font-medium">{c.pair}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-900 tabular-nums">{c.value.toLocaleString("fr-FR")}</span>
                  <span className={`text-xs font-semibold ${isUp ? "text-green-600" : "text-red-600"}`}>
                    {isUp ? "+" : ""}{c.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Commodities */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Matières premières</p>
        <div className="space-y-2">
          {MARKET_DATA.commodities.map((c) => {
            const isUp = c.change >= 0;
            return (
              <div key={c.name} className="flex items-center justify-between">
                <span className="text-xs text-gray-700 truncate flex-1 mr-2">{c.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{c.unit}</span>
                  <span className="text-xs font-medium text-gray-900 tabular-nums">{c.value.toLocaleString("fr-FR")}</span>
                  <span className={`text-xs font-semibold ${isUp ? "text-green-600" : "text-red-600"}`}>
                    {isUp ? "+" : ""}{c.change}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mt-3 text-right">Mis à jour il y a 10 min</p>
    </section>
  );
}
