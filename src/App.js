import { useState, useEffect } from "react";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function fmtViews(n) {
  n = n || 0;
  if (n >= 10000) return (n/10000).toFixed(1)+"만";
  if (n >= 1000)  return (n/1000).toFixed(1)+"천";
  return n.toString();
}
function uid() { return "i"+Math.random().toString(36).slice(2,9); }
function getMonthInfo(year, month) {
  return { firstDay: new Date(year,month-1,1).getDay(), daysInMonth: new Date(year,month,0).getDate() };
}
function makeDate(y,m,d) { return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function calcStreak(uploadDates) {
  const set = new Set(uploadDates); let streak=0; const d=new Date();
  while(true){const s=makeDate(d.getFullYear(),d.getMonth()+1,d.getDate());if(set.has(s)){streak++;d.setDate(d.getDate()-1);}else break;}
  return streak;
}
// 구버전 채널 데이터 안전하게 마이그레이션
function migrateChannel(c) {
  return {
    ...c,
    benchmarks: c.benchmarks||[],
    ideas: c.ideas||[],
    schedule: c.schedule||[],
    goals: c.goals||[],
    videos: (c.videos||[]).map(v=>({goal:10000,...v})),
  };
}

const today = todayStr();
const [ty,tm] = today.split("-").map(Number);
const STORAGE_KEY = "shortshub-data-v3";

const INIT_CHANNELS = [{
  id:"ch_1", name:"쇼핑채널", emoji:"🛍️", color:"#E8856A", description:"핫딜 & 리뷰 쇼츠",
  uploadDates:[makeDate(ty,tm,Math.max(1,new Date().getDate()-2)), makeDate(ty,tm,Math.max(1,new Date().getDate()-1)), today],
  videos:[{id:"v1",title:"여름 핫딜 TOP5",link:"",date:today,views:4200,goal:10000}],
  goals:[{id:"g1",text:"구독자 1,000명 달성",done:false},{id:"g2",text:"조회수 1만 달성",done:true}],
  benchmarks:[{id:"b1",name:"1분미만",url:"https://youtube.com/@1minute",note:"짧고 임팩트 있는 편집 스타일 참고"}],
  ideas:[{id:"i1",text:"편의점 신상 리뷰 쇼츠",done:false,date:today}],
  schedule:[],
}];

const EMOJIS = ["🛍️","🏆","🎬","🍔","💄","🎮","💰","🐶","✈️","🏋️","📚","🎵","😂","🌿","⚽","🤖","👗","🏠","🎨","💡"];
const COLORS  = ["#E8856A","#6A9EBF","#7B6FD4","#C4A44A","#5BAF82","#C46E45","#9B6CC4","#4AABB8","#BF6A7A","#6A8FBF"];
const WEEKDAYS = ["일","월","화","수","목","금","토"];

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
  bulb:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.5-1.5 4.5-3 6H8c-1.5-1.5-3-3.5-3-6a7 7 0 017-7z"/></svg>,
  cal:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  up:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13}}><polyline points="18 15 12 9 6 15"/></svg>,
  down:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:13,height:13}}><polyline points="6 9 12 15 18 9"/></svg>,
};

