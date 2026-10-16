import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Play,Pause,RotateCcw,Plus,Users,History,Settings,Download,Upload,Trophy,TimerReset,CalendarDays} from 'lucide-react';
import {KIT_PRESETS,TEAM_IDS,isPresetHex,kitNameFromHex} from './domain/kits';
import {expireMatch,newMatch,resolveCompetitiveResult,scoreGoal,type FinishReason, type GoalSide} from './domain/match';
import {nextRotation} from './domain/rotation';
import {activeSession,canEndSession,endSession,sessionById,sortedSessions,startSession,updateActiveSession} from './domain/session';
import {teamStats,totalGoals} from './domain/statistics';
import type {AppState,Match,Session,Team,TeamId,TeamStats} from './domain/types';
import {isBackupLike,initialState,loadState,normalizeState,saveState} from './storage/state';
import './styles.css';

const fmt=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
const fmtNow=(date:Date)=>{
  const weekday=new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(date).replace('-feira','').toUpperCase();
  const day=new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
  const time=new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(date);
  return `${weekday} • ${day} • ${time}`;
};
const fmtSessionDate=(date:string)=>{
  const [year,month,day]=date.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'})
    .format(new Date(year,month-1,day))
    .replace('-feira','');
};
const teamStyle=(team:Team)=>({'--team':team.hex} as React.CSSProperties);
const textColor=(hex:string)=>{
  const h=hex.replace('#','');
  if(h.length!==6)return '#fff';
  const [r,g,b]=[0,2,4].map(index=>parseInt(h.slice(index,index+2),16));
  return (r*299+g*587+b*114)/1000>155?'#111':'#fff';
};
const teamName=(team:Team)=>kitNameFromHex(team.hex);

const finishMatch=(session:Session,reason:FinishReason,now:number):Session=>{
  const match=session.current;
  if(match.status==='finished'||match.status==='penalties')return session;

  const result=resolveCompetitiveResult(match,session.history.length,reason);
  if(result==='penalties'){
    return {
      ...session,
      current:{
        ...match,
        status:'penalties',
        reason:'penaltis',
        remaining:0,
        endsAt:null,
        events:[...match.events,{at:now,type:'penaltis'}],
      },
    };
  }

  const done:Match={
    ...match,
    status:'finished',
    winner:result,
    reason,
    remaining:reason==='tempo'?0:match.remaining,
    endsAt:null,
    finishedAt:now,
    events:[...match.events,{at:now,type:'fim'}],
  };

  return {...session,current:done,history:[done,...session.history]};
};

