import { useState, useRef, useEffect } from "react";

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
  return {
    firstDay: new Date(year, month-1, 1).getDay(),
    daysInMonth: new Date(year, month, 0).getDate(),
  };
}
function makeDate(y, m, d) {
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}
function calcStreak(uploadDates) {
  const set = new Set(uploadDates);
  let streak = 0;
  const d = new Date();
  while (true) {
    const s = makeDate(d.getFullYear(), d.getMonth()+1, d.getDate());
    if (set.has(s)) { streak++; d.setDate(d.getDate()-1); } else break;
  }
  return streak;
}
async function callAI(channelName, desc, messages) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      model:"claude-sonnet-4-20250514", max_tokens:1000,
      system:`당신은 유튜브 쇼츠 전문 크리에이터 AI입니다.\n채널명: ${channelName}\n설명: ${desc}\n실용적이고 트렌디한 아이디어를 한국어로 간결하게 답해주세요.`,
      messages,
    }),
  });
  const data = await r.json();
  return data.content?.[0]?.text || "응답 실패";
}

const today = todayStr();
const [ty, tm] = today.split("-").map(Number);

const INIT_CHANNELS = [
  {
    id:"ch_1", name:"쇼핑채널", emoji:"🛍️", color:"#E8856A", description:"핫딜 & 리뷰 쇼츠",
    uploadDates:[today],
    videos:[
      {id:"v1",title:"여름 핫딜 TOP5",link:"",date:today,views:0,goal:10000},
    ],
    goals:[{id:"g1",text:"구독자 1,000명 달성",done:false}],
  },
];

const EMOJIS  = ["🛍️","🏆","🎬","🍔","💄","🎮","💰","🐶","✈️","🏋️","📚","🎵","😂","🌿","⚽","🤖","👗","🏠","🎨","💡"];
const COLORS  = ["#E8856A","#6A9EBF","#7B6FD4","#C4A44A","#5BAF82","#C46E45","#9B6CC4","#4AABB8","#BF6A7A","#6A8FBF"];
const WEEKDAYS = ["일","월","화","수","목","금","토"];
const STORAGE_KEY = "shortshub-data-v2";

const Icon = {
  flame:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><path d="M12 2c0 0-4 4-4 9a4 4 0 008 0c0-2-1-4-1-4s-1 2-3 2c-1 0-2-1-2-2 0-2 2-5 2-5z" strokeLinejoin="round"/></svg>,
  eye:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  video:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><rect x="2" y="5" width="15" height="14" rx="2"/><path d="M17 9l5-3v12l-5-3V9z"/></svg>,
  target: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:14,height:14}}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  plus:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:13,height:13}}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:13,height:13}}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  close:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:12,height:12}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  link:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:12,height:12}}><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
};

