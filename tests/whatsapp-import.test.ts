import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession} from '../src/domain/session.ts';
import {applyImportPreview,buildImportPreview} from '../src/domain/whatsapp-import.ts';
import {parseWhatsAppList} from '../src/domain/whatsapp.ts';
import type {AppState,Player} from '../src/domain/types.ts';

const makePlayer=(id:string,name:string,goalkeeper=false):Player=>({
  id,
  name,
  goalkeeper,
  createdAt:1,
});

const baseState=(players:Player[]=[]):AppState=>{
  const session=createSession(1_700_000_000_000);
  return {
    version:9,
    players,
    activeSessionId:session.id,
    sessions:[session],
  };
};

test('preview reutiliza nome existente inequívoco e marca nome novo',()=>{
  const state=baseState([makePlayer('p-will','Will')]);
  const parsed=parseWhatsAppList('Jogadores\n1 - Will\n2 - Helo');

  const rows=buildImportPreview(state.players,state.sessions[0],parsed);

  assert.equal(rows[0].status,'existing');
  assert.equal(rows[0].candidates[0].id,'p-will');
  assert.equal(rows[1].status,'new');
});

test('preview não adivinha quando há mais de um cadastro com mesmo nome',()=>{
  const state=baseState([
    makePlayer('p1','Alex'),
    makePlayer('p2','Alex'),
  ]);
  const parsed=parseWhatsAppList('Jogadores\n1 - Alex');

  const rows=buildImportPreview(state.players,state.sessions[0],parsed);

  assert.equal(rows[0].status,'ambiguous');
  assert.equal(rows[0].candidates.length,2);
});

test('confirmar importação reutiliza existente e cria somente os novos',()=>{
  const state=baseState([makePlayer('p-will','Will')]);
  const parsed=parseWhatsAppList('Jogadores\n1 - Will\n2 - Helo');
  const rows=buildImportPreview(state.players,state.sessions[0],parsed);
  let seq=0;

  const next=applyImportPreview(state,rows,[],1234,()=>`id-${++seq}`);

  assert.equal(next.players.length,2);
  assert.deepEqual(next.players.map(player=>player.name),['Will','Helo']);
  assert.equal(next.sessions[0].participants.length,2);
  assert.equal(next.sessions[0].participants.find(item=>item.name==='Will')?.playerId,'p-will');
  assert.ok(next.sessions[0].participants.find(item=>item.name==='Helo')?.playerId);
});

test('nome ambíguo só entra após decisão explícita',()=>{
  const state=baseState([
    makePlayer('p1','Alex'),
    makePlayer('p2','Alex'),
  ]);
  const parsed=parseWhatsAppList('Jogadores\n1 - Alex');
  const rows=buildImportPreview(state.players,state.sessions[0],parsed);

  const skipped=applyImportPreview(state,rows,[],1234,()=> 'unused');
  assert.equal(skipped.sessions[0].participants.length,0);

  const chosen=applyImportPreview(
    state,
    rows,
    [{rowId:rows[0].id,playerId:'p2'}],
    1234,
    ()=> 'part-1',
  );
  assert.equal(chosen.sessions[0].participants.length,1);
  assert.equal(chosen.sessions[0].participants[0].playerId,'p2');

  const created=applyImportPreview(
    state,
    rows,
    [{rowId:rows[0].id,playerId:null}],
    1234,
    ()=> 'new-id',
  );
  assert.equal(created.players.length,3);
  assert.equal(created.sessions[0].participants[0].name,'Alex');
  assert.equal(created.sessions[0].participants[0].playerId,'new-id');
});

test('goleiro importado vira goleiro no snapshot sem reescrever cadastro existente',()=>{
  const state=baseState([makePlayer('p-rafa','Rafa',false)]);
  const parsed=parseWhatsAppList('Goleiros\n1 - Rafa');
  const rows=buildImportPreview(state.players,state.sessions[0],parsed);

  const next=applyImportPreview(state,rows,[],1234,()=> 'part-1');

  assert.equal(next.players[0].goalkeeper,false);
  assert.equal(next.sessions[0].participants[0].goalkeeper,true);
});

test('jogador já presente não é duplicado ao importar novamente',()=>{
  const state=baseState([makePlayer('p-will','Will')]);
  const firstRows=buildImportPreview(
    state.players,
    state.sessions[0],
    parseWhatsAppList('Jogadores\n1 - Will'),
  );
  const once=applyImportPreview(state,firstRows,[],1234,()=> 'part-1');

  const secondRows=buildImportPreview(
    once.players,
    once.sessions[0],
    parseWhatsAppList('Jogadores\n1 - Will'),
  );
  assert.equal(secondRows[0].status,'present');

  const twice=applyImportPreview(once,secondRows,[],1234,()=> 'part-2');
  assert.equal(twice.sessions[0].participants.length,1);
});
