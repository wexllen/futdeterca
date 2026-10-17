import type React from 'react';
import {kitNameFromHex} from '../domain/kits';
import type {Team} from '../domain/types';

export const formatClock=(seconds:number)=>
  `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;

export const formatNow=(date:Date)=>{
  const weekday=new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(date).replace('-feira','').toUpperCase();
  const day=new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
  const time=new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(date);
  return `${weekday} • ${day} • ${time}`;
};

export const formatSessionDate=(date:string)=>{
  const [year,month,day]=date.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'})
    .format(new Date(year,month-1,day))
    .replace('-feira','');
};

export const teamStyle=(team:Team)=>({'--team':team.hex} as React.CSSProperties);

export const textColor=(hex:string)=>{
  const h=hex.replace('#','');
  if(h.length!==6)return '#fff';
  const [r,g,b]=[0,2,4].map(index=>parseInt(h.slice(index,index+2),16));
  return (r*299+g*587+b*114)/1000>155?'#111':'#fff';
};

export const teamName=(team:Team)=>kitNameFromHex(team.hex);
