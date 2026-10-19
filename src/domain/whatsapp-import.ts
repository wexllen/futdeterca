import {addPlayerToSession,isPlayerPresent} from './session.ts';
import type {AppState,Player,Session} from './types.ts';
import type {ParsedWhatsAppList,WhatsAppListEntry} from './whatsapp.ts';

export type ImportPreviewRow={
  id:string;
  entry:WhatsAppListEntry;
  candidates:Player[];
  status:'existing'|'new'|'ambiguous'|'present';
};

export type ImportDecision={
  rowId:string;
  playerId:string|null;
};

const nameKey=(value:string)=>
  value.trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');

const rowsFromParsed=(parsed:ParsedWhatsAppList)=>
  [...parsed.goalkeepers,...parsed.players].map((entry,index)=>({entry,index}));

export const buildImportPreview=(
  players:Player[],
  session:Session,
  parsed:ParsedWhatsAppList,
):ImportPreviewRow[]=>
  rowsFromParsed(parsed).map(({entry,index})=>{
    const candidates=players.filter(player=>nameKey(player.name)===nameKey(entry.name));
    const present=candidates.find(player=>isPlayerPresent(session,player.id));

    let status:ImportPreviewRow['status']='new';
    if(present)status='present';
    else if(candidates.length===1)status='existing';
    else if(candidates.length>1)status='ambiguous';

    return {
      id:`${entry.goalkeeper?'gk':'player'}:${entry.position}:${index}`,
      entry,
      candidates,
      status,
    };
  });

const addExistingWithImportedRole=(
  session:Session,
  player:Player,
  goalkeeper:boolean,
  participantId:string,
)=>addPlayerToSession(
  session,
  {...player,goalkeeper:player.goalkeeper||goalkeeper},
  participantId,
);

export const applyImportPreview=(
  state:AppState,
  rows:ImportPreviewRow[],
  decisions:ImportDecision[],
  now:number,
  idFactory=()=>crypto.randomUUID(),
):AppState=>{
  if(!state.activeSessionId)return state;

  const decisionMap=new Map(decisions.map(decision=>[decision.rowId,decision.playerId]));
  let players=[...state.players];
  let sessions=state.sessions.map(session=>({...session}));
  const sessionIndex=sessions.findIndex(session=>session.id===state.activeSessionId);
  if(sessionIndex<0)return state;

  let session=sessions[sessionIndex];

  for(const row of rows){
    if(row.status==='present')continue;

    let player:Player|undefined;
    if(row.status==='existing'){
      player=row.candidates[0];
    }else if(row.status==='ambiguous'){
      if(!decisionMap.has(row.id))continue;
      const selected=decisionMap.get(row.id);
      if(selected){
        player=players.find(candidate=>candidate.id===selected);
        if(!player)continue;
      }else{
        player={
          id:idFactory(),
          name:row.entry.name.trim(),
          goalkeeper:row.entry.goalkeeper,
          createdAt:now,
        };
        players.push(player);
      }
    }else{
      const selected=decisionMap.get(row.id);
      if(selected){
        player=players.find(candidate=>candidate.id===selected);
      }

      if(!player){
        const createdDuringImport=players.filter(candidate=>nameKey(candidate.name)===nameKey(row.entry.name));
        if(createdDuringImport.length===1){
          player=createdDuringImport[0];
        }
      }

      if(!player){
        player={
          id:idFactory(),
          name:row.entry.name.trim(),
          goalkeeper:row.entry.goalkeeper,
          createdAt:now,
        };
        players.push(player);
      }
    }

    session=addExistingWithImportedRole(session,player,row.entry.goalkeeper,idFactory());
  }

  sessions[sessionIndex]=session;
  return {...state,players,sessions};
};
