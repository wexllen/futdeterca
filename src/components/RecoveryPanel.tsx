import type React from 'react';
import {AlertTriangle,Download,Upload} from 'lucide-react';
import type {AppState} from '../domain/types';
import {isBackupLike,normalizeState,type StateRecovery} from '../storage/state';

export function RecoveryPanel({
  recovery,
  onRestore,
  onReset,
}:{
  recovery:StateRecovery;
  onRestore:(state:AppState)=>void;
  onReset:()=>void;
}){
  const downloadRaw=()=>{
    const url=URL.createObjectURL(new Blob([recovery.raw],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;
    link.download=`cefas-recuperacao-${new Date().toISOString().replace(/[:.]/g,'-')}.txt`;
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),0);
  };

  const restore=(event:React.ChangeEvent<HTMLInputElement>)=>{
    const input=event.currentTarget;
    const file=input.files?.[0];
    if(!file)return;

    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const parsed:unknown=JSON.parse(String(reader.result));
        if(!isBackupLike(parsed))throw new Error('Formato inválido');
        if(!confirm('Restaurar este backup e substituir os dados locais que não puderam ser lidos?'))return;
        onRestore(normalizeState(parsed));
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

  return <div className="recovery-shell">
    <section className="recovery-card">
      <AlertTriangle/>
      <div className="eyebrow">MODO DE RECUPERAÇÃO</div>
      <h1>Seus dados não foram apagados</h1>
      <p>O CEFAS encontrou dados locais que não conseguiu interpretar. Para evitar perda de histórico, a gravação automática foi bloqueada e o conteúdo original continua preservado.</p>

      <div className="recovery-detail">
        <strong>O que aconteceu</strong>
        <span>{recovery.reason}</span>
        <small>{recovery.recoveryKey
          ?`Uma cópia adicional foi criada em ${recovery.recoveryKey}.`
          :'Não foi possível criar a cópia adicional, mas o conteúdo original permanece na chave principal e pode ser baixado abaixo.'}</small>
      </div>

      <div className="recovery-actions">
        <button onClick={downloadRaw}><Download/>Baixar dados brutos</button>
        <label><Upload/>Restaurar backup válido<input hidden type="file" accept="application/json" onChange={restore}/></label>
      </div>

      <button className="danger recovery-reset" onClick={()=>{
        if(confirm('Apagar os dados locais que não puderam ser lidos e recomeçar do zero? Faça isso somente depois de salvar uma cópia dos dados brutos.'))onReset();
      }}>Apagar dados e recomeçar</button>
    </section>
  </div>;
}
