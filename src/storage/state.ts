import {migrateV7,isLegacyV7} from './migrations.ts';
import {isLegacyV8,migrateV8} from './legacy-v8.ts';
import type {AppState,Match,Player,Session,SessionParticipant,TeamId} from '../domain/types.ts';

export const STORAGE_KEY='terca-fc:state';
export const LEGACY_V7_BACKUP_KEY=`${STORAGE_KEY}:backup-v7`;
export const LEGACY_V8_BACKUP_KEY=`${STORAGE_KEY}:backup-v8`;
export const UNREADABLE_PREFIX=`${STORAGE_KEY}:unreadable-`;

export type StateRecovery={
  raw:string;
  recoveryKey:string|null;
  reason:string;
};

export type StateLoadResult={
  state:AppState;
  status:'empty'|'ready'|'recovery';
  recovery:StateRecovery|null;
};

export const initialState=():AppState=>({
  version:9,
  players:[],
  activeSessionId:null,
  sessions:[],
});

const TEAM_IDS:TeamId[]=['team-1','team-2','team-3'];
let persistenceBlocked=false;

const isMatchLike=(value:unknown):value is Match=>{
  if(!value||typeof value!=='object')return false;
  const match=value as Match;
  return Boolean(
    TEAM_IDS.includes(match.defender)&&
    TEAM_IDS.includes(match.challenger)&&
    TEAM_IDS.includes(match.waiting)&&
    Array.isArray(match.events)
  );
};

const isPlayerLike=(value:unknown):value is Player=>{
  if(!value||typeof value!=='object')return false;
  const player=value as Player;
  return Boolean(
    typeof player.id==='string'&&
    typeof player.name==='string'&&
    typeof player.goalkeeper==='boolean'&&
    typeof player.createdAt==='number'
  );
};

const isParticipantLike=(value:unknown):value is SessionParticipant=>{
  if(!value||typeof value!=='object')return false;
  const participant=value as SessionParticipant;
  return Boolean(
    typeof participant.id==='string'&&
    (participant.playerId===null||typeof participant.playerId==='string')&&
    typeof participant.name==='string'&&
    typeof participant.goalkeeper==='boolean'&&
    (participant.teamId===null||TEAM_IDS.includes(participant.teamId))&&
    (participant.slot===null||typeof participant.slot==='number')
  );
};

const isSessionLike=(value:unknown):value is Session=>{
  if(!value||typeof value!=='object')return false;
  const session=value as Session;
  return Boolean(
    typeof session.id==='string'&&
    (session.status==='active'||session.status==='finished')&&
    session.teams&&
    TEAM_IDS.every(id=>session.teams[id])&&
    Array.isArray(session.participants)&&
    session.participants.every(isParticipantLike)&&
    isMatchLike(session.current)&&
    Array.isArray(session.history)&&
    session.history.every(isMatchLike)
  );
};

export const isV9State=(value:unknown):value is AppState=>{
  if(!value||typeof value!=='object')return false;
  const state=value as AppState;

  if(state.version!==9||
    !Array.isArray(state.players)||
    !state.players.every(isPlayerLike)||
    (state.activeSessionId!==null&&typeof state.activeSessionId!=='string')||
    !Array.isArray(state.sessions)||
    !state.sessions.every(isSessionLike)
  )return false;

  const playerIds=new Set(state.players.map(player=>player.id));
  if(playerIds.size!==state.players.length)return false;

  const linkedParticipants=state.sessions.flatMap(session=>
    session.participants.filter(participant=>participant.playerId!==null)
  );
  if(linkedParticipants.some(participant=>!playerIds.has(participant.playerId!)))return false;

  const active=state.sessions.filter(session=>session.status==='active');
  if(active.length>1)return false;
  if(state.activeSessionId===null)return active.length===0;
  return active.length===1&&active[0].id===state.activeSessionId;
};

export const normalizeState=(value:unknown):AppState=>{
  if(isV9State(value))return value;

  if(isLegacyV8(value)){
    const migrated=migrateV8(value);
    if(isV9State(migrated))return migrated;
  }

  if(isLegacyV7(value)){
    const migrated=migrateV7(value);
    if(isV9State(migrated))return migrated;
  }

  throw new Error('Backup inválido ou incompatível');
};

const preserveOnce=(key:string,raw:string)=>{
  if(localStorage.getItem(key)!==null)return;
  localStorage.setItem(key,raw);
};

const preserveUnreadable=(raw:string,now:number)=>{
  const key=`${UNREADABLE_PREFIX}${now}`;
  try{
    localStorage.setItem(key,raw);
    return key;
  }catch{
    return null;
  }
};

const errorMessage=(error:unknown)=>
  error instanceof Error?error.message:'Não foi possível interpretar os dados locais.';

export const loadState=(now=Date.now()):StateLoadResult=>{
  const raw=localStorage.getItem(STORAGE_KEY);
  if(raw===null){
    persistenceBlocked=false;
    return {state:initialState(),status:'empty',recovery:null};
  }

  try{
    const parsed:unknown=JSON.parse(raw);

    if(isLegacyV8(parsed))preserveOnce(LEGACY_V8_BACKUP_KEY,raw);
    else if(isLegacyV7(parsed))preserveOnce(LEGACY_V7_BACKUP_KEY,raw);

    const state=normalizeState(parsed);
    persistenceBlocked=false;
    return {state,status:'ready',recovery:null};
  }catch(error){
    persistenceBlocked=true;
    return {
      state:initialState(),
      status:'recovery',
      recovery:{
        raw,
        recoveryKey:preserveUnreadable(raw,now),
        reason:errorMessage(error),
      },
    };
  }
};

export const saveState=(state:AppState)=>{
  if(persistenceBlocked)return false;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  return true;
};

export const resumePersistence=()=>{
  persistenceBlocked=false;
};

export const clearState=()=>{
  localStorage.removeItem(STORAGE_KEY);
  persistenceBlocked=false;
};

export const isBackupLike=(value:unknown)=>
  isV9State(value)||isLegacyV8(value)||isLegacyV7(value);
