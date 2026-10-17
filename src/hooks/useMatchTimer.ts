import {useEffect} from 'react';
import type {Dispatch,SetStateAction} from 'react';
import {expireMatch} from '../domain/match';
import {updateActiveSession} from '../domain/session';
import type {AppState,Session} from '../domain/types';

export function useMatchTimer(
  active:Session|null,
  setState:Dispatch<SetStateAction<AppState>>,
){
  useEffect(()=>{
    if(!active||active.current.status!=='running'||!active.current.endsAt)return;

    const id=setInterval(()=>{
      setState(current=>updateActiveSession(current,session=>{
        const match=session.current;
        if(match.status!=='running'||!match.endsAt)return session;

        const remaining=Math.max(0,Math.ceil((match.endsAt-Date.now())/1000));
        if(remaining<=0)return {...session,current:expireMatch({...match,remaining:0})};
        if(remaining===match.remaining)return session;
        return {...session,current:{...match,remaining}};
      }));
    },250);

    return()=>clearInterval(id);
  },[active?.id,active?.current.id,active?.current.status,active?.current.endsAt,setState]);
}
