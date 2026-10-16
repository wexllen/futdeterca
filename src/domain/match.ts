import type {Color,Match} from './types';

export type FinishReason='tempo'|'2 gols';

export const resolveCompetitiveResult=(
  match:Pick<Match,'defender'|'challenger'|'sd'|'sc'>,
  historyLength:number,
  reason:FinishReason,
):Color|'penalties'=>{

  if(reason==='tempo'&&match.sd===match.sc&&historyLength===0)return 'penalties';
  return match.sd>match.sc?match.defender:match.challenger;
};