export default function App() {
  const [channels,    setChannels]   = useState(INIT_CHANNELS);
  const [loaded,      setLoaded]     = useState(false);
  const [saving,      setSaving]     = useState(false);
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
  const [delVidConf,  setDelVidConf] = useState(null); // 영상 삭제 확인
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

  const ch  = channels.find(c => c.id === activeId);
  const upd = (id, fn) => setChannels(p => p.map(c => c.id===id ? fn(c) : c));

  // localStorage 저장/불러오기 (마이그레이션 포함)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChannels(JSON.parse(saved).map(migrateChannel));
    } catch(_){}
    setLoaded(true);
  },[]);
  useEffect(() => {
    if(!loaded) return;
    setSaving(true);
    const t = setTimeout(()=>{ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(channels));}catch(_){} setSaving(false); },800);
    return ()=>clearTimeout(t);
  },[channels,loaded]);

  const toggleUpload = () => upd(activeId, c=>{ const s=new Set(c.uploadDates); s.has(today)?s.delete(today):s.add(today); return {...c,uploadDates:[...s]}; });
  const prevMonth = () => { calMonth===1?(setCalYear(y=>y-1),setCalMonth(12)):setCalMonth(m=>m-1); };
  const nextMonth = () => { if(calYear===ty&&calMonth>=tm)return; calMonth===12?(setCalYear(y=>y+1),setCalMonth(1)):setCalMonth(m=>m+1); };
  const isCurrentMonth = calYear===ty&&calMonth===tm;

  const openAdd  = () => { setChForm({name:"",emoji:"🎬",color:"#7B6FD4",description:""}); setChModal({mode:"add"}); };
  const openEdit = (c,e) => { e?.stopPropagation(); setChForm({name:c.name,emoji:c.emoji,color:c.color,description:c.description}); setChModal({mode:"edit",id:c.id}); };
  const saveCh   = () => {
    if(!chForm.name.trim()) return;
    chModal.mode==="add"
      ? setChannels(p=>[...p,{id:uid(),...chForm,uploadDates:[],videos:[],goals:[],benchmarks:[],ideas:[],schedule:[]}])
      : upd(chModal.id,c=>({...c,...chForm}));
    setChModal(null);
  };
  const confirmDel = (id,e) => { e?.stopPropagation(); setDelConfirm(id); };
  const execDel    = () => { setChannels(p=>p.filter(c=>c.id!==delConfirm)); if(activeId===delConfirm)setActiveId(null); setDelConfirm(null); };

  // 채널 순서 이동
  const moveChannel = (id, dir) => {
    setChannels(p => {
      const i = p.findIndex(c=>c.id===id);
      const n = i + dir;
      if(n<0||n>=p.length) return p;
      const arr = [...p];
      [arr[i],arr[n]] = [arr[n],arr[i]];
      return arr;
    });
  };

  const addVid = () => {
    if(!vidForm.title.trim()) return;
    const v={id:uid(),title:vidForm.title,link:vidForm.link,date:today,views:0,goal:parseInt(vidForm.goal)||10000};
    upd(activeId,c=>{ const s=new Set(c.uploadDates); s.add(today); return {...c,videos:[v,...c.videos],uploadDates:[...s]}; });
    setVidForm({title:"",link:"",goal:"10000"}); setVidModal(false);
  };
  const execDelVid = () => { upd(activeId,c=>({...c,videos:c.videos.filter(v=>v.id!==delVidConf)})); setDelVidConf(null); };
  const startEdit  = v => { setEditVid(v.id); setEditVal(String(v.views)); };
  const saveViews  = vid => { upd(activeId,c=>({...c,videos:c.videos.map(v=>v.id===vid?{...v,views:parseInt(editVal)||0}:v)})); setEditVid(null); };
  const startGoalEdit = v => { setEditGoalVid(v.id); setEditGoalVal(String(v.goal)); };
  const saveGoal   = vid => { upd(activeId,c=>({...c,videos:c.videos.map(v=>v.id===vid?{...v,goal:parseInt(editGoalVal)||10000}:v)})); setEditGoalVid(null); };

  const addGoal    = () => { if(!goalInput.trim())return; upd(activeId,c=>({...c,goals:[...(c.goals||[]),{id:uid(),text:goalInput.trim(),done:false}]})); setGoalInput(""); setAddingGoal(false); };
  const toggleGoal = gid => upd(activeId,c=>({...c,goals:(c.goals||[]).map(g=>g.id===gid?{...g,done:!g.done}:g)}));
  const delGoal    = gid => upd(activeId,c=>({...c,goals:(c.goals||[]).filter(g=>g.id!==gid)}));

  const addBm  = () => { if(!bmForm.name.trim())return; upd(activeId,c=>({...c,benchmarks:[...(c.benchmarks||[]),{id:uid(),...bmForm}]})); setBmForm({name:"",url:"",note:""}); setBmModal(false); };
  const delBm  = bid => upd(activeId,c=>({...c,benchmarks:(c.benchmarks||[]).filter(b=>b.id!==bid)}));

  const addIdea  = () => { if(!ideaInput.trim())return; upd(activeId,c=>({...c,ideas:[...(c.ideas||[]),{id:uid(),text:ideaInput.trim(),done:false,date:today}]})); setIdeaInput(""); setAddingIdea(false); };
  const toggleIdea = iid => upd(activeId,c=>({...c,ideas:(c.ideas||[]).map(i=>i.id===iid?{...i,done:!i.done}:i)}));
  const delIdea  = iid => upd(activeId,c=>({...c,ideas:(c.ideas||[]).filter(i=>i.id!==iid)}));
  const saveIdeaEdit = iid => { upd(activeId,c=>({...c,ideas:(c.ideas||[]).map(i=>i.id===iid?{...i,text:editIdeaVal}:i)})); setEditIdea(null); };

  const addSc    = () => { if(!scForm.title.trim()||!scForm.date)return; upd(activeId,c=>({...c,schedule:[...(c.schedule||[]),{id:uid(),...scForm,done:false}].sort((a,b)=>a.date.localeCompare(b.date))})); setScForm({title:"",date:"",memo:""}); setScModal(false); };
  const toggleSc = sid => upd(activeId,c=>({...c,schedule:(c.schedule||[]).map(s=>s.id===sid?{...s,done:!s.done}:s)}));
  const delSc    = sid => upd(activeId,c=>({...c,schedule:(c.schedule||[]).filter(s=>s.id!==sid)}));

  if(!loaded) return <div style={{...S.root,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{color:"#3a3a4a",fontSize:14,letterSpacing:2}}>LOADING</div></div>;

  // ══ HOME ══
  if(!activeId) {
    const totViews=channels.reduce((s,c)=>s+c.videos.reduce((a,v)=>a+(v.views||0),0),0);
    const todayDone=channels.filter(c=>c.uploadDates.includes(today)).length;
    return (
      <div style={S.root}><style>{CSS}</style>
        <div style={S.hdr}>
          <div><div style={S.logo}>ShortsHub</div><div style={{fontSize:11,color:"#3a3a52",letterSpacing:1,marginTop:1}}>CHANNEL MANAGER</div></div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {saving&&<div style={{fontSize:11,color:"#3a3a4a",letterSpacing:1}}>saving...</div>}
            <div style={S.pill}>{fmtViews(totViews)} views</div>
          </div>
        </div>
        <div style={S.banner}>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            <div style={{fontSize:11,color:"#4a4a62",letterSpacing:1}}>TODAY · {today}</div>
            <div style={{fontSize:24,fontWeight:300,color:"#c8c8e0",letterSpacing:-0.5}}>
              <span style={{fontWeight:700,color:"#fff"}}>{todayDone}</span>
              <span style={{color:"#3a3a52"}}> / {channels.length}</span>
              <span style={{fontSize:13,color:"#4a4a62",fontWeight:400,marginLeft:8}}>채널 업로드 완료</span>
            </div>
          </div>
          <div style={{display:"flex",gap:6}}>{channels.map(c=><div key={c.id} title={c.name} style={{width:8,height:8,borderRadius:"50%",background:c.uploadDates.includes(today)?c.color:"#2a2a38",transition:"all .3s"}}/>)}</div>
        </div>
        <div style={{padding:"0 20px 10px",fontSize:11,color:"#3a3a52",letterSpacing:2}}>CHANNELS</div>
        <div style={S.grid}>
          {channels.map((c,ci)=>{
            const done=c.uploadDates.includes(today),streak=calcStreak(c.uploadDates),totV=c.videos.reduce((a,v)=>a+(v.views||0),0);
            const goalsDone=(c.goals||[]).filter(g=>g.done).length,goalsTotal=(c.goals||[]).length;
            return (
              <div key={c.id} style={{...S.card,"--accent":c.color}} className="card">
                <div style={{height:2,background:`linear-gradient(90deg,${c.color},transparent)`,borderRadius:"16px 16px 0 0",position:"absolute",top:0,left:0,right:0}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:26}}>{c.emoji}</span>
                    <div><div style={{fontSize:15,fontWeight:700,color:"#d8d8f0"}}>{c.name}</div><div style={{fontSize:11,color:"#5a5a72",marginTop:1}}>{c.description||"—"}</div></div>
                  </div>
                  <div style={{display:"flex",gap:2,flexDirection:"column",alignItems:"flex-end"}}>
                    <div style={{display:"flex",gap:2}}>
                      <button style={S.iBtn} onClick={e=>openEdit(c,e)}>{I.edit}</button>
                      <button style={S.iBtn} onClick={e=>confirmDel(c.id,e)}>{I.trash}</button>
                    </div>
                    <div style={{display:"flex",gap:2}}>
                      <button style={{...S.iBtn,opacity:ci===0?0.2:1}} onClick={e=>{e.stopPropagation();moveChannel(c.id,-1);}} disabled={ci===0}>{I.up}</button>
                      <button style={{...S.iBtn,opacity:ci===channels.length-1?0.2:1}} onClick={e=>{e.stopPropagation();moveChannel(c.id,1);}} disabled={ci===channels.length-1}>{I.down}</button>
                    </div>
                  </div>
                </div>
                <div onClick={()=>{setActiveId(c.id);setTab("dashboard");setCalYear(ty);setCalMonth(tm);}} style={{cursor:"pointer"}}>
                  <div style={{display:"flex",gap:16,marginBottom:12}}>
                    <MiniStat icon={I.video} label="영상"  val={c.videos.length} color={c.color}/>
                    <MiniStat icon={I.eye}   label="조회수" val={fmtViews(totV)} color={c.color}/>
                    <MiniStat icon={I.flame} label="연속"  val={`${streak}일`}  color={c.color}/>
                  </div>
                  {goalsTotal>0&&<div style={{marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:10,color:"#4a4a62",letterSpacing:1}}>GOALS</span><span style={{fontSize:10,color:c.color}}>{goalsDone}/{goalsTotal}</span></div><div style={{height:2,background:"#1e1e2a",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${goalsTotal?Math.round(goalsDone/goalsTotal*100):0}%`,background:c.color,transition:"width .5s"}}/></div></div>}
                  <div style={{display:"flex",justifyContent:"flex-end"}}><div style={{...S.statusTag,background:done?c.color+"22":"#1e1e2a",color:done?c.color:"#4a4a5a",border:`1px solid ${done?c.color+"44":"#3a3a48"}`}}>{done?"업로드 완료":"미업로드"}</div></div>
                </div>
              </div>
            );
          })}
          <div style={S.addCard} className="add-card" onClick={openAdd}><div style={{color:"#3a3a50",marginBottom:6}}>{I.plus}</div><span style={{fontSize:12,color:"#3a3a50",letterSpacing:1}}>ADD CHANNEL</span></div>
        </div>
        {chModal&&<ChModal form={chForm} setForm={setChForm} mode={chModal.mode} onSave={saveCh} onClose={()=>setChModal(null)}/>}
        {delConfirm&&<DelModal name={channels.find(c=>c.id===delConfirm)?.name} onCancel={()=>setDelConfirm(null)} onConfirm={execDel}/>}
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
    <div style={S.root}><style>{CSS}</style>
      <div style={{...S.chHdr,borderBottom:`1px solid ${ch.color}22`}}>
        <button style={S.backBtn} onClick={()=>setActiveId(null)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="15 18 9 12 15 6"/></svg>
          <span>홈</span>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
          <span style={{fontSize:24}}>{ch.emoji}</span>
          <div><div style={{fontSize:17,fontWeight:700,color:"#d8d8f0"}}>{ch.name}</div><div style={{fontSize:11,color:"#5a5a72"}}>{ch.description}</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {saving&&<span style={{fontSize:11,color:"#3a3a4a",letterSpacing:1}}>saving...</span>}
          <button style={{...S.iBtn,border:"1px solid #2a2a38",borderRadius:20,padding:"5px 12px",display:"flex",alignItems:"center",gap:5,color:"#6a6a82"}} onClick={e=>openEdit(ch,e)}>{I.edit}<span style={{fontSize:12}}>수정</span></button>
        </div>
      </div>

      <div style={S.tabs}>
        {[{id:"dashboard",label:"Dashboard"},{id:"videos",label:"Videos"},{id:"bench",label:"벤치마킹"},{id:"plan",label:"플래닝"}].map(t=>(
          <button key={t.id} style={{...S.tab,...(tab===t.id?{color:"#d8d8f0",borderBottom:`1px solid ${ch.color}`}:{})}} onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {tab==="dashboard"&&(
        <div style={S.pad}>
          <div style={{...S.uploadCard,borderColor:uploadedToday?ch.color+"44":"#1e1e2a",background:uploadedToday?ch.color+"0d":"#0e0e16"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:uploadedToday?ch.color+"22":"#1a1a24",display:"flex",alignItems:"center",justifyContent:"center",color:uploadedToday?ch.color:"#4a4a62",border:`1px solid ${uploadedToday?ch.color+"44":"#2a2a34"}`}}>
                {uploadedToday?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:16,height:16}}><polyline points="20 6 9 17 4 12"/></svg>:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:16,height:16}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:"#c8c8e0"}}>{uploadedToday?"오늘 업로드 완료":"오늘 아직 미업로드"}</div>
                <div style={{fontSize:11,color:"#5a5a72",marginTop:2}}>{uploadedToday?`현재 ${streak}일 연속 업로드 중`:"업로드 후 완료 처리하세요"}</div>
              </div>
            </div>
            <button style={{...S.uploadBtn,background:uploadedToday?"transparent":ch.color,border:`1px solid ${uploadedToday?ch.color+"66":ch.color}`,color:uploadedToday?ch.color:"#fff"}} onClick={toggleUpload}>{uploadedToday?"취소":"완료"}</button>
          </div>

          {/* 캘린더 */}
          <div style={S.block}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <button style={S.calNav} onClick={prevMonth}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="15 18 9 12 15 6"/></svg></button>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:600,color:"#c8c8e0"}}>{calYear}년 {calMonth}월</div>
                <div style={{fontSize:11,color:ch.color,marginTop:2,letterSpacing:0.5}}>{monthUploads}일 업로드{isCurrentMonth?` · ${streak}일 연속`:""}</div>
              </div>
              <button style={{...S.calNav,opacity:isCurrentMonth?0.2:1,cursor:isCurrentMonth?"default":"pointer"}} onClick={nextMonth} disabled={isCurrentMonth}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="9 18 15 12 9 6"/></svg></button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>
              {WEEKDAYS.map((w,i)=><div key={w} style={{textAlign:"center",fontSize:10,letterSpacing:0.5,color:i===0?"#a06060":i===6?"#6080a0":"#5a5a72",fontWeight:600,paddingBottom:2}}>{w}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {Array.from({length:firstDay}).map((_,i)=><div key={"e"+i} style={{aspectRatio:"1"}}/>)}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const day=i+1,dateStr=makeDate(calYear,calMonth,day);
                const done=ch.uploadDates.includes(dateStr);
                const isToday=dateStr===today,isFuture=dateStr>today;
                const dow=(firstDay+i)%7;
                const bg=done?ch.color+"dd":"transparent";
                const border=isToday&&!done?`2px solid ${ch.color}55`:"1px solid transparent";
                const textColor=done?"#fff":dow===0?"#b06060":dow===6?"#6090b0":"#8a8aa2";
                return (
                  <div key={day}
                    style={{aspectRatio:"1",borderRadius:6,background:bg,border,display:"flex",alignItems:"center",justifyContent:"center",cursor:isFuture?"default":"pointer",opacity:isFuture?0.4:1,transition:"background .08s"}}
                    onClick={()=>{if(isFuture)return;upd(activeId,c=>{const s=new Set(c.uploadDates);s.has(dateStr)?s.delete(dateStr):s.add(dateStr);return {...c,uploadDates:[...s]};});}}>
                    <span style={{fontSize:11,fontWeight:done?600:400,color:textColor,lineHeight:1,pointerEvents:"none"}}>{day}</span>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:14,marginTop:12,fontSize:10,color:"#5a5a72",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:ch.color}}/> 업로드 완료</div>
              <div style={{marginLeft:"auto",color:"#4a4a62",fontSize:9}}>날짜 클릭으로 수정</div>
            </div>
          </div>

          {/* 스탯 */}
          <div style={S.statsGrid}>
            {[{icon:I.flame,label:"연속 업로드",val:streak+"일"},{icon:I.video,label:"총 영상",val:ch.videos.length+"개"},{icon:I.eye,label:"누적 조회수",val:fmtViews(totViews)},{icon:I.target,label:"목표 달성",val:goalHit+"개"}].map(s=>(
              <div key={s.label} style={{...S.statCard,borderColor:`${ch.color}22`}}>
                <div style={{color:ch.color,marginBottom:8,opacity:0.7}}>{s.icon}</div>
                <div style={{fontSize:22,fontWeight:700,color:"#d8d8f0",letterSpacing:-0.5}}>{s.val}</div>
                <div style={{fontSize:10,color:"#5a5a72",marginTop:3,letterSpacing:0.5}}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* 목표 */}
          <div style={S.block}>
            <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:11,color:"#6a6a82",letterSpacing:2,fontWeight:600}}>GOALS</div>
              {goals.length>0&&<span style={{fontSize:11,color:ch.color,marginLeft:8}}>{goalsDone}/{goals.length}</span>}
              <button style={{marginLeft:"auto",background:"transparent",border:`1px solid ${ch.color}44`,borderRadius:16,padding:"4px 12px",color:ch.color,fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}} onClick={()=>setAddingGoal(true)}>{I.plus} ADD</button>
            </div>
            {goals.length>0&&<div style={{height:2,background:"#1a1a24",borderRadius:2,marginBottom:14,overflow:"hidden"}}><div style={{height:"100%",width:`${goals.length?Math.round(goalsDone/goals.length*100):0}%`,background:ch.color,transition:"width .5s"}}/></div>}
            {goals.length===0&&!addingGoal&&<div style={{textAlign:"center",color:"#4a4a5a",padding:"16px 0",fontSize:13}}>목표를 추가해보세요</div>}
            {goals.map(g=>(
              <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:"1px solid #1a1a26"}}>
                <div style={{width:18,height:18,borderRadius:4,border:`1px solid ${g.done?ch.color:ch.color+"44"}`,background:g.done?ch.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}} onClick={()=>toggleGoal(g.id)}>
                  {g.done&&<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" style={{width:10,height:10}}><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span style={{flex:1,fontSize:13,color:g.done?"#4a4a5a":"#c0c0d8",textDecoration:g.done?"line-through":"none"}}>{g.text}</span>
                <button style={{background:"none",border:"none",cursor:"pointer",color:"#5a5a72",display:"flex",padding:"2px"}} onClick={()=>delGoal(g.id)}>{I.close}</button>
              </div>
            ))}
            {addingGoal&&(
              <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>
                <input autoFocus style={{...S.input,flex:1,padding:"8px 12px",fontSize:12}} value={goalInput} onChange={e=>setGoalInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addGoal();if(e.key==="Escape"){setAddingGoal(false);setGoalInput("");}}} placeholder="예: 구독자 1,000명 달성"/>
                <button style={{background:ch.color,border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}} onClick={addGoal}>추가</button>
                <button style={{background:"transparent",border:"1px solid #3a3a4a",borderRadius:8,padding:"8px 10px",color:"#5a5a72",fontSize:12,cursor:"pointer"}} onClick={()=>{setAddingGoal(false);setGoalInput("");}}>취소</button>
              </div>
            )}
          </div>

          {/* 최근 영상 */}
          <div style={S.block}>
            <div style={{fontSize:11,color:"#5a5a72",letterSpacing:2,fontWeight:600,marginBottom:14}}>RECENT VIDEOS</div>
            {ch.videos.length===0&&<div style={{textAlign:"center",color:"#4a4a5a",padding:"16px 0",fontSize:13}}>아직 영상이 없어요</div>}
            {ch.videos.slice(0,4).map(v=>{
              const pct=Math.min(100,Math.round((v.views/v.goal)*100));
              return (
                <div key={v.id} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderTop:"1px solid #1a1a26"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:"#c0c0d8",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.title}</div>
                    <div style={{fontSize:10,color:"#4a4a5a",marginTop:2,letterSpacing:0.5}}>{v.date}</div>
                    <div style={{height:2,background:"#1a1a24",borderRadius:2,marginTop:6,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:ch.color,borderRadius:2,transition:"width .5s"}}/></div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:16,fontWeight:700,color:"#d8d8f0"}}>{fmtViews(v.views)}</div>
                    <div style={{fontSize:10,color:pct>=100?"#5BAF82":ch.color,marginTop:1}}>{pct}% · 목표 {fmtViews(v.goal)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── VIDEOS ── */}
      {tab==="videos"&&(
        <div style={S.pad}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:11,color:"#5a5a72",letterSpacing:2,fontWeight:600}}>VIDEOS · {ch.videos.length}</div>
            <button style={{...S.actionBtn,background:ch.color}} onClick={()=>setVidModal(true)}>{I.plus}<span>영상 추가</span></button>
          </div>
          {ch.videos.length===0&&<div style={{textAlign:"center",color:"#4a4a5a",padding:40,fontSize:13}}>영상을 추가해보세요</div>}
          {ch.videos.map(v=>{
            const pct=Math.min(100,Math.round((v.views/v.goal)*100));
            return (
              <div key={v.id} style={S.vidCard}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{flex:1,minWidth:0,paddingRight:10}}>
                    <div style={{fontSize:14,fontWeight:600,color:"#c8c8e0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.title}</div>
                    <div style={{fontSize:10,color:"#4a4a5a",marginTop:3,letterSpacing:0.5}}>{v.date}</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                    {v.link&&<a href={v.link} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:4,border:`1px solid ${ch.color}44`,borderRadius:14,padding:"3px 10px",fontSize:11,textDecoration:"none",color:ch.color}}>{I.link}<span>YouTube</span></a>}
                    <button style={{...S.iBtn,color:"#5a5a72"}} onClick={()=>setDelVidConf(v.id)}>{I.trash}</button>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div style={{fontSize:10,color:"#4a4a5a",marginBottom:4,letterSpacing:0.5}}>VIEWS — 클릭해서 수정</div>
                    {editVid===v.id?(
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <input autoFocus style={{width:90,background:"#0a0a12",border:`1px solid ${ch.color}44`,borderRadius:6,padding:"5px 8px",color:"#d8d8f0",fontSize:15,fontWeight:700}} type="number" value={editVal} onChange={e=>setEditVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveViews(v.id);if(e.key==="Escape")setEditVid(null);}}/>
                        <button style={{background:ch.color,border:"none",borderRadius:6,padding:"5px 10px",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={()=>saveViews(v.id)}>저장</button>
                        <button style={{background:"transparent",border:"1px solid #3a3a4a",borderRadius:6,padding:"5px 8px",color:"#5a5a72",fontSize:11,cursor:"pointer"}} onClick={()=>setEditVid(null)}>취소</button>
                      </div>
                    ):(
                      <div style={{fontSize:26,fontWeight:700,color:"#d8d8f0",cursor:"pointer",letterSpacing:-1}} onClick={()=>startEdit(v)}>{fmtViews(v.views)}<span style={{fontSize:12,opacity:.2,marginLeft:4,fontWeight:400}}>✏</span></div>
                    )}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,color:"#4a4a5a",marginBottom:4,letterSpacing:0.5}}>GOAL — 클릭해서 수정</div>
                    {editGoalVid===v.id?(
                      <div style={{display:"flex",gap:6,alignItems:"center",justifyContent:"flex-end"}}>
                        <input autoFocus style={{width:90,background:"#0a0a12",border:`1px solid ${ch.color}44`,borderRadius:6,padding:"5px 8px",color:"#d8d8f0",fontSize:13,fontWeight:700,textAlign:"right"}} type="number" value={editGoalVal} onChange={e=>setEditGoalVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveGoal(v.id);if(e.key==="Escape")setEditGoalVid(null);}}/>
                        <button style={{background:ch.color,border:"none",borderRadius:6,padding:"5px 10px",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={()=>saveGoal(v.id)}>저장</button>
                      </div>
                    ):(
                      <div style={{fontSize:20,fontWeight:700,color:pct>=100?"#5BAF82":ch.color,cursor:"pointer"}} onClick={()=>startGoalEdit(v)}>{pct}%<span style={{fontSize:10,color:"#4a4a5a",fontWeight:400,marginLeft:4}}>{fmtViews(v.goal)}<span style={{opacity:.3,marginLeft:2}}>✏</span></span></div>
                    )}
                  </div>
                </div>
                <div style={{height:2,background:"#1a1a24",borderRadius:2,marginTop:12,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:ch.color,borderRadius:2,transition:"width .5s"}}/></div>
              </div>
            );
          })}
          {vidModal&&(
            <div style={S.overlay} onClick={()=>setVidModal(false)}>
              <div style={S.modal} onClick={e=>e.stopPropagation()}>
                <div style={S.modalTitle}>영상 추가</div>
                <Field label="제목" value={vidForm.title} onChange={v=>setVidForm(p=>({...p,title:v}))} placeholder="영상 제목 입력"/>
                <Field label="유튜브 링크 (선택)" value={vidForm.link} onChange={v=>setVidForm(p=>({...p,link:v}))} placeholder="https://youtube.com/shorts/..."/>
                <Field label="목표 조회수" value={vidForm.goal} onChange={v=>setVidForm(p=>({...p,goal:v}))} placeholder="10000" type="number"/>
                <div style={S.modalBtns}><button style={S.cancelBtn} onClick={()=>setVidModal(false)}>취소</button><button style={{...S.confirmBtn,background:ch.color}} onClick={addVid}>추가</button></div>
              </div>
            </div>
          )}
          {delVidConf&&(
            <div style={S.overlay} onClick={()=>setDelVidConf(null)}>
              <div style={{...S.modal,padding:"28px 24px 32px"}} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:11,color:"#5a5a72",letterSpacing:2,textAlign:"center",marginBottom:16}}>영상 삭제</div>
                <div style={{fontSize:13,color:"#5a5a72",textAlign:"center",marginBottom:24,lineHeight:1.6}}>이 영상을 삭제할까요?<br/>되돌릴 수 없어요.</div>
                <div style={S.modalBtns}><button style={S.cancelBtn} onClick={()=>setDelVidConf(null)}>취소</button><button style={{...S.confirmBtn,background:"#8a3a3a"}} onClick={execDelVid}>삭제</button></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 벤치마킹 ── */}
      {tab==="bench"&&(
        <div style={S.pad}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:11,color:"#5a5a72",letterSpacing:2,fontWeight:600}}>BENCHMARKS · {benchmarks.length}</div>
            <button style={{...S.actionBtn,background:ch.color}} onClick={()=>setBmModal(true)}>{I.plus}<span>채널 추가</span></button>
          </div>
          {benchmarks.length===0&&(
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{color:ch.color,opacity:0.4,marginBottom:12,display:"flex",justifyContent:"center"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:40,height:40}}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
              <div style={{color:"#5a5a72",fontSize:13}}>레퍼런스 채널을 추가해보세요</div>
              <div style={{color:"#4a4a5a",fontSize:11,marginTop:4}}>참고하는 유튜브 채널을 저장해두면 편리해요</div>
            </div>
          )}
          {benchmarks.map(b=>(
            <div key={b.id} style={{...S.vidCard}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:40,height:40,borderRadius:10,background:ch.color+"22",display:"flex",alignItems:"center",justifyContent:"center",color:ch.color,flexShrink:0,border:`1px solid ${ch.color}33`}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:18,height:18}}><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor"/></svg>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:"#c8c8e0"}}>{b.name}</div>
                  {b.url&&<div style={{fontSize:11,color:"#5a5a72",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.url}</div>}
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0}}>
                  {b.url&&<a href={b.url.startsWith("http")?b.url:"https://"+b.url} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:4,border:`1px solid ${ch.color}44`,borderRadius:14,padding:"5px 12px",fontSize:12,textDecoration:"none",color:ch.color,fontWeight:600}}>열기 ↗</a>}
                  <button style={{...S.iBtn,color:"#5a5a72"}} onClick={()=>delBm(b.id)}>{I.trash}</button>
                </div>
              </div>
              {b.note&&<div style={{marginTop:10,fontSize:12,color:"#6a6a82",lineHeight:1.6,borderLeft:`2px solid ${ch.color}44`,paddingLeft:10}}>{b.note}</div>}
            </div>
          ))}
          {bmModal&&(
            <div style={S.overlay} onClick={()=>setBmModal(false)}>
              <div style={S.modal} onClick={e=>e.stopPropagation()}>
                <div style={S.modalTitle}>벤치마킹 채널 추가</div>
                <Field label="채널명" value={bmForm.name} onChange={v=>setBmForm(p=>({...p,name:v}))} placeholder="예: 침착맨, 1분미만 등"/>
                <Field label="유튜브 링크" value={bmForm.url} onChange={v=>setBmForm(p=>({...p,url:v}))} placeholder="https://youtube.com/@..."/>
                <Field label="채널 특징 / 메모" value={bmForm.note} onChange={v=>setBmForm(p=>({...p,note:v}))} placeholder="예: 짧고 임팩트 있는 편집, 썸네일 스타일 참고"/>
                <div style={S.modalBtns}><button style={S.cancelBtn} onClick={()=>setBmModal(false)}>취소</button><button style={{...S.confirmBtn,background:ch.color}} onClick={addBm}>추가</button></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 플래닝 ── */}
      {tab==="plan"&&(
        <div style={S.pad}>
          <div style={S.block}>
            <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:6,color:"#6a6a82"}}>{I.cal}<span style={{fontSize:11,letterSpacing:2,fontWeight:600}}>UPLOAD SCHEDULE</span></div>
              <button style={{marginLeft:"auto",background:"transparent",border:`1px solid ${ch.color}44`,borderRadius:16,padding:"4px 12px",color:ch.color,fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}} onClick={()=>setScModal(true)}>{I.plus} ADD</button>
            </div>
            {schedule.length===0&&<div style={{textAlign:"center",color:"#4a4a5a",padding:"16px 0",fontSize:13}}>예정된 영상을 미리 계획해보세요</div>}
            {schedule.map(s=>{
              const isPast=s.date<today;
              return (
                <div key={s.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 0",borderTop:"1px solid #1a1a26",opacity:s.done?0.4:1}}>
                  <div style={{width:18,height:18,borderRadius:4,border:`1px solid ${s.done?ch.color:isPast?"#5a3a3a":ch.color+"44"}`,background:s.done?ch.color:isPast?"#2a1a1a":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,marginTop:2}} onClick={()=>toggleSc(s.id)}>
                    {s.done&&<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" style={{width:10,height:10}}><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:s.done?"#4a4a5a":"#c0c0d8",textDecoration:s.done?"line-through":"none"}}>{s.title}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginTop:3}}>
                      <span style={{fontSize:10,color:isPast&&!s.done?"#8a4a4a":ch.color,letterSpacing:0.5}}>{s.date}</span>
                      {isPast&&!s.done&&<span style={{fontSize:9,background:"#3a1a1a",color:"#8a4a4a",borderRadius:4,padding:"1px 6px",letterSpacing:0.5}}>지남</span>}
                    </div>
                    {s.memo&&<div style={{fontSize:11,color:"#5a5a72",marginTop:3}}>{s.memo}</div>}
                  </div>
                  <button style={{background:"none",border:"none",cursor:"pointer",color:"#5a5a72",display:"flex",flexShrink:0}} onClick={()=>delSc(s.id)}>{I.close}</button>
                </div>
              );
            })}
          </div>

          <div style={S.block}>
            <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",gap:6,color:"#6a6a82"}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><path d="M9 18h6M10 22h4M12 2a7 7 0 017 7c0 2.5-1.5 4.5-3 6H8c-1.5-1.5-3-3.5-3-6a7 7 0 017-7z"/></svg><span style={{fontSize:11,letterSpacing:2,fontWeight:600}}>CONTENT IDEAS</span></div>
              <span style={{fontSize:11,color:ch.color,marginLeft:8}}>{ideas.filter(i=>!i.done).length}개 대기</span>
              <button style={{marginLeft:"auto",background:"transparent",border:`1px solid ${ch.color}44`,borderRadius:16,padding:"4px 12px",color:ch.color,fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}} onClick={()=>setAddingIdea(true)}>{I.plus} ADD</button>
            </div>
            {ideas.length===0&&!addingIdea&&<div style={{textAlign:"center",color:"#4a4a5a",padding:"16px 0",fontSize:13}}>떠오르는 아이디어를 바로 적어두세요</div>}
            {addingIdea&&(
              <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
                <input autoFocus style={{...S.input,flex:1,padding:"8px 12px",fontSize:12}} value={ideaInput} onChange={e=>setIdeaInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addIdea();if(e.key==="Escape"){setAddingIdea(false);setIdeaInput("");}}} placeholder="예: 요즘 유행하는 밈으로 쇼츠 만들기"/>
                <button style={{background:ch.color,border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}} onClick={addIdea}>추가</button>
                <button style={{background:"transparent",border:"1px solid #3a3a4a",borderRadius:8,padding:"8px 10px",color:"#5a5a72",fontSize:12,cursor:"pointer"}} onClick={()=>{setAddingIdea(false);setIdeaInput("");}}>취소</button>
              </div>
            )}
            {ideas.map(idea=>(
              <div key={idea.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"8px 0",borderTop:"1px solid #1a1a26"}}>
                <div style={{width:18,height:18,borderRadius:4,border:`1px solid ${idea.done?ch.color:ch.color+"44"}`,background:idea.done?ch.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,marginTop:2}} onClick={()=>toggleIdea(idea.id)}>
                  {idea.done&&<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" style={{width:10,height:10}}><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  {editIdea===idea.id?(
                    <div style={{display:"flex",gap:6}}>
                      <input autoFocus style={{...S.input,flex:1,padding:"5px 8px",fontSize:12}} value={editIdeaVal} onChange={e=>setEditIdeaVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveIdeaEdit(idea.id);if(e.key==="Escape")setEditIdea(null);}}/>
                      <button style={{background:ch.color,border:"none",borderRadius:6,padding:"5px 10px",color:"#fff",fontSize:11,cursor:"pointer"}} onClick={()=>saveIdeaEdit(idea.id)}>저장</button>
                    </div>
                  ):(
                    <div style={{fontSize:13,color:idea.done?"#4a4a5a":"#c0c0d8",textDecoration:idea.done?"line-through":"none",cursor:"pointer"}} onClick={()=>{setEditIdea(idea.id);setEditIdeaVal(idea.text);}}>{idea.text}<span style={{fontSize:10,opacity:.2,marginLeft:4}}>✏</span></div>
                  )}
                  <div style={{fontSize:10,color:"#4a4a5a",marginTop:2}}>{idea.date}</div>
                </div>
                <button style={{background:"none",border:"none",cursor:"pointer",color:"#5a5a72",display:"flex",flexShrink:0}} onClick={()=>delIdea(idea.id)}>{I.close}</button>
              </div>
            ))}
          </div>

          {scModal&&(
            <div style={S.overlay} onClick={()=>setScModal(false)}>
              <div style={S.modal} onClick={e=>e.stopPropagation()}>
                <div style={S.modalTitle}>업로드 일정 추가</div>
                <Field label="영상 제목 / 내용" value={scForm.title} onChange={v=>setScForm(p=>({...p,title:v}))} placeholder="예: 여름 핫딜 TOP5"/>
                <Field label="예정 날짜" value={scForm.date} onChange={v=>setScForm(p=>({...p,date:v}))} type="date"/>
                <Field label="메모 (선택)" value={scForm.memo} onChange={v=>setScForm(p=>({...p,memo:v}))} placeholder="참고 사항, 필요한 준비 등"/>
                <div style={S.modalBtns}><button style={S.cancelBtn} onClick={()=>setScModal(false)}>취소</button><button style={{...S.confirmBtn,background:ch.color}} onClick={addSc}>추가</button></div>
              </div>
            </div>
          )}
        </div>
      )}

      {chModal&&<ChModal form={chForm} setForm={setChForm} mode={chModal.mode} onSave={saveCh} onClose={()=>setChModal(null)}/>}
      {delConfirm&&<DelModal name={channels.find(c=>c.id===delConfirm)?.name} onCancel={()=>setDelConfirm(null)} onConfirm={execDel}/>}
    </div>
  );
}

function MiniStat({icon,label,val,color}){return(<div style={{display:"flex",flexDirection:"column",gap:2}}><div style={{display:"flex",alignItems:"center",gap:4,color,opacity:0.6}}>{icon}<span style={{fontSize:10,letterSpacing:0.5,color:"#5a5a72"}}>{label.toUpperCase()}</span></div><div style={{fontSize:15,fontWeight:700,color:"#c8c8e0"}}>{val}</div></div>);}
function DelModal({name,onCancel,onConfirm}){return(<div style={S.overlay} onClick={onCancel}><div style={{...S.modal,padding:"28px 24px 32px"}} onClick={e=>e.stopPropagation()}><div style={{fontSize:11,color:"#5a5a72",letterSpacing:2,textAlign:"center",marginBottom:16}}>CONFIRM DELETE</div><div style={{fontSize:16,fontWeight:600,color:"#c8c8e0",textAlign:"center",marginBottom:8}}>{name}</div><div style={{fontSize:13,color:"#5a5a72",textAlign:"center",marginBottom:24,lineHeight:1.6}}>채널과 모든 데이터가<br/>영구적으로 삭제돼요.</div><div style={{display:"flex",gap:10}}><button style={S.cancelBtn} onClick={onCancel}>취소</button><button style={{...S.confirmBtn,background:"#8a3a3a"}} onClick={onConfirm}>삭제</button></div></div></div>);}
function ChModal({form,setForm,mode,onSave,onClose}){return(<div style={S.overlay} onClick={onClose}><div style={S.modal} onClick={e=>e.stopPropagation()}><div style={S.modalTitle}>{mode==="add"?"새 채널":"채널 수정"}</div><Field label="채널명" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="예: 먹방채널"/><Field label="채널 설명" value={form.description} onChange={v=>setForm(p=>({...p,description:v}))} placeholder="채널 소개"/><div style={{marginBottom:16}}><div style={S.fLabel}>이모지</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{EMOJIS.map(e=>(<div key={e} style={{fontSize:20,cursor:"pointer",padding:"5px 7px",borderRadius:6,background:form.emoji===e?"#ffffff18":"transparent",border:form.emoji===e?"1px solid #ffffff22":"1px solid transparent"}} onClick={()=>setForm(p=>({...p,emoji:e}))}>{e}</div>))}</div></div><div style={{marginBottom:20}}><div style={S.fLabel}>색상</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{COLORS.map(c=>(<div key={c} style={{width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",border:form.color===c?"2px solid #fff":"2px solid transparent",boxShadow:form.color===c?`0 0 0 2px ${c}`:"none"}} onClick={()=>setForm(p=>({...p,color:c}))}/>))}</div></div><div style={S.modalBtns}><button style={S.cancelBtn} onClick={onClose}>취소</button><button style={{...S.confirmBtn,background:form.color}} onClick={onSave}>{mode==="add"?"추가":"저장"}</button></div></div></div>);}
function Field({label,value,onChange,placeholder,type="text"}){return(<div style={{marginBottom:14}}><div style={S.fLabel}>{label}</div><input style={S.input} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>);}

const S={root:{minHeight:"100vh",background:"#08080f",color:"#e0e0f0",fontFamily:"'Pretendard','Apple SD Gothic Neo',sans-serif",paddingBottom:60,maxWidth:680,margin:"0 auto"},hdr:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"22px 20px 16px"},logo:{fontSize:18,fontWeight:700,color:"#c8c8e0",letterSpacing:-0.3},pill:{background:"#111118",border:"1px solid #1e1e2a",borderRadius:20,padding:"4px 12px",fontSize:11,color:"#4a4a62",letterSpacing:0.5},banner:{margin:"0 16px 20px",background:"#0e0e16",border:"1px solid #1a1a24",borderRadius:14,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"},grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,padding:"0 16px"},card:{background:"#0e0e16",border:"1px solid #1a1a24",borderRadius:16,padding:"18px 16px",position:"relative",overflow:"hidden",transition:"all .2s"},addCard:{background:"transparent",border:"1px dashed #2a2a3a",borderRadius:16,minHeight:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",transition:"all .2s"},statusTag:{borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:600,letterSpacing:0.5},iBtn:{background:"none",border:"none",cursor:"pointer",padding:"4px",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#5a5a72"},chHdr:{display:"flex",alignItems:"center",gap:12,padding:"16px"},backBtn:{background:"none",border:"1px solid #2a2a3a",color:"#5a5a72",padding:"5px 12px",borderRadius:20,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:5},tabs:{display:"flex",borderBottom:"1px solid #111118",padding:"0 16px",overflowX:"auto"},tab:{background:"none",border:"none",borderBottom:"1px solid transparent",color:"#3a3a52",padding:"11px 14px",cursor:"pointer",fontSize:12,fontWeight:600,transition:"all .2s",letterSpacing:0.5,whiteSpace:"nowrap"},pad:{padding:16},uploadCard:{display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid",borderRadius:12,padding:"14px 16px",marginBottom:14,transition:"all .3s"},uploadBtn:{borderRadius:20,padding:"8px 18px",fontWeight:600,cursor:"pointer",fontSize:12,transition:"all .2s",letterSpacing:0.5},block:{background:"#0e0e16",border:"1px solid #141420",borderRadius:12,padding:"16px",marginBottom:12},calNav:{background:"#111118",border:"1px solid #1e1e2a",color:"#5a5a72",borderRadius:8,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},statsGrid:{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:12},statCard:{background:"#0e0e16",border:"1px solid",borderRadius:12,padding:"14px"},actionBtn:{border:"none",borderRadius:20,padding:"7px 14px",color:"#fff",fontWeight:600,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:5},vidCard:{background:"#0e0e16",border:"1px solid #141420",borderRadius:12,padding:16,marginBottom:10},overlay:{position:"fixed",inset:0,background:"#000000dd",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200},modal:{background:"#0e0e16",border:"1px solid #1e1e2a",borderRadius:"18px 18px 0 0",padding:"22px 18px 36px",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"},modalTitle:{fontSize:15,fontWeight:700,color:"#c8c8e0",marginBottom:20},fLabel:{fontSize:10,color:"#5a5a72",marginBottom:6,fontWeight:600,letterSpacing:1},input:{width:"100%",background:"#0a0a12",border:"1px solid #1e1e2a",borderRadius:8,padding:"10px 12px",color:"#c8c8e0",fontSize:13,boxSizing:"border-box"},modalBtns:{display:"flex",gap:10},cancelBtn:{flex:1,background:"transparent",border:"1px solid #2a2a3a",borderRadius:10,padding:11,color:"#5a5a72",cursor:"pointer",fontSize:13},confirmBtn:{flex:1,border:"none",borderRadius:10,padding:11,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}};

const CSS=`
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  * { box-sizing:border-box; } body { margin:0; background:#08080f; }
  .card:hover { border-color: color-mix(in srgb, var(--accent) 30%, transparent) !important; transform:translateY(-2px); }
  .add-card:hover { border-color:#3a3a4a !important; }
  input::placeholder { color:#3a3a4a; }
  input:focus { border-color:#3a3a5a !important; outline:none; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.3); }
  ::-webkit-scrollbar{width:2px;height:2px;} ::-webkit-scrollbar-thumb{background:#1e1e2a;border-radius:2px;}
`;
