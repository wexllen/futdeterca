import {CalendarDays} from 'lucide-react';
import type {Session} from '../domain/types';
import {formatSessionDate} from '../ui/presentation';

export function SessionLanding({sessions,onStart}:{sessions:Session[];onStart:()=>void}){
  const latest=sessions[0];

  return <section className="session-landing">
    <CalendarDays/>
    <div className="eyebrow">TERÇAS</div>
    <h2>Nenhuma terça em andamento</h2>
    <p>Inicie uma nova sessão para configurar os coletes e começar a súmula da noite.</p>
    {latest&&<small>Última sessão: {formatSessionDate(latest.date)} · {latest.history.length} partidas</small>}
    <button onClick={onStart}>Iniciar terça</button>
  </section>;
}
