import React from "react";
import { NavLink } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  Bot,
  FlaskConical,
  FileBarChart,
  GitCompareArrows,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Circle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Terminal,
  Settings,
} from "lucide-react";
import { TraceStep, Failure } from "./types";

// ---------------------------------------------------------------------------
// Layout / navigation
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/evaluate", label: "Evaluation", icon: FlaskConical },
  { to: "/regression", label: "Regression", icon: GitCompareArrows },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-base-line bg-base-panel/60 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-base-line">
        <div className="relative">
          <ShieldCheck className="w-6 h-6 text-signal-teal" strokeWidth={2} />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-signal-teal pulse-dot" />
        </div>
        <div className="leading-none">
          <div className="font-display font-semibold text-sm text-ink-hi tracking-tight">AgentShield</div>
          <div className="text-[10px] font-mono text-ink-low tracking-widest uppercase">AI Reliability CI</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-signal-teal/10 text-signal-teal border border-signal-teal/20"
                  : "text-ink-mid border border-transparent hover:text-ink-hi hover:bg-base-raised"
              }`
            }
          >
            <item.icon className="w-4 h-4" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-base-line">
        <div className="rounded-lg border border-base-line bg-base-raised px-3 py-2.5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-low mb-1">Sandbox</div>
          <div className="flex items-center gap-1.5 text-xs text-ink-mid">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-teal pulse-dot" />
            No real tools ever execute
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t border-base-line bg-base-panel/95 backdrop-blur-sm">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium ${
              isActive ? "text-signal-teal" : "text-ink-low"
            }`
          }
        >
          <item.icon className="w-4 h-4" strokeWidth={2} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && (
          <div className="text-[11px] font-mono uppercase tracking-widest text-signal-teal mb-1.5">{eyebrow}</div>
        )}
        <h1 className="font-display text-2xl font-semibold text-ink-hi tracking-tight">{title}</h1>
        {description && <p className="text-sm text-ink-mid mt-1 max-w-xl">{description}</p>}
      </div>
      {right}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cards / stats
// ---------------------------------------------------------------------------

