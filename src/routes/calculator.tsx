import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "الآلة الحاسبة — Study HUB Calculator" },
      { name: "description", content: "آلة حاسبة علمية سريعة للحسابات الرياضية داخل Study HUB." },
      { property: "og:title", content: "الآلة الحاسبة — Study HUB Calculator" },
      { property: "og:description", content: "آلة حاسبة علمية داخل المنصة." },
    ],
  }),
  component: CalculatorPage,
});

const KEYS = [
  ["7", "8", "9", "/"],
  ["4", "5", "6", "*"],
  ["1", "2", "3", "-"],
  ["0", ".", "%", "+"],
  ["(", ")", "^", "π"],
];

const FUNCS = ["sin", "cos", "tan", "√", "log", "ln"];

function evaluate(expr: string): string {
  const js = expr
    .replace(/π/g, "Math.PI")
    .replace(/√\(/g, "Math.sqrt(")
    .replace(/sin\(/g, "Math.sin(")
    .replace(/cos\(/g, "Math.cos(")
    .replace(/tan\(/g, "Math.tan(")
    .replace(/log\(/g, "Math.log10(")
    .replace(/ln\(/g, "Math.log(")
    .replace(/\^/g, "**")
    .replace(/%/g, "/100");
  if (!/^[0-9+\-*/().,%^ MathPIsqrtincoalg*]*$/.test(js)) return "Error";
  try {
    // eslint-disable-next-line no-new-func
    const out = Function(`"use strict";return (${js})`)() as number;
    return Number.isFinite(out) ? String(Math.round(out * 1e10) / 1e10) : "Error";
  } catch {
    return "Error";
  }
}

function CalculatorPage() {
  const [expr, setExpr] = useState("");
  const [out, setOut] = useState("0");

  const push = (k: string) => setExpr((e) => e + (k === "√" ? "√(" : k));

  return (
    <AppShell title="🧮 Calculator" subtitle="آلة حاسبة علمية">
      <div className="hub-card mx-auto max-w-sm p-4">
        <div className="rounded-xl bg-accent p-4 text-right">
          <p className="truncate text-sm text-muted-foreground">{expr || "0"}</p>
          <p className="font-display text-gradient-gold mt-1 truncate text-3xl font-extrabold">{out}</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {FUNCS.map((f) => (
            <Button key={f} variant="outline" size="sm" onClick={() => push(`${f}(`)}>
              {f}
            </Button>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-4 gap-2">
          {KEYS.flat().map((k) => (
            <Button key={k} variant="secondary" onClick={() => push(k)}>
              {k}
            </Button>
          ))}
          <Button variant="outline" onClick={() => setExpr((e) => e.slice(0, -1))}>
            ⌫
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setExpr("");
              setOut("0");
            }}
          >
            AC
          </Button>
          <Button className="gradient-gold col-span-2 font-bold" onClick={() => setOut(evaluate(expr))}>
            =
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
