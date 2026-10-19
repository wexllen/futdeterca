import type {Match,TeamId,TeamStats} from './types.ts';

export type TeamRankingEntry={
  team:TeamId;
  position:number;
  stats:TeamStats;
};

export const teamStats=(history:Match[],team:TeamId):TeamStats=>{
  const games=history.filter(
    match=>match.defender===team||match.challenger===team,
  );
  const wins=games.filter(match=>match.winner===team).length;
  const goals=games.reduce(
    (total,match)=>total+(match.defender===team?match.sd:match.sc),
    0,
  );

  return {
    games:games.length,
    wins,
    losses:games.length-wins,
    goals,
  };
};

export const rankTeams=(
  history:Match[],
  teams:readonly TeamId[],
):TeamRankingEntry[]=>{
  const ordered=teams
    .map((team,index)=>({team,index,stats:teamStats(history,team)}))
    .sort((left,right)=>right.stats.wins-left.stats.wins||left.index-right.index);

  let previousWins:number|null=null;
  let previousPosition=0;

  return ordered.map((entry,index)=>{
    const position=entry.stats.wins===previousWins?previousPosition:index+1;
    previousWins=entry.stats.wins;
    previousPosition=position;
    return {team:entry.team,position,stats:entry.stats};
  });
};

export const totalGoals=(history:Match[])=>
  history.reduce((total,match)=>total+match.sd+match.sc,0);