function App(){
  const [state,setState]=useState<AppState>(loadState);
  const [tab,setTab]=useState<'quadra'|'times'|'historico'|'ajustes'>('quadra');
  const [now,setNow]=useState(()=>new Date());
  const [historySessionId,setHistorySessionId]=useState<string|null>(null);

  const active=activeSession(state);
  const sessions=useMemo(()=>sortedSessions(state),[state.sessions]);
  const historySession=sessionById(state,historySessionId)??active??sessions[0]??null;

  useEffect(()=>{
    const id=setInterval(()=>setNow(new Date()),1000);
    return()=>clearInterval(id);
  },[]);

  useEffect(()=>saveState(state),[state]);

  useEffect(()=>{
    if(!active||active.current.status!=='running'||!active.current.endsAt)return;

    const id=setInterval(()=>{
      setState(current=>updateActiveSession(current,session=>{
        const match=session.current;
        if(match.status!=='running'||!match.endsAt)return session;

        const remaining=Math.max(0,Math.ceil((match.endsAt-Date.now())/1000));
        if(remaining<=0)return {...session,current:expireMatch({...match,remaining:0})};
        if(remaining===match.remaining)return session;
        return {...session,current:{...match,remaining}};
      }));
    },250);

    return()=>clearInterval(id);
  },[active?.id,active?.current.id,active?.current.status,active?.current.endsAt]);

  useEffect(()=>{
    if(historySessionId&&sessionById(state,historySessionId))return;
    if(active)setHistorySessionId(active.id);
    else if(sessions[0])setHistorySessionId(sessions[0].id);
  },[state.sessions,state.activeSessionId,historySessionId]);

  const beginTuesday=()=>{
    setState(current=>startSession(current,Date.now()));
    setTab('quadra');
  };

  const finish=(reason:FinishReason)=>setState(current=>
    updateActiveSession(current,session=>finishMatch(session,reason,Date.now()))
  );

  const choosePenaltyWinner=(winner:TeamId)=>setState(current=>
    updateActiveSession(current,session=>{
      const match=session.current;
      if(match.status!=='penalties'||(winner!==match.defender&&winner!==match.challenger))return session;
      const now=Date.now();
      const done:Match={
        ...match,
        status:'finished',
        winner,
        reason:'penaltis',
        finishedAt:now,
        events:[...match.events,{at:now,type:'fim_penaltis',team:winner}],
      };
      return {...session,current:done,history:[done,...session.history]};
    })
  );

  const goal=(side:GoalSide)=>setState(current=>
    updateActiveSession(current,session=>{
      const before=session.current;
      const match=scoreGoal(before,side,Date.now());
      const changed={...session,current:match};

      if(match.sd>=2||match.sc>=2)return finishMatch(changed,'2 gols',Date.now());
      if(before.status==='expired')return finishMatch(changed,'tempo',Date.now());
      return changed;
    })
  );

  const startPause=()=>setState(current=>
    updateActiveSession(current,session=>{
      const match=session.current;
      if(match.status==='finished'||match.status==='penalties'||match.status==='expired')return session;

      if(match.status==='running'){
        const remaining=Math.max(0,Math.ceil(((match.endsAt??Date.now())-Date.now())/1000));
        if(remaining<=0)return {...session,current:expireMatch({...match,remaining:0})};
        return {...session,current:{...match,status:'paused',remaining,endsAt:null}};
      }

      const timestamp=Date.now();
      return {
        ...session,
        current:{
          ...match,
          status:'running',
          startedAt:match.startedAt??timestamp,
          endsAt:timestamp+match.remaining*1000,
        },
      };
    })
  );

  const next=()=>setState(current=>
    updateActiveSession(current,session=>{
      const rotation=nextRotation(session.current);
      if(!rotation)return session;
      return {...session,current:newMatch(rotation.defender,rotation.challenger,rotation.waiting)};
    })
  );

  const resetCurrent=()=>setState(current=>
    updateActiveSession(current,session=>{
      const match=session.current;
      const hasProgress=match.status!=='ready'||match.sd>0||match.sc>0||match.events.length>0||match.remaining<420;
      if(hasProgress&&!confirm('Reiniciar a partida atual? O placar, o tempo e os eventos desta partida serão descartados.'))return session;
      return {...session,current:newMatch(match.defender,match.challenger,match.waiting)};
    })
  );

  const closeTuesday=()=>{
    if(!active||!canEndSession(active))return;
    if(!confirm(`Encerrar a terça de ${fmtSessionDate(active.date)}? O histórico será preservado com ${active.history.length} partidas e ${totalGoals(active.history)} gols.`))return;
    setState(current=>endSession(current,Date.now()));
  };

  return <div className="app">
    <header>
      <div><div className="eyebrow">{fmtNow(now)}</div><h1>CEFAS</h1></div>
      <div className="live"><span/>LOCAL FIRST · V0.7</div>
    </header>

    <main>
      {tab==='quadra'&&(
        active
          ?<Court session={active} goal={goal} startPause={startPause} resetCurrent={resetCurrent} finish={finish} choosePenaltyWinner={choosePenaltyWinner} next={next}/>
          :<SessionLanding sessions={sessions} onStart={beginTuesday}/>
      )}

      {tab==='times'&&(
        active
          ?<Teams session={active} setState={setState}/>
          :<SessionLanding sessions={sessions} onStart={beginTuesday}/>
      )}

      {tab==='historico'&&<HistoryPanel
        sessions={sessions}
        selected={historySession}
        activeSessionId={state.activeSessionId}
        onSelect={setHistorySessionId}
        onEnd={closeTuesday}
        onStart={beginTuesday}
      />}

      {tab==='ajustes'&&<SettingsPanel state={state} setState={setState}/>}
    </main>

    <nav>{[
      ['quadra',TimerReset,'Quadra'],
      ['times',Users,'Times'],
      ['historico',History,'Histórico'],
      ['ajustes',Settings,'Ajustes'],
    ].map(([id,Icon,label]:any)=>
      <button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>
        <Icon/>{label}
      </button>
    )}</nav>
  </div>;
}

