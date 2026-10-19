import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  LEGACY_V7_BACKUP_KEY,
  STORAGE_KEY,
  UNREADABLE_PREFIX,
  initialState,
  loadState,
  saveState,
} from '../src/storage/state.ts';

class MemoryStorage implements Storage{
  private data=new Map<string,string>();

  get length(){return this.data.size;}

  clear(){this.data.clear();}

  getItem(key:string){return this.data.get(key)??null;}

  key(index:number){return [...this.data.keys()][index]??null;}

  removeItem(key:string){this.data.delete(key);}

  setItem(key:string,value:string){this.data.set(key,String(value));}
}

const installStorage=()=>{
  const storage=new MemoryStorage();
  Object.defineProperty(globalThis,'localStorage',{
    value:storage,
    configurable:true,
    writable:true,
  });
  loadState();
  return storage;
};

test('estado local ilegivel nao e sobrescrito pelo fallback vazio',()=>{
  const storage=installStorage();
  const raw='{"version":8,"sessions":';
  storage.setItem(STORAGE_KEY,raw);

  const loaded=loadState(123456);

  assert.equal(loaded.status,'recovery');
  assert.equal(loaded.recovery?.raw,raw);
  assert.equal(loaded.recovery?.recoveryKey,`${UNREADABLE_PREFIX}123456`);
  assert.equal(storage.getItem(STORAGE_KEY),raw);
  assert.equal(storage.getItem(`${UNREADABLE_PREFIX}123456`),raw);

  const saved=saveState(initialState());

  assert.equal(saved,false);
  assert.equal(storage.getItem(STORAGE_KEY),raw);
});

test('estado estruturalmente invalido tambem entra em recuperacao sem perda',()=>{
  const storage=installStorage();
  const raw=JSON.stringify({
    version:8,
    activeSessionId:null,
    sessions:[{id:'quebrada'}],
  });
  storage.setItem(STORAGE_KEY,raw);

  const loaded=loadState(999);

  assert.equal(loaded.status,'recovery');
  assert.equal(storage.getItem(STORAGE_KEY),raw);
  assert.equal(storage.getItem(`${UNREADABLE_PREFIX}999`),raw);
});

test('migracao V7 cria copia bruta antes de persistir V8',()=>{
  const storage=installStorage();
  const raw=readFileSync(new URL('./fixtures/cefas-v7-real.json',import.meta.url),'utf8');
  storage.setItem(STORAGE_KEY,raw);

  const loaded=loadState(1000);

  assert.equal(loaded.status,'ready');
  assert.equal(loaded.state.version,8);
  assert.equal(storage.getItem(LEGACY_V7_BACKUP_KEY),raw);
  assert.equal(storage.getItem(STORAGE_KEY),raw);

  const saved=saveState(loaded.state);

  assert.equal(saved,true);
  assert.notEqual(storage.getItem(STORAGE_KEY),raw);
  assert.equal(storage.getItem(LEGACY_V7_BACKUP_KEY),raw);
});

test('backup V7 preexistente nunca e sobrescrito',()=>{
  const storage=installStorage();
  const raw=readFileSync(new URL('./fixtures/cefas-v7-real.json',import.meta.url),'utf8');
  storage.setItem(LEGACY_V7_BACKUP_KEY,'copia-anterior');
  storage.setItem(STORAGE_KEY,raw);

  const loaded=loadState(1001);

  assert.equal(loaded.status,'ready');
  assert.equal(storage.getItem(LEGACY_V7_BACKUP_KEY),'copia-anterior');
});

test('estado V8 valido continua permitindo persistencia normal',()=>{
  const storage=installStorage();
  const raw=JSON.stringify(initialState());
  storage.setItem(STORAGE_KEY,raw);

  const loaded=loadState(1002);

  assert.equal(loaded.status,'ready');
  assert.equal(saveState(loaded.state),true);
  assert.equal(storage.getItem(STORAGE_KEY),raw);
});
