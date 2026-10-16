import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCompetitiveResult} from '../src/domain/match.ts';
import {nextRotation} from '../src/domain/rotation.ts';
import {teamStats} from '../src/domain/statistics.ts';

const base={defender:'azul' as const,challenger:'verde' as const,waiting:'vermelho' as const};

test('empate no primeiro jogo por tempo vai para penaltis',()=>{
  assert.equal(resolveCompetitiveResult({...base,sd:1,sc:1},0,'tempo'),'penalties');
});

test('empate a partir do segundo jogo favorece o desafiante',()=>{
  assert.equal(resolveCompetitiveResult({...base,sd:1,sc:1},1,'tempo'),'verde');
});

test('vantagem do defensor no tempo mantem o defensor',()=>{
  assert.equal(resolveCompetitiveResult({...base,sd:1,sc:0},4,'tempo'),'azul');
});

test('dois gols definem o vencedor pelo placar',()=>{
  assert.equal(resolveCompetitiveResult({...base,sd:0,sc:2},4,'2 gols'),'verde');
});

test('vencedor permanece, espera entra e perdedor vai esperar',()=>{
  assert.deepEqual(
    nextRotation({...base,winner:'verde'}),
    {defender:'verde',challenger:'vermelho',waiting:'azul'},
  );
});

test('estatisticas sao derivadas do historico',()=>{
  const history=[
    {...base,sd:2,sc:1,winner:'azul' as const},
    {
      defender:'azul' as const,
      challenger:'vermelho' as const,
      waiting:'verde' as const,
      sd:0,
      sc:2,
      winner:'vermelho' as const,
    },
  ];
  assert.deepEqual(teamStats(history,'azul'),{games:2,wins:1,losses:1,goals:2});
});