function SessionLanding({sessions,onStart}:{sessions:Session[];onStart:()=>void}){
  const latest=sessions[0];
  return <section className="session-landing">
    <CalendarDays/>
    <div className="eyebrow">TERÇAS</div>
    <h2>Nenhuma terça em andamento</h2>
    <p>Inicie uma nova sessão para configurar os coletes e começar a súmula da noite.</p>
    {latest&&<small>Última sessão: {fmtSessionDate(latest.date)} · {latest.history.length} partidas</small>}
    <button onClick={onStart}>Iniciar terça</button>
  </section>;
}

function Court({
  session,goal,startPause,resetCurrent,finish,choosePenaltyWinner,next,
}:{
  session:Session;
  goal:(side:GoalSide)=>void;
  startPause:()=>void;
  resetCurrent:()=>void;
  finish:(reason:FinishReason)=>void;
  choosePenaltyWinner:(winner:TeamId)=>void;
  next:()=>void;
}){
  const match=session.current;
  const team=(id:TeamId)=>session.teams[id];
  const stats=(id:TeamId)=>teamStats(session.history,id);
  const status=
    match.status==='running'?'EM JOGO':
    match.status==='paused'?'PAUSADO':
    match.status==='expired'?'TEMPO ESGOTADO':
    match.status==='penalties'?'PÊNALTIS':
    match.status==='finished'?'FIM':'PRONTO';

  return <section className="court">
    <div className="match-meta">
      <span>{match.status==='finished'?'PARTIDA ENCERRADA':fmtSessionDate(session.date)}</span>
      <span>7 MIN · 2 GOLS</span>
    </div>

    <div className="scoreboard">
      <TeamSide team={team(match.defender)} role="DEFENDE" stats={stats(match.defender)}/>
      <div className="clock">
        <b>{match.sd} <i>×</i> {match.sc}</b>
        <strong>{fmt(match.remaining)}</strong>
        <small>{status}</small>
      </div>
      <TeamSide team={team(match.challenger)} role="DESAFIA" stats={stats(match.challenger)}/>
    </div>

    <div className="rule">
      {session.history.length===0
        ?<>Empate no 1º jogo vai para pênaltis</>
        :<>{teamName(team(match.defender))} precisa vencer <span>•</span> empate mantém {teamName(team(match.challenger))}</>}
    </div>

    {match.status==='penalties'
      ?<div className="penalties">
        <Trophy/>
        <div><small>DISPUTA DE PÊNALTIS</small><h2>Quem venceu?</h2><p>Não é necessário registrar as cobranças.</p></div>
        <div className="penalty-actions">
          {[match.defender,match.challenger].map(id=>
            <button key={id} className="goal" style={{...teamStyle(team(id)),color:textColor(team(id).hex)}} onClick={()=>choosePenaltyWinner(id)}>
              {teamName(team(id))}
            </button>
          )}
        </div>
      </div>
      :match.status!=='finished'
        ?<>
          <div className="goal-row">
            <button className="goal" style={{...teamStyle(team(match.defender)),color:textColor(team(match.defender).hex)}} onClick={()=>goal('d')}><Plus/> Gol {teamName(team(match.defender))}</button>
            <button className="goal" style={{...teamStyle(team(match.challenger)),color:textColor(team(match.challenger).hex)}} onClick={()=>goal('c')}><Plus/> Gol {teamName(team(match.challenger))}</button>
          </div>
          <div className="controls">
            {match.status==='expired'
              ?<button className="time-finish" onClick={()=>finish('tempo')}>Encerrar por tempo</button>
              :<button onClick={startPause}>{match.status==='running'?<Pause/>:<Play/>}{match.status==='running'?'Pausar':'Iniciar'}</button>
            }
            <button onClick={resetCurrent}><RotateCcw/>Reiniciar</button>
          </div>
          {match.status==='expired'&&<div className="expired-note">00:00 informa o fim do tempo. Encerre após a interrupção natural da jogada.</div>}
        </>
        :<div className="result">
          <Trophy/>
          <div>
            <small>PERMANECE NA QUADRA</small>
            <h2>{teamName(team(match.winner!))}</h2>
            <p>{match.reason==='tempo'?'Tempo encerrado':match.reason==='penaltis'?'Vitória nos pênaltis':'Dois gols'} · {match.sd} × {match.sc}</p>
          </div>
          <button onClick={next}>Próxima partida →</button>
        </div>
    }

    <div className="waiting" style={teamStyle(team(match.waiting))}>
      <div><small>PRÓXIMO</small><strong>{teamName(team(match.waiting))}</strong></div>
    </div>
  </section>;
}

