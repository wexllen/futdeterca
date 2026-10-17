import {DEFAULT_HEX,TEAM_IDS} from './kits.ts';
import {newMatch} from './match.ts';
import type {AppState,Session,Team,TeamId} from './types.ts';

const DEFAULT_PLAYERS:Record<TeamId,string[]>={
  'team-1':['Goleiro Azul','Jogador A1','Jogador A2','Jogador A3','Jogador A4','Jogador A5'],
  'team-2':['Goleiro Vermelho','Jogador V1','Jogador V2','Jogador V3','Jogador V4','Jogador V5'],
  'team-3':['Goleiro Amarelo','Jogador M1','Jogador M2','Jogador M3','Jogador M4','Jogador M5'],
};

const seedTeam=(id:TeamId):Team=>({
  id,
  hex:DEFAULT_HEX[id],
  players:DEFAULT_PLAYERS[id].map((name,index)=>({
    id:`${id}-${index}`,
    name,
    gk:index===0,
    games:0,
    wins:0,
    goals:0,
  })),
});

export const defaultTeams=():Record<TeamId,Team>=>({
  'team-1':seedTeam('team-1'),
  'team-2':seedTeam('team-2'),
  'team-3':seedTeam('team-3'),
});


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
