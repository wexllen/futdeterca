import {TEAM_IDS} from '../domain/kits';
import {canEndSession} from '../domain/session';
import {teamStats} from '../domain/statistics';
import type {Session,TeamId} from '../domain/types';
import {formatSessionDate,teamName,teamStyle} from '../ui/presentation';
import {SessionLanding} from './SessionLanding';

export function HistoryPanel({
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
          <strong>{formatSessionDate(session.date)}</strong>
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
