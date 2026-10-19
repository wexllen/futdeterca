import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  LEGACY_V7_BACKUP_KEY,
  LEGACY_V8_BACKUP_KEY,
  STORAGE_KEY,
  UNREADABLE_PREFIX,
  initialState,
  loadState,
  saveState,
} from '../src/storage/state.ts';
import type {LegacyV8State} from '../src/storage/legacy-v8.ts';

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
  Object.defineProperty(globalThis,'localStorage',{value:storage,configurable:true,writable:true});
  loadState();
  return storage;
};

const legacyV8:LegacyV8State={
  version:8,
  activeSessionId:null,
  sessions:[],
};

test('estado local ilegivel nao e sobrescrito pelo fallback vazio',()=>{
  const storage=installStorage();
  const raw='{"version":9,"sessions":';
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
    version:9,
    players:[],
    activeSessionId:null,
    sessions:[{id:'quebrada'}],
  });
  storage.setItem(STORAGE_KEY,raw);

  const loaded=loadState(999);

  assert.equal(loaded.status,'recovery');
  assert.equal(storage.getItem(STORAGE_KEY),raw);
  assert.equal(storage.getItem(`${UNREADABLE_PREFIX}999`),raw);
});

test('migracao V8 cria copia bruta antes de persistir V9',()=>{
  const storage=installStorage();
  const raw=JSON.stringify(legacyV8);
  storage.setItem(STORAGE_KEY,raw);

  const loaded=loadState(1000);

  assert.equal(loaded.status,'ready');
  assert.equal(loaded.state.version,9);
  assert.equal(storage.getItem(LEGACY_V8_BACKUP_KEY),raw);
  assert.equal(storage.getItem(STORAGE_KEY),raw);

  const saved=saveState(loaded.state);
  assert.equal(saved,true);
  assert.notEqual(storage.getItem(STORAGE_KEY),raw);
  assert.equal(storage.getItem(LEGACY_V8_BACKUP_KEY),raw);
});

test('migracao V7 cria copia bruta antes de persistir V9',()=>{
  const storage=installStorage();
  const raw=readFileSync(new URL('./fixtures/cefas-v7-real.json',import.meta.url),'utf8');
  storage.setItem(STORAGE_KEY,raw);

  const loaded=loadState(1001);

  assert.equal(loaded.status,'ready');
  assert.equal(loaded.state.version,9);
  assert.equal(storage.getItem(LEGACY_V7_BACKUP_KEY),raw);
  assert.equal(storage.getItem(STORAGE_KEY),raw);
});

test('backups pre-migracao nunca sao sobrescritos',()=>{
  const storage=installStorage();
  const raw=JSON.stringify(legacyV8);
  storage.setItem(LEGACY_V8_BACKUP_KEY,'copia-anterior');
  storage.setItem(STORAGE_KEY,raw);

  const loaded=loadState(1002);

  assert.equal(loaded.status,'ready');
  assert.equal(storage.getItem(LEGACY_V8_BACKUP_KEY),'copia-anterior');
});

test('estado V9 valido continua permitindo persistencia normal',()=>{
  const storage=installStorage();
  const raw=JSON.stringify(initialState());
  storage.setItem(STORAGE_KEY,raw);

  const loaded=loadState(1003);

  assert.equal(loaded.status,'ready');
  assert.equal(saveState(loaded.state),true);
  assert.equal(storage.getItem(STORAGE_KEY),raw);
});


test('V9 rejeita dois participantes ocupando a mesma vaga',()=>{
  const storage=installStorage();
  const raw=JSON.stringify({
    version:9,
    players:[
      {id:'p1',name:'Zé',goalkeeper:false,createdAt:1},
      {id:'p2',name:'Will',goalkeeper:false,createdAt:1},
    ],
    activeSessionId:null,
    sessions:[{
      id:'s1',
      date:'2026-10-20',
      startedAt:1,
      finishedAt:2,
      status:'finished',
      teams:{
        'team-1':{id:'team-1',hex:'#2368d8'},
        'team-2':{id:'team-2',hex:'#d8443d'},
        'team-3':{id:'team-3',hex:'#f4d03f'},
      },
      participants:[
        {id:'a',playerId:'p1',name:'Zé',goalkeeper:false,teamId:'team-1',slot:1},
        {id:'b',playerId:'p2',name:'Will',goalkeeper:false,teamId:'team-1',slot:1},
      ],
      current:{id:'m',defender:'team-1',challenger:'team-2',waiting:'team-3',sd:0,sc:0,startedAt:null,endsAt:null,finishedAt:null,remaining:420,status:'ready',events:[]},
      history:[],
    }],
  });
  storage.setItem(STORAGE_KEY,raw);

  const loaded=loadState(2000);

  assert.equal(loaded.status,'recovery');
  assert.equal(storage.getItem(STORAGE_KEY),raw);
});

test('V9 rejeita o mesmo Player vinculado duas vezes na mesma terça',()=>{
  const storage=installStorage();
  const raw=JSON.stringify({
    version:9,
    players:[{id:'p1',name:'Zé',goalkeeper:false,createdAt:1}],
    activeSessionId:null,
    sessions:[{
      id:'s1',
      date:'2026-10-20',
      startedAt:1,
      finishedAt:2,
      status:'finished',
      teams:{
        'team-1':{id:'team-1',hex:'#2368d8'},
        'team-2':{id:'team-2',hex:'#d8443d'},
        'team-3':{id:'team-3',hex:'#f4d03f'},
      },
      participants:[
        {id:'a',playerId:'p1',name:'Zé',goalkeeper:false,teamId:'team-1',slot:1},
        {id:'b',playerId:'p1',name:'Zé',goalkeeper:false,teamId:'team-2',slot:1},
      ],
      current:{id:'m',defender:'team-1',challenger:'team-2',waiting:'team-3',sd:0,sc:0,startedAt:null,endsAt:null,finishedAt:null,remaining:420,status:'ready',events:[]},
      history:[],
    }],
  });
  storage.setItem(STORAGE_KEY,raw);

  const loaded=loadState(2001);

  assert.equal(loaded.status,'recovery');
  assert.equal(storage.getItem(STORAGE_KEY),raw);
});
