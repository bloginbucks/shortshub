import { useState, useEffect } from "react";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmtViews(n) {
  n = n||0;
  if(n>=10000) return (n/10000).toFixed(1)+"만";
  if(n>=1000)  return (n/1000).toFixed(1)+"천";
  return n.toString();
}
function uid() { return "i"+Math.random().toString(36).slice(2,9); }
function getMonthInfo(year,month) { return {firstDay:new Date(year,month-1,1).getDay(),daysInMonth:new Date(year,month,0).getDate()}; }
function makeDate(y,m,d) { return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function calcStreak(uploadDates) {
  const set=new Set(uploadDates); let streak=0; const d=new Date();
  while(true){const s=makeDate(d.getFullYear(),d.getMonth()+1,d.getDate());if(set.has(s)){streak++;d.setDate(d.getDate()-1);}else break;}
  return streak;
}
function migrateChannel(c) {
  return {...c,benchmarks:c.benchmarks||[],ideas:c.ideas||[],schedule:c.schedule||[],goals:c.goals||[],videos:(c.videos||[]).map(v=>({goal:10000,...v}))};
}

const today = todayStr();
const [ty,tm] = today.split("-").map(Number);
const STORAGE_KEY = "shortshub-data-v3";
const THEME_KEY   = "shortshub-theme";

const INIT_CHANNELS = [{
  id:"ch_1", name:"쇼핑채널", emoji:"🛍️", color:"#E8856A", description:"핫딜 & 리뷰 쇼츠",
  uploadDates:[makeDate(ty,tm,Math.max(1,new Date().getDate()-2)),makeDate(ty,tm,Math.max(1,new Date().getDate()-1)),today],
  videos:[{id:"v1",title:"여름 핫딜 TOP5",link:"",date:today,views:4200,goal:10000}],
  goals:[{id:"g1",text:"구독자 1,000명 달성",done:false},{id:"g2",text:"조회수 1만 달성",done:true}],
  benchmarks:[{id:"b1",name:"1분미만",url:"https://youtube.com/@1minute",note:"짧고 임팩트 있는 편집 스타일 참고"}],
  ideas:[{id:"i1",text:"편의점 신상 리뷰 쇼츠",done:false,date:today}],
  schedule:[],
}];

const EMOJIS  = ["🛍️","🏆","🎬","🍔","💄","🎮","💰","🐶","✈️","🏋️","📚","🎵","😂","🌿","⚽","🤖","👗","🏠","🎨","💡"];
const COLORS  = ["#E8856A","#6A9EBF","#7B6FD4","#C4A44A","#5BAF82","#C46E45","#9B6CC4","#4AABB8","#BF6A7A","#6A8FBF"];
const WEEKDAYS = ["일","월","화","수","목","금","토"];

// 테마 토큰
const DARK = {
  bg:"#08080f", bg2:"#0e0e18", bg3:"#111120", bg4:"#161626",
  border:"#1e1e30", border2:"#252538", border3:"#2a2a40",
  text:"#e8e8f8", text2:"#a0a0c0", text3:"#606080", text4:"#3a3a58",
  inputBg:"#0a0a14", shadow:"0 4px 24px rgba(0,0,0,.5)", shadow2:"0 2px 12px rgba(0,0,0,.4)",
  isDark:true,
};
const LIGHT = {
  bg:"#f5f4f0", bg2:"#ffffff", bg3:"#f0efe8", bg4:"#e8e7de",
  border:"#e0dfd6", border2:"#d4d3ca", border3:"#c8c7be",
  text:"#1a1a2e", text2:"#4a4a6a", text3:"#8a8aaa", text4:"#b0b0c8",
  inputBg:"#ffffff", shadow:"0 4px 24px rgba(0,0,0,.08)", shadow2:"0 2px 12px rgba(0,0,0,.06)",
  isDark:false,
};

const I = {
  flame:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><path d="M12 2c0 0-4 4-4 9a4 4 0 008 0c0-2-1-4-1-4s-1 2-3 2c-1 0-2-1-2-2 0-2 2-5 2-5z" strokeLinejoin="round"/></svg>,
  eye:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  video:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><rect x="2" y="5" width="15" height="14" rx="2"/><path d="M17 9l5-3v12l-5-3V9z"/></svg>,
  target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  plus:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:13,height:13}}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:13,height:13}}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  close:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:12,height:12}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  link:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:12,height:12}}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  cal:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  bulb:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.5-1.5 4.5-3 6H8c-1.5-1.5-3-3.5-3-6a7 7 0 017-7z"/></svg>,
  up:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13}}><polyline points="18 15 12 9 6 15"/></svg>,
  down:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13}}><polyline points="6 9 12 15 18 9"/></svg>,
  sun:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
};

