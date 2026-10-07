import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Play, Pause, RotateCcw, Plus, Users, History, Settings, Download, Upload, Trophy, TimerReset} from 'lucide-react';
import './styles.css';

type Color='azul'|'verde'|'vermelho';
type Player={id:string;name:string;gk:boolean;games:number;wins:number;goals:number};
type Team={color:Color;name:string;hex:string;players:Player[]};
type Match={id:string;defender:Color;challenger:Color;waiting:Color;sd:number;sc:number;startedAt:number|null;endsAt:number|null;remaining:number;status:'ready'|'running'|'paused'|'penalties'|'finished';winner?:Color;reason?:string;events:{at:number;type:string;team?:Color;player?:string}[]};
type AppState={version:number;teams:Record<Color,Team>;current:Match;history:Match[]};
type TeamStats={games:number;wins:number;losses:number};
const COLORS:Color[]=['azul','verde','vermelho'];
const LABEL:Record<Color,string>={azul:'Azul',verde:'Vermelho',vermelho:'Amarelo'};
const DEFAULT_HEX:Record<Color,string>={azul:'#2368d8',verde:'#d8443d',vermelho:'#f4d03f'};
const seed=(color:Color,names:string[]):Team=>({color,name:LABEL[color],hex:DEFAULT_HEX[color],players:names.map((name,i)=>({id:`${color}-${i}`,name,gk:i===0,games:0,wins:0,goals:0}))});
const newMatch=(d:Color='azul',c:Color='verde',w:Color='vermelho'):Match=>({id:crypto.randomUUID(),defender:d,challenger:c,waiting:w,sd:0,sc:0,startedAt:null,endsAt:null,remaining:420,status:'ready',events:[]});
const initial=():AppState=>({version:7,teams:{azul:seed('azul',['Goleiro Azul','Jogador A1','Jogador A2','Jogador A3','Jogador A4','Jogador A5']),verde:seed('verde',['Goleiro Vermelho','Jogador V1','Jogador V2','Jogador V3','Jogador V4','Jogador V5']),vermelho:seed('vermelho',['Goleiro Amarelo','Jogador M1','Jogador M2','Jogador M3','Jogador M4','Jogador M5'])},current:newMatch(),history:[]});
const normalize=(parsed:any):AppState=>{const base=initial();const teams=Object.fromEntries(COLORS.map(c=>{let raw=parsed?.teams?.[c]||base.teams[c];if(c==='verde'&&raw.name==='Verde'&&String(raw.hex).toLowerCase()==='#239b67')raw={...raw,name:'Vermelho',hex:'#d8443d'};if(c==='vermelho'&&raw.name==='Vermelho'&&String(raw.hex).toLowerCase()==='#d8443d'&&parsed?.teams?.verde?.name==='Vermelho'&&String(parsed?.teams?.verde?.hex||'').toLowerCase()==='#d8443d')raw={...raw,name:'Amarelo',hex:'#f4d03f'};const players=(Array.isArray(raw.players)?raw.players:base.teams[c].players).map((p:any,i:number)=>({id:p.id||`${c}-${i}`,name:p.name||`Jogador ${i+1}`,gk:Boolean(p.gk??i===0),games:Number(p.games||0),wins:Number(p.wins||0),goals:Number(p.goals||0)}));return [c,{color:c,name:raw.name||LABEL[c],hex:raw.hex||DEFAULT_HEX[c],players}] } )) as Record<Color,Team>;const rawCurrent=parsed?.current||base.current;const current={...rawCurrent,endsAt:rawCurrent.endsAt??null};if(current.status==='running'&&!current.endsAt)current.endsAt=Date.now()+current.remaining*1000;return {...base,...parsed,version:7,teams,current,history:Array.isArray(parsed?.history)?parsed.history:[]}};
const load=():AppState=>{try{const x=localStorage.getItem('terca-fc:state');return x?normalize(JSON.parse(x)):initial()}catch{return initial()}};
const fmt=(s:number)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
const fmtNow=(d:Date)=>{const weekday=new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(d).replace('-feira','').toUpperCase();const date=new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(d);const time=new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(d);return `${weekday} • ${date} • ${time}`};
const teamStyle=(t:Team)=>({'--team':t.hex} as React.CSSProperties);
const teamStats=(history:Match[],color:Color):TeamStats=>{const games=history.filter(m=>m.defender===color||m.challenger===color);const wins=games.filter(m=>m.winner===color).length;return {games:games.length,wins,losses:games.length-wins}};
const textColor=(hex:string)=>{const h=hex.replace('#','');if(h.length!==6)return '#fff';const [r,g,b]=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));return (r*299+g*587+b*114)/1000>155?'#111':'#fff'};

