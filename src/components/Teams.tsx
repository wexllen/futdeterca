import type React from 'react';
import {KIT_PRESETS,TEAM_IDS,isPresetHex} from '../domain/kits';
import {newMatch} from '../domain/match';
import {teamStats} from '../domain/statistics';
import {teamParticipants,updateActiveSession} from '../domain/session';
import type {AppState,Session,SessionParticipant,Team,TeamId,TeamStats} from '../domain/types';
import {formatSessionDate,teamName,teamStyle} from '../ui/presentation';

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

function TeamEditor({
  team,participants,stats,onChange,onParticipantChange,kitLocked,usedHexes,
}:{
  team:Team;
  participants:SessionParticipant[];
  stats:TeamStats;
  onChange:(team:Team)=>void;
  onParticipantChange:(participantId:string,name:string)=>void;
  kitLocked:boolean;
  usedHexes:string[];
}){

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

    {participants.map((participant,index)=>
      <div className="player" key={participant.id}>
        <span>{participant.goalkeeper?'GK':String(index).padStart(2,'0')}</span>
        <input value={participant.name} onChange={event=>onParticipantChange(participant.id,event.target.value)}/>
      </div>
    )}
  </div>;
}

export function Teams({session,setState}:{session:Session;setState:React.Dispatch<React.SetStateAction<AppState>>}){
  const stats=(id:TeamId)=>teamStats(session.history,id);
  const setSession=(update:(session:Session)=>Session)=>setState(state=>updateActiveSession(state,update));

  return <section>
    <div className="section-title"><div><div className="eyebrow">{formatSessionDate(session.date)}</div><h2>3 times · 6 jogadores</h2></div></div>
    <InitialMatchSelector session={session} setSession={setSession}/>
    <div className="teams-grid">
      {TEAM_IDS.map(id=>
        <TeamEditor
          key={id}
          team={session.teams[id]}
          participants={teamParticipants(session,id)}
          stats={stats(id)}
          kitLocked={session.history.length>0||session.current.status!=='ready'}
          usedHexes={TEAM_IDS.filter(other=>other!==id).map(other=>session.teams[other].hex)}
          onChange={team=>setSession(current=>({...current,teams:{...current.teams,[id]:team}}))}
          onParticipantChange={(participantId,name)=>setSession(current=>({
            ...current,
            participants:current.participants.map(participant=>
              participant.id===participantId?{...participant,name}:participant
            ),
          }))}
        />
      )}
    </div>
  </section>;
}