export function Card({
  children,
  className = "",
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-base-line bg-base-panel/80 ${
        glow ? "shadow-glow" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  sub,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
  tone?: "default" | "danger" | "success";
  sub?: string;
}) {
  const toneColor =
    tone === "danger" ? "text-signal-red" : tone === "success" ? "text-signal-teal" : "text-ink-hi";
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-mono uppercase tracking-widest text-ink-low">{label}</div>
        {Icon && <Icon className="w-3.5 h-3.5 text-ink-low" strokeWidth={2} />}
      </div>
      <div className={`font-display text-3xl font-semibold mt-2 ${toneColor}`}>{value}</div>
      {sub && <div className="text-xs text-ink-low mt-1">{sub}</div>}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-signal-red/10 text-signal-red border-signal-red/30",
  HIGH: "bg-signal-red/10 text-signal-red border-signal-red/20",
  MEDIUM: "bg-signal-amber/10 text-signal-amber border-signal-amber/25",
  LOW: "bg-signal-cyan/10 text-signal-cyan border-signal-cyan/25",
  NONE: "bg-signal-teal/10 text-signal-teal border-signal-teal/25",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-mono uppercase tracking-wider ${
        SEVERITY_STYLES[severity] || SEVERITY_STYLES.NONE
      }`}
    >
      {severity}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const pass = status === "pass";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono uppercase tracking-wider ${
        pass
          ? "bg-signal-teal/10 text-signal-teal border-signal-teal/25"
          : "bg-signal-red/10 text-signal-red border-signal-red/30"
      }`}
    >
      {pass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

export function CategoryPill({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-base-line bg-base-raised text-[10px] font-medium text-ink-mid">
      {category}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Score gauge / label
// ---------------------------------------------------------------------------

export function scoreColor(score: number) {
  if (score >= 90) return "#3DDCC7";
  if (score >= 75) return "#5FC9E8";
  if (score >= 50) return "#E8B15F";
  return "#EF6461";
}

export function ScoreRing({ score, size = 96, label }: { score: number; size?: number; label?: string }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c;
  const color = scoreColor(score);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--ring-track, #232A38)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-semibold text-ink-hi" style={{ fontSize: size * 0.24 }}>
          {Math.round(score)}
        </span>
        {label && <span className="text-[9px] font-mono uppercase tracking-widest text-ink-low">{label}</span>}
      </div>
    </div>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-ink-mid">{label}</span>
        <span className="text-xs font-mono text-ink-hi">{value.toFixed(0)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-base-raised overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: scoreColor(value), transition: "width 0.6s ease" }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trend indicator
// ---------------------------------------------------------------------------

export function TrendChip({ delta }: { delta: number }) {
  if (delta > 0)
    return (
      <span className="inline-flex items-center gap-1 text-signal-teal text-sm font-mono font-medium">
        <ArrowUpRight className="w-4 h-4" /> +{delta.toFixed(1)}
      </span>
    );
  if (delta < 0)
    return (
      <span className="inline-flex items-center gap-1 text-signal-red text-sm font-mono font-medium">
        <ArrowDownRight className="w-4 h-4" /> {delta.toFixed(1)}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-ink-low text-sm font-mono font-medium">
      <Minus className="w-4 h-4" /> 0.0
    </span>
  );
}

// ---------------------------------------------------------------------------
// Execution trace (the "signature" element — CI pipeline log)
// ---------------------------------------------------------------------------

function traceIcon(status: string) {
  if (status === "fail" || status === "blocked") return <XCircle className="w-3.5 h-3.5 text-signal-red" />;
  if (status === "info" || status === "dispatched") return <Circle className="w-3 h-3 text-ink-low" />;
  return <CheckCircle2 className="w-3.5 h-3.5 text-signal-teal" />;
}

export function TraceView({ steps }: { steps: TraceStep[] }) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-[9px] top-1 bottom-1 w-px bg-base-line" />
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="relative fade-up">
            <div className="absolute -left-6 top-0.5 w-[19px] h-[19px] rounded-full bg-base-panel border border-base-line flex items-center justify-center">
              {traceIcon(step.status)}
            </div>
            <div className="rounded-lg border border-base-line bg-base-raised/60 p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-ink-low">#{step.step_number}</span>
                  <span className="font-mono text-xs font-semibold text-ink-hi tracking-wide">
                    {step.action.replace(/_/g, " ")}
                  </span>
                  {step.tool && (
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-base-panel border border-base-line text-signal-cyan">
                      {step.tool}()
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-ink-low">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {step.parameters && Object.keys(step.parameters).length > 0 && (
                <pre className="mt-2 text-[11px] font-mono text-ink-mid bg-base-panel rounded p-2 overflow-x-auto">
                  {JSON.stringify(step.parameters, null, 2)}
                </pre>
              )}
              {step.response && Object.keys(step.response).length > 0 && (
                <pre className="mt-2 text-[11px] font-mono text-ink-low bg-base-panel/60 rounded p-2 overflow-x-auto border border-base-line/60">
                  {JSON.stringify(step.response, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Failure card
// ---------------------------------------------------------------------------

export function FailureCard({ failure }: { failure: Failure }) {
  return (
    <Card className={`p-4 ${failure.severity === "CRITICAL" ? "shadow-glowRed border-signal-red/30" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={`w-4 h-4 ${failure.severity === "CRITICAL" || failure.severity === "HIGH" ? "text-signal-red" : "text-signal-amber"}`}
          />
          <span className="font-display font-semibold text-sm text-ink-hi">{failure.type}</span>
        </div>
        <SeverityBadge severity={failure.severity} />
      </div>
      <p className="text-sm text-ink-mid mb-3">{failure.description}</p>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg border border-base-line bg-base-raised/50 p-2.5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-low mb-1">Expected</div>
          <div className="text-xs text-ink-mid">{failure.expected_behavior}</div>
        </div>
        <div className="rounded-lg border border-signal-red/20 bg-signal-red/5 p-2.5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-signal-red/80 mb-1">Actual</div>
          <div className="text-xs text-ink-mid">{failure.actual_behavior}</div>
        </div>
      </div>
      <div className="flex items-start gap-1.5 text-[11px] font-mono text-ink-low mb-3 bg-base-panel rounded p-2 border border-base-line/60">
        <Terminal className="w-3 h-3 mt-0.5 shrink-0" />
        <span className="break-all">{failure.evidence}</span>
      </div>
      <div className="text-xs text-ink-mid mb-1.5">
        <span className="text-ink-low">Risk: </span>
        {failure.risk}
      </div>
      <div className="text-xs text-signal-teal">
        <span className="text-ink-low">Recommendation: </span>
        {failure.recommendation}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-ink-mid text-sm py-10 justify-center">
      <span className="w-2 h-2 rounded-full bg-signal-teal pulse-dot" />
      <span className="font-mono">{label}</span>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="text-center py-12 border border-dashed border-base-line rounded-xl">
      <div className="font-display text-ink-hi font-medium">{title}</div>
      {description && <div className="text-sm text-ink-low mt-1">{description}</div>}
    </div>
  );
}
