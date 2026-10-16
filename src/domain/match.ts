import type {Match,TeamId} from './types.ts';

export type FinishReason='tempo'|'2 gols';
export type GoalSide='d'|'c';

export const newMatch=(
  defender:TeamId='team-1',
  challenger:TeamId='team-2',
  waiting:TeamId='team-3',
):Match=>({
  id:crypto.randomUUID(),
  defender,
  challenger,
  waiting,
  sd:0,
  sc:0,
  startedAt:null,
  endsAt:null,
  finishedAt:null,
  remaining:420,
  status:'ready',
  events:[],
});

export const resolveCompetitiveResult=(
  match:Pick<Match,'defender'|'challenger'|'sd'|'sc'>,
  historyLength:number,
  reason:FinishReason,
):TeamId|'penalties'=>{

  if(reason==='tempo'&&match.sd===match.sc&&historyLength===0)return 'penalties';
  return match.sd>match.sc?match.defender:match.challenger;
};

export const expireMatch=(match:Match):Match=>{
  if(match.status!=='running')return match;
  return {
    ...match,
    status:'expired',
    remaining:0,
    endsAt:null,
  };
};

export const scoreGoal=(match:Match,side:GoalSide,now:number):Match=>{
  if(match.status==='finished'||match.status==='penalties')return match;

  const events=[...match.events];
  const started=match.status==='ready';
  const team=side==='d'?match.defender:match.challenger;

  const next:Match={
    ...match,
    status:started?'running':match.status,
    startedAt:started?now:match.startedAt,
    endsAt:started?now+match.remaining*1000:match.endsAt,
    sd:match.sd+(side==='d'?1:0),
    sc:match.sc+(side==='c'?1:0),
    events,
  };

  next.events.push({at:now,type:'gol',team});
  return next;
};
