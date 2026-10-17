import {Pause,Play,Plus,RotateCcw,Trophy} from 'lucide-react';
import {teamStats} from '../domain/statistics';
import type {FinishReason,GoalSide} from '../domain/match';
import type {Session,Team,TeamId,TeamStats} from '../domain/types';
import {formatClock,formatSessionDate,teamName,teamStyle,textColor} from '../ui/presentation';

function TeamSide({team,role,stats}:{team:Team;role:string;stats:TeamStats}){
  return <div className="team-side">
    <div className="shirt" style={teamStyle(team)}/>
    <small>{role}</small>
    <h2>{teamName(team)}</h2>
    <div className="team-record"><b>{stats.wins}V</b><span>{stats.losses}D</span></div>
  </div>;
}

export function Court({
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
      <span>{match.status==='finished'?'PARTIDA ENCERRADA':formatSessionDate(session.date)}</span>
      <span>7 MIN · 2 GOLS</span>
    </div>

    <div className="scoreboard">
      <TeamSide team={team(match.defender)} role="DEFENDE" stats={stats(match.defender)}/>
      <div className="clock">
        <b>{match.sd} <i>×</i> {match.sc}</b>
        <strong>{formatClock(match.remaining)}</strong>
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
