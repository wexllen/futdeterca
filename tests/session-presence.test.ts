import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addPlayerToSession,
  assignParticipant,
  availableParticipants,
  createPlayerForActiveSession,
  createSession,
  participationCounts,
  removeParticipant,
  teamParticipants,
  unassignParticipant,
} from '../src/domain/session.ts';
import type {AppState,Player} from '../src/domain/types.ts';

const player=(id:string,name:string,goalkeeper=false):Player=>({
  id,
  name,
  goalkeeper,
  createdAt:1,
});

test('nova sessao começa sem placeholders e sem presentes',()=>{
  const session=createSession(1_700_000_000_000);
  assert.deepEqual(session.participants,[]);
  assert.deepEqual(participationCounts(session),{present:0,assigned:0,available:0});
});

test('jogador presente começa disponivel e não duplica na sessão',()=>{
  const base=createSession(1_700_000_000_000);
  const will=player('p-will','Will');

  const once=addPlayerToSession(base,will,'part-will');
  const twice=addPlayerToSession(once,will,'part-will-2');

  assert.equal(twice.participants.length,1);
  assert.equal(twice.participants[0].playerId,'p-will');
  assert.equal(twice.participants[0].teamId,null);
  assert.deepEqual(participationCounts(twice),{present:1,assigned:0,available:1});
});

test('alocar remove dos disponiveis e desalocar devolve sem excluir da terça',()=>{
  const base=addPlayerToSession(createSession(1_700_000_000_000),player('p1','Zé'),'part-1');
  const assigned=assignParticipant(base,'part-1','team-1',2);

  assert.equal(teamParticipants(assigned,'team-1')[0].name,'Zé');
  assert.equal(availableParticipants(assigned).length,0);
  assert.deepEqual(participationCounts(assigned),{present:1,assigned:1,available:0});

  const available=unassignParticipant(assigned,'part-1');
  assert.equal(available.participants.length,1);
  assert.equal(available.participants[0].teamId,null);
  assert.equal(availableParticipants(available).length,1);
});

test('uma vaga não aceita dois jogadores',()=>{
  let session=createSession(1_700_000_000_000);
  session=addPlayerToSession(session,player('p1','Zé'),'part-1');
  session=addPlayerToSession(session,player('p2','Will'),'part-2');
  session=assignParticipant(session,'part-1','team-1',1);

  const blocked=assignParticipant(session,'part-2','team-1',1);

  assert.equal(blocked.participants.find(item=>item.id==='part-2')?.teamId,null);
  assert.equal(teamParticipants(blocked,'team-1').length,1);
});

test('remover da presença não apaga jogador persistente',()=>{
  const session=addPlayerToSession(createSession(1_700_000_000_000),player('p1','Will'),'part-1');
  const state:AppState={
    version:9,
    players:[player('p1','Will')],
    activeSessionId:session.id,
    sessions:[session],
  };

  const next={
    ...state,
    sessions:[removeParticipant(session,'part-1')],
  };

  assert.equal(next.players.length,1);
  assert.equal(next.sessions[0].participants.length,0);
});

test('criar jogador manualmente cadastra identidade e presença na terça ativa',()=>{
  const session=createSession(1_700_000_000_000);
  const state:AppState={
    version:9,
    players:[],
    activeSessionId:session.id,
    sessions:[session],
  };

  const next=createPlayerForActiveSession(state,'  Helo  ',false,1234);

  assert.equal(next.players.length,1);
  assert.equal(next.players[0].name,'Helo');
  assert.equal(next.sessions[0].participants.length,1);
  assert.equal(next.sessions[0].participants[0].playerId,next.players[0].id);
});
