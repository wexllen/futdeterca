import type {Match} from './types.ts';

export const nextRotation=(
  match:Pick<Match,'defender'|'challenger'|'waiting'|'winner'>,
)=>{
  if(!match.winner)return null;

  const loser=match.winner===match.defender
    ?match.challenger
    :match.defender;

  return {
    defender:match.winner,
    challenger:match.waiting,
    waiting:loser,
  };
};
