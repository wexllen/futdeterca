import type React from 'react';
import {Download,Upload} from 'lucide-react';
import type {AppState} from '../domain/types';
import {initialState,isBackupLike,normalizeState} from '../storage/state';

export function SettingsPanel({state,setState}:{state:AppState;setState:React.Dispatch<React.SetStateAction<AppState>>}){
  const exp=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));
    const link=document.createElement('a');
    link.href=url;
    link.download=`cefas-backup-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),0);
  };

  const imp=(event:React.ChangeEvent<HTMLInputElement>)=>{
    const input=event.currentTarget;
    const file=input.files?.[0];
    if(!file)return;

    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const parsed:unknown=JSON.parse(String(reader.result));
        if(!isBackupLike(parsed))throw new Error('Formato inválido');
        if(!confirm('Restaurar este backup? Os dados atuais deste navegador serão substituídos pelo conteúdo do arquivo.'))return;
        setState(normalizeState(parsed));
        alert('Backup restaurado com sucesso.');
      }catch{
        alert('Backup inválido ou incompatível.');
      }finally{
        input.value='';
      }
    };
    reader.onerror=()=>{
      alert('Não foi possível ler o arquivo de backup.');
      input.value='';
    };
    reader.readAsText(file);
  };

  return <section>
    <div className="section-title"><div className="eyebrow">LOCAL FIRST · SCHEMA V9</div><h2>Dados e backup</h2></div>
    <div className="settings-card">
      <h3>Suas terças ficam neste navegador</h3>
      <p>O backup V9 contém jogadores e todas as sessões. Backups V8 e V7 continuam aceitos e são migrados automaticamente.</p>
      <div className="settings-actions">
        <button onClick={exp}><Download/>Baixar backup</button>
        <label><Upload/>Restaurar backup<input hidden type="file" accept="application/json" onChange={imp}/></label>
      </div>
      <button className="danger" onClick={()=>{
        if(confirm('Apagar todos os dados locais? Esta ação remove todas as terças, partidas, jogadores e configurações deste navegador.'))setState(initialState());
      }}>Apagar dados e recomeçar</button>
    </div>
  </section>;
}
