export type WhatsAppSection='goalkeepers'|'players';

export type WhatsAppListEntry={
  position:number;
  label:string;
  name:string;
  goalkeeper:boolean;
  raw:string;
};

export type WhatsAppIgnoredLine={
  raw:string;
  reason:'outside-section'|'unrecognized';
};

export type WhatsAppListMetadata={
  date?:string;
  time?:string;
  venue?:string;
};

export type ParsedWhatsAppList={
  goalkeepers:WhatsAppListEntry[];
  players:WhatsAppListEntry[];
  ignored:WhatsAppIgnoredLine[];
  metadata:WhatsAppListMetadata;
};

const INVISIBLE=/[\u200B-\u200F\u2060\u2066-\u2069\uFEFF]/g;

const visible=(value:string)=>
  value.replace(INVISIBLE,'').replace(/\s+/g,' ').trim();

const comparable=(value:string)=>
  visible(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('pt-BR');

const cleanName=(value:string)=>
  visible(value)
    .replace(/^[\s@~]+/,'')
    .replace(/\s+/g,' ')
    .trim();

const sectionFromLine=(line:string):WhatsAppSection|null=>{
  const normalized=comparable(line);
  if(/\bgoleiros?\b/.test(normalized))return 'goalkeepers';
  if(/\bjogadores?\b/.test(normalized))return 'players';
  return null;
};

const numberedLine=(line:string)=>{
  const match=visible(line).match(/^(\d+)(?:\s+e\s+faixa)?\s*[-–—:]\s*(.*)$/i);
  if(!match)return null;
  return {
    position:Number(match[1]),
    label:match[1],
    value:match[2]??'',
  };
};

const metadataFromLine=(line:string,metadata:WhatsAppListMetadata)=>{
  const normalized=visible(line);

  if(metadata.venue===undefined&&/🏟/.test(normalized)){
    const venue=visible(normalized.replace(/🏟️?/gu,''));
    if(venue)metadata.venue=venue;
  }

  if(metadata.date===undefined){
    const date=normalized.match(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/);
    if(date)metadata.date=date[0];
  }

  if(metadata.time===undefined){
    const time=normalized.match(/\b\d{1,2}(?::\d{2})?\s*h\b/i)??normalized.match(/\b\d{1,2}:\d{2}\b/);
    if(time)metadata.time=visible(time[0]);
  }
};

export const parseWhatsAppList=(input:string):ParsedWhatsAppList=>{
  const result:ParsedWhatsAppList={
    goalkeepers:[],
    players:[],
    ignored:[],
    metadata:{},
  };

  let section:WhatsAppSection|null=null;

  for(const rawLine of input.split(/\r?\n/)){
    const line=visible(rawLine);
    if(!line)continue;

    metadataFromLine(line,result.metadata);

    const heading=sectionFromLine(line);
    if(heading){
      section=heading;
      continue;
    }

    const numbered=numberedLine(line);
    if(!numbered)continue;

    const name=cleanName(numbered.value);
    if(!name)continue;

    if(!section){
      result.ignored.push({raw:rawLine,reason:'outside-section'});
      continue;
    }

    const entry:WhatsAppListEntry={
      position:numbered.position,
      label:numbered.label,
      name,
      goalkeeper:section==='goalkeepers',
      raw:rawLine,
    };

    if(section==='goalkeepers')result.goalkeepers.push(entry);
    else result.players.push(entry);
  }

  return result;
};
