import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {teamStats,totalGoals,type LegacyMatchRecord} from '../src/domain/legacyRules.ts';

const fixture=JSON.parse(
  readFileSync(new URL('./fixtures/cefas-v7-real.json',import.meta.url),'utf8'),
) as {
  version:number;
  teams:Record<string,{hex:string}>;
  history:LegacyMatchRecord[];
};

test('backup real da primeira terca preserva os fatos observados',()=>{
  assert.equal(fixture.version,7);
  assert.equal(fixture.history.length,12);
  assert.equal(totalGoals(fixture.history),27);
  assert.deepEqual(teamStats(fixture.history,'azul'),{games:8,wins:4,losses:4,goals:10});
  assert.deepEqual(teamStats(fixture.history,'verde'),{games:9,wins:6,losses:3,goals:12});
  assert.deepEqual(teamStats(fixture.history,'vermelho'),{games:7,wins:2,losses:5,goals:5});
});

test('backup real preserva os coletes usados na primeira terca',()=>{
  assert.equal(fixture.teams.azul.hex.toLowerCase(),'#ff6a00');
  assert.equal(fixture.teams.verde.hex.toLowerCase(),'#ffffff');
  assert.equal(fixture.teams.vermelho.hex.toLowerCase(),'#000000');
});

test('primeira terca teve onze partidas por dois gols e uma por tempo',()=>{
  assert.equal(fixture.history.filter(match=>match.reason==='2 gols').length,11);
  assert.equal(fixture.history.filter(match=>match.reason==='tempo').length,1);
});
