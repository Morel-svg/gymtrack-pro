import { useState, useEffect, useMemo, useRef } from "react";
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

/* ─── FONTS ──────────────────────────────────────────────────────────────── */
const fl = document.createElement("link");
fl.rel = "stylesheet";
fl.href = "https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Martian+Mono:wght@300;400;500&display=swap";
document.head.appendChild(fl);

/* ─── GLOBAL CSS ─────────────────────────────────────────────────────────── */
const css = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg:      #111214;
  --surface: #1a1c20;
  --surface2:#1f2127;
  --border:  #2a2d35;
  --border2: #32363f;
  --t1: #f0f1f3;
  --t2: #9199a8;
  --t3: #545c6b;
  --t4: #363c47;

  /* only pops of color — used sparingly */
  --green:   #4ade80;
  --red:     #f87171;
  --amber:   #f59e0b;
  --orange:  #f97316;
  --blue:    #60a5fa;
  --teal:    #2dd4bf;

  --src-orange: #f97316;
  --src-wave:   #60a5fa;
  --src-cash:   #4ade80;

  --font-ui:   'Syne', sans-serif;
  --font-data: 'Martian Mono', monospace;
}
html, body, #root { height: 100%; background: var(--bg); color: var(--t1); }
input, select, button { font-family: var(--font-ui); color: var(--t1); }
select option { background: var(--surface2); }
input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.4); cursor: pointer; }

