import type {Color,Match,TeamStats} from './types';

export const teamStats=(history:Match[],color:Color):TeamStats=>{
  const games=history.filter(
    match=>match.defender===color||match.challenger===color,
  );
  const wins=games.filter(match=>match.winner===color).length;
  const goals=games.reduce(
    (total,match)=>total+(match.defender===color?match.sd:match.sc),
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
