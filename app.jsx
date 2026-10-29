import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  TrendingUp, TrendingDown, Search, Plus, Wallet, BarChart3, Clock, Users,
  DollarSign, CheckCircle, ArrowRight, ChevronDown, ChevronUp, X, Menu,
  Home, Globe, Zap, Shield, Award, Target, ArrowUpRight, ArrowDownRight,
  Filter, Bell, Star, Info, ExternalLink, Copy, LogIn, UserPlus
} from "lucide-react";
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── Constants & Mock Data ───────────────────────────────────────────────────

const CATEGORIES = ["All", "Politics", "Economy", "Technology", "Health", "Culture", "Environment", "Sports"];

const SURVEY_DATA = [
  {
    id: 1,
    question: "Do a majority of Americans support military action in Iran?",
    category: "Politics",
    threshold: 1000000,
    poolSize: 743200,
    yesOdds: 0.34,
    totalBets: 2847,
    createdAt: "2026-03-28",
    deadline: "2026-05-15",
    surveyFirm: "Gallup",
    trending: true,
    hot: true,
    history: [
      { day: "Mar 28", yes: 0.45 }, { day: "Mar 30", yes: 0.42 }, { day: "Apr 1", yes: 0.38 },
      { day: "Apr 3", yes: 0.40 }, { day: "Apr 5", yes: 0.36 }, { day: "Apr 7", yes: 0.33 },
      { day: "Apr 9", yes: 0.35 }, { day: "Apr 11", yes: 0.34 },
    ],
  },
  {
    id: 2,
    question: "Will over 60% of Europeans say AI has improved their work life?",
    category: "Technology",
    threshold: 500000,
    poolSize: 512000,
    yesOdds: 0.62,
    totalBets: 1923,
    createdAt: "2026-03-15",
    deadline: "2026-04-30",
    surveyFirm: "YouGov",
    trending: true,
    hot: false,
    status: "funded",
    history: [
      { day: "Mar 15", yes: 0.55 }, { day: "Mar 18", yes: 0.57 }, { day: "Mar 21", yes: 0.54 },
      { day: "Mar 24", yes: 0.58 }, { day: "Mar 27", yes: 0.60 }, { day: "Mar 30", yes: 0.59 },
      { day: "Apr 2", yes: 0.61 }, { day: "Apr 5", yes: 0.62 },
    ],
  },
  {
    id: 3,
    question: "Do most Americans believe climate change is the #1 global threat?",
    category: "Environment",
    threshold: 750000,
    poolSize: 289400,
    yesOdds: 0.48,
    totalBets: 1102,
    createdAt: "2026-04-01",
    deadline: "2026-06-01",
    surveyFirm: "Pew Research",
    trending: false,
    hot: false,
    history: [
      { day: "Apr 1", yes: 0.52 }, { day: "Apr 3", yes: 0.50 }, { day: "Apr 5", yes: 0.49 },
      { day: "Apr 7", yes: 0.47 }, { day: "Apr 9", yes: 0.48 }, { day: "Apr 11", yes: 0.48 },
    ],
  },
  {
    id: 4,
    question: "Will a majority of UK adults say they trust their government?",
    category: "Politics",
    threshold: 400000,
    poolSize: 156800,
    yesOdds: 0.21,
    totalBets: 634,
    createdAt: "2026-04-05",
    deadline: "2026-06-15",
    surveyFirm: "Ipsos",
    trending: false,
    hot: false,
    history: [
      { day: "Apr 5", yes: 0.25 }, { day: "Apr 7", yes: 0.23 }, { day: "Apr 9", yes: 0.22 },
      { day: "Apr 11", yes: 0.21 },
    ],
  },
  {
    id: 5,
    question: "Do over 50% of Gen Z consider remote work a dealbreaker?",
    category: "Economy",
    threshold: 300000,
    poolSize: 287600,
    yesOdds: 0.73,
    totalBets: 1456,
    createdAt: "2026-03-20",
    deadline: "2026-05-01",
    surveyFirm: "YouGov",
    trending: true,
    hot: true,
    history: [
      { day: "Mar 20", yes: 0.65 }, { day: "Mar 23", yes: 0.68 }, { day: "Mar 26", yes: 0.70 },
      { day: "Mar 29", yes: 0.69 }, { day: "Apr 1", yes: 0.72 }, { day: "Apr 4", yes: 0.71 },
      { day: "Apr 7", yes: 0.73 }, { day: "Apr 10", yes: 0.73 },
    ],
  },
  {
    id: 6,
    question: "Will a majority say they've used a chatbot for medical advice?",
    category: "Health",
    threshold: 600000,
    poolSize: 98200,
    yesOdds: 0.41,
    totalBets: 389,
    createdAt: "2026-04-08",
    deadline: "2026-07-01",
    surveyFirm: "Gallup",
    trending: false,
    hot: false,
    history: [
      { day: "Apr 8", yes: 0.38 }, { day: "Apr 10", yes: 0.40 }, { day: "Apr 12", yes: 0.41 },
    ],
  },
  {
    id: 7,
    question: "Do most sports fans believe esports should be in the Olympics?",
    category: "Sports",
    threshold: 250000,
    poolSize: 241300,
    yesOdds: 0.56,
    totalBets: 978,
    createdAt: "2026-03-10",
    deadline: "2026-04-25",
    surveyFirm: "Ipsos",
    trending: false,
    hot: false,
    status: "funded",
    history: [
      { day: "Mar 10", yes: 0.50 }, { day: "Mar 14", yes: 0.52 }, { day: "Mar 18", yes: 0.53 },
      { day: "Mar 22", yes: 0.55 }, { day: "Mar 26", yes: 0.54 }, { day: "Mar 30", yes: 0.55 },
      { day: "Apr 3", yes: 0.56 }, { day: "Apr 7", yes: 0.56 },
    ],
  },
  {
    id: 8,
    question: "Will over 70% of parents say social media harms children?",
    category: "Culture",
    threshold: 500000,
    poolSize: 467800,
    yesOdds: 0.82,
    totalBets: 2103,
    createdAt: "2026-03-05",
    deadline: "2026-04-20",
    surveyFirm: "Pew Research",
    trending: true,
    hot: true,
    history: [
      { day: "Mar 5", yes: 0.75 }, { day: "Mar 9", yes: 0.77 }, { day: "Mar 13", yes: 0.78 },
      { day: "Mar 17", yes: 0.79 }, { day: "Mar 21", yes: 0.80 }, { day: "Mar 25", yes: 0.81 },
      { day: "Mar 29", yes: 0.81 }, { day: "Apr 2", yes: 0.82 },
    ],
  },
];

