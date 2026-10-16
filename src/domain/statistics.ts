import type {Match,TeamId,TeamStats} from './types';

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

export const totalGoals=(history:Match[])=>
  history.reduce((total,match)=>total+match.sd+match.sc,0);
