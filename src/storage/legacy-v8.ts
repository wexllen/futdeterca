import type {AppState,Match,Session,SessionParticipant,TeamId} from '../domain/types.ts';

export type LegacyV8Player={
  id?:string;
  name?:string;
  gk?:boolean;
  games?:number;
  wins?:number;
  goals?:number;
};

export type LegacyV8Team={
  id:TeamId;
  hex:string;
  players:LegacyV8Player[];
};

export type LegacyV8Session={
  id:string;
  date:string;
  startedAt:number;
  finishedAt:number|null;
  status:'active'|'finished';
  teams:Record<TeamId,LegacyV8Team>;
  current:Match;
  history:Match[];
};

export type LegacyV8State={
  version:8;
  activeSessionId:string|null;
  sessions:LegacyV8Session[];
};

const TEAM_IDS:TeamId[]=['team-1','team-2','team-3'];

const participants=(session:LegacyV8Session):SessionParticipant[]=>
  TEAM_IDS.flatMap(teamId=>
    session.teams[teamId].players.map((player,index)=>({
      id:`${session.id}:${teamId}:${index}`,
      playerId:null,
      name:String(player.name||`Jogador ${index+1}`),
      goalkeeper:Boolean(player.gk??index===0),
      teamId,
      slot:index,
    }))
  );

const migrateSession=(session:LegacyV8Session):Session=>({
  id:session.id,
  date:session.date,
  startedAt:session.startedAt,
  finishedAt:session.finishedAt,
  status:session.status,
  teams:{
    'team-1':{id:'team-1',hex:session.teams['team-1'].hex},
    'team-2':{id:'team-2',hex:session.teams['team-2'].hex},
    'team-3':{id:'team-3',hex:session.teams['team-3'].hex},
  },
  participants:participants(session),
  current:session.current,
  history:session.history,
});

export const isLegacyV8=(value:unknown):value is LegacyV8State=>{
  if(!value||typeof value!=='object')return false;
  const candidate=value as LegacyV8State;
  if(
    candidate.version!==8||
    (candidate.activeSessionId!==null&&typeof candidate.activeSessionId!=='string')||
    !Array.isArray(candidate.sessions)
  )return false;

  const sessionsValid=candidate.sessions.every(session=>
    Boolean(
      session&&
      typeof session.id==='string'&&
      (session.status==='active'||session.status==='finished')&&
      session.teams&&
      TEAM_IDS.every(id=>Array.isArray(session.teams[id]?.players))&&
      session.current&&
      Array.isArray(session.current.events)&&
      Array.isArray(session.history)
    )
  );
  if(!sessionsValid)return false;

  const active=candidate.sessions.filter(session=>session.status==='active');
  if(active.length>1)return false;
  if(candidate.activeSessionId===null)return active.length===0;
  return active.length===1&&active[0].id===candidate.activeSessionId;
};

export const migrateV8=(legacy:LegacyV8State):AppState=>{
  if(!isLegacyV8(legacy))throw new Error('Backup V8 inválido');

  return {
    version:9,
    players:[],
    activeSessionId:legacy.activeSessionId,
    sessions:legacy.sessions.map(migrateSession),
  };
};