const COMPLETED_SURVEYS = [
  {
    id: 101,
    question: "Did a majority of Americans approve of the 2025 infrastructure bill?",
    category: "Politics",
    result: "YES — 58%",
    won: "yes",
    poolSize: 1200000,
    surveyFirm: "Gallup",
    completedAt: "2026-02-15",
  },
  {
    id: 102,
    question: "Did over 50% of EU citizens say they reduced meat consumption in 2025?",
    category: "Health",
    result: "NO — 43%",
    won: "no",
    poolSize: 800000,
    surveyFirm: "YouGov",
    completedAt: "2026-03-01",
  },
];

const USER_POSITIONS = [
  { surveyId: 1, side: "no", amount: 500, odds: 0.38, currentOdds: 0.34 },
  { surveyId: 2, side: "yes", amount: 1200, odds: 0.57, currentOdds: 0.62 },
  { surveyId: 5, side: "yes", amount: 300, odds: 0.68, currentOdds: 0.73 },
  { surveyId: 8, side: "yes", amount: 800, odds: 0.79, currentOdds: 0.82 },
];

// ─── Utility Functions ───────────────────────────────────────────────────────

const fmt = (n) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
};

const pct = (n) => `${(n * 100).toFixed(0)}%`;

const daysLeft = (deadline) => {
  const diff = new Date(deadline) - new Date("2026-04-12");
  return Math.max(0, Math.ceil(diff / 86400000));
};

const progressPct = (pool, threshold) => Math.min(100, (pool / threshold) * 100);

// ─── Shared Components ───────────────────────────────────────────────────────

