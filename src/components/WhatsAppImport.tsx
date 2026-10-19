import {useMemo,useState,type Dispatch,type SetStateAction} from 'react';
import {ClipboardPaste,X} from 'lucide-react';
import {applyImportPreview,buildImportPreview,type ImportDecision} from '../domain/whatsapp-import';
import {parseWhatsAppList,type ParsedWhatsAppList} from '../domain/whatsapp';
import type {AppState,Session} from '../domain/types';

export function WhatsAppImport({
  state,
  session,
  setState,
}:{
  state:AppState;
  session:Session;
  setState:Dispatch<SetStateAction<AppState>>;
}){
  const [open,setOpen]=useState(false);
  const [text,setText]=useState('');
  const [parsed,setParsed]=useState<ParsedWhatsAppList|null>(null);
  const [decisions,setDecisions]=useState<ImportDecision[]>([]);

  const rows=useMemo(
    ()=>parsed?buildImportPreview(state.players,session,parsed):[],
    [parsed,state.players,session],
  );

  const unresolved=rows.filter(row=>
    row.status==='ambiguous'&&!decisions.some(decision=>decision.rowId===row.id)
  ).length;

  const close=()=>{
    setOpen(false);
    setText('');
    setParsed(null);
    setDecisions([]);
  };

  const interpret=()=>{
    const next=parseWhatsAppList(text);
    setParsed(next);
    setDecisions([]);
  };

  const decide=(rowId:string,value:string)=>{
    setDecisions(current=>[
      ...current.filter(decision=>decision.rowId!==rowId),
      {rowId,playerId:value==='__new__'?null:value},
    ]);
  };

  const confirmImport=()=>{
    if(!parsed||rows.length===0||unresolved>0)return;
    setState(current=>applyImportPreview(current,rows,decisions,Date.now()));
    close();
  };

  return <>
    <button type="button" className="whatsapp-import-trigger" onClick={()=>setOpen(true)}>
      <ClipboardPaste/>Importar lista do WhatsApp
    </button>

    {open&&<div className="whatsapp-import-backdrop" role="presentation" onClick={close}>
      <section className="whatsapp-import-modal" role="dialog" aria-modal="true" aria-label="Importar lista do WhatsApp" onClick={event=>event.stopPropagation()}>
        <div className="whatsapp-import-head">
          <div><small>LISTA DA TERÇA</small><h3>Importar do WhatsApp</h3></div>
          <button type="button" aria-label="Fechar" onClick={close}><X/></button>
        </div>

        {!parsed
          ?<>
            <p>Cole a mensagem do grupo. Nada será alterado antes da prévia e da sua confirmação.</p>
            <textarea
              autoFocus
              value={text}
              onChange={event=>setText(event.target.value)}
              placeholder="Cole aqui a lista do WhatsApp..."
              rows={12}
            />
            <div className="whatsapp-import-actions">
              <button type="button" className="secondary" onClick={close}>Cancelar</button>
              <button type="button" disabled={!text.trim()} onClick={interpret}>Interpretar lista</button>
            </div>
          </>
          :<>
            <div className="whatsapp-preview-summary">
              <div><b>{parsed.goalkeepers.length}</b><span>goleiros</span></div>
              <div><b>{parsed.players.length}</b><span>jogadores</span></div>
              <div><b>{rows.length}</b><span>identificados</span></div>
            </div>

            {(parsed.metadata.date||parsed.metadata.time||parsed.metadata.venue)&&<div className="whatsapp-preview-meta">
              <small>METADADOS ENCONTRADOS · NÃO ALTERAM A SESSÃO</small>
              {parsed.metadata.date&&<span>Data: <b>{parsed.metadata.date}</b></span>}
              {parsed.metadata.time&&<span>Hora: <b>{parsed.metadata.time}</b></span>}
              {parsed.metadata.venue&&<span>Local: <b>{parsed.metadata.venue}</b></span>}
            </div>}

            <div className="whatsapp-preview-list">
              {rows.length===0
                ?<p className="whatsapp-preview-empty">Nenhum goleiro ou jogador foi identificado. Volte e revise o texto.</p>
                :rows.map(row=><div className="whatsapp-preview-row" key={row.id}>
                  <span className={`whatsapp-preview-role ${row.entry.goalkeeper?'goalkeeper':''}`}>{row.entry.goalkeeper?'GK':'JOG'}</span>
                  <div>
                    <strong>{row.entry.name}</strong>
                    {row.status==='existing'&&<small>Cadastro existente será reutilizado</small>}
                    {row.status==='new'&&<small>Novo cadastro</small>}
                    {row.status==='present'&&<small>Já está presente nesta terça</small>}
                    {row.status==='ambiguous'&&<small>Mais de um cadastro com este nome</small>}
                  </div>
                  {row.status==='ambiguous'&&<select
                    aria-label={`Resolver ${row.entry.name}`}
                    value={decisions.find(decision=>decision.rowId===row.id)?.playerId??(decisions.some(decision=>decision.rowId===row.id)?'__new__':'')}
                    onChange={event=>decide(row.id,event.target.value)}
                  >
                    <option value="">Escolha...</option>
                    {row.candidates.map(candidate=><option key={candidate.id} value={candidate.id}>Usar {candidate.name}</option>)}
                    <option value="__new__">Cadastrar novo</option>
                  </select>}
                </div>)
              }
            </div>

            {parsed.ignored.length>0&&<div className="whatsapp-preview-ignored">
              <small>LINHAS NUMERADAS NÃO IMPORTADAS</small>
              {parsed.ignored.map((item,index)=><code key={index}>{item.raw}</code>)}
            </div>}

            {unresolved>0&&<p className="whatsapp-preview-warning">{unresolved} nome(s) ambíguo(s) precisam de decisão antes de confirmar.</p>}

            <div className="whatsapp-import-actions">
              <button type="button" className="secondary" onClick={()=>{setParsed(null);setDecisions([]);}}>Voltar</button>
              <button type="button" disabled={rows.length===0||unresolved>0} onClick={confirmImport}>
                Confirmar {rows.length>0?`${rows.length} nomes`:'importação'}
              </button>
            </div>
          </>
        }
      </section>
    </div>}
  </>;
}
