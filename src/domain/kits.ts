import type {TeamId} from './types.ts';

export const TEAM_IDS:TeamId[]=['team-1','team-2','team-3'];

export const DEFAULT_HEX:Record<TeamId,string>={
  'team-1':'#2368d8',
  'team-2':'#d8443d',
  'team-3':'#f4d03f',
};

export const KIT_PRESETS=[
  {name:'Branco',hex:'#ffffff'},
  {name:'Preto',hex:'#000000'},
  {name:'Vermelho',hex:'#d8443d'},
  {name:'Laranja',hex:'#ff6a00'},
  {name:'Amarelo',hex:'#f4d03f'},
  {name:'Azul',hex:'#2368d8'},
  {name:'Verde',hex:'#239b67'},
] as const;

export const kitNameFromHex=(hex:string)=>{
  const raw=hex.replace('#','');
  if(!/^[0-9a-f]{6}$/i.test(raw))return 'Colete';

  const r=parseInt(raw.slice(0,2),16)/255;
  const g=parseInt(raw.slice(2,4),16)/255;
  const b=parseInt(raw.slice(4,6),16)/255;
  const max=Math.max(r,g,b);
  const min=Math.min(r,g,b);
  const d=max-min;
  const l=(max+min)/2;

  if(l>=.92)return 'Branco';
  if(l<=.1)return 'Preto';

  const s=d===0?0:d/(1-Math.abs(2*l-1));
  if(s<=.12)return 'Cinza';

  let h=0;
  if(d!==0){
    if(max===r)h=60*(((g-b)/d)%6);
    else if(max===g)h=60*((b-r)/d+2);
    else h=60*((r-g)/d+4);
    if(h<0)h+=360;
  }

  if(h<15||h>=345)return 'Vermelho';
  if(h<45)return 'Laranja';
  if(h<70)return 'Amarelo';
  if(h<165)return 'Verde';
  if(h<255)return 'Azul';
  if(h<295)return 'Roxo';
  return 'Rosa';
};

export const isPresetHex=(hex:string)=>
  KIT_PRESETS.some(kit=>kit.hex.toLowerCase()===hex.toLowerCase());
