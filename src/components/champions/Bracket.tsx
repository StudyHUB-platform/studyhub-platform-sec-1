import { Link } from "@tanstack/react-router";
import { CL_ROUNDS } from "@/lib/champions";
import { cn } from "@/lib/utils";

export type ClMatch = {
  id: string;
  round: number;
  slot: number;
  p1: string | null;
  p2: string | null;
  winner: string | null;
};
export type ClPerson = { id: string; name: string; emoji: string; is_warned: boolean };

function Slot({ person, match }: { person: ClPerson | undefined; match: ClMatch | undefined }) {
  const lost = !!match?.winner && !!person && match.winner !== person.id;
  const won = !!match?.winner && !!person && match.winner === person.id;
  return (
    <div
      className={cn(
        "flex min-h-14 flex-col items-center justify-center rounded-lg border px-2 py-1 text-center",
        won ? "border-primary bg-primary/15" : "border-sidebar-border bg-sidebar-accent/40",
        lost && "opacity-60",
      )}
    >
      {person ? (
        <>
          <span className="text-xl leading-none">{person.emoji}</span>
          <span className={cn("mt-0.5 max-w-28 truncate text-[11px] font-bold", lost && "line-through")}>
            {person.name} {lost && <span className="text-destructive no-underline">❌ X</span>}
            {person.is_warned && " ⚠️"}
          </span>
        </>
      ) : (
        <span className="text-[11px] text-sidebar-foreground/50">في الانتظار</span>
      )}
    </div>
  );
}

export function Bracket({ matches, people }: { matches: ClMatch[]; people: Map<string, ClPerson> }) {
  const final = matches.find((m) => m.round === 4);
  const champ = final?.winner ? people.get(final.winner) : undefined;
  return (
    <div className="overflow-x-auto rounded-2xl bg-sidebar p-4 text-sidebar-foreground">
      <div className="flex min-w-[860px] gap-4" dir="ltr">
        {CL_ROUNDS.map((r) => (
          <div key={r.round} className="flex flex-1 flex-col">
            <p className="mb-3 text-center text-xs font-bold text-primary">
              {r.medal} {r.ar}
            </p>
            <div className="flex flex-1 flex-col justify-around gap-3">
              {Array.from({ length: r.matches }).map((_, slot) => {
                const m = matches.find((x) => x.round === r.round && x.slot === slot);
                const inner = (
                  <div className="space-y-1 rounded-xl border border-primary/30 p-1.5 transition hover:border-primary">
                    <Slot person={m?.p1 ? people.get(m.p1) : undefined} match={m} />
                    <p className="text-center text-[10px] font-extrabold text-primary">VS</p>
                    <Slot person={m?.p2 ? people.get(m.p2) : undefined} match={m} />
                  </div>
                );
                return m ? (
                  <Link key={slot} to="/champions/match/$matchId" params={{ matchId: m.id }}>
                    {inner}
                  </Link>
                ) : (
                  <div key={slot}>{inner}</div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="flex w-36 flex-col items-center justify-center text-center">
          <p className="text-4xl">🏆</p>
          <p className="mt-2 text-xs font-bold text-primary">البطل</p>
          {champ ? (
            <div className="mt-2 rounded-xl border-2 border-primary bg-primary/15 p-3">
              <p className="text-3xl">{champ.emoji}</p>
              <p className="text-sm font-extrabold">{champ.name}</p>
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-sidebar-foreground/50">لم يُحسم بعد</p>
          )}
        </div>
      </div>
    </div>
  );
}
