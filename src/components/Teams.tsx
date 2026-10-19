import {useMemo,useState,type Dispatch,type SetStateAction} from 'react';
import {Plus,UserMinus,X} from 'lucide-react';
import {KIT_PRESETS,TEAM_IDS,isPresetHex} from '../domain/kits';
import {newMatch} from '../domain/match';
import {teamStats} from '../domain/statistics';
import {
  addExistingPlayerToActiveSession,
  assignParticipant,
  availableParticipants,
  createPlayerForActiveSession,
  participationCounts,
  removeParticipant,
  teamParticipants,
  unassignParticipant,
  updateActiveSession,
} from '../domain/session';
import type {AppState,Player,Session,SessionParticipant,Team,TeamId,TeamStats} from '../domain/types';
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

function PlayerPicker({
  title,
  participants,
  onChoose,
  onClose,
}:{
  title:string;
  participants:SessionParticipant[];
  onChoose:(participantId:string)=>void;
  onClose:()=>void;
}){
  const ordered=[...participants].sort((left,right)=>
    Number(right.goalkeeper)-Number(left.goalkeeper)||left.name.localeCompare(right.name,'pt-BR')
  );

  return <div className="player-picker-backdrop" role="presentation" onClick={onClose}>
    <section className="player-picker" role="dialog" aria-modal="true" aria-label={title} onClick={event=>event.stopPropagation()}>
      <div className="player-picker-head">
        <div><small>JOGADORES DISPONÍVEIS</small><h3>{title}</h3></div>
        <button type="button" aria-label="Fechar" onClick={onClose}><X/></button>
      </div>
      {ordered.length===0
        ?<p className="player-picker-empty">Todos os presentes já estão alocados.</p>
        :<div className="player-picker-list">
          {ordered.map(participant=>
            <button type="button" key={participant.id} onClick={()=>onChoose(participant.id)}>
              <span>{participant.goalkeeper?'GK':'JOG'}</span>
              <strong>{participant.name}</strong>
            </button>
          )}
        </div>
      }
    </section>
  </div>;
}

function TeamEditor({
  team,
  participants,
  available,
  stats,
  onChange,
  onAssign,
  onUnassign,
  kitLocked,
  usedHexes,
}:{
  team:Team;
  participants:SessionParticipant[];
  available:SessionParticipant[];
  stats:TeamStats;
  onChange:(team:Team)=>void;
  onAssign:(participantId:string,slot:number)=>void;
  onUnassign:(participantId:string)=>void;
  kitLocked:boolean;
  usedHexes:string[];
}){
  const [slotToFill,setSlotToFill]=useState<number|null>(null);

  const chooseKit=(hex:string)=>{
    if(kitLocked)return;
    const normalized=hex.toLowerCase();
    if(usedHexes.some(value=>value.toLowerCase()===normalized)){
      alert('Este colete já está sendo usado por outro time. Escolha uma cor diferente.');
      return;
    }
    onChange({...team,hex:normalized});
  };

  const bySlot=new Map(participants.map(participant=>[participant.slot,participant]));

  return <div className="team-card" style={teamStyle(team)}>
    <div className="team-card-head">
      <div><small>COLETE</small><h3>{teamName(team)}</h3></div>
      <div className="result-counter">
        <span><b>{stats.wins}</b> vitórias</span>
        <span><b>{stats.losses}</b> derrotas</span>
        <small>{stats.games} jogos · {participants.length}/6</small>
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

    <div className="team-slots">
      {Array.from({length:6},(_,slot)=>{
        const participant=bySlot.get(slot);
        const goalkeeper=slot===0;
        return participant
          ?<div className="team-slot filled" key={slot}>
            <span>{goalkeeper?'GK':String(slot).padStart(2,'0')}</span>
            <strong>{participant.name}</strong>
            <button type="button" title="Remover do colete" aria-label={`Remover ${participant.name} do colete`} onClick={()=>onUnassign(participant.id)}><X/></button>
          </div>
          :<button type="button" className="team-slot add" key={slot} onClick={()=>setSlotToFill(slot)}>
            <span>{goalkeeper?'GK':String(slot).padStart(2,'0')}</span>
            <Plus/><strong>{goalkeeper?'Adicionar goleiro':'Adicionar jogador'}</strong>
          </button>;
      })}
    </div>

    {slotToFill!==null&&<PlayerPicker
      title={`Adicionar ao ${teamName(team)}`}
      participants={available}
      onClose={()=>setSlotToFill(null)}
      onChoose={participantId=>{
        onAssign(participantId,slotToFill);
        setSlotToFill(null);
      }}
    />}
  </div>;
}

