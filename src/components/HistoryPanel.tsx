import {TEAM_IDS} from '../domain/kits';
import {canEndSession,teamParticipants} from '../domain/session';
import {rankTeams,teamStats} from '../domain/statistics';
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
  const ranking=rankTeams(selected.history,TEAM_IDS);
  const showRanking=selected.history.length>0;

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
      {(showRanking?ranking:TEAM_IDS.map(id=>({team:id,position:0,stats:stats(id)}))).map(entry=>{
        const id=entry.team;
        const data=entry.stats;
        const team=selected.teams[id];
        const medal=entry.position===1?'🥇':entry.position===2?'🥈':'🥉';
        return <div className="history-summary-card" key={id} style={teamStyle(team)}>
          <div className="history-summary-head">
            <div className="history-summary-team"><span className="dot"/><strong>{teamName(team)}</strong></div>
            {showRanking&&<div className="history-rank" aria-label={`${entry.position}º lugar`}><span>{medal}</span><strong>{entry.position}º</strong></div>}
          </div>
          <div className="history-summary-stats">
            <span><b>{data.games}</b><small>J</small></span>
            <span><b>{data.wins}</b><small>V</small></span>
            <span><b>{data.losses}</b><small>D</small></span>
            <span><b>{data.goals}</b><small>G</small></span>
          </div>
        </div>;
      })}
    </div>

    <section className="history-composition">
      <div className="history-composition-title">
        <div><small>COMPOSIÇÃO DA TERÇA</small><h3>Quem participou</h3></div>
        <span>{selected.participants.length} presentes</span>
      </div>
      <div className="history-composition-grid">
        {TEAM_IDS.map(id=>{
          const participants=teamParticipants(selected,id);
          return <div className="history-composition-team" key={id} style={teamStyle(selected.teams[id])}>
            <div className="history-composition-team-head">
              <span className="dot"/>
              <strong>{teamName(selected.teams[id])}</strong>
              <small>{participants.length}/6</small>
            </div>
            {participants.length===0
              ?<p>Nenhum jogador registrado neste colete.</p>
              :participants.map(participant=><div className="history-composition-player" key={participant.id}>
                <span>{participant.goalkeeper?'GK':participant.slot===null?'—':String(participant.slot).padStart(2,'0')}</span>
                <strong>{participant.name}</strong>
              </div>)
            }
          </div>;
        })}
      </div>
      {selected.participants.some(participant=>participant.teamId===null)&&<div className="history-unassigned">
        <small>PRESENTES SEM COLETE</small>
        <div>{selected.participants.filter(participant=>participant.teamId===null).map(participant=><span key={participant.id}>{participant.name}</span>)}</div>
      </div>}
    </section>

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
