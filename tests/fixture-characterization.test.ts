import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrateV7,type LegacyV7State} from '../src/storage/migrations.ts';
import {activeSession,endSession,startSession} from '../src/domain/session.ts';
import {teamStats,totalGoals} from '../src/domain/statistics.ts';

const legacy=JSON.parse(
  readFileSync(new URL('./fixtures/cefas-v7-real.json',import.meta.url),'utf8'),
) as LegacyV7State;

test('backup real V7 migra para V8 preservando fatos observados',()=>{
  const state=migrateV7(legacy,1_700_000_000_000);
  const session=activeSession(state);

  assert.equal(state.version,8);
  assert.ok(session);
  assert.equal(session.history.length,12);
  assert.equal(totalGoals(session.history),27);
  assert.deepEqual(teamStats(session.history,'team-1'),{games:8,wins:4,losses:4,goals:10});
  assert.deepEqual(teamStats(session.history,'team-2'),{games:9,wins:6,losses:3,goals:12});
  assert.deepEqual(teamStats(session.history,'team-3'),{games:7,wins:2,losses:5,goals:5});
});

test('migracao V7 troca ids legados por ids neutros e preserva coletes',()=>{
  const session=activeSession(migrateV7(legacy,1_700_000_000_000));
  assert.ok(session);

  assert.equal(session.teams['team-1'].hex.toLowerCase(),'#ff6a00');
  assert.equal(session.teams['team-2'].hex.toLowerCase(),'#ffffff');
  assert.equal(session.teams['team-3'].hex.toLowerCase(),'#000000');

  for(const match of session.history){
    assert.match(match.defender,/^team-[123]$/);
    assert.match(match.challenger,/^team-[123]$/);
    assert.match(match.waiting,/^team-[123]$/);
  }
});

test('primeira terca migra como sessao ativa para evitar encerramento inferido',()=>{
  const state=migrateV7(legacy,1_700_000_000_000);
  const session=activeSession(state);

  assert.ok(session);
  assert.equal(session.status,'active');
  assert.equal(state.activeSessionId,session.id);
  assert.equal(session.finishedAt,null);
});

test('timestamps historicos sao reconstruidos a partir dos eventos quando possivel',()=>{
  const session=activeSession(migrateV7(legacy,1_700_000_000_000));
  assert.ok(session);

  const withEvents=session.history.filter(match=>match.events.length>0);
  assert.ok(withEvents.length>0);
  assert.ok(withEvents.every(match=>match.finishedAt!==null));
  assert.ok(session.startedAt>0);
});

test('uma sessao encerrada permanece e outra pode ser iniciada sem herdar coletes ou jogadores',()=>{
  const migrated=migrateV7(legacy,1_700_000_000_000);
  const current=activeSession(migrated);
  assert.ok(current);

  const finishable={
    ...migrated,
    sessions:migrated.sessions.map(session=>
      session.id===current.id
        ?{...session,current:{...session.current,status:'ready' as const}}
        :session
    ),
  };

  const ended=endSession(finishable,1_700_000_100_000);
  assert.equal(ended.activeSessionId,null);
  assert.equal(ended.sessions.length,1);
  assert.equal(ended.sessions[0].status,'finished');

  const next=startSession(ended,1_700_086_400_000);
  const newSession=activeSession(next);

  assert.ok(newSession);
  assert.equal(next.sessions.length,2);
  assert.equal(next.sessions[0].history.length,12);

  assert.equal(newSession.teams['team-1'].hex,'#2368d8');
  assert.equal(newSession.teams['team-2'].hex,'#d8443d');
  assert.equal(newSession.teams['team-3'].hex,'#f4d03f');

  assert.equal(newSession.teams['team-1'].players[0].name,'Goleiro Azul');
  assert.equal(newSession.teams['team-2'].players[0].name,'Goleiro Vermelho');
  assert.equal(newSession.teams['team-3'].players[0].name,'Goleiro Amarelo');

  assert.equal(next.sessions[0].teams['team-1'].hex.toLowerCase(),'#ff6a00');
  assert.equal(next.sessions[0].teams['team-2'].hex.toLowerCase(),'#ffffff');
  assert.equal(next.sessions[0].teams['team-3'].hex.toLowerCase(),'#000000');
});