const Badge = ({ children, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    green: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/15 text-red-400 border-red-500/20",
    yellow: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    gray: "bg-gray-500/15 text-gray-400 border-gray-500/20",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};

const ProgressBar = ({ value, max, size = "md" }) => {
  const p = Math.min(100, (value / max) * 100);
  const h = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";
  return (
    <div className={`w-full bg-gray-800 rounded-full ${h} overflow-hidden`}>
      <div
        className={`${h} rounded-full transition-all duration-700 ${
          p >= 100 ? "bg-emerald-500" : p > 60 ? "bg-blue-500" : "bg-blue-600"
        }`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
};

const OddsDisplay = ({ yes, size = "md" }) => {
  const no = 1 - yes;
  const textSize = size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-emerald-500" />
        <span className={`${textSize} font-bold text-emerald-400`}>Yes {pct(yes)}</span>
      </div>
      <div className="w-px h-5 bg-gray-700" />
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <span className={`${textSize} font-bold text-red-400`}>No {pct(no)}</span>
      </div>
    </div>
  );
};

const MiniChart = ({ data, color = "#10b981", height = 40 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="yes" stroke={color} fill={`url(#g-${color})`} strokeWidth={2} dot={false} />
    </AreaChart>
  </ResponsiveContainer>
);

// ─── Navigation ──────────────────────────────────────────────────────────────

const Nav = ({ page, setPage, wallet }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { id: "home", label: "Home", icon: Home },
    { id: "market", label: "Markets", icon: BarChart3 },
    { id: "create", label: "Create", icon: Plus },
    { id: "wallet", label: "Portfolio", icon: Wallet },
  ];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage("home")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">SurveyBet</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => setPage(l.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  page === l.id
                    ? "bg-blue-500/15 text-blue-400"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-1.5 border border-gray-700/50">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">{fmt(wallet)}</span>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all">
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          </div>
          <button className="md:hidden text-gray-400" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-gray-950 border-t border-gray-800 px-4 py-3 space-y-1">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => { setPage(l.id); setMobileOpen(false); }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium ${
                page === l.id ? "bg-blue-500/15 text-blue-400" : "text-gray-400"
              }`}
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </button>
          ))}
          <div className="pt-2 border-t border-gray-800 mt-2">
            <div className="flex items-center gap-2 text-emerald-400 px-3 py-2">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-semibold">{fmt(wallet)}</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

// ─── Survey Card ─────────────────────────────────────────────────────────────

const SurveyCard = ({ survey, onClick }) => {
  const funded = survey.status === "funded" || survey.poolSize >= survey.threshold;
  const dl = daysLeft(survey.deadline);
  return (
    <div
      onClick={onClick}
      className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-5 cursor-pointer hover:border-gray-700/50 hover:bg-gray-900/80 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex gap-2 flex-wrap">
          <Badge color="purple">{survey.category}</Badge>
          {funded && <Badge color="green">Funded</Badge>}
          {survey.hot && <Badge color="red">Hot</Badge>}
        </div>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {dl}d left
        </span>
      </div>
      <h3 className="text-white font-semibold text-sm leading-snug mb-4 group-hover:text-blue-300 transition-colors">
        {survey.question}
      </h3>
      <div className="mb-3">
        <MiniChart data={survey.history} color={survey.yesOdds > 0.5 ? "#10b981" : "#ef4444"} />
      </div>
      <OddsDisplay yes={survey.yesOdds} size="md" />
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Pool: {fmt(survey.poolSize)}</span>
          <span>Goal: {fmt(survey.threshold)}</span>
        </div>
        <ProgressBar value={survey.poolSize} max={survey.threshold} size="sm" />
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800/50">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Users className="w-3 h-3" /> {survey.totalBets.toLocaleString()} bets
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Shield className="w-3 h-3" /> {survey.surveyFirm}
        </div>
      </div>
    </div>
  );
};

// ─── Home Page ───────────────────────────────────────────────────────────────

const HomePage = ({ setPage, setSelectedSurvey }) => {
  const stats = [
    { label: "Total Pool Value", value: "$4.2M", icon: DollarSign, color: "text-emerald-400" },
    { label: "Active Surveys", value: "8", icon: BarChart3, color: "text-blue-400" },
    { label: "Total Bettors", value: "11.4K", icon: Users, color: "text-purple-400" },
    { label: "Surveys Completed", value: "2", icon: CheckCircle, color: "text-amber-400" },
  ];
  const steps = [
    { icon: Globe, title: "A Question is Asked", desc: "Anyone can propose a yes/no public opinion question — like a prediction market, but for what people actually think." },
    { icon: DollarSign, title: "The Crowd Bets", desc: "Users bet on what they believe the survey majority will say. Money flows in, odds shift in real time, a market forms." },
    { icon: Target, title: "Threshold is Reached", desc: "Once the pool hits its funding goal, the money pays for a real, statistically rigorous survey by a professional polling firm." },
    { icon: Award, title: "Truth Settles the Market", desc: "The survey results come in. Winners are paid out. No opinions — just data." },
  ];
  const hotSurveys = SURVEY_DATA.filter((s) => s.hot);
  return (
    <div>
      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-purple-600/5 to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">Prediction Markets Meet Real Surveys</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight mb-6">
            Bet on What People
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Actually Think</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Fund real public opinion surveys by betting on their outcomes. When the pool hits its goal, a professional firm
            runs the survey. Truth pays.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setPage("market")}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all shadow-lg shadow-blue-600/20"
            >
              Explore Markets <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage("create")}
              className="inline-flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all border border-gray-700"
            >
              Create a Survey <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 -mt-4 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 text-center">
              <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Hot Markets */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Trending Markets</h2>
          <button onClick={() => setPage("market")} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotSurveys.map((s) => (
            <SurveyCard key={s.id} survey={s} onClick={() => { setSelectedSurvey(s); setPage("detail"); }} />
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-12">How It Works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="relative">
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 h-full">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4">
                  <s.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-xs text-gray-600 font-mono mb-2">STEP {i + 1}</div>
                <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Completed */}
      <section className="max-w-5xl mx-auto px-4 mb-20">
        <h2 className="text-2xl font-bold text-white mb-6">Recently Resolved</h2>
        <div className="space-y-3">
          {COMPLETED_SURVEYS.map((s) => (
            <div key={s.id} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex gap-2 mb-2">
                  <Badge color="gray">{s.category}</Badge>
                  <Badge color={s.won === "yes" ? "green" : "red"}>{s.result}</Badge>
                </div>
                <p className="text-white text-sm font-medium">{s.question}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">{fmt(s.poolSize)}</div>
                <div className="text-xs text-gray-500">Total Pool · {s.surveyFirm}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 mb-20">
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Have a Question the World Should Answer?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Create a survey market, set a funding goal, and let the crowd decide if it's worth knowing.
          </p>
          <button
            onClick={() => setPage("create")}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl text-base font-semibold transition-all"
          >
            Create Your Survey <Plus className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

// ─── Market Page ─────────────────────────────────────────────────────────────

const MarketPage = ({ setPage, setSelectedSurvey }) => {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("pool");

  const filtered = useMemo(() => {
    let list = SURVEY_DATA.filter((s) => {
      if (cat !== "All" && s.category !== cat) return false;
      if (search && !s.question.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    if (sort === "pool") list.sort((a, b) => b.poolSize - a.poolSize);
    if (sort === "bets") list.sort((a, b) => b.totalBets - a.totalBets);
    if (sort === "deadline") list.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    if (sort === "new") list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [cat, search, sort]);

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Survey Markets</h1>
        <p className="text-gray-400">Bet on what people think. Fund real answers.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search surveys..."
            className="w-full bg-gray-900/50 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
        >
          <option value="pool">Sort by Pool Size</option>
          <option value="bets">Sort by Activity</option>
          <option value="deadline">Sort by Deadline</option>
          <option value="new">Sort by Newest</option>
        </select>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              cat === c
                ? "bg-blue-600 text-white"
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-700/50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <SurveyCard key={s.id} survey={s} onClick={() => { setSelectedSurvey(s); setPage("detail"); }} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No surveys match your filters.</p>
        </div>
      )}
    </div>
  );
};

// ─── Survey Detail Page ──────────────────────────────────────────────────────

const DetailPage = ({ survey, setPage, onBet }) => {
  const [side, setSide] = useState("yes");
  const [amount, setAmount] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  if (!survey) return null;
  const funded = survey.status === "funded" || survey.poolSize >= survey.threshold;
  const dl = daysLeft(survey.deadline);
  const payout = amount
    ? side === "yes"
      ? (parseFloat(amount) / survey.yesOdds).toFixed(2)
      : (parseFloat(amount) / (1 - survey.yesOdds)).toFixed(2)
    : "0.00";

  const handleBet = () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setShowConfirm(true);
  };

  const confirmBet = () => {
    onBet(survey.id, side, parseFloat(amount));
    setShowConfirm(false);
    setAmount("");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
      <button onClick={() => setPage("market")} className="text-sm text-gray-500 hover:text-white mb-6 flex items-center gap-1">
        ← Back to Markets
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6">
            <div className="flex gap-2 flex-wrap mb-4">
              <Badge color="purple">{survey.category}</Badge>
              {funded && <Badge color="green">Funded — Survey Pending</Badge>}
              {survey.hot && <Badge color="red">Hot</Badge>}
              <Badge color="gray">{survey.surveyFirm}</Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-6 leading-snug">
              {survey.question}
            </h1>
            <OddsDisplay yes={survey.yesOdds} size="lg" />
          </div>

          {/* Chart */}
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">YES Price History</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={survey.history}>
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 1]}
                  tickFormatter={(v) => pct(v)}
                />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px" }}
                  labelStyle={{ color: "#9ca3af" }}
                  formatter={(v) => [pct(v), "YES"]}
                />
                <Area type="monotone" dataKey="yes" stroke="#3b82f6" fill="url(#chartGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Pool Size", value: fmt(survey.poolSize), icon: DollarSign },
              { label: "Goal", value: fmt(survey.threshold), icon: Target },
              { label: "Total Bets", value: survey.totalBets.toLocaleString(), icon: Users },
              { label: "Days Left", value: `${dl}`, icon: Clock },
            ].map((item) => (
              <div key={item.label} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
                <item.icon className="w-4 h-4 text-gray-500 mb-2" />
                <div className="text-lg font-bold text-white">{item.value}</div>
                <div className="text-xs text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Funding Progress */}
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-400">Funding Progress</h3>
              <span className="text-sm font-bold text-white">{progressPct(survey.poolSize, survey.threshold).toFixed(1)}%</span>
            </div>
            <ProgressBar value={survey.poolSize} max={survey.threshold} size="lg" />
            <p className="text-xs text-gray-500 mt-3">
              {funded
                ? `Fully funded! ${survey.surveyFirm} will conduct the survey.`
                : `${fmt(survey.threshold - survey.poolSize)} more needed to trigger the ${survey.surveyFirm} survey.`}
            </p>
          </div>
        </div>

        {/* Betting Panel */}
        <div className="space-y-4">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 sticky top-20">
            <h3 className="text-lg font-bold text-white mb-4">Place Your Bet</h3>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                onClick={() => setSide("yes")}
                className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                  side === "yes"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                YES {pct(survey.yesOdds)}
              </button>
              <button
                onClick={() => setSide("no")}
                className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                  side === "no"
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                NO {pct(1 - survey.yesOdds)}
              </button>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1.5 block">Amount ($)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-lg font-semibold focus:outline-none focus:border-blue-500/50"
              />
              <div className="flex gap-2 mt-2">
                {[10, 50, 100, 500].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 text-xs py-1.5 rounded-lg border border-gray-700/50"
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Your bet</span>
                <span className="text-white font-medium">{side.toUpperCase()} · ${amount || "0"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Odds</span>
                <span className="text-white font-medium">{side === "yes" ? pct(survey.yesOdds) : pct(1 - survey.yesOdds)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-700/50 pt-2">
                <span className="text-gray-400">Potential payout</span>
                <span className="text-emerald-400 font-bold">${payout}</span>
              </div>
            </div>
            <button
              onClick={handleBet}
              disabled={!amount || parseFloat(amount) <= 0}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
                amount && parseFloat(amount) > 0
                  ? side === "yes"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                    : "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed"
              }`}
            >
              {amount ? `Bet $${amount} on ${side.toUpperCase()}` : "Enter an amount"}
            </button>
            <p className="text-xs text-gray-600 text-center mt-3">
              Payout depends on final odds at survey close.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-2">Confirm Bet</h3>
            <p className="text-sm text-gray-400 mb-5">
              You're betting <span className="text-white font-semibold">${amount}</span> on{" "}
              <span className={side === "yes" ? "text-emerald-400" : "text-red-400"}>{side.toUpperCase()}</span> for:
            </p>
            <p className="text-sm text-white font-medium bg-gray-800 rounded-xl p-3 mb-5">{survey.question}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmBet}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white ${
                  side === "yes" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
                }`}
              >
                Confirm Bet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Create Survey Page ──────────────────────────────────────────────────────

const CreatePage = ({ setPage }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    question: "",
    category: "Politics",
    threshold: 100000,
    deadline: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const thresholds = [
    { value: 50000, label: "$50K", desc: "Quick poll (~1,000 respondents)" },
    { value: 100000, label: "$100K", desc: "Standard survey (~5,000 respondents)" },
    { value: 500000, label: "$500K", desc: "Large-scale (~25,000 respondents)" },
    { value: 1000000, label: "$1M", desc: "National study (~50,000+ respondents)" },
  ];

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-32 pb-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">Survey Market Created!</h2>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          Your survey is now live. As bets come in and the pool grows, you'll reach the funding threshold and trigger a real survey.
        </p>
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 text-left mb-8">
          <p className="text-sm text-gray-500 mb-1">Your Question</p>
          <p className="text-white font-medium">{form.question}</p>
          <div className="flex gap-4 mt-3 text-sm text-gray-400">
            <span>{form.category}</span>
            <span>Goal: {fmt(form.threshold)}</span>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setPage("market")} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
            View Markets
          </button>
          <button onClick={() => { setSubmitted(false); setStep(1); setForm({ question: "", category: "Politics", threshold: 100000, deadline: "", description: "" }); }}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium border border-gray-700">
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
      <h1 className="text-3xl font-bold text-white mb-2">Create a Survey Market</h1>
      <p className="text-gray-400 mb-8">Pose a question, set a funding goal, and let the market decide.</p>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step >= s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-500"
            }`}>{s}</div>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-blue-600" : "bg-gray-800"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Your Question</label>
            <p className="text-xs text-gray-500 mb-2">Must be answerable as a yes/no majority question.</p>
            <textarea
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder='e.g. "Do a majority of Americans support universal basic income?"'
              className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 min-h-24 resize-none"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, category: c })}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    form.category === c
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800/50 text-gray-400 hover:bg-gray-800 border border-gray-700/50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add context, links to relevant news, or why this question matters..."
              className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
              rows={3}
            />
          </div>
          <button
            onClick={() => form.question.length > 10 && setStep(2)}
            disabled={form.question.length <= 10}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
              form.question.length > 10
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            Continue →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-3 block">Funding Threshold</label>
            <p className="text-xs text-gray-500 mb-4">
              How much money needs to be in the pool before a professional survey firm is hired?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {thresholds.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm({ ...form, threshold: t.value })}
                  className={`p-4 rounded-xl text-left transition-all border ${
                    form.threshold === t.value
                      ? "bg-blue-600/15 border-blue-500/50 text-white"
                      : "bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-700"
                  }`}
                >
                  <div className="text-lg font-bold">{t.label}</div>
                  <div className="text-xs mt-1 opacity-75">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="w-full bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl text-sm font-medium">
              ← Back
            </button>
            <button onClick={() => setStep(3)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-semibold">
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white">Review Your Survey</h3>
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Question</p>
              <p className="text-white font-medium">{form.question}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Category</p>
                <p className="text-white">{form.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Funding Goal</p>
                <p className="text-white">{fmt(form.threshold)}</p>
              </div>
            </div>
            {form.deadline && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Deadline</p>
                <p className="text-white">{form.deadline}</p>
              </div>
            )}
            {form.description && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-300">{form.description}</p>
              </div>
            )}
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                Once created, your survey market will be live. A professional survey firm will be assigned once funding is reached.
                The platform takes a 3% fee from the final pool.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl text-sm font-medium">
              ← Back
            </button>
            <button onClick={() => setSubmitted(true)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-semibold">
              Launch Survey Market
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Wallet / Portfolio Page ─────────────────────────────────────────────────

const WalletPage = ({ wallet, setPage, setSelectedSurvey }) => {
  const positions = USER_POSITIONS.map((p) => {
    const survey = SURVEY_DATA.find((s) => s.id === p.surveyId);
    const currentValue = p.side === "yes"
      ? (p.amount / p.odds) * p.currentOdds
      : (p.amount / (1 - p.odds)) * (1 - p.currentOdds);
    const pnl = currentValue - p.amount;
    return { ...p, survey, currentValue, pnl };
  });

  const totalInvested = positions.reduce((s, p) => s + p.amount, 0);
  const totalValue = positions.reduce((s, p) => s + p.currentValue, 0);
  const totalPnl = totalValue - totalInvested;

  const pieData = positions.map((p) => ({
    name: p.survey?.question?.slice(0, 30) + "...",
    value: p.currentValue,
  }));
  const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];

  return (
    <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
      <h1 className="text-3xl font-bold text-white mb-8">Your Portfolio</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
          <Wallet className="w-4 h-4 text-gray-500 mb-2" />
          <div className="text-xl font-bold text-white">{fmt(wallet)}</div>
          <div className="text-xs text-gray-500">Available Balance</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
          <BarChart3 className="w-4 h-4 text-gray-500 mb-2" />
          <div className="text-xl font-bold text-white">${totalValue.toFixed(0)}</div>
          <div className="text-xs text-gray-500">Position Value</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
          <DollarSign className="w-4 h-4 text-gray-500 mb-2" />
          <div className="text-xl font-bold text-white">${totalInvested}</div>
          <div className="text-xs text-gray-500">Total Invested</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4">
          {totalPnl >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-400 mb-2" /> : <TrendingDown className="w-4 h-4 text-red-400 mb-2" />}
          <div className={`text-xl font-bold ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500">Unrealized P&L</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Positions */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold text-white mb-3">Active Positions</h2>
          {positions.map((p) => (
            <div
              key={p.surveyId}
              onClick={() => { setSelectedSurvey(p.survey); setPage("detail"); }}
              className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 cursor-pointer hover:border-gray-700/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-4">
                  <p className="text-sm text-white font-medium leading-snug">{p.survey?.question}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge color={p.side === "yes" ? "green" : "red"}>
                      {p.side.toUpperCase()} @ {pct(p.side === "yes" ? p.odds : 1 - p.odds)}
                    </Badge>
                    <Badge color="gray">{p.survey?.category}</Badge>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-white">${p.currentValue.toFixed(0)}</div>
                  <div className={`text-sm font-medium ${p.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(0)} ({((p.pnl / p.amount) * 100).toFixed(1)}%)
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Invested: ${p.amount}</span>
                <span>Current odds: {pct(p.survey?.yesOdds)} YES</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pie Chart */}
        <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Allocation</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v) => [`$${v.toFixed(0)}`, "Value"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-gray-400 truncate">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completed */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white mb-4">Completed Surveys</h2>
        <div className="space-y-3">
          {COMPLETED_SURVEYS.map((s) => (
            <div key={s.id} className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex gap-2 mb-2">
                  <Badge color={s.won === "yes" ? "green" : "red"}>{s.result}</Badge>
                  <Badge color="gray">{s.surveyFirm}</Badge>
                </div>
                <p className="text-sm text-white font-medium">{s.question}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-400">+$240</div>
                <div className="text-xs text-gray-500">Completed {s.completedAt}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── App Root ────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("home");
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [wallet, setWallet] = useState(5000);
  const [toast, setToast] = useState(null);

  const handleBet = (surveyId, side, amount) => {
    if (amount > wallet) {
      setToast({ msg: "Insufficient balance!", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setWallet((w) => w - amount);
    setToast({ msg: `Bet $${amount} on ${side.toUpperCase()} placed!`, type: "success" });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav page={page} setPage={setPage} wallet={wallet} />

      {page === "home" && <HomePage setPage={setPage} setSelectedSurvey={setSelectedSurvey} />}
      {page === "market" && <MarketPage setPage={setPage} setSelectedSurvey={setSelectedSurvey} />}
      {page === "detail" && <DetailPage survey={selectedSurvey} setPage={setPage} onBet={handleBet} />}
      {page === "create" && <CreatePage setPage={setPage} />}
      {page === "wallet" && <WalletPage wallet={wallet} setPage={setPage} setSelectedSurvey={setSelectedSurvey} />}

      {/* Footer */}
      <footer className="border-t border-gray-800/50 mt-20 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Target className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-400">SurveyBet</span>
          </div>
          <p className="text-xs text-gray-600">Fund real surveys. Bet on real opinions. Get real answers.</p>
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl animate-bounce ${
          toast.type === "success"
            ? "bg-emerald-600 text-white"
            : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
