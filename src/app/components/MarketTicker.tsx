import { TrendingUp, TrendingDown } from "lucide-react";
import { useMarketData } from "../../lib/siteData";

export function MarketOverview() {
  const items = useMarketData();

  const indices     = items.filter((i) => i.type === "index"     && i.is_active);
  const commodities = items.filter((i) => i.type === "commodity" && i.is_active);

  const lastUpdated = items.length > 0
    ? new Date(Math.max(...items.map((i) => new Date(i.updated_at).getTime())))
    : null;

  function relativeTime(d: Date): string {
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000);
    if (diffMin < 1)  return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)   return `il y a ${diffH}h`;
    return `il y a ${Math.floor(diffH / 24)}j`;
  }

  return (
    <section className="bg-white border rounded-xl p-5 shadow-sm" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
      <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-[#00A651]" />
        Marchés en temps réel
      </h3>

      {indices.length > 0 && (
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Indices boursiers</p>
          <div className="space-y-2">
            {indices.map((idx) => {
              const isUp = idx.change_abs >= 0;
              return (
                <div key={idx.id} className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 truncate flex-1 mr-2">{idx.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-900 tabular-nums">
                      {idx.value.toLocaleString("fr-FR")}
                    </span>
                    <span className={`flex items-center gap-0.5 text-xs font-semibold ${isUp ? "text-green-600" : "text-red-600"}`}>
                      {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {idx.change_pct}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {commodities.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Matières premières</p>
          <div className="space-y-2">
            {commodities.map((c) => {
              const isUp = c.change_abs >= 0;
              return (
                <div key={c.id} className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 truncate flex-1 mr-2">{c.name}</span>
                  <div className="flex items-center gap-2">
                    {c.unit && <span className="text-xs text-gray-500">{c.unit}</span>}
                    <span className="text-xs font-medium text-gray-900 tabular-nums">
                      {c.value.toLocaleString("fr-FR")}
                    </span>
                    <span className={`text-xs font-semibold ${isUp ? "text-green-600" : "text-red-600"}`}>
                      {isUp ? "+" : ""}{c.change_abs}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lastUpdated && (
        <p className="text-[10px] text-gray-400 mt-3 text-right">
          Mis à jour {relativeTime(lastUpdated)}
        </p>
      )}
    </section>
  );
}
