import Link from "next/link";
import { addDays, monthLabel, shiftMonth, today } from "@/lib/format";
import { withQuery } from "@/lib/util";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

type Props = {
  month: string; // YYYY-MM
  selected: string; // YYYY-MM-DD
  counts: Map<string, number>;
  reminderCounts?: Map<string, number>;
  path?: string;
};

/** Primer lunes visible y fin exclusivo de la grilla del mes. */
export function monthGrid(month: string) {
  const first = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const weekday = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const start = addDays(first, -weekday);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = Math.ceil((weekday + daysInMonth) / 7) * 7;
  return { start, end: addDays(start, cells), cells };
}

export function Calendar({ month, selected, counts, reminderCounts = new Map(), path = "/" }: Props) {
  const { start, cells } = monthGrid(month);
  const now = today();
  const days = Array.from({ length: cells }, (_, i) => addDays(start, i));

  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between">
        <Link href={withQuery(path, { mes: shiftMonth(month, -1), f: selected })} className="btn-ghost btn-sm" aria-label="Mes anterior">‹</Link>
        <span className="font-semibold">{monthLabel(month)}</span>
        <Link href={withQuery(path, { mes: shiftMonth(month, 1), f: selected })} className="btn-ghost btn-sm" aria-label="Mes siguiente">›</Link>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const inMonth = date.startsWith(month);
          const count = counts.get(date) ?? 0;
          const reminders = reminderCounts.get(date) ?? 0;
          const isSelected = date === selected;
          const isToday = date === now;
          return (
            <Link
              key={date}
              href={withQuery(path, { f: date, mes: month })}
              aria-current={isSelected ? "date" : undefined}
              aria-label={`${date}${count ? `, ${count} trabajos` : ""}${reminders ? `, ${reminders} recordatorios` : ""}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm tabular-nums transition md:aspect-auto md:h-14 ${
                isSelected ? "bg-accent font-bold text-white dark:text-black" : isToday ? "bg-accent-soft font-semibold text-accent" : inMonth ? "hover:bg-accent-soft/60" : "text-muted/50"
              }`}
            >
              {Number(date.slice(8))}
              <span className="mt-0.5 flex h-1.5 gap-0.5">
                {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                  <span key={i} className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white dark:bg-black" : "bg-sage"}`} />
                ))}
                {reminders > 0 && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white dark:bg-black" : "bg-warn"}`} />}
              </span>
            </Link>
          );
        })}
      </div>
      <p className="mt-3 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-sage" /> Trabajos</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-warn" /> Recordatorios</span>
      </p>
    </section>
  );
}
