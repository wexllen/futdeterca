export type TeamId='team-1'|'team-2'|'team-3';

export type Player={
  id:string;
  name:string;
  goalkeeper:boolean;
  createdAt:number;
};

export type SessionParticipant={
  id:string;
  playerId:string|null;
  name:string;
  goalkeeper:boolean;
  teamId:TeamId|null;
  slot:number|null;
};

export type Team={
  id:TeamId;
  hex:string;
};

export type MatchStatus='ready'|'running'|'paused'|'expired'|'penalties'|'finished';

export type MatchEvent={
  at:number;
  type:string;
  team?:TeamId;
  player?:string;
};

export type Match={
  id:string;
  defender:TeamId;
  challenger:TeamId;
  waiting:TeamId;
  sd:number;
  sc:number;
  startedAt:number|null;
  endsAt:number|null;
  finishedAt:number|null;
  remaining:number;
  status:MatchStatus;
  winner?:TeamId;
  reason?:string;
  events:MatchEvent[];
};

export type SessionStatus='active'|'finished';

export type Session={
  id:string;
  date:string;
  startedAt:number;
  finishedAt:number|null;
  status:SessionStatus;
  teams:Record<TeamId,Team>;
  participants:SessionParticipant[];
  current:Match;
  history:Match[];
};

export type AppState={
  version:9;
  players:Player[];
  activeSessionId:string|null;
  sessions:Session[];
};

export type TeamStats={
  games:number;
  wins:number;
  losses:number;
  goals:number;
};