@keyframes fadeUp {
  from { opacity:0; transform:translateY(10px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes overlayIn { from{opacity:0} to{opacity:1} }
@keyframes modalIn {
  from { opacity:0; transform:scale(0.97) translateY(8px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
}
@keyframes pulseDot {
  0%,100% { opacity:1; }
  50% { opacity:0.35; }
}

.fu  { animation: fadeUp .35s ease both; }
.fu1 { animation: fadeUp .35s .04s ease both; }
.fu2 { animation: fadeUp .35s .08s ease both; }
.fu3 { animation: fadeUp .35s .12s ease both; }
.fu4 { animation: fadeUp .35s .16s ease both; }
.fu5 { animation: fadeUp .35s .20s ease both; }
.fu6 { animation: fadeUp .35s .24s ease both; }

.card { transition: border-color .18s; }
.card:hover { border-color: var(--border2) !important; }
.txrow { transition: background .14s; }
.txrow:hover { background: var(--surface2) !important; }
.navlink { transition: background .14s, color .14s; cursor:pointer; }
.navlink:hover { background: var(--surface2) !important; }
.ibtn { transition: background .14s, border-color .14s; }
.ibtn:hover { background: var(--surface2) !important; border-color: var(--border2) !important; }
.pbtn { transition: opacity .14s, transform .1s; }
.pbtn:hover { opacity: .85; }
.pbtn:active { transform: scale(.97); }
.mi:hover { background: var(--surface2) !important; }

input:focus, select:focus { outline:none; border-color: var(--border2) !important; }
::-webkit-scrollbar { width:4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius:2px; }
`;
const se = document.createElement("style");
se.textContent = css;
document.head.appendChild(se);

/* ─── CONSTANTS ─────────────────────────────────────────────────────────── */
const INCOME_CATS  = ["session","sessionCoaching","monthlySubscription","weeklySubscription","equipment","others"];
const EXPENSE_CATS = ["rent","salaries","equipmentExp","maintenance","marketing","others"];
const SOURCES      = ["orangeMoney","wave","cash"];
const SRC_COLOR    = { orangeMoney:"#f97316", wave:"#60a5fa", cash:"#4ade80" };

/* chart palette: muted, cohesive — not rainbow */
const CHART_COLORS = ["#60a5fa","#94a3b8","#4ade80","#f59e0b","#c084fc","#f97316","#2dd4bf","#a3a3a3"];

function uid() { return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function fmt(n) { return new Intl.NumberFormat("fr-FR").format(Math.round(n))+" FCFA"; }
function fmtS(n){ if(n>=1e6)return(n/1e6).toFixed(1)+"M"; if(n>=1e3)return(n/1e3).toFixed(0)+"k"; return String(Math.round(n)); }

/* ─── I18N ───────────────────────────────────────────────────────────────── */
const T = {
  en:{
    appName:"New Gym", tagline:"Income Dashboard",
    addIncome:"+ Add Income", addExpense:"+ Add Expense", synced:"Synced",
    totalIncome:"Total Income", totalExpenses:"Total Expenses", netProfit:"Net Profit",
    avgTransaction:"Avg Transaction", thisWeek:"This Week", thisMonth:"This Month",
    allTime:"All time", perTx:"Per transaction", last7:"Last 7 days", curMonth:"Current month",
    transactions:"Transactions", analytics:"Analytics",
    ledger:"Recent Transactions",
    search:"Search transactions...", allCats:"All Categories", allSrcs:"All Sources", allTypes:"All Types",
    income:"Income", expense:"Expense",
    desc:"Description", cat:"Category", date:"Date", src:"Source", amount:"Amount", status:"Status",
    settled:"completed", pending:"pending",
    insights:"Quick Insights", topCat:"Top Category", totalTx:"Total Transactions", sources:"Payment Sources",
    add:"Add Transaction", edit:"Edit Transaction", cancel:"Cancel", save:"Save Changes",
    delQ:"Are you sure you want to delete this transaction?",
    del:"Delete", confirmDel:"Confirm Delete",
    recurring:"Recurring", freq:"Frequency", monthly:"Monthly", weekly:"Weekly",
    session:"Session", sessionCoaching:"Session + Coaching",
    monthlySubscription:"Monthly Subscription", weeklySubscription:"Weekly Subscription",
    equipment:"Equipment / Shop", others:"Others",
    rent:"Rent & Utilities", salaries:"Staff Salaries",
    equipmentExp:"Equipment Purchase", maintenance:"Maintenance", marketing:"Marketing",
    orangeMoney:"Orange Money", wave:"Wave", cash:"Manual",
    incByCat:"Income by Category", expByCat:"Expense by Category",
    incBySrc:"Income by Source", trend:"Monthly Income Trend", catPerf:"Category Performance",
    noData:"No data yet", noTx:"No transactions found",
    export:"Export", filters:"Filters", from:"From", to:"To", vsLast:"vs last month",
  },
  fr:{
    appName:"New Gym", tagline:"Tableau de Bord",
    addIncome:"+ Revenu", addExpense:"+ Dépense", synced:"Synchronisé",
    totalIncome:"Revenus Totaux", totalExpenses:"Dépenses Totales", netProfit:"Bénéfice Net",
    avgTransaction:"Moy. Transaction", thisWeek:"Cette Semaine", thisMonth:"Ce Mois",
    allTime:"Depuis toujours", perTx:"Par transaction", last7:"7 derniers jours", curMonth:"Mois en cours",
    transactions:"Transactions", analytics:"Analytiques",
    ledger:"Transactions Récentes",
    search:"Rechercher...", allCats:"Toutes Catégories", allSrcs:"Toutes Sources", allTypes:"Tous Types",
    income:"Revenu", expense:"Dépense",
    desc:"Description", cat:"Catégorie", date:"Date", src:"Source", amount:"Montant", status:"Statut",
    settled:"complété", pending:"en attente",
    insights:"Aperçu Rapide", topCat:"Top Catégorie", totalTx:"Total Transactions", sources:"Sources de Paiement",
    add:"Ajouter", edit:"Modifier", cancel:"Annuler", save:"Sauvegarder",
    delQ:"Voulez-vous supprimer cette transaction ?",
    del:"Supprimer", confirmDel:"Confirmer Suppression",
    recurring:"Récurrent", freq:"Fréquence", monthly:"Mensuel", weekly:"Hebdomadaire",
    session:"Séance", sessionCoaching:"Séance + Coaching",
    monthlySubscription:"Abonnement Mensuel", weeklySubscription:"Abonnement Hebdo.",
    equipment:"Équipement / Boutique", others:"Autres",
    rent:"Loyer & Charges", salaries:"Salaires",
    equipmentExp:"Achat Équipement", maintenance:"Maintenance", marketing:"Marketing",
    orangeMoney:"Orange Money", wave:"Wave", cash:"Manuel",
    incByCat:"Revenus par Catégorie", expByCat:"Dépenses par Catégorie",
    incBySrc:"Revenus par Source", trend:"Tendance Mensuelle", catPerf:"Performance Catégories",
    noData:"Aucune donnée", noTx:"Aucune transaction",
    export:"Exporter", filters:"Filtres", from:"Du", to:"Au", vsLast:"vs mois dernier",
  }
};

const SEED = [
  {id:uid(),type:"income", amount:200000,date:"2026-03-11",description:"Abonnement + Box",        category:"monthlySubscription",source:"orangeMoney",status:"settled", isRecurring:true, recurringFrequency:"monthly",createdAt:"2026-03-11"},
  {id:uid(),type:"income", amount:150000,date:"2026-03-11",description:"Abonnement avec coaching", category:"sessionCoaching",    source:"wave",       status:"settled", isRecurring:false,recurringFrequency:null,   createdAt:"2026-03-11"},
  {id:uid(),type:"income", amount:50000, date:"2026-03-11",description:"Séance découverte",         category:"session",            source:"cash",       status:"settled", isRecurring:false,recurringFrequency:null,   createdAt:"2026-03-11"},
  {id:uid(),type:"expense",amount:80000, date:"2026-03-10",description:"Loyer salle mars",          category:"rent",               source:"wave",       status:"settled", isRecurring:true, recurringFrequency:"monthly",createdAt:"2026-03-10"},
  {id:uid(),type:"expense",amount:45000, date:"2026-03-09",description:"Salaire coach",             category:"salaries",           source:"orangeMoney",status:"settled", isRecurring:false,recurringFrequency:null,   createdAt:"2026-03-09"},
];

/* ══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [lang, setLang] = useState("fr");
  const t = T[lang];

  const [txs, setTxs] = useState(() => {
    try { const s = localStorage.getItem("gt3"); return s ? JSON.parse(s) : SEED; } catch { return SEED; }
  });
  useEffect(() => { try { localStorage.setItem("gt3", JSON.stringify(txs)); } catch {} }, [txs]);

  const [tab, setTab]             = useState("transactions");
  const [modal, setModal]         = useState(null);
  const [delId, setDelId]         = useState(null);
  const [search, setSearch]       = useState("");
  const [fCat, setFCat]           = useState("");
  const [fSrc, setFSrc]           = useState("");
  const [fType, setFType]         = useState("");
  const [fFrom, setFFrom]         = useState("");
  const [fTo, setFTo]             = useState("");
  const [sort, setSort]           = useState("date");
  const [dir, setDir]             = useState("desc");
  const [showF, setShowF]         = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const w7 = new Date(now); w7.setDate(w7.getDate()-7);
    const m0 = new Date(now.getFullYear(), now.getMonth(), 1);
    const pm0= new Date(now.getFullYear(), now.getMonth()-1, 1);
    const pm1= new Date(now.getFullYear(), now.getMonth(), 0);
    const inc = txs.filter(x => x.type==="income");
    const exp = txs.filter(x => x.type==="expense");
    const totInc = inc.reduce((s,x)=>s+x.amount,0);
    const totExp = exp.reduce((s,x)=>s+x.amount,0);
    const wkInc  = inc.filter(x=>new Date(x.date)>=w7).reduce((s,x)=>s+x.amount,0);
    const mthInc = inc.filter(x=>new Date(x.date)>=m0).reduce((s,x)=>s+x.amount,0);
    const pmInc  = inc.filter(x=>{const d=new Date(x.date);return d>=pm0&&d<=pm1;}).reduce((s,x)=>s+x.amount,0);
    const growth = pmInc===0?null:((mthInc-pmInc)/pmInc*100).toFixed(1);
    const wkTx   = txs.filter(x=>new Date(x.date)>=w7).length;
    const mthTx  = txs.filter(x=>new Date(x.date)>=m0).length;
    const avg    = inc.length>0 ? totInc/inc.length : 0;
    const catMap={}, srcMap={}, eCatMap={};
    inc.forEach(x=>{ catMap[x.category]=(catMap[x.category]||0)+x.amount; });
    inc.forEach(x=>{ srcMap[x.source] =(srcMap[x.source] ||0)+x.amount; });
    exp.forEach(x=>{ eCatMap[x.category]=(eCatMap[x.category]||0)+x.amount; });
    const topCat = Object.entries(catMap).sort((a,b)=>b[1]-a[1])[0];
    return { totInc,totExp,net:totInc-totExp,avg,wkInc,mthInc,wkTx,mthTx,growth,catMap,topCat,srcMap,eCatMap };
  }, [txs]);

  const trend = useMemo(() => {
    const m={};
    txs.forEach(x=>{
      const d=new Date(x.date);
      const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      if(!m[k])m[k]={inc:0,exp:0};
      x.type==="income" ? m[k].inc+=x.amount : m[k].exp+=x.amount;
    });
    return Object.entries(m).sort().slice(-8).map(([k,v])=>({l:k.slice(5)+"/"+k.slice(2,4),inc:v.inc,exp:v.exp}));
  }, [txs]);

  const filtered = useMemo(() => {
    let a=[...txs];
    if(search) a=a.filter(x=>x.description.toLowerCase().includes(search.toLowerCase()));
    if(fCat)   a=a.filter(x=>x.category===fCat);
    if(fSrc)   a=a.filter(x=>x.source===fSrc);
    if(fType)  a=a.filter(x=>x.type===fType);
    if(fFrom)  a=a.filter(x=>x.date>=fFrom);
    if(fTo)    a=a.filter(x=>x.date<=fTo);
    a.sort((a,b)=>{
      let va=a[sort],vb=b[sort];
      if(sort==="amount"){va=+va;vb=+vb;}
      if(va<vb)return dir==="asc"?-1:1;
      if(va>vb)return dir==="asc"?1:-1;
      return 0;
    });
    return a;
  }, [txs,search,fCat,fSrc,fType,fFrom,fTo,sort,dir]);

  const doSort = col => {
    if(sort===col) setDir(d=>d==="asc"?"desc":"asc");
    else { setSort(col); setDir("desc"); }
  };
  const saveTx = data => {
    if(modal.mode==="edit") setTxs(p=>p.map(x=>x.id===data.id?data:x));
    else setTxs(p=>[{...data,id:uid(),createdAt:new Date().toISOString().slice(0,10)},...p]);
    setModal(null);
  };
  const doExport = () => {
    const h=["type","amount","date","description","category","source","status"];
    const b=new Blob([h.join(",")+"\n"+filtered.map(x=>h.map(k=>x[k]).join(",")).join("\n")],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="gymtrack.csv";a.click();
  };

  const allCats = fType==="expense" ? EXPENSE_CATS : fType==="income" ? INCOME_CATS : [...INCOME_CATS,...EXPENSE_CATS];

  /* ── shared input style ── */
  const IS = {background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 11px",color:"var(--t1)",fontSize:13,fontFamily:"var(--font-ui)",width:"100%",boxSizing:"border-box"};
  const LS = {display:"block",fontFamily:"var(--font-data)",fontSize:10,color:"var(--t3)",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:5};

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",fontFamily:"var(--font-ui)",background:"var(--bg)"}}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{width:200,background:"var(--surface)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",flexShrink:0}}>
        {/* Logo */}
        <div style={{padding:"16px 16px 12px",borderBottom:"1px solid var(--border)"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:7,background:"var(--surface2)",border:"1px solid var(--border2)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--font-data)",fontSize:11,fontWeight:500,color:"var(--t2)"}}>NG</div>
            <div>
              <div style={{fontFamily:"var(--font-ui)",fontWeight:700,fontSize:14,color:"var(--t1)",letterSpacing:"-0.3px"}}>{t.appName}</div>
              <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:"#4ade80",display:"inline-block",animation:"pulseDot 2s infinite"}}/>
                <span style={{fontFamily:"var(--font-data)",fontSize:9,color:"var(--t3)",letterSpacing:"0.06em"}}>{t.synced}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{padding:"8px 8px",flex:1}}>
          {[
            {id:"transactions", label:t.transactions, icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1.5" fill="currentColor"/><circle cx="3" cy="12" r="1.5" fill="currentColor"/><circle cx="3" cy="18" r="1.5" fill="currentColor"/></svg>},
            {id:"analytics",    label:t.analytics,    icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>},
          ].map(item=>(
            <div key={item.id} className="navlink" onClick={()=>setTab(item.id)}
              style={{display:"flex",alignItems:"center",gap:9,padding:"9px 10px",borderRadius:7,marginBottom:1,
                background:tab===item.id?"var(--surface2)":"transparent",
                color:tab===item.id?"var(--t1)":"var(--t3)",
                fontWeight:tab===item.id?600:400,fontSize:13}}>
              <span style={{opacity:tab===item.id?1:0.6}}>{item.icon}</span>{item.label}
            </div>
          ))}
        </nav>

        {/* Lang */}
        <div style={{padding:"10px 8px",borderTop:"1px solid var(--border)"}}>
          <button onClick={()=>setLang(l=>l==="fr"?"en":"fr")} className="navlink"
            style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"7px 10px",borderRadius:7,background:"none",border:"1px solid var(--border)",color:"var(--t3)",fontSize:11,fontWeight:600,cursor:"pointer"}}>
            {lang==="fr"?"🇬🇧 EN":"🇫🇷 FR"}
          </button>
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Top bar */}
        <header style={{background:"var(--surface)",borderBottom:"1px solid var(--border)",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <h1 style={{fontSize:20,fontWeight:700,color:"var(--t1)",letterSpacing:"-0.4px",margin:0}}>
              {tab==="transactions" ? "Gym Income Dashboard" : t.analytics}
            </h1>
            <p style={{fontSize:12,color:"var(--t3)",marginTop:2}}>{tab==="transactions" ? "Track your gym revenue from sessions and memberships" : ""}</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="ibtn" onClick={()=>setShowF(f=>!f)}
              style={{display:"flex",alignItems:"center",gap:6,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--t2)",borderRadius:8,padding:"7px 13px",cursor:"pointer",fontSize:12,fontWeight:600}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              {t.filters}
            </button>
            <button className="ibtn" onClick={doExport}
              style={{display:"flex",alignItems:"center",gap:6,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--t2)",borderRadius:8,padding:"7px 13px",cursor:"pointer",fontSize:12,fontWeight:600}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {t.export}
            </button>
            <button className="ibtn pbtn" onClick={()=>setModal({mode:"add-expense"})}
              style={{background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--t2)",borderRadius:8,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600}}>
              {t.addExpense}
            </button>
            <button className="pbtn" onClick={()=>setModal({mode:"add-income"})}
              style={{background:"var(--t1)",border:"none",color:"var(--bg)",borderRadius:8,padding:"7px 16px",cursor:"pointer",fontSize:12,fontWeight:700}}>
              {t.addIncome}
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:16}}>

          {/* ── KPI ROW ── */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr) 280px",gap:12,alignItems:"stretch"}}>
            {/* KPI 1 — Total Income */}
            <KpiCard cls="fu1" label={t.totalIncome} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              value={fmt(stats.totInc)} sub={t.allTime}
              badge={stats.topCat ? {color:"#f97316",bg:"#f97316",label:t[stats.topCat[0]]||stats.topCat[0]} : null}
              growth={stats.growth} growthLabel={t.vsLast}
            />
            {/* KPI 2 — Avg */}
            <KpiCard cls="fu2" label={t.avgTransaction} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
              value={fmt(Math.round(stats.avg))} sub={t.perTx}
              badge={{color:"#6b7280",bg:"#6b7280",label:`Top: ${t.monthlySubscription}`}}
            />
            {/* KPI 3 — This Week */}
            <KpiCard cls="fu3" label={t.thisWeek} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
              value={fmt(stats.wkInc)} sub={t.last7}
              badge={{color:"#374151",bg:"#374151",label:`${stats.wkTx} transactions`,textColor:"#9ca3af"}}
            />
            {/* KPI 4 — This Month */}
            <KpiCard cls="fu4" label={t.thisMonth} icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              value={fmt(stats.mthInc)} sub={t.curMonth}
              badge={{color:"#374151",bg:"#374151",label:`${stats.mthTx} transactions`,textColor:"#9ca3af"}}
            />
            {/* Insights sidebar card */}
            <div className="fu5 card" style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"16px 16px",gridRow:"span 1"}}>
              <div style={{fontSize:14,fontWeight:700,color:"var(--t1)",marginBottom:14}}>{t.insights}</div>
              {[
                {lbl:t.topCat,    val:stats.topCat?t[stats.topCat[0]]||stats.topCat[0]:"—", badge:true},
                {lbl:t.avgTransaction, val:fmt(Math.round(stats.avg))},
                {lbl:t.totalTx,   val:String(txs.length)},
              ].map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <span style={{fontSize:12,color:"var(--t3)"}}>{r.lbl}</span>
                  {r.badge
                    ? <span style={{background:"var(--surface2)",border:"1px solid var(--border2)",borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:600,color:"var(--t2)"}}>{r.val}</span>
                    : <span style={{fontFamily:"var(--font-data)",fontSize:11,color:"var(--t1)",fontWeight:500}}>{r.val}</span>
                  }
                </div>
              ))}
              <div style={{height:1,background:"var(--border)",margin:"12px 0"}}/>
              <div style={{fontSize:11,color:"var(--t3)",marginBottom:10}}>{t.sources}</div>
              {SOURCES.map(s=>{
                const total=stats.totInc||1, val=stats.srcMap[s]||0, pct=Math.round(val/total*100);
                return(
                  <div key={s} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:SRC_COLOR[s],flexShrink:0}}/>
                    <span style={{fontSize:11,color:"var(--t2)",flex:1}}>{t[s]}</span>
                    <div style={{width:60,height:4,background:"var(--surface2)",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:pct+"%",background:SRC_COLOR[s],borderRadius:2,transition:"width .7s ease"}}/>
                    </div>
                    <span style={{fontFamily:"var(--font-data)",fontSize:10,color:"var(--t3)",width:28,textAlign:"right"}}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── TABS ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",background:"var(--surface2)",borderRadius:10,padding:3,width:"100%",border:"1px solid var(--border)"}}>
            {["transactions","analytics"].map(id=>(
              <button key={id} onClick={()=>setTab(id)} className={tab===id?"":"ibtn"}
                style={{padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
                  background:tab===id?"var(--surface)":"transparent",
                  color:tab===id?"var(--t1)":"var(--t3)",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                {id==="transactions"
                  ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1.5" fill="currentColor"/><circle cx="3" cy="12" r="1.5" fill="currentColor"/><circle cx="3" cy="18" r="1.5" fill="currentColor"/></svg>{t.transactions}</>
                  : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="8" width="6" height="13" rx="1"/><rect x="16" y="13" width="6" height="8" rx="1"/></svg>{t.analytics}</>
                }
              </button>
            ))}
          </div>

          {/* ── MAIN PANEL ── */}
          {tab==="transactions" ? (
            <div className="fu card" style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"16px 20px 0"}}>
                <div style={{fontSize:15,fontWeight:700,color:"var(--t1)",marginBottom:14}}>{t.ledger}</div>

                {/* Filter bar */}
                <div style={{display:"flex",gap:9,marginBottom:showF?10:14,flexWrap:"wrap",alignItems:"center"}}>
                  <div style={{flex:2,minWidth:180,position:"relative",display:"flex",alignItems:"center"}}>
                    <svg style={{position:"absolute",left:10,opacity:0.4}} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search}
                      style={{...IS,paddingLeft:30}}/>
                  </div>
                  {[
                    {v:fType,set:setFType,opts:[["",t.allTypes],["income",t.income],["expense",t.expense]]},
                    {v:fCat, set:setFCat, opts:[["",t.allCats],...allCats.map(c=>[c,t[c]||c])]},
                    {v:fSrc, set:setFSrc, opts:[["",t.allSrcs],...SOURCES.map(s=>[s,t[s]])]},
                  ].map((f,i)=>(
                    <select key={i} value={f.v} onChange={e=>f.set(e.target.value)}
                      style={{...IS,width:"auto",flex:"0 0 auto",cursor:"pointer"}}>
                      {f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  ))}
                </div>
                {showF && (
                  <div style={{display:"flex",gap:9,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
                    <span style={{fontSize:11,color:"var(--t3)"}}>{t.from}</span>
                    <input type="date" value={fFrom} onChange={e=>setFFrom(e.target.value)} style={{...IS,width:"auto"}}/>
                    <span style={{fontSize:11,color:"var(--t3)"}}>{t.to}</span>
                    <input type="date" value={fTo} onChange={e=>setFTo(e.target.value)} style={{...IS,width:"auto"}}/>
                    <button onClick={()=>{setSearch("");setFCat("");setFSrc("");setFType("");setFFrom("");setFTo("");}}
                      style={{background:"none",border:"1px solid var(--border)",borderRadius:7,padding:"6px 11px",color:"var(--t3)",fontSize:11,cursor:"pointer"}}>
                      ✕ Clear
                    </button>
                  </div>
                )}

                {/* Table head */}
                <div style={{display:"grid",gridTemplateColumns:"2fr 1.3fr 0.9fr 1.1fr 1.2fr 32px",padding:"6px 0",borderBottom:"1px solid var(--border)",marginBottom:0}}>
                  {[["description",t.desc],["category",t.cat],["date",t.date],["source",t.src],["amount",t.amount]].map(([col,lbl])=>(
                    <button key={col} onClick={()=>doSort(col)}
                      style={{background:"none",border:"none",padding:0,textAlign:"left",display:"flex",alignItems:"center",gap:4,cursor:"pointer",
                        fontFamily:"var(--font-data)",fontSize:10,color:sort===col?"var(--t2)":"var(--t3)",letterSpacing:"0.05em",textTransform:"uppercase",fontWeight:400}}>
                      {lbl}
                      <span style={{opacity:.6}}>{sort===col?(dir==="asc"?"↑":"↓"):"⇅"}</span>
                    </button>
                  ))}
                  <div/>
                </div>
              </div>

              {/* Rows */}
              <div style={{maxHeight:440,overflowY:"auto"}}>
                {filtered.length===0
                  ? <div style={{textAlign:"center",padding:"44px 0",color:"var(--t4)",fontFamily:"var(--font-data)",fontSize:12}}>{t.noTx}</div>
                  : filtered.map(tx=><TxRow key={tx.id} tx={tx} t={t} onEdit={()=>setModal({mode:"edit",tx})} onDel={()=>setDelId(tx.id)}/>)
                }
              </div>
            </div>
          ) : (
            <AnalyticsTab t={t} stats={stats} trend={trend}/>
          )}
        </div>
      </div>

      {modal  && <TxModal mode={modal.mode} tx={modal.tx} t={t} IS={IS} LS={LS} onSave={saveTx} onClose={()=>setModal(null)}/>}
      {delId  && <DelModal t={t} onConfirm={()=>{setTxs(p=>p.filter(x=>x.id!==delId));setDelId(null);}} onCancel={()=>setDelId(null)}/>}
    </div>
  );
}

/* ─── KPI CARD ───────────────────────────────────────────────────────────── */
function KpiCard({cls,label,icon,value,sub,badge,growth,growthLabel}){
  return(
    <div className={`${cls} card`} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"16px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <span style={{fontSize:12,color:"var(--t3)",fontWeight:500}}>{label}</span>
        <span style={{color:"var(--t3)",opacity:.7}}>{icon}</span>
      </div>
      <div style={{fontFamily:"var(--font-data)",fontSize:20,fontWeight:500,color:"var(--t1)",letterSpacing:"-0.5px",marginBottom:8,lineHeight:1.1}}>
        {value}
      </div>
      {badge && (
        <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:badge.color,flexShrink:0}}/>
          <span style={{fontSize:11,color:badge.textColor||"var(--t3)",background:"transparent",fontWeight:500}}>{badge.label}</span>
          {growth!=null && <span style={{fontSize:11,color:"var(--t3)",marginLeft:4}}>0%</span>}
        </div>
      )}
      {growth!=null && badge?.color==="var(--t3)" && (
        <div style={{fontFamily:"var(--font-data)",fontSize:10,color:parseFloat(growth)>=0?"#4ade80":"#f87171"}}>
          {parseFloat(growth)>=0?"▲":"▼"} {Math.abs(growth)}% {growthLabel}
        </div>
      )}
      {!badge && <div style={{fontFamily:"var(--font-data)",fontSize:10,color:"var(--t4)"}}>{sub}</div>}
    </div>
  );
}

/* ─── TX ROW ─────────────────────────────────────────────────────────────── */
function TxRow({tx,t,onEdit,onDel}){
  const [open,setOpen]=useState(false);
  const ref=useRef();
  useEffect(()=>{
    const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn);
  },[]);
  const isInc=tx.type==="income";
  return(
    <div className="txrow" style={{display:"grid",gridTemplateColumns:"2fr 1.3fr 0.9fr 1.1fr 1.2fr 32px",padding:"13px 20px",borderBottom:"1px solid var(--border)",alignItems:"center",background:"transparent"}}>
      <div>
        <div style={{fontSize:13,fontWeight:600,color:"var(--t1)",display:"flex",alignItems:"center",gap:7}}>
          {tx.description}
          {tx.isRecurring&&<span style={{fontFamily:"var(--font-data)",fontSize:9,color:"var(--t3)",background:"var(--surface2)",border:"1px solid var(--border)",padding:"1px 5px",borderRadius:3}}>↺</span>}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:11,color:"var(--t2)"}}>{t[tx.category]||tx.category}</span>
      </div>
      <div style={{fontFamily:"var(--font-data)",fontSize:11,color:"var(--t3)"}}>{tx.date}</div>
      <div>
        <span style={{fontFamily:"var(--font-data)",fontSize:11,color:SRC_COLOR[tx.source],background:SRC_COLOR[tx.source]+"14",border:`1px solid ${SRC_COLOR[tx.source]}28`,padding:"3px 8px",borderRadius:5,fontWeight:500}}>
          {t[tx.source]}
        </span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
        <span style={{fontFamily:"var(--font-data)",fontSize:13,fontWeight:500,color:isInc?"#4ade80":"#f87171"}}>
          {fmt(tx.amount)}
        </span>
        <span style={{fontSize:10,color:tx.status==="settled"?"#4ade80":"#f59e0b",background:tx.status==="settled"?"#4ade8014":"#f59e0b14",border:`1px solid ${tx.status==="settled"?"#4ade8028":"#f59e0b28"}`,padding:"2px 7px",borderRadius:5,fontFamily:"var(--font-data)"}}>
          {t[tx.status]||tx.status}
        </span>
      </div>
      <div style={{position:"relative"}} ref={ref}>
        <button onClick={()=>setOpen(o=>!o)}
          style={{background:"none",border:"none",color:"var(--t4)",cursor:"pointer",fontSize:16,padding:"3px 5px",lineHeight:1}}>⋯</button>
        {open&&(
          <div style={{position:"absolute",right:0,top:"100%",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:9,overflow:"hidden",minWidth:110,zIndex:50,boxShadow:"0 6px 24px #00000066"}}>
            <button className="mi" onClick={()=>{onEdit();setOpen(false);}}
              style={{display:"block",width:"100%",padding:"9px 14px",background:"none",border:"none",color:"var(--t2)",cursor:"pointer",textAlign:"left",fontSize:12,fontFamily:"var(--font-ui)",fontWeight:500}}>
              Edit
            </button>
            <button className="mi" onClick={()=>{onDel();setOpen(false);}}
              style={{display:"block",width:"100%",padding:"9px 14px",background:"none",border:"none",color:"#f87171",cursor:"pointer",textAlign:"left",fontSize:12,fontFamily:"var(--font-ui)",fontWeight:500}}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ANALYTICS ──────────────────────────────────────────────────────────── */
function AnalyticsTab({t,stats,trend}){
  const iD=Object.entries(stats.catMap).map(([k,v],i)=>({name:t[k]||k,value:v,color:CHART_COLORS[i%CHART_COLORS.length]}));
  const eD=Object.entries(stats.eCatMap).map(([k,v],i)=>({name:t[k]||k,value:v,color:CHART_COLORS[i%CHART_COLORS.length]}));
  const sD=Object.entries(stats.srcMap).map(([k,v])=>({name:t[k]||k,value:v,color:SRC_COLOR[k]}));
  const bD=Object.entries(stats.catMap).sort((a,b)=>b[1]-a[1]).map(([k,v],i)=>({name:t[k]||k,value:v,fill:CHART_COLORS[i%CHART_COLORS.length]}));
  const TT={background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--t2)",fontSize:10,fontFamily:"var(--font-data)"};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {[{title:t.incByCat,data:iD},{title:t.expByCat,data:eD},{title:t.incBySrc,data:sD}].map((c,i)=>(
          <div key={i} className={`fu${i+1} card`} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"16px"}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:12}}>{c.title}</div>
            {c.data.length===0
              ?<div style={{textAlign:"center",padding:"28px 0",color:"var(--t4)",fontSize:12}}>{t.noData}</div>
              :<ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={c.data} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={62} strokeWidth={0}>
                    {c.data.map((d,j)=><Cell key={j} fill={d.color}/>)}
                  </Pie>
                  <Tooltip formatter={v=>fmt(v)} contentStyle={TT}/>
                </PieChart>
              </ResponsiveContainer>
            }
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>
              {c.data.slice(0,4).map((d,j)=>(
                <div key={j} style={{display:"flex",alignItems:"center",gap:4}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:d.color,display:"inline-block"}}/>
                  <span style={{fontFamily:"var(--font-data)",fontSize:9,color:"var(--t3)"}}>{d.name.slice(0,14)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fu4 card" style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"16px"}}>
        <div style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:12}}>{t.trend}</div>
        {trend.length===0
          ?<div style={{textAlign:"center",padding:"40px 0",color:"var(--t4)",fontSize:12}}>{t.noData}</div>
          :<ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend} margin={{top:4,right:10,left:0,bottom:4}}>
              <defs>
                <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4ade80" stopOpacity={.15}/><stop offset="95%" stopColor="#4ade80" stopOpacity={0}/></linearGradient>
                <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={.15}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
              </defs>
              <XAxis dataKey="l" stroke="#2a2d35" tick={{fill:"#545c6b",fontSize:10,fontFamily:"var(--font-data)"}}/>
              <YAxis stroke="#2a2d35" tick={{fill:"#545c6b",fontSize:10,fontFamily:"var(--font-data)"}} tickFormatter={fmtS}/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={TT}/>
              <Area type="monotone" dataKey="inc" stroke="#4ade80" strokeWidth={1.5} fill="url(#gi)" name="Income"/>
              <Area type="monotone" dataKey="exp" stroke="#f87171" strokeWidth={1.5} fill="url(#ge)" name="Expense"/>
            </AreaChart>
          </ResponsiveContainer>
        }
      </div>

      {bD.length>0&&(
        <div className="fu5 card" style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"16px"}}>
          <div style={{fontSize:13,fontWeight:700,color:"var(--t1)",marginBottom:12}}>{t.catPerf}</div>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={bD} margin={{top:0,right:10,left:0,bottom:28}}>
              <XAxis dataKey="name" stroke="#2a2d35" tick={{fill:"#545c6b",fontSize:9,fontFamily:"var(--font-data)",angle:-20,textAnchor:"end"}}/>
              <YAxis stroke="#2a2d35" tick={{fill:"#545c6b",fontSize:10,fontFamily:"var(--font-data)"}} tickFormatter={fmtS}/>
              <Tooltip formatter={v=>fmt(v)} contentStyle={TT}/>
              <Bar dataKey="value" radius={[3,3,0,0]}>
                {bD.map((d,i)=><Cell key={i} fill={d.fill}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/* ─── TX MODAL ───────────────────────────────────────────────────────────── */
function TxModal({mode,tx,t,IS,LS,onSave,onClose}){
  const isExp=mode==="add-expense"||(mode==="edit"&&tx?.type==="expense");
  const cats=isExp?EXPENSE_CATS:INCOME_CATS;
  const [form,setForm]=useState({
    id:tx?.id||"",type:tx?.type||(isExp?"expense":"income"),
    amount:tx?.amount||"",date:tx?.date||new Date().toISOString().slice(0,10),
    description:tx?.description||"",category:tx?.category||"",
    source:tx?.source||"",status:tx?.status||"settled",
    isRecurring:tx?.isRecurring||false,recurringFrequency:tx?.recurringFrequency||"monthly",
  });
  const [errs,setErrs]=useState({});
  function validate(){
    const e={};
    if(!form.amount||isNaN(+form.amount)||+form.amount<=0)e.amount=true;
    if(!form.description.trim())e.description=true;
    if(!form.category)e.category=true;
    if(!form.source)e.source=true;
    setErrs(e);return Object.keys(e).length===0;
  }
  const title=mode==="edit"?t.edit:(isExp?t.addExpense:t.addIncome);
  const accentBorder=isExp?"1px solid #f8717128":"1px solid #4ade8028";
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{position:"fixed",inset:0,background:"#000000aa",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"overlayIn .2s ease"}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderTop:accentBorder,borderRadius:14,padding:"24px",width:"100%",maxWidth:500,animation:"modalIn .22s ease",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h2 style={{fontSize:16,fontWeight:700,color:"var(--t1)",letterSpacing:"-0.3px",margin:0}}>{title}</h2>
          <button onClick={onClose} style={{background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--t3)",borderRadius:7,width:28,height:28,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div>
            <label style={LS}>{t.amount} *</label>
            <input value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} type="number" placeholder="0.00"
              style={{...IS,borderColor:errs.amount?"#f87171":"var(--border)"}}/>
          </div>
          <div>
            <label style={LS}>{t.date}</label>
            <input value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} type="date" style={IS}/>
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={LS}>{t.desc} *</label>
          <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
            placeholder={isExp?"e.g., Loyer mensuel, Salaire...":"e.g., Web development services, Product sales..."}
            style={{...IS,borderColor:errs.description?"#f87171":"var(--border)"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div>
            <label style={LS}>{t.cat} *</label>
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
              style={{...IS,cursor:"pointer",borderColor:errs.category?"#f87171":"var(--border)"}}>
              <option value="">Select category</option>
              {cats.map(c=><option key={c} value={c}>{t[c]||c}</option>)}
            </select>
          </div>
          <div>
            <label style={LS}>Payment Source *</label>
            <select value={form.source} onChange={e=>setForm(f=>({...f,source:e.target.value}))}
              style={{...IS,cursor:"pointer",borderColor:errs.source?"#f87171":"var(--border)"}}>
              <option value="">Select payment source</option>
              {SOURCES.map(s=><option key={s} value={s}>{t[s]}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:22}}>
          <div>
            <label style={LS}>{t.status}</label>
            <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={{...IS,cursor:"pointer"}}>
              <option value="settled">{t.settled}</option>
              <option value="pending">{t.pending}</option>
            </select>
          </div>
          <div>
            <label style={LS}>{t.recurring}</label>
            <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:4}}>
              <input type="checkbox" checked={form.isRecurring} onChange={e=>setForm(f=>({...f,isRecurring:e.target.checked}))}
                style={{width:15,height:15,cursor:"pointer",accentColor:"var(--t2)"}}/>
              {form.isRecurring&&(
                <select value={form.recurringFrequency} onChange={e=>setForm(f=>({...f,recurringFrequency:e.target.value}))}
                  style={{...IS,cursor:"pointer"}}>
                  <option value="monthly">{t.monthly}</option>
                  <option value="weekly">{t.weekly}</option>
                </select>
              )}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}>
          <button onClick={onClose}
            style={{background:"none",border:"1px solid var(--border)",color:"var(--t3)",borderRadius:8,padding:"9px 18px",cursor:"pointer",fontSize:13,fontWeight:600}}>
            {t.cancel}
          </button>
          <button onClick={()=>validate()&&onSave({...form,amount:+form.amount})} className="pbtn"
            style={{background:"var(--t1)",border:"none",color:"var(--bg)",borderRadius:8,padding:"9px 22px",cursor:"pointer",fontSize:13,fontWeight:700}}>
            {mode==="edit"?t.save:t.add}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── DELETE MODAL ───────────────────────────────────────────────────────── */
function DelModal({t,onConfirm,onCancel}){
  return(
    <div style={{position:"fixed",inset:0,background:"#000000aa",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20,animation:"overlayIn .2s ease"}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"24px",maxWidth:360,width:"100%",animation:"modalIn .22s ease"}}>
        <h2 style={{fontSize:15,fontWeight:700,color:"var(--t1)",marginBottom:10}}>{t.confirmDel}</h2>
        <p style={{fontSize:12,color:"var(--t3)",marginBottom:22,lineHeight:1.6}}>{t.delQ}</p>
        <div style={{display:"flex",gap:9,justifyContent:"flex-end"}}>
          <button onClick={onCancel} style={{background:"none",border:"1px solid var(--border)",color:"var(--t3)",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:12,fontWeight:600}}>{t.cancel}</button>
          <button onClick={onConfirm} className="pbtn" style={{background:"#f87171",border:"none",color:"#fff",borderRadius:8,padding:"8px 18px",cursor:"pointer",fontSize:12,fontWeight:700}}>{t.del}</button>
        </div>
      </div>
    </div>
  );
}
