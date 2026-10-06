type S = { minutes: number; created_at: string };

export function StudyCandles({ sessions }: { sessions: S[] }) {
  const days = Array.from({ length: 31 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (30 - i));
    const key = d.toDateString();
    const list = sessions.filter((s) => new Date(s.created_at).toDateString() === key).map((s) => s.minutes);
    return { d, total: list.reduce((a, b) => a + b, 0), longest: Math.max(0, ...list) };
  });
  const candles = days.slice(1).map((day, i) => {
    const open = days[i]!.total;
    const close = day.total;
    return { ...day, open, close, high: Math.max(open, close, close + day.longest * 0.25), low: Math.max(0, Math.min(open, close) - day.longest * 0.25) };
  });
  const max = Math.max(30, ...candles.map((c) => c.high));
  const W = 620, H = 200, pad = 24;
  const step = (W - pad * 2) / candles.length;
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  if (!sessions.length) return <p className="text-sm text-muted-foreground">لا توجد جلسات مذاكرة بعد — ابدأ من Study Focus.</p>;
  return (
    <div className="overflow-x-auto rounded-xl bg-sidebar p-2" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[560px] w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={pad} x2={W - pad} y1={y(max * f)} y2={y(max * f)} stroke="currentColor" className="text-sidebar-border" strokeDasharray="3 3" />
            <text x={2} y={y(max * f) + 3} fontSize="8" className="fill-sidebar-foreground/60">{Math.round(max * f)}</text>
          </g>
        ))}
        {candles.map((c, i) => {
          const x = pad + i * step + step / 2;
          const up = c.close >= c.open;
          const color = up ? "oklch(0.72 0.17 150)" : "oklch(0.63 0.22 25)";
          const top = y(Math.max(c.open, c.close));
          const h = Math.max(2, Math.abs(y(c.open) - y(c.close)));
          return (
            <g key={i}>
              <title>{`${c.d.toLocaleDateString("ar-EG")}: ${c.close} دقيقة`}</title>
              <line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth="1" />
              <rect x={x - step * 0.3} y={top} width={step * 0.6} height={h} fill={color} rx="1" />
              {i % 5 === 0 && (
                <text x={x} y={H - 6} fontSize="8" textAnchor="middle" className="fill-sidebar-foreground/60">
                  {c.d.getDate()}/{c.d.getMonth() + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
