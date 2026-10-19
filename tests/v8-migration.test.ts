import test from 'node:test';
import assert from 'node:assert/strict';
import {newMatch} from '../src/domain/match.ts';
import {teamParticipants} from '../src/domain/session.ts';
import {migrateV8,type LegacyV8State} from '../src/storage/legacy-v8.ts';
import {normalizeState} from '../src/storage/state.ts';

const legacyV8:LegacyV8State={
  version:8,
  activeSessionId:null,
  sessions:[{
    id:'session-v8',
    date:'2026-10-13',
    startedAt:1000,
    finishedAt:2000,
    status:'finished',
    teams:{
      'team-1':{id:'team-1',hex:'#ff6a00',players:[{id:'a',name:'Will',gk:false}]},
      'team-2':{id:'team-2',hex:'#ffffff',players:[{id:'b',name:'Pedrao',gk:false}]},
      'team-3':{id:'team-3',hex:'#000000',players:[{id:'c',name:'Igor',gk:false}]},
    },
    current:{...newMatch(),status:'finished'},
    history:[],
  }],
};

test('backup V8 migra para V9 com snapshots sem inferir identidade persistente',()=>{
  const state=migrateV8(legacyV8);
  const session=state.sessions[0];

  assert.equal(state.version,9);
  assert.deepEqual(state.players,[]);
  assert.equal(session.teams['team-1'].hex,'#ff6a00');
  assert.equal(teamParticipants(session,'team-1')[0].name,'Will');
  assert.equal(teamParticipants(session,'team-2')[0].name,'Pedrao');
  assert.equal(teamParticipants(session,'team-3')[0].name,'Igor');
  assert.ok(session.participants.every(participant=>participant.playerId===null));
  assert.ok(!('players' in session.teams['team-1']));
});

test('normalizeState aceita diretamente backup V8 e entrega V9',()=>{
  const state=normalizeState(legacyV8);
  assert.equal(state.version,9);
  assert.equal(state.sessions[0].participants.length,3);
});