function Teams({session,setState}:{session:Session;setState:React.Dispatch<React.SetStateAction<AppState>>}){
  const stats=(id:TeamId)=>teamStats(session.history,id);
  const setSession=(update:(session:Session)=>Session)=>setState(state=>updateActiveSession(state,update));

  return <section>
    <div className="section-title"><div><div className="eyebrow">{fmtSessionDate(session.date)}</div><h2>3 times · 6 jogadores</h2></div></div>
    <InitialMatchSelector session={session} setSession={setSession}/>
    <div className="teams-grid">
      {TEAM_IDS.map(id=>
        <TeamEditor
          key={id}
          team={session.teams[id]}
          stats={stats(id)}
          kitLocked={session.history.length>0||session.current.status!=='ready'}
          usedHexes={TEAM_IDS.filter(other=>other!==id).map(other=>session.teams[other].hex)}
          onChange={team=>setSession(current=>({...current,teams:{...current.teams,[id]:team}}))}
        />
      )}
    </div>
  </section>;
}

function InitialMatchSelector({session,setSession}:{session:Session;setSession:(update:(session:Session)=>Session)=>void}){
  const locked=session.history.length>0||session.current.status!=='ready';

  const setFirst=(id:TeamId)=>setSession(current=>{
    if(current.history.length>0||current.current.status!=='ready'||id===current.current.challenger)return current;
    const waiting=TEAM_IDS.find(item=>item!==id&&item!==current.current.challenger)!;
    return {...current,current:newMatch(id,current.current.challenger,waiting)};
  });

  const setSecond=(id:TeamId)=>setSession(current=>{
    if(current.history.length>0||current.current.status!=='ready'||id===current.current.defender)return current;
    const waiting=TEAM_IDS.find(item=>item!==current.current.defender&&item!==id)!;
    return {...current,current:newMatch(current.current.defender,id,waiting)};
  });

  return <div className={`initial-match ${locked?'locked':''}`}>
    <div className="initial-match-copy">
      <small>CONFRONTO INICIAL</small>
      <h3>Quem começa jogando?</h3>
      <p>{locked?'A escolha fica bloqueada depois que a primeira partida começa.':'Escolha os dois times da primeira partida. O terceiro fica aguardando.'}</p>
    </div>
    <div className="initial-match-fields">
      <label><span>TIME 1</span>
        <select value={session.current.defender} disabled={locked} onChange={event=>setFirst(event.target.value as TeamId)}>
          {TEAM_IDS.filter(id=>id!==session.current.challenger).map(id=><option key={id} value={id}>{teamName(session.teams[id])}</option>)}
        </select>
      </label>
      <span className="versus">×</span>
      <label><span>TIME 2</span>
        <select value={session.current.challenger} disabled={locked} onChange={event=>setSecond(event.target.value as TeamId)}>
          {TEAM_IDS.filter(id=>id!==session.current.defender).map(id=><option key={id} value={id}>{teamName(session.teams[id])}</option>)}
        </select>
      </label>
      <div className="initial-waiting"><span>AGUARDA</span><strong>{teamName(session.teams[session.current.waiting])}</strong></div>
    </div>
  </div>;
}

