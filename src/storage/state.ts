import {migrateV7,isLegacyV7} from './migrations.ts';
import type {AppState,Match,Session,TeamId} from '../domain/types.ts';

export const STORAGE_KEY='terca-fc:state';

export const initialState=():AppState=>({
  version:8,
  activeSessionId:null,
  sessions:[],
});

const TEAM_IDS:TeamId[]=['team-1','team-2','team-3'];

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
  return state.version===8&&
    (state.activeSessionId===null||typeof state.activeSessionId==='string')&&
    Array.isArray(state.sessions)&&
    state.sessions.every(isSessionLike);
};

export const normalizeState=(value:unknown):AppState=>{
  if(isV8State(value))return value;
  if(isLegacyV7(value))return migrateV7(value);
  throw new Error('Backup inválido ou incompatível');
};

export const loadState=():AppState=>{
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    return raw?normalizeState(JSON.parse(raw)):initialState();
  }catch{
    return initialState();
  }
};

export const saveState=(state:AppState)=>
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));

export const isBackupLike=(value:unknown)=>
  isV8State(value)||isLegacyV7(value);
