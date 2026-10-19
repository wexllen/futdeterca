import test from 'node:test';
import assert from 'node:assert/strict';
import {addPlayerToSession,assignParticipant,createSession} from '../src/domain/session.ts';
import {playerParticipationHistory,rankTeams,teamStats,totalGoals} from '../src/domain/statistics.ts';
import type {AppState,Player} from '../src/domain/types.ts';
import {normalizeState} from '../src/storage/state.ts';

const makePlayer=(id:string,name:string,goalkeeper=false):Player=>({
  id,
  name,
  goalkeeper,
  createdAt:1,
});

test('snapshot da sessão não muda quando cadastro persistente é alterado depois',()=>{
  const player=makePlayer('p-will','Will');
  let session=createSession(1_700_000_000_000);
  session=addPlayerToSession(session,player,'part-will');
  session=assignParticipant(session,'part-will','team-1',1);

  const state:AppState={
    version:9,
    players:[player],
    activeSessionId:null,
    sessions:[{...session,status:'finished',finishedAt:1_700_000_100_000}],
  };

  const renamed:AppState={
    ...state,
    players:[{...player,name:'William'}],
  };

  assert.equal(renamed.players[0].name,'William');
  assert.equal(renamed.sessions[0].participants[0].name,'Will');
  assert.equal(renamed.sessions[0].participants[0].teamId,'team-1');
  assert.equal(renamed.sessions[0].participants[0].slot,1);
});

test('histórico individual é derivado por playerId e preserva snapshot de cada terça',()=>{
  const player=makePlayer('p-will','Will');
  let first=createSession(1_700_000_000_000);
  first=addPlayerToSession(first,player,'part-1');
  first=assignParticipant(first,'part-1','team-1',1);

  let second=createSession(1_700_086_400_000);
  second=addPlayerToSession(second,{...player,name:'Will'},'part-2');
  second=assignParticipant(second,'part-2','team-3',4);

  const records=playerParticipationHistory(
    [
      {...first,status:'finished',finishedAt:1_700_000_100_000},
      {...second,status:'finished',finishedAt:1_700_086_500_000},
    ],
    player.id,
  );

  assert.equal(records.length,2);
  assert.equal(records[0].participant.teamId,'team-3');
  assert.equal(records[0].participant.slot,4);
  assert.equal(records[1].participant.teamId,'team-1');
  assert.equal(records[1].participant.slot,1);
});

test('export/import V9 preserva jogadores, participantes, coletes e sessões',()=>{
  const player=makePlayer('p-zé','Zé');
  let session=createSession(1_700_000_000_000);
  session=addPlayerToSession(session,player,'part-zé');
  session=assignParticipant(session,'part-zé','team-2',3);

  const state:AppState={
    version:9,
    players:[player],
    activeSessionId:session.id,
    sessions:[session],
  };

  const restored=normalizeState(JSON.parse(JSON.stringify(state)));

  assert.deepEqual(restored,state);
});

test('classificação e estatísticas continuam derivadas exclusivamente do histórico de partidas',()=>{
  const base=createSession(1_700_000_000_000);
  const history=[
    {...base.current,id:'m1',status:'finished' as const,defender:'team-1' as const,challenger:'team-2' as const,waiting:'team-3' as const,sd:2,sc:0,winner:'team-1' as const},
    {...base.current,id:'m2',status:'finished' as const,defender:'team-1' as const,challenger:'team-3' as const,waiting:'team-2' as const,sd:1,sc:2,winner:'team-3' as const},
  ];

  assert.deepEqual(teamStats(history,'team-1'),{games:2,wins:1,losses:1,goals:3});
  assert.equal(totalGoals(history),5);
  assert.deepEqual(
    rankTeams(history,['team-1','team-2','team-3']).map(item=>({team:item.team,position:item.position,wins:item.stats.wins})),
    [
      {team:'team-1',position:1,wins:1},
      {team:'team-3',position:1,wins:1},
      {team:'team-2',position:3,wins:0},
    ],
  );
});