function TeamSide({team,role,stats}:{team:Team;role:string;stats:TeamStats}){
  return <div className="team-side">
    <div className="shirt" style={teamStyle(team)}/>
    <small>{role}</small>
    <h2>{teamName(team)}</h2>
    <div className="team-record"><b>{stats.wins}V</b><span>{stats.losses}D</span></div>
  </div>;
}

function TeamEditor({
  team,stats,onChange,kitLocked,usedHexes,
}:{
  team:Team;
  stats:TeamStats;
  onChange:(team:Team)=>void;
  kitLocked:boolean;
  usedHexes:string[];
}){
  const updateName=(index:number,name:string)=>{
    const players=team.players.map((player,current)=>current===index?{...player,name}:player);
    onChange({...team,players});
  };

  const chooseKit=(hex:string)=>{
    if(kitLocked)return;
    const normalized=hex.toLowerCase();
    if(usedHexes.some(value=>value.toLowerCase()===normalized)){
      alert('Este colete já está sendo usado por outro time. Escolha uma cor diferente.');
      return;
    }
    onChange({...team,hex:normalized});
  };

  return <div className="team-card" style={teamStyle(team)}>
    <div className="team-card-head">
      <div><small>COLETE</small><h3>{teamName(team)}</h3></div>
      <div className="result-counter">
        <span><b>{stats.wins}</b> vitórias</span>
        <span><b>{stats.losses}</b> derrotas</span>
        <small>{stats.games} jogos</small>
      </div>
    </div>

    <div className="kit-editor">
      <div className="kit-current">
        <span className="kit-current-swatch" style={{background:team.hex}}/>
        <div><small>COLETE SELECIONADO</small><strong>{teamName(team)}</strong><code>{team.hex.toUpperCase()}</code></div>
      </div>

      <div className="kit-presets">
        {KIT_PRESETS.map(kit=>{
          const selected=kit.hex.toLowerCase()===team.hex.toLowerCase();
          const used=usedHexes.some(hex=>hex.toLowerCase()===kit.hex.toLowerCase());
          const disabled=kitLocked||(used&&!selected);
          return <button type="button" key={kit.name} className={`kit-option ${selected?'selected':''}`} aria-pressed={selected} disabled={disabled} title={used&&!selected?'Este colete já está em uso':''} onClick={()=>chooseKit(kit.hex)}>
            <span className="kit-swatch" style={{background:kit.hex}}/><b>{kit.name}</b>
          </button>;
        })}
        <label className={`kit-option kit-custom ${!isPresetHex(team.hex)?'selected':''} ${kitLocked?'disabled':''}`}>
          <span className="kit-swatch" style={{background:team.hex}}/><b>Outra cor</b>
          <input aria-label="Escolher outra cor de colete" type="color" value={team.hex} disabled={kitLocked} onChange={event=>chooseKit(event.target.value)}/>
        </label>
      </div>

      {kitLocked&&<div className="kit-lock-note">Coletes bloqueados após o início da primeira partida.</div>}
    </div>

    {team.players.map((player,index)=>
      <div className="player" key={player.id}>
        <span>{player.gk?'GK':String(index).padStart(2,'0')}</span>
        <input value={player.name} onChange={event=>updateName(index,event.target.value)}/>
      </div>
    )}
  </div>;
}

