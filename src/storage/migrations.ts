import {kitNameFromHex} from '../domain/kits';
import {defaultTeams,localDateKey} from '../domain/session';
import type {AppState,Match,MatchEvent,Session,Team,TeamId} from '../domain/types';

export type LegacyTeamId='azul'|'verde'|'vermelho';

type LegacyPlayer={
  id?:string;
  name?:string;
  gk?:boolean;
  games?:number;
  wins?:number;
  goals?:number;
};

type LegacyTeam={
  color?:LegacyTeamId;
  name?:string;
  hex?:string;
  players?:LegacyPlayer[];
};

type LegacyEvent={
  at?:number;
  type?:string;
  team?:LegacyTeamId;
  player?:string;
};

type LegacyMatch={
  id?:string;
  defender:LegacyTeamId;
  challenger:LegacyTeamId;
  waiting:LegacyTeamId;
  sd?:number;
  sc?:number;
  startedAt?:number|null;
  endsAt?:number|null;
  remaining?:number;
  status?:string;
  winner?:LegacyTeamId;
  reason?:string;
  events?:LegacyEvent[];
};

export type LegacyV7State={
  version?:number;
  teams?:Partial<Record<LegacyTeamId,LegacyTeam>>;
  current?:LegacyMatch;
  history?:LegacyMatch[];
};

export const LEGACY_TO_TEAM_ID:Record<LegacyTeamId,TeamId>={
  azul:'team-1',
  verde:'team-2',
  vermelho:'team-3',
};

const mapTeamId=(id:LegacyTeamId)=>LEGACY_TO_TEAM_ID[id];

const eventTimestamp=(event:LegacyEvent)=>
  typeof event.at==='number'&&Number.isFinite(event.at)?event.at:null;

const minTimestamp=(matches:LegacyMatch[])=>{
  const values=matches.flatMap(match=>
    (match.events??[]).map(eventTimestamp).filter((value):value is number=>value!==null)
  );
  return values.length?Math.min(...values):null;
};

const maxTimestamp=(match:LegacyMatch)=>{
  const values=(match.events??[])
    .map(eventTimestamp)
    .filter((value):value is number=>value!==null);
  return values.length?Math.max(...values):null;
};

const mapEvent=(event:LegacyEvent):MatchEvent=>({
  at:typeof event.at==='number'?event.at:Date.now(),
  type:String(event.type??'evento'),
  ...(event.team?{team:mapTeamId(event.team)}:{}),
  ...(event.player?{player:event.player}:{}),
});

const mapMatch=(legacy:LegacyMatch,finished:boolean):Match=>{
  const status:Match['status']=
    legacy.status==='running'?'running':
    legacy.status==='paused'?'paused':
    legacy.status==='penalties'?'penalties':
    legacy.status==='finished'?'finished':
    'ready';

  const finishedAt=finished?maxTimestamp(legacy):null;

  return {
    id:legacy.id||crypto.randomUUID(),
    defender:mapTeamId(legacy.defender),
    challenger:mapTeamId(legacy.challenger),
    waiting:mapTeamId(legacy.waiting),
    sd:Number(legacy.sd??0),
    sc:Number(legacy.sc??0),
    startedAt:typeof legacy.startedAt==='number'
      ?legacy.startedAt
      :null,
    endsAt:typeof legacy.endsAt==='number'
      ?legacy.endsAt
      :null,
    finishedAt,
    remaining:Number(legacy.remaining??420),
    status:finished?'finished':status,
    ...(legacy.winner?{winner:mapTeamId(legacy.winner)}:{}),
    ...(legacy.reason?{reason:legacy.reason}:{}),
    events:(legacy.events??[]).map(mapEvent),
  };
};

const normalizeLegacyTeam=(
  id:TeamId,
  raw:LegacyTeam|undefined,
  fallback:Team,
):Team=>{
  const hex=String(raw?.hex||fallback.hex).toLowerCase();
  const source=Array.isArray(raw?.players)?raw!.players!:fallback.players;

  return {
    id,
    hex,
    players:source.map((player,index)=>({
      id:player.id||`${id}-${index}`,
      name:player.name||`Jogador ${index+1}`,
      gk:Boolean(player.gk??index===0),
      games:Number(player.games??0),
      wins:Number(player.wins??0),
      goals:Number(player.goals??0),
    })),
  };
};

export const isLegacyV7=(value:unknown):value is LegacyV7State=>{
  if(!value||typeof value!=='object')return false;
  const candidate=value as LegacyV7State;
  return Boolean(candidate.teams&&candidate.current&&Array.isArray(candidate.history));
};

export const migrateV7=(legacy:LegacyV7State,now=Date.now()):AppState=>{
  if(!isLegacyV7(legacy))throw new Error('Backup V7 inválido');

  const fallback=defaultTeams();
  const teams:Session['teams']={
    'team-1':normalizeLegacyTeam('team-1',legacy.teams?.azul,fallback['team-1']),
    'team-2':normalizeLegacyTeam('team-2',legacy.teams?.verde,fallback['team-2']),
    'team-3':normalizeLegacyTeam('team-3',legacy.teams?.vermelho,fallback['team-3']),
  };

  const history=(legacy.history??[]).map(match=>mapMatch(match,true));
  const current=mapMatch(legacy.current!,false);
  const firstEvent=minTimestamp([...(legacy.history??[]),legacy.current!]);
  const startedAt=firstEvent??now;
  const date=localDateKey(new Date(startedAt));

  const session:Session={
    id:`legacy-v7-${date}`,
    date,
    startedAt,
    finishedAt:null,
    status:'active',
    teams,
    current,
    history,
  };

  return {
    version:8,
    activeSessionId:session.id,
    sessions:[session],
  };
};

export const legacyKitLabel=(legacy:LegacyTeam|undefined)=>
  kitNameFromHex(String(legacy?.hex??''));
