import {useEffect,useMemo,useState} from 'react';
import {History,Settings,TimerReset,Users} from 'lucide-react';
import {Court} from './components/Court';
import {HistoryPanel} from './components/HistoryPanel';
import {SessionLanding} from './components/SessionLanding';
import {SettingsPanel} from './components/SettingsPanel';
import {Teams} from './components/Teams';
import {newMatch,resolveCompetitiveResult,scoreGoal,type FinishReason,type GoalSide} from './domain/match';
import {nextRotation} from './domain/rotation';
import {activeSession,canEndSession,endSession,sessionById,sortedSessions,startSession,updateActiveSession} from './domain/session';
import {totalGoals} from './domain/statistics';
import type {AppState,Match,Session,TeamId} from './domain/types';
import {useMatchTimer} from './hooks/useMatchTimer';
import {loadState,saveState} from './storage/state';
import {formatNow,formatSessionDate} from './ui/presentation';

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

export function App(){
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

  useMatchTimer(active,setState);

  useEffect(()=>{
    if(historySessionId&&sessionById(state,historySessionId))return;
    if(active)setHistorySessionId(active.id);
    else if(sessions[0])setHistorySessionId(sessions[0].id);
  },[state.sessions,state.activeSessionId,historySessionId,active,sessions]);

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
      const timestamp=Date.now();
      const done:Match={
        ...match,
        status:'finished',
        winner,
        reason:'penaltis',
        finishedAt:timestamp,
        events:[...match.events,{at:timestamp,type:'fim_penaltis',team:winner}],
      };
      return {...session,current:done,history:[done,...session.history]};
    })
  );

  const goal=(side:GoalSide)=>setState(current=>
    updateActiveSession(current,session=>{
      const before=session.current;
      const timestamp=Date.now();
      const match=scoreGoal(before,side,timestamp);
      const changed={...session,current:match};

      if(match.sd>=2||match.sc>=2)return finishMatch(changed,'2 gols',timestamp);
      if(before.status==='expired')return finishMatch(changed,'tempo',timestamp);
      return changed;
    })
  );

  const startPause=()=>setState(current=>
    updateActiveSession(current,session=>{
      const match=session.current;
      if(match.status==='finished'||match.status==='penalties'||match.status==='expired')return session;

      if(match.status==='running'){
        const remaining=Math.max(0,Math.ceil(((match.endsAt??Date.now())-Date.now())/1000));
        if(remaining<=0)return {...session,current:{...match,status:'expired',remaining:0,endsAt:null}};
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
    if(!confirm(`Encerrar a terça de ${formatSessionDate(active.date)}? O histórico será preservado com ${active.history.length} partidas e ${totalGoals(active.history)} gols.`))return;
    setState(current=>endSession(current,Date.now()));
  };

  return <div className="app">
    <header>
      <div><div className="eyebrow">{formatNow(now)}</div><h1>CEFAS</h1></div>
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
