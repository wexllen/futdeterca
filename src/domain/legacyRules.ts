export type LegacyTeamId='azul'|'verde'|'vermelho';

export type LegacyMatchRecord={
  defender:LegacyTeamId;
  challenger:LegacyTeamId;
  waiting:LegacyTeamId;
  sd:number;
  sc:number;
  winner?:LegacyTeamId;
  reason?:string;
};

export type LegacyTeamStats={games:number;wins:number;losses:number;goals:number};

export const resolveCompetitiveResult=(
  match:Pick<LegacyMatchRecord,'defender'|'challenger'|'sd'|'sc'>,
  historyLength:number,
  reason:'tempo'|'2 gols',
):LegacyTeamId|'penalties'=>{

  if(reason==='tempo'&&match.sd===match.sc&&historyLength===0)return 'penalties';
  return match.sd>match.sc?match.defender:match.challenger;
};

export const nextRotation=(match:Pick<LegacyMatchRecord,'defender'|'challenger'|'waiting'|'winner'>)=>{
  if(!match.winner)return null;
  const loser=match.winner===match.defender?match.challenger:match.defender;
  return {defender:match.winner,challenger:match.waiting,waiting:loser};
};

export const teamStats=(history:LegacyMatchRecord[],team:LegacyTeamId):LegacyTeamStats=>{
  const games=history.filter(match=>match.defender===team||match.challenger===team);
  const wins=games.filter(match=>match.winner===team).length;
  const goals=games.reduce((total,match)=>total+(match.defender===team?match.sd:match.sc),0);
  return {games:games.length,wins,losses:games.length-wins,goals};
};

export const totalGoals=(history:LegacyMatchRecord[])=>
  history.reduce((total,match)=>total+match.sd+match.sc,0);