function HistoryPanel({
  sessions,selected,activeSessionId,onSelect,onEnd,onStart,
}:{
  sessions:Session[];
  selected:Session|null;
  activeSessionId:string|null;
  onSelect:(id:string)=>void;
  onEnd:()=>void;
  onStart:()=>void;
}){
  if(!selected)return <SessionLanding sessions={sessions} onStart={onStart}/>;

  const active=selected.id===activeSessionId;
  const stats=(id:TeamId)=>teamStats(selected.history,id);

  return <section>
    <div className="section-title history-title">
      <div><div className="eyebrow">SÚMULA</div><h2>Histórico por terça</h2></div>
      <div className="session-actions">
        {!activeSessionId&&<button onClick={onStart}>Nova terça</button>}
        {active&&canEndSession(selected)&&<button className="end-session" onClick={onEnd}>Encerrar terça</button>}
      </div>
    </div>

    <div className="session-switcher">
      {sessions.map(session=>
        <button key={session.id} className={session.id===selected.id?'active':''} onClick={()=>onSelect(session.id)}>
          <strong>{fmtSessionDate(session.date)}</strong>
          <small>{session.status==='active'?'EM ANDAMENTO':`${session.history.length} partidas`}</small>
        </button>
      )}
    </div>

    <div className="history-summary">
      {TEAM_IDS.map(id=>{
        const data=stats(id);
        const team=selected.teams[id];
        return <div className="history-summary-card" key={id} style={teamStyle(team)}>
          <div className="history-summary-team"><span className="dot"/><strong>{teamName(team)}</strong></div>
          <div className="history-summary-stats">
            <span><b>{data.games}</b><small>J</small></span>
            <span><b>{data.wins}</b><small>V</small></span>
            <span><b>{data.losses}</b><small>D</small></span>
            <span><b>{data.goals}</b><small>G</small></span>
          </div>
        </div>;
      })}
    </div>

    {active&&!canEndSession(selected)&&<div className="session-warning">Finalize a partida atual antes de encerrar a terça.</div>}

    <div className="history">
      {selected.history.length===0
        ?<div className="empty">Nenhuma partida encerrada nesta terça.</div>
        :selected.history.map((match,index)=>
          <div className="history-item" key={match.id}>
            <b className="match-number">#{selected.history.length-index}</b>
            <div className="history-score">
              <div className="history-team history-team-left"><span className="dot" style={teamStyle(selected.teams[match.defender])}/><strong>{teamName(selected.teams[match.defender])}</strong></div>
              <div className="history-scoreline"><b>{match.sd}</b><em>×</em><b>{match.sc}</b></div>
              <div className="history-team history-team-right"><strong>{teamName(selected.teams[match.challenger])}</strong><span className="dot" style={teamStyle(selected.teams[match.challenger])}/></div>
            </div>
            <span className="winner">fica {match.winner?teamName(selected.teams[match.winner]):'—'}</span>
          </div>
        )
      }
    </div>
  </section>;
}

function SettingsPanel({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}){
  const exp=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
    const link=document.createElement('a');
    link.href=url;
    link.download=`cefas-backup-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),0);
  };

  const imp=(event:React.ChangeEvent<HTMLInputElement>)=>{
    const input=event.currentTarget;
    const file=input.files?.[0];
    if(!file)return;

    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const parsed:unknown=JSON.parse(String(reader.result));
        if(!isBackupLike(parsed))throw new Error('Formato inválido');
        if(!confirm('Restaurar este backup? Os dados atuais deste navegador serão substituídos pelo conteúdo do arquivo.'))return;
        setState(normalizeState(parsed));
        alert('Backup restaurado com sucesso.');
      }catch{
        alert('Backup inválido ou incompatível.');
      }finally{
        input.value='';
      }
    };
    reader.onerror=()=>{
      alert('Não foi possível ler o arquivo de backup.');
      input.value='';
    };
    reader.readAsText(file);
  };

  return <section>
    <div className="section-title"><div className="eyebrow">LOCAL FIRST · SCHEMA V8</div><h2>Dados e backup</h2></div>
    <div className="settings-card">
      <h3>Suas terças ficam neste navegador</h3>
      <p>O backup V8 contém todas as sessões. Backups V7 continuam aceitos e são migrados automaticamente.</p>
      <div className="settings-actions">
        <button onClick={exp}><Download/>Baixar backup</button>
        <label><Upload/>Restaurar backup<input hidden type="file" accept="application/json" onChange={imp}/></label>
      </div>
      <button className="danger" onClick={()=>{
        if(confirm('Apagar todos os dados locais? Esta ação remove todas as terças, partidas, jogadores e configurações deste navegador.'))setState(initialState());
      }}>Apagar dados e recomeçar</button>
    </div>
  </section>;
}

createRoot(document.getElementById('root')!).render(<App/>);