export default function App() {
  const [channels,   setChannels]   = useState(INIT_CHANNELS);
  const [loaded,     setLoaded]     = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [activeId,   setActiveId]   = useState(null);
  const [tab,        setTab]        = useState("dashboard");
  const [chModal,    setChModal]    = useState(null);
  const [chForm,     setChForm]     = useState({name:"",emoji:"🎬",color:"#7B6FD4",description:""});
  const [vidModal,   setVidModal]   = useState(false);
  const [vidForm,    setVidForm]    = useState({title:"",link:"",goal:"10000"});
  const [editVid,    setEditVid]    = useState(null);
  const [editVal,    setEditVal]    = useState("");
  const [delConfirm, setDelConfirm] = useState(null);
  const [goalInput,  setGoalInput]  = useState("");
  const [addingGoal, setAddingGoal] = useState(false);
  const [chatMsgs,   setChatMsgs]   = useState([]);
  const [chatIn,     setChatIn]     = useState("");
  const [aiLoad,     setAiLoad]     = useState(false);
  const [calYear,    setCalYear]    = useState(ty);
  const [calMonth,   setCalMonth]   = useState(tm);
  const chatEnd = useRef(null);
  const ch  = channels.find(c => c.id === activeId);
  const upd = (id, fn) => setChannels(p => p.map(c => c.id===id ? fn(c) : c));

  // localStorage 저장/불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setChannels(JSON.parse(saved));
    } catch (_) {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaving(true);
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(channels)); } catch (_) {}
      setSaving(false);
    }, 800);
    return () => clearTimeout(t);
  }, [channels, loaded]);

  const toggleUpload = () => upd(activeId, c => {
    const s = new Set(c.uploadDates);
    s.has(today) ? s.delete(today) : s.add(today);
    return {...c, uploadDates:[...s]};
  });

  const prevMonth = () => { calMonth===1?(setCalYear(y=>y-1),setCalMonth(12)):setCalMonth(m=>m-1); };
  const nextMonth = () => {
    if(calYear===ty&&calMonth>=tm) return;
    calMonth===12?(setCalYear(y=>y+1),setCalMonth(1)):setCalMonth(m=>m+1);
  };
  const isCurrentMonth = calYear===ty&&calMonth===tm;

  const openAdd  = () => { setChForm({name:"",emoji:"🎬",color:"#7B6FD4",description:""}); setChModal({mode:"add"}); };
  const openEdit = (c,e) => { e?.stopPropagation(); setChForm({name:c.name,emoji:c.emoji,color:c.color,description:c.description}); setChModal({mode:"edit",id:c.id}); };
  const saveCh   = () => {
    if (!chForm.name.trim()) return;
    chModal.mode==="add"
      ? setChannels(p=>[...p,{id:uid(),...chForm,uploadDates:[],videos:[],goals:[]}])
      : upd(chModal.id, c=>({...c,...chForm}));
    setChModal(null);
  };
  const confirmDel = (id,e) => { e?.stopPropagation(); setDelConfirm(id); };
  const execDel    = () => { setChannels(p=>p.filter(c=>c.id!==delConfirm)); if(activeId===delConfirm) setActiveId(null); setDelConfirm(null); };

  const addVid = () => {
    if (!vidForm.title.trim()) return;
    const v = {id:uid(),title:vidForm.title,link:vidForm.link,date:today,views:0,goal:parseInt(vidForm.goal)||10000};
    upd(activeId, c => { const s=new Set(c.uploadDates); s.add(today); return {...c,videos:[v,...c.videos],uploadDates:[...s]}; });
    setVidForm({title:"",link:"",goal:"10000"}); setVidModal(false);
  };
  const delVid    = vid => upd(activeId, c=>({...c,videos:c.videos.filter(v=>v.id!==vid)}));
  const startEdit = v   => { setEditVid(v.id); setEditVal(String(v.views)); };
  const saveViews = vid => {
    upd(activeId, c=>({...c,videos:c.videos.map(v=>v.id===vid?{...v,views:parseInt(editVal)||0}:v)}));
    setEditVid(null); setEditVal("");
  };

  const addGoal    = () => { if (!goalInput.trim()) return; upd(activeId, c=>({...c,goals:[...(c.goals||[]),{id:uid(),text:goalInput.trim(),done:false}]})); setGoalInput(""); setAddingGoal(false); };
  const toggleGoal = gid => upd(activeId, c=>({...c,goals:(c.goals||[]).map(g=>g.id===gid?{...g,done:!g.done}:g)}));
  const delGoal    = gid => upd(activeId, c=>({...c,goals:(c.goals||[]).filter(g=>g.id!==gid)}));

  const sendChat = async () => {
    if (!chatIn.trim()||aiLoad) return;
    const msg = {role:"user",content:chatIn};
    const next = [...chatMsgs,msg];
    setChatMsgs(next); setChatIn(""); setAiLoad(true);
    try {
      const reply = await callAI(ch.name,ch.description,next);
      setChatMsgs([...next,{role:"assistant",content:reply}]);
    } catch { setChatMsgs([...next,{role:"assistant",content:"연결에 실패했어요. 다시 시도해주세요."}]); }
    setAiLoad(false);
    setTimeout(()=>chatEnd.current?.scrollIntoView({behavior:"smooth"}),100);
  };

  if (!loaded) return (
    <div style={{...S.root,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{color:"#3a3a4a",fontSize:14,letterSpacing:2}}>LOADING</div>
    </div>
  );

  if (!activeId) {
    const totViews  = channels.reduce((s,c)=>s+c.videos.reduce((a,v)=>a+(v.views||0),0),0);
    const todayDone = channels.filter(c=>c.uploadDates.includes(today)).length;
    return (
      <div style={S.root}>
        <style>{CSS}</style>
        <div style={S.hdr}>
          <div>
            <div style={S.logo}>ShortsHub</div>
            <div style={{fontSize:11,color:"#3a3a52",letterSpacing:1,marginTop:1}}>CHANNEL MANAGER</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {saving && <div style={{fontSize:11,color:"#3a3a4a",letterSpacing:1}}>saving...</div>}
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
          <div style={{display:"flex",gap:6}}>
            {channels.map(c=>(
              <div key={c.id} title={c.name} style={{width:8,height:8,borderRadius:"50%",background:c.uploadDates.includes(today)?c.color:"#2a2a38",transition:"all .3s"}}/>
            ))}
          </div>
        </div>

        <div style={{padding:"0 20px 10px",fontSize:11,color:"#3a3a52",letterSpacing:2}}>CHANNELS</div>
        <div style={S.grid}>
          {channels.map(c=>{
            const done=c.uploadDates.includes(today);
            const streak=calcStreak(c.uploadDates);
            const totV=c.videos.reduce((a,v)=>a+(v.views||0),0);
            const goalsDone=(c.goals||[]).filter(g=>g.done).length;
            const goalsTotal=(c.goals||[]).length;
            return (
              <div key={c.id} style={{...S.card,"--accent":c.color}} className="card">
                <div style={{height:2,background:`linear-gradient(90deg,${c.color},transparent)`,borderRadius:"16px 16px 0 0",position:"absolute",top:0,left:0,right:0}}/>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:26}}>{c.emoji}</span>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,color:"#d8d8f0"}}>{c.name}</div>
                      <div style={{fontSize:11,color:"#3a3a52",marginTop:1}}>{c.description||"—"}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:2}}>
                    <button style={S.iBtn} onClick={e=>openEdit(c,e)}>{Icon.edit}</button>
                    <button style={S.iBtn} onClick={e=>confirmDel(c.id,e)}>{Icon.trash}</button>
                  </div>
                </div>
                <div onClick={()=>{setActiveId(c.id);setTab("dashboard");setChatMsgs([]);setCalYear(ty);setCalMonth(tm);}} style={{cursor:"pointer"}}>
                  <div style={{display:"flex",gap:16,marginBottom:12}}>
                    <MiniStat icon={Icon.video} label="영상"   val={c.videos.length} color={c.color}/>
                    <MiniStat icon={Icon.eye}   label="조회수" val={fmtViews(totV)}  color={c.color}/>
                    <MiniStat icon={Icon.flame} label="연속"   val={`${streak}일`}   color={c.color}/>
                  </div>
                  {goalsTotal>0&&(
                    <div style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:10,color:"#3a3a52",letterSpacing:1}}>GOALS</span>
                        <span style={{fontSize:10,color:c.color}}>{goalsDone}/{goalsTotal}</span>
                      </div>
                      <div style={{height:2,background:"#1e1e2a",borderRadius:2,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${goalsTotal?Math.round(goalsDone/goalsTotal*100):0}%`,background:c.color,transition:"width .5s"}}/>
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <div style={{...S.statusTag,background:done?c.color+"22":"#1e1e2a",color:done?c.color:"#3a3a52",border:`1px solid ${done?c.color+"44":"#2a2a38"}`}}>
                      {done?"업로드 완료":"미업로드"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={S.addCard} className="add-card" onClick={openAdd}>
            <div style={{color:"#2a2a38",marginBottom:6}}>{Icon.plus}</div>
            <span style={{fontSize:12,color:"#2a2a38",letterSpacing:1}}>ADD CHANNEL</span>
          </div>
        </div>

        {chModal&&<ChModal form={chForm} setForm={setChForm} mode={chModal.mode} onSave={saveCh} onClose={()=>setChModal(null)}/>}
        {delConfirm&&<DelModal name={channels.find(c=>c.id===delConfirm)?.name} onCancel={()=>setDelConfirm(null)} onConfirm={execDel}/>}
      </div>
    );
  }

  const uploadedToday=ch.uploadDates.includes(today);
  const streak=calcStreak(ch.uploadDates);
  const totViews=ch.videos.reduce((a,v)=>a+(v.views||0),0);
  const goalHit=ch.videos.filter(v=>v.views>=v.goal).length;
  const goals=ch.goals||[];
  const goalsDone=goals.filter(g=>g.done).length;
  const {firstDay,daysInMonth}=getMonthInfo(calYear,calMonth);
  const monthUploads=ch.uploadDates.filter(d=>d.startsWith(`${calYear}-${String(calMonth).padStart(2,"0")}`)).length;

  return (
    <div style={S.root}>
      <style>{CSS}</style>
      <div style={{...S.chHdr,borderBottom:`1px solid ${ch.color}22`}}>
        <button style={S.backBtn} onClick={()=>setActiveId(null)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="15 18 9 12 15 6"/></svg>
          <span>홈</span>
        </button>
        <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
          <span style={{fontSize:24}}>{ch.emoji}</span>
          <div>
            <div style={{fontSize:17,fontWeight:700,color:"#d8d8f0"}}>{ch.name}</div>
            <div style={{fontSize:11,color:"#3a3a52"}}>{ch.description}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {saving&&<span style={{fontSize:11,color:"#3a3a4a",letterSpacing:1}}>saving...</span>}
          <button style={{...S.iBtn,border:"1px solid #2a2a38",borderRadius:20,padding:"5px 12px",display:"flex",alignItems:"center",gap:5,color:"#5a5a72"}} onClick={e=>openEdit(ch,e)}>
            {Icon.edit}<span style={{fontSize:12}}>수정</span>
          </button>
        </div>
      </div>

      <div style={S.tabs}>
        {[{id:"dashboard",label:"Dashboard"},{id:"videos",label:"Videos"},{id:"ai",label:"AI Studio"}].map(t=>(
          <button key={t.id} style={{...S.tab,...(tab===t.id?{color:"#d8d8f0",borderBottom:`1px solid ${ch.color}`}:{})}} onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab==="dashboard"&&(
        <div style={S.pad}>
          <div style={{...S.uploadCard,borderColor:uploadedToday?ch.color+"44":"#1e1e2a",background:uploadedToday?ch.color+"0d":"#0e0e16"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:uploadedToday?ch.color+"22":"#1a1a24",display:"flex",alignItems:"center",justifyContent:"center",color:uploadedToday?ch.color:"#3a3a52",border:`1px solid ${uploadedToday?ch.color+"44":"#2a2a34"}`}}>
                {uploadedToday
                  ?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:16,height:16}}><polyline points="20 6 9 17 4 12"/></svg>
                  :<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width:16,height:16}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                }
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:"#c8c8e0"}}>{uploadedToday?"오늘 업로드 완료":"오늘 아직 미업로드"}</div>
                <div style={{fontSize:11,color:"#3a3a52",marginTop:2}}>{uploadedToday?`현재 ${streak}일 연속 업로드 중`:"업로드 후 완료 처리하세요"}</div>
              </div>
            </div>
            <button style={{...S.uploadBtn,background:uploadedToday?"transparent":ch.color,border:`1px solid ${uploadedToday?ch.color+"66":ch.color}`,color:uploadedToday?ch.color:"#fff"}} onClick={toggleUpload}>
              {uploadedToday?"취소":"완료"}
            </button>
          </div>

          <div style={S.block}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <button style={S.calNav} onClick={prevMonth}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:600,color:"#c8c8e0"}}>{calYear}년 {calMonth}월</div>
                <div style={{fontSize:11,color:ch.color,marginTop:2,letterSpacing:0.5}}>{monthUploads}일 업로드{isCurrentMonth?` · ${streak}일 연속`:""}</div>
              </div>
              <button style={{...S.calNav,opacity:isCurrentMonth?0.2:1,cursor:isCurrentMonth?"default":"pointer"}} onClick={nextMonth} disabled={isCurrentMonth}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>
              {WEEKDAYS.map((w,i)=>(
                <div key={w} style={{textAlign:"center",fontSize:10,letterSpacing:0.5,color:i===0?"#8a4a4a":i===6?"#4a6a8a":"#2a2a3a",fontWeight:600,paddingBottom:2}}>{w}</div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
              {Array.from({length:firstDay}).map((_,i)=><div key={"e"+i} style={{aspectRatio:"1"}}/>)}
              {Array.from({length:daysInMonth}).map((_,i)=>{
                const day=i+1,dateStr=makeDate(calYear,calMonth,day);
                const done=ch.uploadDates.includes(dateStr);
                const isToday=dateStr===today,isFuture=dateStr>today;
                const dow=(firstDay+i)%7;
                return (
                  <div key={day} className={isFuture?"":"cal-day"} title={dateStr}
                    style={{aspectRatio:"1",borderRadius:6,background:done?ch.color+"dd":isToday?"#1a1a26":"transparent",border:isToday?`1px solid ${ch.color}55`:"1px solid transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:isFuture?"default":"pointer",opacity:isFuture?0.15:1,transition:"all .15s"}}
                    onClick={()=>{if(isFuture)return;upd(activeId,c=>{const s=new Set(c.uploadDates);s.has(dateStr)?s.delete(dateStr):s.add(dateStr);return {...c,uploadDates:[...s]};});}}>
                    <span style={{fontSize:11,fontWeight:done?600:400,color:done?"#fff":dow===0?"#7a3a3a":dow===6?"#3a5a7a":"#3a3a52",lineHeight:1}}>{day}</span>
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",gap:14,marginTop:12,fontSize:10,color:"#3a3a52",alignItems:"center",letterSpacing:0.5}}>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:ch.color}}/> UPLOADED</div>
              <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:"transparent",border:`1px solid ${ch.color}55`}}/> TODAY</div>
              <div style={{marginLeft:"auto",color:"#2a2a3a"}}>날짜 클릭으로 수정</div>
            </div>
          </div>

          <div style={S.statsGrid}>
            {[
              {icon:Icon.flame, label:"연속 업로드", val:streak+"일"},
              {icon:Icon.video, label:"총 영상",     val:ch.videos.length+"개"},
              {icon:Icon.eye,   label:"누적 조회수", val:fmtViews(totViews)},
              {icon:Icon.target,label:"목표 달성",   val:goalHit+"개"},
            ].map(s=>(
              <div key={s.label} style={{...S.statCard,borderColor:`${ch.color}22`}}>
                <div style={{color:ch.color,marginBottom:8,opacity:0.7}}>{s.icon}</div>
                <div style={{fontSize:22,fontWeight:700,color:"#d8d8f0",letterSpacing:-0.5}}>{s.val}</div>
                <div style={{fontSize:10,color:"#3a3a52",marginTop:3,letterSpacing:0.5}}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          <div style={S.block}>
            <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
              <div style={{fontSize:11,color:"#5a5a72",letterSpacing:2,fontWeight:600}}>GOALS</div>
              {goals.length>0&&<span style={{fontSize:11,color:ch.color,marginLeft:8}}>{goalsDone}/{goals.length}</span>}
              <button style={{marginLeft:"auto",background:"transparent",border:`1px solid ${ch.color}44`,borderRadius:16,padding:"4px 12px",color:ch.color,fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4,letterSpacing:0.5}} onClick={()=>setAddingGoal(true)}>
                {Icon.plus} ADD
              </button>
            </div>
            {goals.length>0&&(
              <div style={{height:2,background:"#1a1a24",borderRadius:2,marginBottom:14,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${goals.length?Math.round(goalsDone/goals.length*100):0}%`,background:ch.color,transition:"width .5s"}}/>
              </div>
            )}
            {goals.length===0&&!addingGoal&&<div style={{textAlign:"center",color:"#2a2a38",padding:"16px 0",fontSize:13}}>목표를 추가해보세요</div>}
            {goals.map(g=>(
              <div key={g.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderTop:"1px solid #141420"}}>
                <div style={{width:18,height:18,borderRadius:4,border:`1px solid ${g.done?ch.color:ch.color+"44"}`,background:g.done?ch.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all .15s"}} onClick={()=>toggleGoal(g.id)}>
                  {g.done&&<svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" style={{width:10,height:10}}><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <span style={{flex:1,fontSize:13,color:g.done?"#3a3a52":"#c0c0d8",textDecoration:g.done?"line-through":"none",transition:"all .2s"}}>{g.text}</span>
                <button style={{background:"none",border:"none",cursor:"pointer",color:"#2a2a38",padding:"0 2px",display:"flex"}} onClick={()=>delGoal(g.id)}>{Icon.close}</button>
              </div>
            ))}
            {addingGoal&&(
              <div style={{display:"flex",gap:8,marginTop:10,alignItems:"center"}}>
                <input autoFocus style={{...S.input,flex:1,padding:"8px 12px",fontSize:12}} value={goalInput} onChange={e=>setGoalInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")addGoal();if(e.key==="Escape"){setAddingGoal(false);setGoalInput("");}}} placeholder="예: 구독자 1,000명 달성"/>
                <button style={{background:ch.color,border:"none",borderRadius:8,padding:"8px 14px",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}} onClick={addGoal}>추가</button>
                <button style={{background:"transparent",border:"1px solid #2a2a38",borderRadius:8,padding:"8px 10px",color:"#3a3a52",fontSize:12,cursor:"pointer"}} onClick={()=>{setAddingGoal(false);setGoalInput("");}}>취소</button>
              </div>
            )}
          </div>

          <div style={S.block}>
            <div style={{fontSize:11,color:"#3a3a52",letterSpacing:2,fontWeight:600,marginBottom:14}}>RECENT VIDEOS</div>
            {ch.videos.length===0&&<div style={{textAlign:"center",color:"#2a2a38",padding:"16px 0",fontSize:13}}>아직 영상이 없어요</div>}
            {ch.videos.slice(0,4).map(v=>{
              const pct=Math.min(100,Math.round((v.views/v.goal)*100));
              return (
                <div key={v.id} style={{display:"flex",alignItems:"center",gap:14,padding:"10px 0",borderTop:"1px solid #141420"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:"#c0c0d8",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.title}</div>
                    <div style={{fontSize:10,color:"#2a2a3a",marginTop:2,letterSpacing:0.5}}>{v.date}</div>
                    <div style={{height:2,background:"#1a1a24",borderRadius:2,marginTop:6,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:ch.color,borderRadius:2,transition:"width .5s"}}/>
                    </div>
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

      {tab==="videos"&&(
        <div style={S.pad}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div style={{fontSize:11,color:"#3a3a52",letterSpacing:2,fontWeight:600}}>VIDEOS · {ch.videos.length}</div>
            <button style={{...S.actionBtn,background:ch.color}} onClick={()=>setVidModal(true)}>{Icon.plus}<span>영상 추가</span></button>
          </div>
          {ch.videos.length===0&&<div style={{textAlign:"center",color:"#2a2a38",padding:40,fontSize:13}}>영상을 추가해보세요</div>}
          {ch.videos.map(v=>{
            const pct=Math.min(100,Math.round((v.views/v.goal)*100));
            return (
              <div key={v.id} style={S.vidCard}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{flex:1,minWidth:0,paddingRight:10}}>
                    <div style={{fontSize:14,fontWeight:600,color:"#c8c8e0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{v.title}</div>
                    <div style={{fontSize:10,color:"#2a2a3a",marginTop:3,letterSpacing:0.5}}>{v.date}</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                    {v.link&&<a href={v.link} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:4,border:`1px solid ${ch.color}44`,borderRadius:14,padding:"3px 10px",fontSize:11,textDecoration:"none",color:ch.color}}>{Icon.link}<span>YouTube</span></a>}
                    <button style={{...S.iBtn,color:"#3a3a52"}} onClick={()=>delVid(v.id)}>{Icon.trash}</button>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                  <div>
                    <div style={{fontSize:10,color:"#2a2a3a",marginBottom:4,letterSpacing:0.5}}>VIEWS — 클릭해서 수정</div>
                    {editVid===v.id?(
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <input autoFocus style={{width:90,background:"#0a0a12",border:`1px solid ${ch.color}44`,borderRadius:6,padding:"5px 8px",color:"#d8d8f0",fontSize:15,fontWeight:700}}
                          type="number" value={editVal} onChange={e=>setEditVal(e.target.value)}
                          onKeyDown={e=>{if(e.key==="Enter")saveViews(v.id);if(e.key==="Escape")setEditVid(null);}}/>
                        <button style={{background:ch.color,border:"none",borderRadius:6,padding:"5px 10px",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={()=>saveViews(v.id)}>저장</button>
                        <button style={{background:"transparent",border:"1px solid #2a2a38",borderRadius:6,padding:"5px 8px",color:"#3a3a52",fontSize:11,cursor:"pointer"}} onClick={()=>setEditVid(null)}>취소</button>
                      </div>
                    ):(
                      <div style={{fontSize:26,fontWeight:700,color:"#d8d8f0",cursor:"pointer",letterSpacing:-1}} onClick={()=>startEdit(v)}>
                        {fmtViews(v.views)}<span style={{fontSize:12,opacity:.2,marginLeft:4,fontWeight:400}}>✏</span>
                      </div>
                    )}
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:10,color:"#2a2a3a",marginBottom:4,letterSpacing:0.5}}>GOAL · {fmtViews(v.goal)}</div>
                    <div style={{fontSize:20,fontWeight:700,color:pct>=100?"#5BAF82":ch.color}}>{pct}%</div>
                  </div>
                </div>
                <div style={{height:2,background:"#1a1a24",borderRadius:2,marginTop:12,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:ch.color,borderRadius:2,transition:"width .5s"}}/>
                </div>
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
                <div style={S.modalBtns}>
                  <button style={S.cancelBtn} onClick={()=>setVidModal(false)}>취소</button>
                  <button style={{...S.confirmBtn,background:ch.color}} onClick={addVid}>추가</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="ai"&&(
        <div style={{padding:"14px 16px 0",display:"flex",flexDirection:"column",height:"calc(100vh - 158px)"}}>
          <div style={{background:"#0e0e16",border:"1px solid #1e1e2a",borderRadius:12,padding:"12px 16px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:32,height:32,borderRadius:8,background:ch.color+"22",display:"flex",alignItems:"center",justifyContent:"center",border:`1px solid ${ch.color}33`,fontSize:16}}>◈</div>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:"#c0c0d8"}}>{ch.name} AI Studio</div>
              <div style={{fontSize:11,color:"#3a3a52",marginTop:1}}>아이디어, 제목, 기획을 도와드립니다</div>
            </div>
          </div>
          <div style={{flex:1,background:"#0a0a12",border:"1px solid #161620",borderRadius:12,padding:14,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,marginBottom:10}}>
            {chatMsgs.length===0&&(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div style={{fontSize:10,color:"#2a2a38",textAlign:"center",letterSpacing:1,marginBottom:6}}>SUGGESTIONS</div>
                {["트렌드 아이디어 3개 추천해줘","조회수 높이는 제목 공식 알려줘","이번 주 쇼츠 기획 5개 줘"].map(s=>(
                  <div key={s} style={{border:`1px solid ${ch.color}33`,borderRadius:10,padding:"9px 14px",fontSize:12,cursor:"pointer",color:ch.color,letterSpacing:0.3}} className="suggestion" onClick={()=>setChatIn(s)}>{s}</div>
                ))}
              </div>
            )}
            {chatMsgs.map((m,i)=>(
              <div key={i} style={{alignSelf:m.role==="user"?"flex-end":"flex-start",maxWidth:"82%"}}>
                <div style={{background:m.role==="user"?ch.color+"cc":"#141420",borderRadius:m.role==="user"?"12px 12px 3px 12px":"12px 12px 12px 3px",padding:"10px 14px",fontSize:13,color:"#d8d8f0",lineHeight:1.65,whiteSpace:"pre-wrap"}}>{m.content}</div>
              </div>
            ))}
            {aiLoad&&(
              <div style={{alignSelf:"flex-start"}}>
                <div style={{background:"#141420",borderRadius:"12px 12px 12px 3px",padding:"12px 16px",display:"flex",gap:4,alignItems:"center"}}>
                  <span className="dot"/><span className="dot" style={{animationDelay:".2s"}}/><span className="dot" style={{animationDelay:".4s"}}/>
                </div>
              </div>
            )}
            <div ref={chatEnd}/>
          </div>
          <div style={{display:"flex",gap:8,paddingBottom:16}}>
            <input style={{flex:1,background:"#0e0e16",border:`1px solid ${ch.color}33`,borderRadius:20,padding:"11px 16px",color:"#d8d8f0",fontSize:13,outline:"none"}}
              value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendChat()} placeholder="메시지 입력..."/>
            <button style={{width:42,height:42,borderRadius:"50%",border:"none",background:ch.color,color:"#fff",cursor:"pointer",fontWeight:900,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={sendChat} disabled={aiLoad}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:16,height:16}}><polyline points="12 5 19 12 12 19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
        </div>
      )}

      {chModal&&<ChModal form={chForm} setForm={setChForm} mode={chModal.mode} onSave={saveCh} onClose={()=>setChModal(null)}/>}
      {delConfirm&&<DelModal name={channels.find(c=>c.id===delConfirm)?.name} onCancel={()=>setDelConfirm(null)} onConfirm={execDel}/>}
    </div>
  );
}

function MiniStat({icon,label,val,color}){return(<div style={{display:"flex",flexDirection:"column",gap:2}}><div style={{display:"flex",alignItems:"center",gap:4,color:color,opacity:0.6}}>{icon}<span style={{fontSize:10,letterSpacing:0.5,color:"#3a3a52"}}>{label.toUpperCase()}</span></div><div style={{fontSize:15,fontWeight:700,color:"#c8c8e0"}}>{val}</div></div>);}
function DelModal({name,onCancel,onConfirm}){return(<div style={S.overlay} onClick={onCancel}><div style={{...S.modal,padding:"28px 24px 32px"}} onClick={e=>e.stopPropagation()}><div style={{fontSize:11,color:"#3a3a52",letterSpacing:2,textAlign:"center",marginBottom:16}}>CONFIRM DELETE</div><div style={{fontSize:16,fontWeight:600,color:"#c8c8e0",textAlign:"center",marginBottom:8}}>{name}</div><div style={{fontSize:13,color:"#3a3a52",textAlign:"center",marginBottom:24,lineHeight:1.6}}>채널과 모든 데이터가<br/>영구적으로 삭제돼요.</div><div style={{display:"flex",gap:10}}><button style={S.cancelBtn} onClick={onCancel}>취소</button><button style={{...S.confirmBtn,background:"#8a3a3a"}} onClick={onConfirm}>삭제</button></div></div></div>);}
function ChModal({form,setForm,mode,onSave,onClose}){return(<div style={S.overlay} onClick={onClose}><div style={S.modal} onClick={e=>e.stopPropagation()}><div style={S.modalTitle}>{mode==="add"?"새 채널":"채널 수정"}</div><Field label="채널명" value={form.name} onChange={v=>setForm(p=>({...p,name:v}))} placeholder="예: 먹방채널"/><Field label="채널 설명" value={form.description} onChange={v=>setForm(p=>({...p,description:v}))} placeholder="채널 소개"/><div style={{marginBottom:16}}><div style={S.fLabel}>이모지</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{EMOJIS.map(e=>(<div key={e} style={{fontSize:20,cursor:"pointer",padding:"5px 7px",borderRadius:6,background:form.emoji===e?"#ffffff18":"transparent",border:form.emoji===e?"1px solid #ffffff22":"1px solid transparent",transition:"all .1s"}} onClick={()=>setForm(p=>({...p,emoji:e}))}>{e}</div>))}</div></div><div style={{marginBottom:20}}><div style={S.fLabel}>색상</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{COLORS.map(c=>(<div key={c} style={{width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",border:form.color===c?"2px solid #fff":"2px solid transparent",boxShadow:form.color===c?`0 0 0 2px ${c}`:"none",transition:"all .1s"}} onClick={()=>setForm(p=>({...p,color:c}))}/>))}</div></div><div style={S.modalBtns}><button style={S.cancelBtn} onClick={onClose}>취소</button><button style={{...S.confirmBtn,background:form.color}} onClick={onSave}>{mode==="add"?"추가":"저장"}</button></div></div></div>);}
function Field({label,value,onChange,placeholder,type="text"}){return(<div style={{marginBottom:14}}><div style={S.fLabel}>{label}</div><input style={S.input} type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>);}

const S={root:{minHeight:"100vh",background:"#08080f",color:"#e0e0f0",fontFamily:"'Pretendard','Apple SD Gothic Neo',sans-serif",paddingBottom:60,maxWidth:680,margin:"0 auto"},hdr:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"22px 20px 16px"},logo:{fontSize:18,fontWeight:700,color:"#c8c8e0",letterSpacing:-0.3},pill:{background:"#111118",border:"1px solid #1e1e2a",borderRadius:20,padding:"4px 12px",fontSize:11,color:"#3a3a52",letterSpacing:0.5},banner:{margin:"0 16px 20px",background:"#0e0e16",border:"1px solid #1a1a24",borderRadius:14,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"},grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,padding:"0 16px"},card:{background:"#0e0e16",border:"1px solid #1a1a24",borderRadius:16,padding:"18px 16px",position:"relative",overflow:"hidden",transition:"all .2s"},addCard:{background:"transparent",border:"1px dashed #1e1e2a",borderRadius:16,minHeight:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",transition:"all .2s"},statusTag:{borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:600,letterSpacing:0.5},iBtn:{background:"none",border:"none",cursor:"pointer",padding:"4px",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",color:"#3a3a52",transition:"color .15s"},chHdr:{display:"flex",alignItems:"center",gap:12,padding:"16px"},backBtn:{background:"none",border:"1px solid #1e1e2a",color:"#3a3a52",padding:"5px 12px",borderRadius:20,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:5},tabs:{display:"flex",borderBottom:"1px solid #111118",padding:"0 16px"},tab:{background:"none",border:"none",borderBottom:"1px solid transparent",color:"#2a2a42",padding:"11px 16px",cursor:"pointer",fontSize:12,fontWeight:600,transition:"all .2s",letterSpacing:0.5},pad:{padding:16},uploadCard:{display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid",borderRadius:12,padding:"14px 16px",marginBottom:14,transition:"all .3s"},uploadBtn:{borderRadius:20,padding:"8px 18px",fontWeight:600,cursor:"pointer",fontSize:12,transition:"all .2s",letterSpacing:0.5},block:{background:"#0e0e16",border:"1px solid #141420",borderRadius:12,padding:"16px",marginBottom:12},calNav:{background:"#111118",border:"1px solid #1e1e2a",color:"#3a3a52",borderRadius:8,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"},statsGrid:{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:12},statCard:{background:"#0e0e16",border:"1px solid",borderRadius:12,padding:"14px"},actionBtn:{border:"none",borderRadius:20,padding:"7px 14px",color:"#fff",fontWeight:600,cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",gap:5,letterSpacing:0.3},vidCard:{background:"#0e0e16",border:"1px solid #141420",borderRadius:12,padding:16,marginBottom:10},overlay:{position:"fixed",inset:0,background:"#000000dd",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:200},modal:{background:"#0e0e16",border:"1px solid #1e1e2a",borderRadius:"18px 18px 0 0",padding:"22px 18px 36px",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"},modalTitle:{fontSize:15,fontWeight:700,color:"#c8c8e0",marginBottom:20,letterSpacing:-0.3},fLabel:{fontSize:10,color:"#3a3a52",marginBottom:6,fontWeight:600,letterSpacing:1},input:{width:"100%",background:"#0a0a12",border:"1px solid #1e1e2a",borderRadius:8,padding:"10px 12px",color:"#c8c8e0",fontSize:13,boxSizing:"border-box"},modalBtns:{display:"flex",gap:10},cancelBtn:{flex:1,background:"transparent",border:"1px solid #1e1e2a",borderRadius:10,padding:11,color:"#3a3a52",cursor:"pointer",fontSize:13},confirmBtn:{flex:1,border:"none",borderRadius:10,padding:11,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}};

const CSS=`
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
  * { box-sizing:border-box; } body { margin:0; }
  .card:hover { border-color: color-mix(in srgb, var(--accent) 30%, transparent) !important; transform:translateY(-2px); }
  .add-card:hover { border-color:#2a2a38 !important; }
  .cal-day:hover { background:#1a1a26 !important; }
  .suggestion:hover { background: rgba(255,255,255,0.03); }
  .dot { display:inline-block;width:5px;height:5px;background:#2a2a42;border-radius:50%;margin:0 2px;animation:bounce .9s infinite; }
  @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }
  input::placeholder { color:#2a2a3a; }
  input:focus { border-color:#3a3a5a !important; outline:none; }
  ::-webkit-scrollbar{width:2px;} ::-webkit-scrollbar-thumb{background:#1e1e2a;border-radius:2px;}
`;