function App(){
 const [state,setState]=useState<AppState>(load); const [tab,setTab]=useState<'quadra'|'times'|'historico'|'ajustes'>('quadra'); const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{const id=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(id)},[]);
 useEffect(()=>localStorage.setItem('terca-fc:state',JSON.stringify(state)),[state]);
 useEffect(()=>{if(state.current.status!=='running')return; const id=setInterval(()=>setState(s=>{if(s.current.status!=='running'||!s.current.endsAt)return s; const r=Math.max(0,Math.ceil((s.current.endsAt-Date.now())/1000)); if(r<=0)return finish(s,'tempo'); if(r===s.current.remaining)return s; return {...s,current:{...s.current,remaining:r}}}),250);return()=>clearInterval(id)},[state.current.status,state.current.id]);
 const finish=(s:AppState,reason:string):AppState=>{const m=s.current;if(m.status==='finished'||m.status==='penalties')return s; const isFirstMatch=s.history.length===0; if(reason==='tempo'&&m.sd===m.sc&&isFirstMatch){const shootout={...m,status:'penalties' as const,reason:'penaltis',remaining:0,startedAt:null,endsAt:null,events:[...m.events,{at:Date.now(),type:'penaltis'}]};return {...s,current:shootout}} const winner:Color=m.sd>m.sc?m.defender:m.challenger; const done={...m,status:'finished' as const,winner,reason,remaining:reason==='tempo'?0:m.remaining,startedAt:null,endsAt:null,events:[...m.events,{at:Date.now(),type:'fim'}]}; return {...s,current:done,history:[done,...s.history]}};
 const choosePenaltyWinner=(winner:Color)=>setState(s=>{const m=s.current;if(m.status!=='penalties'||(winner!==m.defender&&winner!==m.challenger))return s;const done={...m,status:'finished' as const,winner,reason:'penaltis',events:[...m.events,{at:Date.now(),type:'fim_penaltis',team:winner}]};return {...s,current:done,history:[done,...s.history]}});
 const goal=(side:'d'|'c')=>setState(s=>{let m={...s.current,events:[...s.current.events]};if(m.status==='finished')return s;if(m.status==='ready'){const now=Date.now();m.status='running';m.startedAt=now;m.endsAt=now+m.remaining*1000;} if(side==='d')m.sd++;else m.sc++;m.events.push({at:Date.now(),type:'gol',team:side==='d'?m.defender:m.challenger}); const ns={...s,current:m};return (m.sd>=2||m.sc>=2)?finish(ns,'2 gols'):ns});
 const startPause=()=>setState(s=>{const m=s.current;if(m.status==='finished')return s;if(m.status==='running'){const r=Math.max(0,Math.ceil(((m.endsAt??Date.now())-Date.now())/1000));if(r<=0)return finish(s,'tempo');return {...s,current:{...m,status:'paused',remaining:r,startedAt:null,endsAt:null}}}const now=Date.now();return {...s,current:{...m,status:'running',startedAt:now,endsAt:now+m.remaining*1000}}});
 const next=()=>setState(s=>{const m=s.current;if(!m.winner)return s; const loser=m.winner===m.defender?m.challenger:m.defender; return {...s,current:newMatch(m.winner,m.waiting,loser)}});
 const resetCurrent=()=>setState(s=>({...s,current:newMatch(s.current.defender,s.current.challenger,s.current.waiting)}));
 const team=(c:Color)=>state.teams[c];
 const stats=(c:Color)=>teamStats(state.history,c);
 return <div className="app"><header><div><div className="eyebrow">{fmtNow(now)}</div><h1>CEFAS</h1></div><div className="live"><span/>LOCAL FIRST</div></header>
 <main>{tab==='quadra'&&<section className="court">
   <div className="match-meta"><span>{state.current.status==='finished'?'PARTIDA ENCERRADA':'QUADRA'}</span><span>7 MIN · 2 GOLS</span></div>
   <div className="scoreboard"><TeamSide team={team(state.current.defender)} role="DEFENDE" stats={stats(state.current.defender)}/><div className="clock"><b>{state.current.sd} <i>×</i> {state.current.sc}</b><strong>{fmt(state.current.remaining)}</strong><small>{state.current.status==='running'?'EM JOGO':state.current.status==='paused'?'PAUSADO':state.current.status==='penalties'?'PÊNALTIS':state.current.status==='finished'?'FIM':'PRONTO'}</small></div><TeamSide team={team(state.current.challenger)} role="DESAFIA" stats={stats(state.current.challenger)}/></div>
   <div className="rule">{state.history.length===0?<>Empate no 1º jogo vai para pênaltis</>:<>{team(state.current.defender).name} precisa vencer <span>•</span> empate mantém {team(state.current.challenger).name}</>}</div>
   {state.current.status==='penalties'?<div className="penalties"><Trophy/><div><small>DISPUTA DE PÊNALTIS</small><h2>Quem venceu?</h2><p>Não é necessário registrar as cobranças.</p></div><div className="penalty-actions"><button className="goal" style={{...teamStyle(team(state.current.defender)),color:textColor(team(state.current.defender).hex)}} onClick={()=>choosePenaltyWinner(state.current.defender)}>{team(state.current.defender).name}</button><button className="goal" style={{...teamStyle(team(state.current.challenger)),color:textColor(team(state.current.challenger).hex)}} onClick={()=>choosePenaltyWinner(state.current.challenger)}>{team(state.current.challenger).name}</button></div></div>:state.current.status!=='finished'?<><div className="goal-row"><button className="goal" style={{...teamStyle(team(state.current.defender)),color:textColor(team(state.current.defender).hex)}} onClick={()=>goal('d')}><Plus/> Gol {team(state.current.defender).name}</button><button className="goal" style={{...teamStyle(team(state.current.challenger)),color:textColor(team(state.current.challenger).hex)}} onClick={()=>goal('c')}><Plus/> Gol {team(state.current.challenger).name}</button></div><div className="controls"><button onClick={startPause}>{state.current.status==='running'?<Pause/>:<Play/>}{state.current.status==='running'?'Pausar':'Iniciar'}</button><button onClick={resetCurrent}><RotateCcw/>Reiniciar</button></div></>:<div className="result"><Trophy/><div><small>PERMANECE NA QUADRA</small><h2>{team(state.current.winner!).name}</h2><p>{state.current.reason==='tempo'?'Tempo encerrado':state.current.reason==='penaltis'?'Vitória nos pênaltis':'Dois gols'} · {state.current.sd} × {state.current.sc}</p></div><button onClick={next}>Próxima partida →</button></div>}
   <div className="waiting" style={teamStyle(team(state.current.waiting))}><div><small>PRÓXIMO</small><strong>{team(state.current.waiting).name}</strong></div></div>
 </section>}
 {tab==='times'&&<section><div className="section-title"><div><div className="eyebrow">ELENCOS DA NOITE</div><h2>3 times · 6 jogadores</h2></div></div><InitialMatchSelector state={state} setState={setState}/><div className="teams-grid">{COLORS.map(c=><TeamEditor key={c} team={team(c)} stats={stats(c)} onChange={t=>setState(s=>({...s,teams:{...s.teams,[c]:t}}))}/>)}</div></section>}
 {tab==='historico'&&<section><div className="section-title"><div className="eyebrow">SÚMULA</div><h2>Histórico da terça</h2></div><div className="history">{state.history.length===0?<div className="empty">Nenhuma partida encerrada ainda.</div>:state.history.map((m,i)=><div className="history-item" key={m.id}><b>#{state.history.length-i}</b><span className="dot" style={teamStyle(team(m.defender))}/><strong>{team(m.defender).name} {m.sd}</strong><em>×</em><strong>{m.sc} {team(m.challenger).name}</strong><span className="winner">fica {team(m.winner!).name}</span></div>)}</div></section>}
 {tab==='ajustes'&&<SettingsPanel state={state} setState={setState}/>}</main>
 <nav>{[['quadra',TimerReset,'Quadra'],['times',Users,'Times'],['historico',History,'Histórico'],['ajustes',Settings,'Ajustes']].map(([id,Icon,label]:any)=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon/>{label}</button>)}</nav></div>
}

function InitialMatchSelector({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}){
 const locked=state.history.length>0||state.current.status!=='ready';
 const setFirst=(c:Color)=>setState(s=>{if(s.history.length>0||s.current.status!=='ready'||c===s.current.challenger)return s;const waiting=COLORS.find(x=>x!==c&&x!==s.current.challenger)!;return {...s,current:newMatch(c,s.current.challenger,waiting)}});
 const setSecond=(c:Color)=>setState(s=>{if(s.history.length>0||s.current.status!=='ready'||c===s.current.defender)return s;const waiting=COLORS.find(x=>x!==s.current.defender&&x!==c)!;return {...s,current:newMatch(s.current.defender,c,waiting)}});
 return <div className={`initial-match ${locked?'locked':''}`}>
   <div className="initial-match-copy"><small>CONFRONTO INICIAL</small><h3>Quem começa jogando?</h3><p>{locked?'A escolha fica bloqueada depois que a primeira partida começa.':'Escolha os dois times da primeira partida. O terceiro fica aguardando.'}</p></div>
   <div className="initial-match-fields">
     <label><span>TIME 1</span><select value={state.current.defender} disabled={locked} onChange={e=>setFirst(e.target.value as Color)}>{COLORS.filter(c=>c!==state.current.challenger).map(c=><option key={c} value={c}>{state.teams[c].name}</option>)}</select></label>
     <span className="versus">×</span>
     <label><span>TIME 2</span><select value={state.current.challenger} disabled={locked} onChange={e=>setSecond(e.target.value as Color)}>{COLORS.filter(c=>c!==state.current.defender).map(c=><option key={c} value={c}>{state.teams[c].name}</option>)}</select></label>
     <div className="initial-waiting"><span>AGUARDA</span><strong>{state.teams[state.current.waiting].name}</strong></div>
   </div>
 </div>
}

function TeamSide({team,role,stats}:{team:Team;role:string;stats:TeamStats}){return <div className="team-side"><div className="shirt" style={teamStyle(team)}/><small>{role}</small><h2>{team.name}</h2><div className="team-record"><b>{stats.wins}V</b><span>{stats.losses}D</span></div></div>}
function TeamEditor({team,stats,onChange}:{team:Team;stats:TeamStats;onChange:(t:Team)=>void}){
 const update=(i:number,k:keyof Player,v:any)=>{const ps=team.players.map((p,x)=>x===i?{...p,[k]:v}:p);onChange({...team,players:ps})};
 return <div className="team-card" style={teamStyle(team)}>
   <div className="team-card-head"><div><small>TIME / COLETE</small><h3>{team.name}</h3></div><div className="result-counter"><span><b>{stats.wins}</b> vitórias</span><span><b>{stats.losses}</b> derrotas</span><small>{stats.games} jogos</small></div></div>
   <div className="kit-editor">
     <label className="color-picker"><input type="color" value={team.hex} onChange={e=>onChange({...team,hex:e.target.value})}/><span style={{background:team.hex}}/></label>
     <div><small>NOME DO TIME</small><input className="kit-name" value={team.name} maxLength={18} onChange={e=>onChange({...team,name:e.target.value||LABEL[team.color]})}/></div>
     <code>{team.hex.toUpperCase()}</code>
   </div>
   {team.players.map((p,i)=><div className="player" key={p.id}><span>{p.gk?'GK':String(i).padStart(2,'0')}</span><input value={p.name} onChange={e=>update(i,'name',e.target.value)}/></div>)}
 </div>
}
function SettingsPanel({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}){const exp=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download=`cefas-backup-${new Date().toISOString().slice(0,10)}.json`;a.click()}; const imp=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{setState(normalize(JSON.parse(String(r.result))))}catch{alert('Backup inválido')}};r.readAsText(f)};return <section><div className="section-title"><div className="eyebrow">LOCAL FIRST</div><h2>Dados e backup</h2></div><div className="settings-card"><h3>Seus dados ficam neste navegador</h3><p>A aplicação não possui servidor nem banco de dados. Faça um backup JSON de tempos em tempos.</p><div className="settings-actions"><button onClick={exp}><Download/>Baixar backup</button><label><Upload/>Restaurar backup<input hidden type="file" accept="application/json" onChange={imp}/></label></div><button className="danger" onClick={()=>{if(confirm('Apagar todos os dados locais?'))setState(initial())}}>Apagar dados e recomeçar</button></div></section>}
createRoot(document.getElementById('root')!).render(<App/>);
