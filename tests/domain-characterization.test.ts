import test from 'node:test';
import assert from 'node:assert/strict';
import {expireMatch,newMatch,resolveCompetitiveResult,scoreGoal} from '../src/domain/match.ts';
import {nextRotation} from '../src/domain/rotation.ts';
import {rankTeams,teamStats} from '../src/domain/statistics.ts';

const base={
  defender:'team-1' as const,
  challenger:'team-2' as const,
  waiting:'team-3' as const,
};

test('empate no primeiro jogo por tempo vai para penaltis',()=>{
  assert.equal(resolveCompetitiveResult({...base,sd:1,sc:1},0,'tempo'),'penalties');
});

test('empate a partir do segundo jogo favorece o desafiante',()=>{
  assert.equal(resolveCompetitiveResult({...base,sd:1,sc:1},1,'tempo'),'team-2');
});

test('vantagem do defensor no tempo mantem o defensor',()=>{
  assert.equal(resolveCompetitiveResult({...base,sd:1,sc:0},4,'tempo'),'team-1');
});

test('dois gols definem o vencedor pelo placar',()=>{
  assert.equal(resolveCompetitiveResult({...base,sd:0,sc:2},4,'2 gols'),'team-2');
});

test('vencedor permanece, espera entra e perdedor vai esperar',()=>{
  assert.deepEqual(
    nextRotation({...base,winner:'team-2'}),
    {defender:'team-2',challenger:'team-3',waiting:'team-1'},
  );
});

test('estatisticas sao derivadas do historico',()=>{
  const first={...newMatch(),...base,sd:2,sc:1,status:'finished' as const,winner:'team-1' as const};
  const second={
    ...newMatch(),
    defender:'team-1' as const,
    challenger:'team-3' as const,
    waiting:'team-2' as const,
    sd:0,
    sc:2,
    status:'finished' as const,
    winner:'team-3' as const,
  };
  assert.deepEqual(teamStats([first,second],'team-1'),{games:2,wins:1,losses:1,goals:2});
});

test('00:00 gera tempo esgotado sem encerrar automaticamente',()=>{
  const match={...newMatch(),status:'running' as const,remaining:0,endsAt:123};
  const expired=expireMatch(match);
  assert.equal(expired.status,'expired');
  assert.equal(expired.remaining,0);
  assert.equal(expired.endsAt,null);
  assert.equal(expired.winner,undefined);
});

test('gol depois de 00:00 continua sendo registrado',()=>{
  const expired={...newMatch(),status:'expired' as const,remaining:0,sd:0,sc:0};
  const scored=scoreGoal(expired,'d',1000);
  assert.equal(scored.sd,1);
  assert.equal(scored.events.at(-1)?.type,'gol');
  assert.equal(scored.events.at(-1)?.team,'team-1');
});


test('classificacao ordena por vitorias e compartilha posicao em empate',()=>{
  const first={...newMatch(),...base,status:'finished' as const,winner:'team-1' as const};
  const second={
    ...newMatch(),
    defender:'team-2' as const,
    challenger:'team-3' as const,
    waiting:'team-1' as const,
    status:'finished' as const,
    winner:'team-2' as const,
  };
  const third={
    ...newMatch(),
    defender:'team-1' as const,
    challenger:'team-3' as const,
    waiting:'team-2' as const,
    status:'finished' as const,
    winner:'team-3' as const,
  };

  assert.deepEqual(
    rankTeams([first,second,third],['team-1','team-2','team-3']).map(entry=>({
      team:entry.team,
      position:entry.position,
      wins:entry.stats.wins,
    })),
    [
      {team:'team-1',position:1,wins:1},
      {team:'team-2',position:1,wins:1},
      {team:'team-3',position:1,wins:1},
    ],
  );
});

test('classificacao usa ranking de competicao sem desempate artificial',()=>{
  const history=[
    {...newMatch(),...base,status:'finished' as const,winner:'team-1' as const},
    {...newMatch(),...base,status:'finished' as const,winner:'team-1' as const},
    {
      ...newMatch(),
      defender:'team-2' as const,
      challenger:'team-3' as const,
      waiting:'team-1' as const,
      status:'finished' as const,
      winner:'team-2' as const,
    },
    {
      ...newMatch(),
      defender:'team-2' as const,
      challenger:'team-3' as const,
      waiting:'team-1' as const,
      status:'finished' as const,
      winner:'team-2' as const,
    },
  ];

  assert.deepEqual(
    rankTeams(history,['team-1','team-2','team-3']).map(entry=>({
      team:entry.team,
      position:entry.position,
      wins:entry.stats.wins,
    })),
    [
      {team:'team-1',position:1,wins:2},
      {team:'team-2',position:1,wins:2},
      {team:'team-3',position:3,wins:0},
    ],
  );
});