export default function App() {
  const [channels,    setChannels]   = useState(INIT_CHANNELS);
  const [loaded,      setLoaded]     = useState(false);
  const [saving,      setSaving]     = useState(false);
  const [isDark,      setIsDark]     = useState(true);
  const [activeId,    setActiveId]   = useState(null);
  const [tab,         setTab]        = useState("dashboard");
  const [chModal,     setChModal]    = useState(null);
  const [chForm,      setChForm]     = useState({name:"",emoji:"🎬",color:"#7B6FD4",description:""});
  const [vidModal,    setVidModal]   = useState(false);
  const [vidForm,     setVidForm]    = useState({title:"",link:"",goal:"10000"});
  const [editVid,     setEditVid]    = useState(null);
  const [editVal,     setEditVal]    = useState("");
  const [editGoalVid, setEditGoalVid]= useState(null);
  const [editGoalVal, setEditGoalVal]= useState("");
  const [delVidConf,  setDelVidConf] = useState(null);
  const [delConfirm,  setDelConfirm] = useState(null);
  const [goalInput,   setGoalInput]  = useState("");
  const [addingGoal,  setAddingGoal] = useState(false);
  const [calYear,     setCalYear]    = useState(ty);
  const [calMonth,    setCalMonth]   = useState(tm);
  const [bmModal,     setBmModal]    = useState(false);
  const [bmForm,      setBmForm]     = useState({name:"",url:"",note:""});
  const [ideaInput,   setIdeaInput]  = useState("");
  const [addingIdea,  setAddingIdea] = useState(false);
  const [editIdea,    setEditIdea]   = useState(null);
  const [editIdeaVal, setEditIdeaVal]= useState("");
  const [scModal,     setScModal]    = useState(false);
  const [scForm,      setScForm]     = useState({title:"",date:"",memo:""});

  const T = isDark ? DARK : LIGHT;
  const ch  = channels.find(c => c.id === activeId);
  const upd = (id, fn) => setChannels(p => p.map(c => c.id===id ? fn(c) : c));

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if(saved) setChannels(JSON.parse(saved).map(migrateChannel));
      const theme = localStorage.getItem(THEME_KEY);
      if(theme) setIsDark(theme==="dark");
    } catch(_){}
    setLoaded(true);
  },[]);
  useEffect(() => {
    if(!loaded) return;
    setSaving(true);
    const t=setTimeout(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(channels));}catch(_){} setSaving(false);},800);
    return()=>clearTimeout(t);
  },[channels,loaded]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    try { localStorage.setItem(THEME_KEY, next?"dark":"light"); } catch(_){}
  };

  const toggleUpload = () => upd(activeId,c=>{const s=new Set(c.uploadDates);s.has(today)?s.delete(today):s.add(today);return{...c,uploadDates:[...s]};});
  const prevMonth = () => {calMonth===1?(setCalYear(y=>y-1),setCalMonth(12)):setCalMonth(m=>m-1);};
  const nextMonth = () => {if(calYear===ty&&calMonth>=tm)return;calMonth===12?(setCalYear(y=>y+1),setCalMonth(1)):setCalMonth(m=>m+1);};
  const isCurrentMonth = calYear===ty&&calMonth===tm;

  const openAdd  = () => {setChForm({name:"",emoji:"🎬",color:"#7B6FD4",description:""});setChModal({mode:"add"});};
  const openEdit = (c,e) => {e?.stopPropagation();setChForm({name:c.name,emoji:c.emoji,color:c.color,description:c.description});setChModal({mode:"edit",id:c.id});};
  const saveCh   = () => {
    if(!chForm.name.trim()) return;
    chModal.mode==="add"
      ? setChannels(p=>[...p,{id:uid(),...chForm,uploadDates:[],videos:[],goals:[],benchmarks:[],ideas:[],schedule:[]}])
      : upd(chModal.id,c=>({...c,...chForm}));
    setChModal(null);
  };
  const confirmDel = (id,e) => {e?.stopPropagation();setDelConfirm(id);};
  const execDel    = () => {setChannels(p=>p.filter(c=>c.id!==delConfirm));if(activeId===delConfirm)setActiveId(null);setDelConfirm(null);};
  const moveChannel = (id,dir) => {
    setChannels(p=>{
      const i=p.findIndex(c=>c.id===id),n=i+dir;
      if(n<0||n>=p.length) return p;
      const arr=[...p];[arr[i],arr[n]]=[arr[n],arr[i]];return arr;
    });
  };

  const addVid = () => {
    if(!vidForm.title.trim()) return;
    const v={id:uid(),title:vidForm.title,link:vidForm.link,date:today,views:0,goal:parseInt(vidForm.goal)||10000};
    upd(activeId,c=>{const s=new Set(c.uploadDates);s.add(today);return{...c,videos:[v,...c.videos],uploadDates:[...s]};});
    setVidForm({title:"",link:"",goal:"10000"});setVidModal(false);
  };
  const execDelVid   = () => {upd(activeId,c=>({...c,videos:c.videos.filter(v=>v.id!==delVidConf)}));setDelVidConf(null);};
  const startEdit    = v => {setEditVid(v.id);setEditVal(String(v.views));};
  const saveViews    = vid => {upd(activeId,c=>({...c,videos:c.videos.map(v=>v.id===vid?{...v,views:parseInt(editVal)||0}:v)}));setEditVid(null);};
  const startGoalEdit= v => {setEditGoalVid(v.id);setEditGoalVal(String(v.goal));};
  const saveGoal     = vid => {upd(activeId,c=>({...c,videos:c.videos.map(v=>v.id===vid?{...v,goal:parseInt(editGoalVal)||10000}:v)}));setEditGoalVid(null);};

  const addGoal    = () => {if(!goalInput.trim())return;upd(activeId,c=>({...c,goals:[...(c.goals||[]),{id:uid(),text:goalInput.trim(),done:false}]}));setGoalInput("");setAddingGoal(false);};
  const toggleGoal = gid => upd(activeId,c=>({...c,goals:(c.goals||[]).map(g=>g.id===gid?{...g,done:!g.done}:g)}));
  const delGoal    = gid => upd(activeId,c=>({...c,goals:(c.goals||[]).filter(g=>g.id!==gid)}));

  const addBm  = () => {if(!bmForm.name.trim())return;upd(activeId,c=>({...c,benchmarks:[...(c.benchmarks||[]),{id:uid(),...bmForm}]}));setBmForm({name:"",url:"",note:""});setBmModal(false);};
  const delBm  = bid => upd(activeId,c=>({...c,benchmarks:(c.benchmarks||[]).filter(b=>b.id!==bid)}));

  const addIdea      = () => {if(!ideaInput.trim())return;upd(activeId,c=>({...c,ideas:[...(c.ideas||[]),{id:uid(),text:ideaInput.trim(),done:false,date:today}]}));setIdeaInput("");setAddingIdea(false);};
  const toggleIdea   = iid => upd(activeId,c=>({...c,ideas:(c.ideas||[]).map(i=>i.id===iid?{...i,done:!i.done}:i)}));
  const delIdea      = iid => upd(activeId,c=>({...c,ideas:(c.ideas||[]).filter(i=>i.id!==iid)}));
  const saveIdeaEdit = iid => {upd(activeId,c=>({...c,ideas:(c.ideas||[]).map(i=>i.id===iid?{...i,text:editIdeaVal}:i)}));setEditIdea(null);};

  const addSc    = () => {if(!scForm.title.trim()||!scForm.date)return;upd(activeId,c=>({...c,schedule:[...(c.schedule||[]),{id:uid(),...scForm,done:false}].sort((a,b)=>a.date.localeCompare(b.date))}));setScForm({title:"",date:"",memo:""});setScModal(false);};
  const toggleSc = sid => upd(activeId,c=>({...c,schedule:(c.schedule||[]).map(s=>s.id===sid?{...s,done:!s.done}:s)}));
  const delSc    = sid => upd(activeId,c=>({...c,schedule:(c.schedule||[]).filter(s=>s.id!==sid)}));

  if(!loaded) return <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:T.text3,fontSize:14,letterSpacing:2}}>LOADING</div></div>;

  // 스타일 헬퍼
  const card  = {background:T.bg2,border:`1px solid ${T.border}`,borderRadius:18,padding:"18px 16px",position:"relative",overflow:"hidden",transition:"all .2s",boxShadow:T.shadow2};
  const block = {background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px",marginBottom:12,boxShadow:T.shadow2};
  const iBtn  = {background:"none",border:"none",cursor:"pointer",padding:"5px",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",color:T.text3,transition:"color .15s"};
  const input = {width:"100%",background:T.inputBg,border:`1px solid ${T.border2}`,borderRadius:9,padding:"10px 12px",color:T.text,fontSize:13,boxSizing:"border-box",outline:"none"};
  const overlay={position:"fixed",inset:0,background:isDark?"rgba(0,0,0,.7)":"rgba(0,0,0,.3)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200};
  const modal  ={background:T.bg2,border:`1px solid ${T.border}`,borderRadius:"20px 20px 0 0",padding:"24px 20px 40px",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",boxShadow:T.shadow};

  // ══ HOME ══
  if(!activeId) {
    const totViews=channels.reduce((s,c)=>s+c.videos.reduce((a,v)=>a+(v.views||0),0),0);
    const todayDone=channels.filter(c=>c.uploadDates.includes(today)).length;
    return (
      <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Pretendard','Apple SD Gothic Neo',sans-serif",paddingBottom:60,maxWidth:680,margin:"0 auto",transition:"background .3s,color .3s"}}>
        <style>{`
          @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
          * { box-sizing:border-box; } body { margin:0; background:${T.bg}; transition:background .3s; }
          .sh-card:hover { transform:translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,${isDark?.4:.12}) !important; }
          .sh-addcard:hover { border-color:${T.border2} !important; background:${T.bg3} !important; }
          .sh-ibtn:hover { color:${T.text2} !important; background:${T.bg3} !important; }
          input::placeholder { color:${T.text4}; }
          input:focus { border-color:${T.border3} !important; }
          input[type=date]::-webkit-calendar-picker-indicator { filter: ${isDark?"invert(.3)":"invert(.6)"}; }
          ::-webkit-scrollbar{width:3px;height:3px;} ::-webkit-scrollbar-thumb{background:${T.border2};border-radius:3px;}
        `}</style>

        {/* 헤더 */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"22px 20px 16px"}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:T.text,letterSpacing:-0.5}}>ShortsHub</div>
            <div style={{fontSize:11,color:T.text3,letterSpacing:1.5,marginTop:1}}>CHANNEL MANAGER</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {saving&&<div style={{fontSize:11,color:T.text4,letterSpacing:1}}>saving...</div>}
            <div style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:20,padding:"4px 12px",fontSize:11,color:T.text3,letterSpacing:0.5}}>{fmtViews(totViews)} views</div>
            {/* 테마 토글 */}
            <button onClick={toggleTheme} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:20,padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:T.text2,transition:"all .2s"}}>
              {isDark?I.sun:I.moon}
              <span style={{fontSize:11,fontWeight:600}}>{isDark?"라이트":"다크"}</span>
            </button>
          </div>
        </div>

        {/* 배너 */}
        <div style={{margin:"0 16px 20px",background:isDark?"linear-gradient(135deg,#0e0e1e,#161630)":"linear-gradient(135deg,#ffffff,#f0efea)",border:`1px solid ${T.border}`,borderRadius:16,padding:"20px",boxShadow:T.shadow2,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-20,right:-20,width:120,height:120,borderRadius:"50%",background:isDark?"rgba(255,255,255,.02)":"rgba(0,0,0,.03)"}}/>
          <div style={{position:"absolute",bottom:-30,right:20,width:80,height:80,borderRadius:"50%",background:isDark?"rgba(255,255,255,.015)":"rgba(0,0,0,.02)"}}/>
          <div style={{fontSize:11,color:T.text3,letterSpacing:1.5,marginBottom:8}}>TODAY · {today}</div>
          <div style={{fontSize:28,fontWeight:300,color:T.text,letterSpacing:-1,lineHeight:1}}>
            <span style={{fontWeight:800}}>{todayDone}</span>
            <span style={{color:T.text3,fontWeight:300}}> / {channels.length}</span>
            <span style={{fontSize:14,color:T.text3,fontWeight:400,marginLeft:10}}>채널 업로드 완료</span>
          </div>
          <div style={{display:"flex",gap:6,marginTop:14}}>
            {channels.map(c=><div key={c.id} title={c.name} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:c.uploadDates.includes(today)?c.color:T.border2,transition:"all .3s",boxShadow:c.uploadDates.includes(today)?`0 0 6px ${c.color}66`:"none"}}/>
            </div>)}
          </div>
        </div>

        <div style={{padding:"0 20px 10px",fontSize:10,color:T.text3,letterSpacing:2.5,fontWeight:700}}>CHANNELS</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,padding:"0 16px"}}>
          {channels.map((c,ci)=>{
            const done=c.uploadDates.includes(today),streak=calcStreak(c.uploadDates),totV=c.videos.reduce((a,v)=>a+(v.views||0),0);
            const goalsDone=(c.goals||[]).filter(g=>g.done).length,goalsTotal=(c.goals||[]).length;
            return (
              <div key={c.id} className="sh-card" style={{...card,"--accent":c.color}}>
                <div style={{height:3,background:`linear-gradient(90deg,${c.color},${c.color}44,transparent)`,position:"absolute",top:0,left:0,right:0,borderRadius:"18px 18px 0 0"}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontSize:26,lineHeight:1}}>{c.emoji}</div>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:T.text}}>{c.name}</div>
                      <div style={{fontSize:11,color:T.text3,marginTop:1}}>{c.description||"—"}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:2,alignItems:"flex-end"}}>
                    <div style={{display:"flex",gap:1}}>
                      <button className="sh-ibtn" style={iBtn} onClick={e=>openEdit(c,e)}>{I.edit}</button>
                      <button className="sh-ibtn" style={iBtn} onClick={e=>confirmDel(c.id,e)}>{I.trash}</button>
                    </div>
                    <div style={{display:"flex",gap:1}}>
                      <button className="sh-ibtn" style={{...iBtn,opacity:ci===0?.2:1}} onClick={e=>{e.stopPropagation();moveChannel(c.id,-1);}} disabled={ci===0}>{I.up}</button>
                      <button className="sh-ibtn" style={{...iBtn,opacity:ci===channels.length-1?.2:1}} onClick={e=>{e.stopPropagation();moveChannel(c.id,1);}} disabled={ci===channels.length-1}>{I.down}</button>
                    </div>
                  </div>
                </div>
                <div onClick={()=>{setActiveId(c.id);setTab("dashboard");setCalYear(ty);setCalMonth(tm);}} style={{cursor:"pointer"}}>
                  <div style={{display:"flex",gap:16,marginBottom:14}}>
                    <MiniStat icon={I.video} label="영상"  val={c.videos.length} color={c.color} T={T}/>
                    <MiniStat icon={I.eye}   label="조회수" val={fmtViews(totV)} color={c.color} T={T}/>
                    <MiniStat icon={I.flame} label="연속"  val={`${streak}일`}  color={c.color} T={T}/>
                  </div>
                  {goalsTotal>0&&<div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:10,color:T.text3,letterSpacing:1,fontWeight:600}}>GOALS</span>
                      <span style={{fontSize:10,color:c.color,fontWeight:600}}>{goalsDone}/{goalsTotal}</span>
                    </div>
                    <div style={{height:3,background:T.bg4,borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${goalsTotal?Math.round(goalsDone/goalsTotal*100):0}%`,background:`linear-gradient(90deg,${c.color},${c.color}bb)`,borderRadius:3,transition:"width .5s"}}/>
                    </div>
                  </div>}
                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <div style={{borderRadius:8,padding:"3px 10px",fontSize:10,fontWeight:700,letterSpacing:0.5,background:done?c.color+"22":T.bg3,color:done?c.color:T.text3,border:`1px solid ${done?c.color+"44":T.border}`}}>{done?"✓ 업로드 완료":"미업로드"}</div>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="sh-addcard" onClick={openAdd} style={{background:"transparent",border:`1px dashed ${T.border2}`,borderRadius:18,minHeight:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",transition:"all .2s"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:T.bg3,display:"flex",alignItems:"center",justifyContent:"center",color:T.text3}}>{I.plus}</div>
            <span style={{fontSize:11,color:T.text3,letterSpacing:1.5,fontWeight:600}}>ADD CHANNEL</span>
          </div>
        </div>

        {chModal&&<ChModal form={chForm} setForm={setChForm} mode={chModal.mode} onSave={saveCh} onClose={()=>setChModal(null)} T={T} overlay={overlay} modal={modal} input={input}/>}
        {delConfirm&&<DelModal name={channels.find(c=>c.id===delConfirm)?.name} onCancel={()=>setDelConfirm(null)} onConfirm={execDel} T={T} overlay={overlay} modal={modal}/>}
      </div>
    );
  }

  // ══ DETAIL ══
  const uploadedToday=ch.uploadDates.includes(today),streak=calcStreak(ch.uploadDates);
  const totViews=ch.videos.reduce((a,v)=>a+(v.views||0),0),goalHit=ch.videos.filter(v=>v.views>=v.goal).length;
  const goals=ch.goals||[],goalsDone=goals.filter(g=>g.done).length;
  const {firstDay,daysInMonth}=getMonthInfo(calYear,calMonth);
  const monthUploads=ch.uploadDates.filter(d=>d.startsWith(`${calYear}-${String(calMonth).padStart(2,"0")}`)).length;
  const benchmarks=ch.benchmarks||[],ideas=ch.ideas||[],schedule=ch.schedule||[];

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Pretendard','Apple SD Gothic Neo',sans-serif",paddingBottom:60,maxWidth:680,margin:"0 auto",transition:"background .3s,color .3s"}}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        * { box-sizing:border-box; } body { margin:0; background:${T.bg}; transition:background .3s; }
        .sh-ibtn:hover { color:${T.text2} !important; background:${T.bg3} !important; }
        .sh-tab:hover { color:${T.text2} !important; }
        input::placeholder { color:${T.text4}; }
        input:focus { border-color:${T.border3} !important; outline:none; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: ${isDark?"invert(.3)":"invert(.6)"}; }
        ::-webkit-scrollbar{width:3px;height:3px;} ::-webkit-scrollbar-thumb{background:${T.border2};border-radius:3px;}
      `}</style>

      {/* 채널 헤더 */}
      <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 16px 12px",borderBottom:`1px solid ${T.border}`,background:T.bg2,boxShadow:T.shadow2}}>
        <button className="sh-ibtn" style={{...iBtn,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 12px",gap:5,color:T.text2}} onClick={()=>setActiveId(null)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="15 18 9 12 15 6"/></svg>
          <span style={{fontSize:12}}>홈</span>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
          <span style={{fontSize:24}}>{ch.emoji}</span>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:T.text}}>{ch.name}</div>
            <div style={{fontSize:11,color:T.text3}}>{ch.description}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {saving&&<span style={{fontSize:11,color:T.text4,letterSpacing:1}}>saving...</span>}
          <button onClick={toggleTheme} style={{background:T.bg3,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,color:T.text3,transition:"all .2s"}}>
            {isDark?I.sun:I.moon}
          </button>
          <button className="sh-ibtn" style={{...iBtn,border:`1px solid ${T.border}`,borderRadius:20,padding:"5px 12px",gap:5,color:T.text2}} onClick={e=>openEdit(ch,e)}>{I.edit}<span style={{fontSize:12}}>수정</span></button>
        </div>
      </div>

      {/* 탭 */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,padding:"0 4px",background:T.bg2,overflowX:"auto"}}>
        {[{id:"dashboard",label:"Dashboard"},{id:"videos",label:"Videos"},{id:"bench",label:"벤치마킹"},{id:"plan",label:"플래닝"}].map(t=>(
          <button key={t.id} className="sh-tab" style={{background:"none",border:"none",borderBottom:tab===t.id?`2px solid ${ch.color}`:"2px solid transparent",color:tab===t.id?T.text:T.text3,padding:"12px 16px",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?700:500,transition:"all .2s",letterSpacing:0.3,whiteSpace:"nowrap"}} onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab==="dashboard"&&(
        <div style={{padding:16}}>
          {/* 업로드 카드 */}
          <div style={{background:uploadedToday?`linear-gradient(135deg,${ch.color}18,${ch.color}08)`:`${T.bg2}`,border:`1px solid ${uploadedToday?ch.color+"44":T.border}`,borderRadius:14,padding:"16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:T.shadow2,transition:"all .3s"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:12,background:uploadedToday?ch.color+"22":T.bg3,display:"flex",alignItems:"center",justifyContent:"center",color:uploadedToday?ch.color:T.text3,border:`1px solid ${uploadedToday?ch.color+"44":T.border}`,flexShrink:0}}>
                {uploadedToday?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:18,height:18}}><polyline points="20 6 9 17 4 12"/></svg>:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:18,height:18}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:T.text}}>{uploadedToday?"오늘 업로드 완료 ✓":"오늘 아직 미업로드"}</div>
                <div style={{fontSize:11,color:T.text3,marginTop:2}}>{uploadedToday?`${streak}일 연속 업로드 중 🔥`:"업로드 후 완료 처리하세요"}</div>
              </div>
            </div>
            <button style={{borderRadius:20,padding:"8px 20px",fontWeight:700,cursor:"pointer",fontSize:12,transition:"all .2s",letterSpacing:0.3,background:uploadedToday?"transparent":ch.color,border:`1px solid ${uploadedToday?ch.color+"66":ch.color}`,color:uploadedToday?ch.color:"#fff",boxShadow:uploadedToday?"none":`0 4px 12px ${ch.color}44`}} onClick={toggleUpload}>{uploadedToday?"취소":"완료"}</button>
          </div>

          {/* 캘린더 */}
          <div style={block}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <button className="sh-ibtn" style={{...iBtn,background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,width:32,height:32}} onClick={prevMonth}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="15 18 9 12 15 6"/></svg></button>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:700,color:T.text}}>{calYear}년 {calMonth}월</div>
                <div style={{fontSize:11,color:ch.color,marginTop:2}}>{monthUploads}일 업로드{isCurrentMonth?` · ${streak}일 연속`:""}</div>
              </div>
              <button className="sh-ibtn" style={{...iBtn,background:T.bg3,border:`1px solid ${T.border}`,borderRadius:8,width:32,height:32,opacity:isCurrentMonth?.3:1,cursor:isCurrentMonth?"default":"pointer"}} onClick={nextMonth} disabled={isCurrentMonth}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="9 18 15 12 9 6"/></svg></button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>
              {WEEKDAYS.map((w,i)=><div key={w} style={{textAlign:"center",fontSize:10,color:i===0?"#c07070":i===6?"#7090c0":T.text3,fontWeight:700,paddingBottom:3}}>{w}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
              {Array.from({length:firstDay}).map((_,i)=><div key={"e"+i} style={{aspectRatio:"1"}}/>)}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const day=i+1,dateStr=makeDate(calYear,calMonth,day);
                const done=ch.uploadDates.includes(dateStr),isToday=dateStr===today,isFuture=dateStr>today;
                const dow=(firstDay+i)%7;
                const bg=done?ch.color:"transparent";
                const border=isToday&&!done?`2px solid ${ch.color}88`:`1px solid transparent`;
                const textColor=done?"#fff":dow===0?"#c07070":dow===6?"#7090c0":T.text2;
                return (
                  <div key={day} style={{aspectRatio:"1",borderRadius:7,background:bg,border,display:"flex",alignItems:"center",justifyContent:"center",cursor:isFuture?"default":"pointer",opacity:isFuture?.35:1,transition:"background .08s",boxShadow:done?`0 2px 8px ${ch.color}55`:"none"}}
                    onClick={()=>{if(isFuture)return;upd(activeId,c=>{const s=new Set(c.uploadDates);s.has(dateStr)?s.delete(dateStr):s.add(dateStr);return{...c,uploadDates:[...s]};});}}>
                    <span style={{fontSize:11,fontWeight:done?700:400,color:textColor,lineHeight:1,pointerEvents:"none"}}>{day}</span>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:14,marginTop:12,fontSize:10,color:T.text3,alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:ch.color,boxShadow:`0 0 4px ${ch.color}66`}}/> 업로드 완료</div>
              <div style={{marginLeft:"auto",color:T.text4,fontSize:9}}>날짜 클릭으로 수정</div>
            </div>
          </div>

          {/* 스탯 */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:12}}>
            {[{icon:I.flame,label:"연속 업로드",val:streak+"일"},{icon:I.video,label:"총 영상",val:ch.videos.length+"개"},{icon:I.eye,label:"누적 조회수",val:fmtViews(totViews)},{icon:I.target,label:"목표 달성",val:goalHit+"개"}].map(s=>(
              <div key={s.label} style={{background:T.bg2,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px",boxShadow:T.shadow2}}>
                <div style={{color:ch.color,marginBottom:10,opacity:0.8}}>{s.icon}</div>
                <div style={{fontSize:24,fontWeight:800,color:T.text,letterSpacing:-0.5}}>{s.val}</div>
                <div style={{fontSize:10,color:T.text3,marginTop:3,letterSpacing:1,fontWeight:600}}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* 목표 */}
          <div style={block}>
            <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:10,color:T.text3,letterSpacing:2,fontWeight:700}}>GOALS</div>
              {goals.length>0&&<span style={{fontSize:11,color:ch.color,marginLeft:8,fontWeight:600}}>{goalsDone}/{goals.length}</span>}
              <button style={{marginLeft:"auto",background:"transparent",border:`1px solid ${ch.color}55`,borderRadius:16,padding:"4px 12px",color:ch.color,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}} onClick={()=>setAddingGoal(true)}>{I.plus} ADD</button>
            </div>
            {goals.length>0&&<div style={{height:3,background:T.bg3,borderRadius:3,marginBottom:14,overflow:"hidden"}}><div style={{height:"100%",width:`${goals.length?Math.round(goalsDone/goals.length*100):0}%`,background:`linear-gradient(90deg,${ch.color},${ch.color}bb)`,borderRadius:3,transition:"width .5s"}}/></div>}
            {goals.length===0&&!addingGoal&&<div style={{textAlign:"center",color:T.text4,padding:"16px 0",fontSize:13}}>목표를 추가해보세요</div>}
            {goals.map(g=>(
              <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderTop:`1px solid ${T.border}`}}>
                <div style={{width:20,height:20,borderRadius:5,border:`1.5px solid ${g.done?ch.color:T.border2}`,background:g.done?ch.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all .15s"}} onClick={()=>toggleGoal(g.id)}>
                  {g.done&&<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" style={{width:11,height:11}}><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span style={{flex:1,fontSize:13,color:g.done?T.text3:T.text,textDecoration:g.done?"line-through":"none"}}>{g.text}</span>
                <button className="sh-ibtn" style={iBtn} onClick={()=>delGoal(g.id)}>{I.close}</button>
              </div>
            ))}
            {addingGoal&&(
              <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>
                <input autoFocus style={{...input,flex:1,padding:"8px 12px",fontSize:12}} value={goalInput} onChange={e=>setGoalInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addGoal();if(e.key==="Escape"){setAddingGoal(false);setGoalInput("");}}} placeholder="예: 구독자 1,000명 달성"/>
                <button style={{background:ch.color,border:"none",borderRadius:9,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 12px ${ch.color}44`}} onClick={addGoal}>추가</button>
                <button style={{background:"transparent",border:`1px solid ${T.border2}`,borderRadius:9,padding:"8px 10px",color:T.text3,fontSize:12,cursor:"pointer"}} onClick={()=>{setAddingGoal(false);setGoalInput("");}}>취소</button>
              </div>
            )}
          </div>

          {/* 최근 영상 */}
          <div style={block}>
            <div style={{fontSize:10,color:T.text3,letterSpacing:2,fontWeight:700,marginBottom:14}}>RECENT VIDEOS</div>
            {ch.videos.length===0&&<div style={{textAlign:"center",color:T.text4,padding:"16px 0",fontSize:13}}>아직 영상이 없어요</div>}
            {ch.videos.slice(0,4).map(v=>{
              const pct=Math.min(100,Math.round((v.views/v.goal)*100));
              return (
                <div key={v.id} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderTop:`1px solid ${T.border}`}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:T.text,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.title}</div>
                    <div style={{fontSize:10,color:T.text3,marginTop:2}}>{v.date}</div>
                    <div style={{height:3,background:T.bg3,borderRadius:3,marginTop:7,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:ch.color,borderRadius:3,transition:"width .5s"}}/></div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:17,fontWeight:800,color:T.text}}>{fmtViews(v.views)}</div>
                    <div style={{fontSize:10,color:pct>=100?"#5BAF82":ch.color,marginTop:1,fontWeight:600}}>{pct}% · {fmtViews(v.goal)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VIDEOS ── */}
      {tab==="videos"&&(
        <div style={{padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:10,color:T.text3,letterSpacing:2,fontWeight:700}}>VIDEOS · {ch.videos.length}</div>
            <button style={{border:"none",borderRadius:20,padding:"8px 16px",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:5,background:ch.color,boxShadow:`0 4px 14px ${ch.color}44`}} onClick={()=>setVidModal(true)}>{I.plus}<span>영상 추가</span></button>
          </div>
          {ch.videos.length===0&&<div style={{textAlign:"center",color:T.text4,padding:40,fontSize:13}}>영상을 추가해보세요</div>}
          {ch.videos.map(v=>{
            const pct=Math.min(100,Math.round((v.views/v.goal)*100));
            return (
              <div key={v.id} style={{...block,marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{flex:1,minWidth:0,paddingRight:10}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.title}</div>
                    <div style={{fontSize:10,color:T.text3,marginTop:3}}>{v.date}</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                    {v.link&&<a href={v.link} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:4,border:`1px solid ${ch.color}44`,borderRadius:14,padding:"4px 10px",fontSize:11,textDecoration:"none",color:ch.color,fontWeight:600}}>{I.link}<span>YouTube</span></a>}
                    <button className="sh-ibtn" style={iBtn} onClick={()=>setDelVidConf(v.id)}>{I.trash}</button>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div style={{fontSize:10,color:T.text3,marginBottom:4,letterSpacing:0.5}}>VIEWS — 클릭해서 수정</div>
                    {editVid===v.id?(
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <input autoFocus style={{...input,width:90,padding:"5px 8px",fontSize:15,fontWeight:700}} type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveViews(v.id);if(e.key==="Escape")setEditVid(null);}}/>
                        <button style={{background:ch.color,border:"none",borderRadius:7,padding:"5px 10px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}} onClick={()=>saveViews(v.id)}>저장</button>
                        <button style={{background:"transparent",border:`1px solid ${T.border2}`,borderRadius:7,padding:"5px 8px",color:T.text3,fontSize:11,cursor:"pointer"}} onClick={()=>setEditVid(null)}>취소</button>
                      </div>
                    ):(
                      <div style={{fontSize:26,fontWeight:800,color:T.text,cursor:"pointer",letterSpacing:-1}} onClick={()=>startEdit(v)}>{fmtViews(v.views)}<span style={{fontSize:12,opacity:.25,marginLeft:4,fontWeight:400}}>✏</span></div>
                    )}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,color:T.text3,marginBottom:4,letterSpacing:0.5}}>GOAL — 클릭해서 수정</div>
                    {editGoalVid===v.id?(
                      <div style={{display:"flex",gap:6,alignItems:"center",justifyContent:"flex-end"}}>
                        <input autoFocus style={{...input,width:90,padding:"5px 8px",fontSize:13,fontWeight:700,textAlign:"right"}} type="number" value={editGoalVal} onChange={e=>setEditGoalVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveGoal(v.id);if(e.key==="Escape")setEditGoalVid(null);}}/>
                        <button style={{background:ch.color,border:"none",borderRadius:7,padding:"5px 10px",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}} onClick={()=>saveGoal(v.id)}>저장</button>
                      </div>
                    ):(
                      <div style={{fontSize:20,fontWeight:800,color:pct>=100?"#5BAF82":ch.color,cursor:"pointer"}} onClick={()=>startGoalEdit(v)}>{pct}%<span style={{fontSize:10,color:T.text3,fontWeight:400,marginLeft:4}}>{fmtViews(v.goal)}<span style={{opacity:.3,marginLeft:2}}>✏</span></span></div>
                    )}
                  </div>
                </div>
                <div style={{height:3,background:T.bg3,borderRadius:3,marginTop:12,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:ch.color,borderRadius:3,transition:"width .5s"}}/></div>
              </div>
            );
          })}
          {vidModal&&(
            <div style={overlay} onClick={()=>setVidModal(false)}>
              <div style={modal} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:20}}>영상 추가</div>
                <FField label="제목" value={vidForm.title} onChange={v=>setVidForm(p=>({...p,title:v}))} placeholder="영상 제목 입력" T={T} input={input}/>
                <FField label="유튜브 링크 (선택)" value={vidForm.link} onChange={v=>setVidForm(p=>({...p,link:v}))} placeholder="https://youtube.com/shorts/..." T={T} input={input}/>
                <FField label="목표 조회수" value={vidForm.goal} onChange={v=>setVidForm(p=>({...p,goal:v}))} placeholder="10000" type="number" T={T} input={input}/>
                <div style={{display:"flex",gap:10}}><button style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,borderRadius:11,padding:12,color:T.text3,cursor:"pointer",fontSize:13}} onClick={()=>setVidModal(false)}>취소</button><button style={{flex:1,border:"none",borderRadius:11,padding:12,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13,background:ch.color,boxShadow:`0 4px 14px ${ch.color}44`}} onClick={addVid}>추가</button></div>
              </div>
            </div>
          )}
          {delVidConf&&(
            <div style={overlay} onClick={()=>setDelVidConf(null)}>
              <div style={{...modal,padding:"28px 24px 40px"}} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:10,color:T.text3,letterSpacing:2,textAlign:"center",marginBottom:16,fontWeight:700}}>영상 삭제</div>
                <div style={{fontSize:13,color:T.text2,textAlign:"center",marginBottom:24,lineHeight:1.7}}>이 영상을 삭제할까요?<br/>되돌릴 수 없어요.</div>
                <div style={{display:"flex",gap:10}}><button style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,borderRadius:11,padding:12,color:T.text3,cursor:"pointer",fontSize:13}} onClick={()=>setDelVidConf(null)}>취소</button><button style={{flex:1,border:"none",borderRadius:11,padding:12,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13,background:"#b04040"}} onClick={execDelVid}>삭제</button></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 벤치마킹 ── */}
      {tab==="bench"&&(
        <div style={{padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:10,color:T.text3,letterSpacing:2,fontWeight:700}}>BENCHMARKS · {benchmarks.length}</div>
            <button style={{border:"none",borderRadius:20,padding:"8px 16px",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:5,background:ch.color,boxShadow:`0 4px 14px ${ch.color}44`}} onClick={()=>setBmModal(true)}>{I.plus}<span>채널 추가</span></button>
          </div>
          {benchmarks.length===0&&(
            <div style={{textAlign:"center",padding:"50px 20px"}}>
              <div style={{color:ch.color,opacity:0.3,marginBottom:14,display:"flex",justifyContent:"center"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{width:48,height:48}}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
              <div style={{color:T.text2,fontSize:13,fontWeight:600}}>레퍼런스 채널을 추가해보세요</div>
              <div style={{color:T.text3,fontSize:11,marginTop:5}}>참고하는 유튜브 채널을 저장해두면 편리해요</div>
            </div>
          )}
          {benchmarks.map(b=>(
            <div key={b.id} style={block}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:44,height:44,borderRadius:12,background:ch.color+"18",display:"flex",alignItems:"center",justifyContent:"center",color:ch.color,flexShrink:0,border:`1px solid ${ch.color}30`}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:20,height:20}}><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor"/></svg>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:T.text}}>{b.name}</div>
                  {b.url&&<div style={{fontSize:11,color:T.text3,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.url}</div>}
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0}}>
                  {b.url&&<a href={b.url.startsWith("http")?b.url:"https://"+b.url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:4,border:`1px solid ${ch.color}44`,borderRadius:14,padding:"5px 12px",fontSize:12,textDecoration:"none",color:ch.color,fontWeight:700}}>열기 ↗</a>}
                  <button className="sh-ibtn" style={iBtn} onClick={()=>delBm(b.id)}>{I.trash}</button>
                </div>
              </div>
              {b.note&&<div style={{marginTop:12,fontSize:12,color:T.text2,lineHeight:1.6,borderLeft:`2px solid ${ch.color}55`,paddingLeft:10,background:T.bg3,borderRadius:"0 8px 8px 0",padding:"8px 10px",marginLeft:0}}>{b.note}</div>}
            </div>
          ))}
          {bmModal&&(
            <div style={overlay} onClick={()=>setBmModal(false)}>
              <div style={modal} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:20}}>벤치마킹 채널 추가</div>
                <FField label="채널명" value={bmForm.name} onChange={v=>setBmForm(p=>({...p,name:v}))} placeholder="예: 침착맨, 1분미만 등" T={T} input={input}/>
                <FField label="유튜브 링크" value={bmForm.url} onChange={v=>setBmForm(p=>({...p,url:v}))} placeholder="https://youtube.com/@..." T={T} input={input}/>
                <FField label="채널 특징 / 메모" value={bmForm.note} onChange={v=>setBmForm(p=>({...p,note:v}))} placeholder="예: 짧고 임팩트 있는 편집, 썸네일 스타일 참고" T={T} input={input}/>
                <div style={{display:"flex",gap:10}}><button style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,borderRadius:11,padding:12,color:T.text3,cursor:"pointer",fontSize:13}} onClick={()=>setBmModal(false)}>취소</button><button style={{flex:1,border:"none",borderRadius:11,padding:12,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13,background:ch.color,boxShadow:`0 4px 14px ${ch.color}44`}} onClick={addBm}>추가</button></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 플래닝 ── */}
      {tab==="plan"&&(
        <div style={{padding:16}}>
          <div style={block}>
            <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:6,color:T.text3}}>{I.cal}<span style={{fontSize:10,letterSpacing:2,fontWeight:700}}>UPLOAD SCHEDULE</span></div>
              <button style={{marginLeft:"auto",background:"transparent",border:`1px solid ${ch.color}55`,borderRadius:16,padding:"4px 12px",color:ch.color,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}} onClick={()=>setScModal(true)}>{I.plus} ADD</button>
            </div>
            {schedule.length===0&&<div style={{textAlign:"center",color:T.text4,padding:"16px 0",fontSize:13}}>예정된 영상을 미리 계획해보세요</div>}
            {schedule.map(s=>{
              const isPast=s.date<today;
              return (
                <div key={s.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 0",borderTop:`1px solid ${T.border}`,opacity:s.done?.4:1}}>
                  <div style={{width:20,height:20,borderRadius:5,border:`1.5px solid ${s.done?ch.color:isPast?"#c06060":T.border2}`,background:s.done?ch.color:isPast?isDark?"#2a1010":"#fff0f0":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,marginTop:2,transition:"all .15s"}} onClick={()=>toggleSc(s.id)}>
                    {s.done&&<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" style={{width:11,height:11}}><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:s.done?T.text3:T.text,textDecoration:s.done?"line-through":"none"}}>{s.title}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:3}}>
                      <span style={{fontSize:10,color:isPast&&!s.done?"#c06060":ch.color}}>{s.date}</span>
                      {isPast&&!s.done&&<span style={{fontSize:9,background:isDark?"#3a1010":"#ffe0e0",color:"#c06060",borderRadius:4,padding:"1px 6px",fontWeight:600}}>지남</span>}
                    </div>
                    {s.memo&&<div style={{fontSize:11,color:T.text3,marginTop:3}}>{s.memo}</div>}
                  </div>
                  <button className="sh-ibtn" style={iBtn} onClick={()=>delSc(s.id)}>{I.close}</button>
                </div>
              );
            })}
          </div>

          <div style={block}>
            <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:6,color:T.text3}}>{I.bulb}<span style={{fontSize:10,letterSpacing:2,fontWeight:700}}>CONTENT IDEAS</span></div>
              <span style={{fontSize:11,color:ch.color,marginLeft:8,fontWeight:600}}>{ideas.filter(i=>!i.done).length}개 대기</span>
              <button style={{marginLeft:"auto",background:"transparent",border:`1px solid ${ch.color}55`,borderRadius:16,padding:"4px 12px",color:ch.color,fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4}} onClick={()=>setAddingIdea(true)}>{I.plus} ADD</button>
            </div>
            {ideas.length===0&&!addingIdea&&<div style={{textAlign:"center",color:T.text4,padding:"16px 0",fontSize:13}}>떠오르는 아이디어를 바로 적어두세요</div>}
            {addingIdea&&(
              <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
                <input autoFocus style={{...input,flex:1,padding:"8px 12px",fontSize:12}} value={ideaInput} onChange={e=>setIdeaInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addIdea();if(e.key==="Escape"){setAddingIdea(false);setIdeaInput("");}}} placeholder="예: 요즘 유행하는 밈으로 쇼츠 만들기"/>
                <button style={{background:ch.color,border:"none",borderRadius:9,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",boxShadow:`0 4px 12px ${ch.color}44`}} onClick={addIdea}>추가</button>
                <button style={{background:"transparent",border:`1px solid ${T.border2}`,borderRadius:9,padding:"8px 10px",color:T.text3,fontSize:12,cursor:"pointer"}} onClick={()=>{setAddingIdea(false);setIdeaInput("");}}>취소</button>
              </div>
            )}
            {ideas.map(idea=>(
              <div key={idea.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"9px 0",borderTop:`1px solid ${T.border}`}}>
                <div style={{width:20,height:20,borderRadius:5,border:`1.5px solid ${idea.done?ch.color:T.border2}`,background:idea.done?ch.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,marginTop:2,transition:"all .15s"}} onClick={()=>toggleIdea(idea.id)}>
                  {idea.done&&<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" style={{width:11,height:11}}><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  {editIdea===idea.id?(
                    <div style={{display:"flex",gap:6}}>
                      <input autoFocus style={{...input,flex:1,padding:"5px 8px",fontSize:12}} value={editIdeaVal} onChange={e=>setEditIdeaVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveIdeaEdit(idea.id);if(e.key==="Escape")setEditIdea(null);}}/>
                      <button style={{background:ch.color,border:"none",borderRadius:7,padding:"5px 10px",color:"#fff",fontSize:11,cursor:"pointer",fontWeight:700}} onClick={()=>saveIdeaEdit(idea.id)}>저장</button>
                    </div>
                  ):(
                    <div style={{fontSize:13,color:idea.done?T.text3:T.text,textDecoration:idea.done?"line-through":"none",cursor:"pointer"}} onClick={()=>{setEditIdea(idea.id);setEditIdeaVal(idea.text);}}>{idea.text}<span style={{fontSize:10,opacity:.2,marginLeft:4}}>✏</span></div>
                  )}
                  <div style={{fontSize:10,color:T.text3,marginTop:2}}>{idea.date}</div>
                </div>
                <button className="sh-ibtn" style={iBtn} onClick={()=>delIdea(idea.id)}>{I.close}</button>
              </div>
            ))}
          </div>

          {scModal&&(
            <div style={overlay} onClick={()=>setScModal(false)}>
              <div style={modal} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:20}}>업로드 일정 추가</div>
                <FField label="영상 제목 / 내용" value={scForm.title} onChange={v=>setScForm(p=>({...p,title:v}))} placeholder="예: 여름 핫딜 TOP5" T={T} input={input}/>
                <FField label="예정 날짜" value={scForm.date} onChange={v=>setScForm(p=>({...p,date:v}))} type="date" T={T} input={input}/>
                <FField label="메모 (선택)" value={scForm.memo} onChange={v=>setScForm(p=>({...p,memo:v}))} placeholder="참고 사항, 필요한 준비 등" T={T} input={input}/>
                <div style={{display:"flex",gap:10}}><button style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,borderRadius:11,padding:12,color:T.text3,cursor:"pointer",fontSize:13}} onClick={()=>setScModal(false)}>취소</button><button style={{flex:1,border:"none",borderRadius:11,padding:12,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13,background:ch.color,boxShadow:`0 4px 14px ${ch.color}44`}} onClick={addSc}>추가</button></div>
              </div>
            </div>
          )}
        </div>
      )}

      {chModal&&<ChModal form={chForm} setForm={setChForm} mode={chModal.mode} onSave={saveCh} onClose={()=>setChModal(null)} T={T} overlay={overlay} modal={modal} input={input}/>}
      {delConfirm&&<DelModal name={channels.find(c=>c.id===delConfirm)?.name} onCancel={()=>setDelConfirm(null)} onConfirm={execDel} T={T} overlay={overlay} modal={modal}/>}
    </div>
  );
}

function MiniStat({icon,label,val,color,T}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:3}}>
      <div style={{display:"flex",alignItems:"center",gap:4,color,opacity:0.7}}>{icon}<span style={{fontSize:10,letterSpacing:0.5,color:T.text3,fontWeight:600}}>{label.toUpperCase()}</span></div>
      <div style={{fontSize:16,fontWeight:800,color:T.text}}>{val}</div>
    </div>
  );
}
function DelModal({name,onCancel,onConfirm,T,overlay,modal}){
  return(
    <div style={overlay} onClick={onCancel}>
      <div style={{...modal,padding:"28px 24px 40px"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:10,color:T.text3,letterSpacing:2,textAlign:"center",marginBottom:16,fontWeight:700}}>채널 삭제</div>
        <div style={{fontSize:17,fontWeight:800,color:T.text,textAlign:"center",marginBottom:8}}>{name}</div>
        <div style={{fontSize:13,color:T.text2,textAlign:"center",marginBottom:28,lineHeight:1.7}}>채널과 모든 데이터가<br/>영구적으로 삭제돼요.</div>
        <div style={{display:"flex",gap:10}}>
          <button style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,borderRadius:11,padding:12,color:T.text3,cursor:"pointer",fontSize:13}} onClick={onCancel}>취소</button>
          <button style={{flex:1,border:"none",borderRadius:11,padding:12,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13,background:"#b04040"}} onClick={onConfirm}>삭제</button>
        </div>
      </div>
    </div>
  );
}
function ChModal({form,setForm,mode,onSave,onClose,T,overlay,modal,input}){
  return(
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,color:T.text,marginBottom:20}}>{mode==="add"?"새 채널":"채널 수정"}</div>
        <FField label="채널명" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="예: 먹방채널" T={T} input={input}/>
        <FField label="채널 설명" value={form.description} onChange={v=>setForm(p=>({...p,description:v}))} placeholder="채널 소개" T={T} input={input}/>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:T.text3,marginBottom:8,fontWeight:700,letterSpacing:1}}>이모지</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
            {EMOJIS.map(e=>(<div key={e} style={{fontSize:20,cursor:"pointer",padding:"5px 7px",borderRadius:8,background:form.emoji===e?T.bg4:"transparent",border:form.emoji===e?`1px solid ${T.border2}`:"1px solid transparent",transition:"all .1s"}} onClick={()=>setForm(p=>({...p,emoji:e}))}>{e}</div>))}
          </div>
        </div>
        <div style={{marginBottom:22}}>
          <div style={{fontSize:10,color:T.text3,marginBottom:8,fontWeight:700,letterSpacing:1}}>색상</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {COLORS.map(c=>(<div key={c} style={{width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",border:form.color===c?"2px solid white":"2px solid transparent",boxShadow:form.color===c?`0 0 0 2px ${c}`:"none",transition:"all .15s"}} onClick={()=>setForm(p=>({...p,color:c}))}/>))}
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button style={{flex:1,background:"transparent",border:`1px solid ${T.border2}`,borderRadius:11,padding:12,color:T.text3,cursor:"pointer",fontSize:13}} onClick={onClose}>취소</button>
          <button style={{flex:1,border:"none",borderRadius:11,padding:12,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13,background:form.color,boxShadow:`0 4px 14px ${form.color}44`}} onClick={onSave}>{mode==="add"?"추가":"저장"}</button>
        </div>
      </div>
    </div>
  );
}
function FField({label,value,onChange,placeholder,type="text",T,input}){
  return(
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,color:T.text3,marginBottom:6,fontWeight:700,letterSpacing:1}}>{label}</div>
      <input style={input} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
    </div>
  );
}
