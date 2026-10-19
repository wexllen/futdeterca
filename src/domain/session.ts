import {DEFAULT_HEX,TEAM_IDS} from './kits.ts';
import {newMatch} from './match.ts';
import type {AppState,Player,Session,SessionParticipant,Team,TeamId} from './types.ts';

const seedTeam=(id:TeamId):Team=>({
  id,
  hex:DEFAULT_HEX[id],
});

export const defaultTeams=():Record<TeamId,Team>=>({
  'team-1':seedTeam('team-1'),
  'team-2':seedTeam('team-2'),
  'team-3':seedTeam('team-3'),
});

export const teamParticipants=(session:Session,teamId:TeamId)=>
  session.participants
    .filter(participant=>participant.teamId===teamId)
    .sort((left,right)=>(left.slot??99)-(right.slot??99));

export const availableParticipants=(session:Session)=>
  session.participants.filter(participant=>participant.teamId===null);

export const participationCounts=(session:Session)=>{
  const present=session.participants.length;
  const assigned=session.participants.filter(participant=>participant.teamId!==null).length;
  return {present,assigned,available:present-assigned};
};

export const isPlayerPresent=(session:Session,playerId:string)=>
  session.participants.some(participant=>participant.playerId===playerId);

export const addPlayerToSession=(
  session:Session,
  player:Player,
  participantId=crypto.randomUUID(),
):Session=>{
  if(isPlayerPresent(session,player.id))return session;

  const participant:SessionParticipant={
    id:participantId,
    playerId:player.id,
    name:player.name,
    goalkeeper:player.goalkeeper,
    teamId:null,
    slot:null,
  };

  return {...session,participants:[...session.participants,participant]};
};

export const removeParticipant=(session:Session,participantId:string):Session=>{
  const participants=session.participants.filter(participant=>participant.id!==participantId);
  return participants.length===session.participants.length?session:{...session,participants};
};

export const assignParticipant=(
  session:Session,
  participantId:string,
  teamId:TeamId,
  slot:number,
):Session=>{
  if(!Number.isInteger(slot)||slot<0||slot>5)return session;
  if(session.participants.some(participant=>
    participant.id!==participantId&&participant.teamId===teamId&&participant.slot===slot
  ))return session;

  let changed=false;
  const participants=session.participants.map(participant=>{
    if(participant.id!==participantId)return participant;
    if(participant.teamId===teamId&&participant.slot===slot)return participant;
    changed=true;
    return {...participant,teamId,slot};
  });

  return changed?{...session,participants}:session;
};

export const unassignParticipant=(session:Session,participantId:string):Session=>{
  let changed=false;
  const participants=session.participants.map(participant=>{
    if(participant.id!==participantId||participant.teamId===null)return participant;
    changed=true;
    return {...participant,teamId:null,slot:null};
  });
  return changed?{...session,participants}:session;
};

export const localDateKey=(date:Date)=>{
  const year=date.getFullYear();
  const month=String(date.getMonth()+1).padStart(2,'0');
  const day=String(date.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
};

export const createSession=(now:number):Session=>({
  id:crypto.randomUUID(),
  date:localDateKey(new Date(now)),
  startedAt:now,
  finishedAt:null,
  status:'active',
  teams:defaultTeams(),
  participants:[],
  current:newMatch(),
  history:[],
});

export const activeSession=(state:AppState):Session|null=>
  state.activeSessionId
    ?state.sessions.find(session=>session.id===state.activeSessionId)??null
    :null;

export const updateActiveSession=(
  state:AppState,
  update:(session:Session)=>Session,
):AppState=>{
  if(!state.activeSessionId)return state;
  let changed=false;
  const sessions=state.sessions.map(session=>{
    if(session.id!==state.activeSessionId)return session;
    changed=true;
    return update(session);
  });
  return changed?{...state,sessions}:state;
};

export const addExistingPlayerToActiveSession=(state:AppState,playerId:string):AppState=>{
  const player=state.players.find(item=>item.id===playerId);
  if(!player)return state;
  return updateActiveSession(state,session=>addPlayerToSession(session,player));
};

export const createPlayerForActiveSession=(
  state:AppState,
  name:string,
  goalkeeper:boolean,
  now:number,
):AppState=>{
  if(!activeSession(state))return state;
  const normalized=name.trim();
  if(!normalized)return state;

  const existing=state.players.find(player=>
    player.name.trim().localeCompare(normalized,undefined,{sensitivity:'accent'})===0
  );
  if(existing)return addExistingPlayerToActiveSession(state,existing.id);

  const player:Player={
    id:crypto.randomUUID(),
    name:normalized,
    goalkeeper,
    createdAt:now,
  };

  const withPlayer={...state,players:[...state.players,player]};
  return addExistingPlayerToActiveSession(withPlayer,player.id);
};

export const startSession=(state:AppState,now:number):AppState=>{
  if(activeSession(state))return state;

  const session=createSession(now);

  return {
    ...state,
    activeSessionId:session.id,
    sessions:[...state.sessions,session],
  };
};

export const canEndSession=(session:Session)=>
  session.status==='active'&&
  (session.current.status==='ready'||session.current.status==='finished');

export const endSession=(state:AppState,now:number):AppState=>{
  const current=activeSession(state);
  if(!current||!canEndSession(current))return state;

  return {
    ...state,
    activeSessionId:null,
    sessions:state.sessions.map(session=>
      session.id===current.id
        ?{...session,status:'finished',finishedAt:now}
        :session
    ),
  };
};

export const sessionById=(state:AppState,id:string|null|undefined)=>
  id?state.sessions.find(session=>session.id===id)??null:null;

export const sortedSessions=(state:AppState)=>
  [...state.sessions].sort((a,b)=>b.startedAt-a.startedAt);

export const hasDuplicateKit=(teams:Record<TeamId,Team>,id:TeamId,hex:string)=>
  TEAM_IDS.some(teamId=>
    teamId!==id&&teams[teamId].hex.toLowerCase()===hex.toLowerCase()
  );