function PresenceTray({
  session,
  players,
  setState,
}:{
  session:Session;
  players:Player[];
  setState:Dispatch<SetStateAction<AppState>>;
}){
  const [name,setName]=useState('');
  const [goalkeeper,setGoalkeeper]=useState(false);
  const counts=participationCounts(session);
  const existingAvailable=useMemo(
    ()=>players.filter(player=>!session.participants.some(participant=>participant.playerId===player.id)),
    [players,session.participants],
  );

  const assignedName=(participant:SessionParticipant)=>{
    if(participant.teamId===null)return 'disponível';
    return teamName(session.teams[participant.teamId]);
  };

  return <section className="presence-card">
    <div className="presence-head">
      <div><small>JOGADORES DA TERÇA</small><h3>Presença</h3></div>
      <div className="presence-counts">
        <span><b>{counts.present}</b> presentes</span>
        <span><b>{counts.assigned}</b> alocados</span>
        <span><b>{counts.available}</b> disponíveis</span>
      </div>
    </div>

    <div className="presence-add">
      <div className="presence-existing">
        <small>ADICIONAR JOGADOR JÁ CADASTRADO</small>
        {existingAvailable.length===0
          ?<p>{players.length===0?'Nenhum jogador cadastrado ainda.':'Todos os jogadores cadastrados já estão nesta terça.'}</p>
          :<div className="presence-existing-list">
            {existingAvailable
              .sort((a,b)=>Number(b.goalkeeper)-Number(a.goalkeeper)||a.name.localeCompare(b.name,'pt-BR'))
              .map(player=><button type="button" key={player.id} onClick={()=>setState(current=>addExistingPlayerToActiveSession(current,player.id))}>
                <Plus/><span>{player.goalkeeper?'GK':'JOG'}</span><strong>{player.name}</strong>
              </button>)}
          </div>
        }
      </div>

      <form className="presence-new" onSubmit={event=>{
        event.preventDefault();
        if(!name.trim())return;
        setState(current=>createPlayerForActiveSession(current,name,goalkeeper,Date.now()));
        setName('');
        setGoalkeeper(false);
      }}>
        <small>NOVO JOGADOR</small>
        <input value={name} onChange={event=>setName(event.target.value)} placeholder="Nome do jogador"/>
        <label><input type="checkbox" checked={goalkeeper} onChange={event=>setGoalkeeper(event.target.checked)}/> Goleiro</label>
        <button type="submit"><Plus/>Adicionar à terça</button>
      </form>
    </div>

    <div className="presence-list">
      {session.participants.length===0
        ?<p className="presence-empty">Adicione os jogadores presentes para começar a montar os três coletes.</p>
        :session.participants
          .slice()
          .sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))
          .map(participant=><div className="presence-row" key={participant.id}>
            <span className={participant.teamId?'assigned':'available'}/>
            <strong>{participant.name}</strong>
            {participant.goalkeeper&&<small>GK</small>}
            <em>{assignedName(participant)}</em>
            <button type="button" title="Remover da terça" aria-label={`Remover ${participant.name} da terça`} onClick={()=>{
              if(confirm(`Remover ${participant.name} desta terça? O cadastro do jogador será mantido.`)){
                setState(current=>updateActiveSession(current,active=>removeParticipant(active,participant.id)));
              }
            }}><UserMinus/></button>
          </div>)
      }
    </div>
  </section>;
}

export function Teams({state,session,setState}:{state:AppState;session:Session;setState:Dispatch<SetStateAction<AppState>>}){
  const stats=(id:TeamId)=>teamStats(session.history,id);
  const setSession=(update:(session:Session)=>Session)=>setState(current=>updateActiveSession(current,update));
  const available=availableParticipants(session);

  return <section>
    <div className="section-title"><div><div className="eyebrow">{formatSessionDate(session.date)}</div><h2>3 times · até 6 jogadores</h2></div></div>
    <PresenceTray session={session} players={state.players} setState={setState}/>
    <InitialMatchSelector session={session} setSession={setSession}/>
    <div className="teams-grid">
      {TEAM_IDS.map(id=>
        <TeamEditor
          key={id}
          team={session.teams[id]}
          participants={teamParticipants(session,id)}
          available={available}
          stats={stats(id)}
          kitLocked={session.history.length>0||session.current.status!=='ready'}
          usedHexes={TEAM_IDS.filter(other=>other!==id).map(other=>session.teams[other].hex)}
          onChange={team=>setSession(current=>({...current,teams:{...current.teams,[id]:team}}))}
          onAssign={(participantId,slot)=>setSession(current=>assignParticipant(current,participantId,id,slot))}
          onUnassign={participantId=>setSession(current=>unassignParticipant(current,participantId))}
        />
      )}
    </div>
  </section>;
}
