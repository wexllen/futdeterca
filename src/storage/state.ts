import {migrateV7,isLegacyV7} from './migrations.ts';
import type {AppState,Match,Session,TeamId} from '../domain/types.ts';

export const STORAGE_KEY='terca-fc:state';
export const LEGACY_V7_BACKUP_KEY=`${STORAGE_KEY}:backup-v7`;
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
  version:8,
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

const isSessionLike=(value:unknown):value is Session=>{
  if(!value||typeof value!=='object')return false;
  const session=value as Session;
  return Boolean(
    typeof session.id==='string'&&
    (session.status==='active'||session.status==='finished')&&
    session.teams&&
    TEAM_IDS.every(id=>session.teams[id])&&
    isMatchLike(session.current)&&
    Array.isArray(session.history)&&
    session.history.every(isMatchLike)
  );
};

export const isV8State=(value:unknown):value is AppState=>{
  if(!value||typeof value!=='object')return false;
  const state=value as AppState;

  if(state.version!==8||
    (state.activeSessionId!==null&&typeof state.activeSessionId!=='string')||
    !Array.isArray(state.sessions)||
    !state.sessions.every(isSessionLike)
  )return false;

  const active=state.sessions.filter(session=>session.status==='active');
  if(active.length>1)return false;
  if(state.activeSessionId===null)return active.length===0;
  return active.length===1&&active[0].id===state.activeSessionId;
};

export const normalizeState=(value:unknown):AppState=>{
  if(isV8State(value))return value;
  if(isLegacyV7(value)){
    const migrated=migrateV7(value);
    if(isV8State(migrated))return migrated;
  }
  throw new Error('Backup inválido ou incompatível');
};

const preserveV7BeforeMigration=(raw:string)=>{
  if(localStorage.getItem(LEGACY_V7_BACKUP_KEY)!==null)return;
  localStorage.setItem(LEGACY_V7_BACKUP_KEY,raw);
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
    if(isLegacyV7(parsed))preserveV7BeforeMigration(raw);
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
  isV8State(value)||isLegacyV7(value);
