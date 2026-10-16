export type Color='azul'|'verde'|'vermelho';

export type Player={
  id:string;
  name:string;
  gk:boolean;
  games:number;
  wins:number;
  goals:number;
};

export type Team={
  color:Color;
  name:string;
  hex:string;
  players:Player[];
};

export type MatchStatus='ready'|'running'|'paused'|'penalties'|'finished';

export type MatchEvent={
  at:number;
  type:string;
  team?:Color;
  player?:string;
};

export type Match={
  id:string;
  defender:Color;
  challenger:Color;
  waiting:Color;
  sd:number;
  sc:number;
  startedAt:number|null;
  endsAt:number|null;
  remaining:number;
  status:MatchStatus;
  winner?:Color;
  reason?:string;
  events:MatchEvent[];
};

export type AppState={
  version:number;
  teams:Record<Color,Team>;
  current:Match;
  history:Match[];
};

export type TeamStats={
  games:number;
  wins:number;
  losses:number;
  goals:number;
};
