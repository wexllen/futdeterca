import test from 'node:test';
import assert from 'node:assert/strict';
import {parseWhatsAppList} from '../src/domain/whatsapp.ts';

const sample=`⚽🍺 Fute Eduzz
🏟️ Santiago Bernaleste - CEFAS
20/10 - 20h

🥬 Goleiros
1 -
2 -
3 -

⚽ Jogadores
1 - Zé
2 - Helo
3 -
4 -
5 -
6 -
7 - Cantonez
8 e faixa - Erick van bommel
9 -
10 -
11 -
12 - Pedro Henrique
13 -  Will
14 -
15 - @⁨~Alessandro Carneiro
`;

test('lista real extrai jogadores, ignora vagas vazias e não inventa goleiros',()=>{
  const parsed=parseWhatsAppList(sample);

  assert.equal(parsed.goalkeepers.length,0);
  assert.deepEqual(
    parsed.players.map(item=>item.name),
    ['Zé','Helo','Cantonez','Erick van bommel','Pedro Henrique','Will','Alessandro Carneiro'],
  );
  assert.equal(parsed.players[3].position,8);
  assert.equal(parsed.players[3].goalkeeper,false);
});

test('reconhece goleiros e marca função sem misturar seções',()=>{
  const parsed=parseWhatsAppList(`🥬 Goleiros
1 - Rafa
2 - João

⚽ Jogadores
1 - Zé
2 - Will`);

  assert.deepEqual(parsed.goalkeepers.map(item=>item.name),['Rafa','João']);
  assert.ok(parsed.goalkeepers.every(item=>item.goalkeeper));
  assert.deepEqual(parsed.players.map(item=>item.name),['Zé','Will']);
  assert.ok(parsed.players.every(item=>!item.goalkeeper));
});

test('tolera variações de hífen, espaço e dois-pontos',()=>{
  const parsed=parseWhatsAppList(`Jogadores
1-Zé
2 - Helo
3 – Will
4: Pedrinho
5 — Igor`);

  assert.deepEqual(parsed.players.map(item=>item.name),['Zé','Helo','Will','Pedrinho','Igor']);
});

test('remove artefatos de menção e caracteres invisíveis do início do nome',()=>{
  const parsed=parseWhatsAppList('Jogadores\n1 - @\u2068~Alessandro Carneiro\n2 - \u200B@~Will');

  assert.deepEqual(parsed.players.map(item=>item.name),['Alessandro Carneiro','Will']);
});

test('metadados são apenas extraídos para prévia',()=>{
  const parsed=parseWhatsAppList(`⚽🍺 Fute Eduzz
🏟️ Santiago Bernaleste - CEFAS
20/10 - 20h
Jogadores
1 - Zé`);

  assert.deepEqual(parsed.metadata,{
    venue:'Santiago Bernaleste - CEFAS',
    date:'20/10',
    time:'20h',
  });
});

test('linha numerada fora de uma seção é reportada sem virar presença',()=>{
  const parsed=parseWhatsAppList(`1 - Solto
Jogadores
2 - Zé`);

  assert.equal(parsed.players.length,1);
  assert.deepEqual(parsed.ignored,[{raw:'1 - Solto',reason:'outside-section'}]);
});

test('texto livre não é tratado como linha ignorada operacional',()=>{
  const parsed=parseWhatsAppList(`⚽🍺 Fute Eduzz
texto qualquer
Jogadores
1 - Zé`);

  assert.equal(parsed.players.length,1);
  assert.deepEqual(parsed.ignored,[]);
});
