# CEFAS — V0.8.0

Aplicação local-first para operar e preservar o histórico da pelada de terça.

## Regras principais

- 3 times por sessão, identificados pelo colete.
- Um defende, um desafia e um espera.
- Partida: 7 minutos ou 2 gols.
- Primeira partida empatada no tempo vai para pênaltis.
- Da segunda em diante, empate no tempo favorece o desafiante.
- Ao atingir 00:00, o relógio marca **TEMPO ESGOTADO**, mas não encerra automaticamente a jogada.
- O operador encerra por tempo após a interrupção natural.

## Jogadores independentes dos coletes

A V0.8 separa a identidade persistente do jogador da composição temporária de cada terça.

```text
Player
  ↓ participa de
Session
  ↓
SessionParticipant
  ↓
colete + vaga daquela noite
```

Uma nova terça começa sem presença herdada. O operador pode adicionar jogadores já cadastrados, criar novos jogadores e montar manualmente os três coletes.

Remover do colete devolve o jogador aos disponíveis. Remover da terça não exclui o cadastro persistente.

## Importar lista do WhatsApp

Na tela de Times, a lista usada pelo grupo pode ser colada no CEFAS.

O fluxo é:

```text
colar mensagem
→ interpretar
→ prévia
→ reconciliar nomes
→ confirmar
→ presença da terça
```

O parser é local e determinístico. Ele reconhece goleiros/jogadores, ignora vagas vazias, tolera pequenas variações de formatação e limpa artefatos comuns de menção.

Nomes inequívocos reutilizam o cadastro existente. Nomes ambíguos exigem decisão explícita. Data, hora e local encontrados são apenas informativos e não sobrescrevem a sessão.

## Histórico

Cada sessão preserva:
- coletes usados;
- participantes;
- indicação de goleiro;
- vaga/colete daquela noite;
- partidas, placares, vencedores e eventos.

Alterações posteriores no cadastro persistente do jogador não reescrevem sessões antigas.

## Persistência

- local-first;
- `localStorage`;
- schema V9;
- leitura/migração de backups V8 e V7;
- proteção contra sobrescrita silenciosa quando um estado não pode ser interpretado.

Antes de migrar dados antigos, o raw é preservado em uma chave de backup quando possível. Se o estado principal for ilegível/incompatível, a aplicação entra em modo de recuperação e bloqueia a gravação automática até ação explícita do operador.

## IDs de times

A identidade técnica usa IDs neutros:

```text
team-1
team-2
team-3
```

A cor do colete é atributo da sessão e não identidade permanente do jogador.

## Estrutura

```text
src/
├── components/
├── domain/
├── hooks/
├── storage/
├── ui/
├── App.tsx
├── main.tsx
└── styles.css
```

Veja:
- `AGENTS.md`
- `docs/product.md`
- `docs/business-rules.md`
- `docs/architecture.md`
- `docs/roadmap.md`
- `docs/project-management.md`

## Desenvolvimento

Requer Node.js 22+.

```bash
npm ci
npm run check
npm run dev
```

`npm run check` executa testes, typecheck e build.

## Deploy

GitHub Actions verifica testes, typecheck e build antes da publicação no GitHub Pages.

## Limitação intencional

Não há backend, login ou sincronização entre dispositivos. O aparelho do operador continua sendo a fonte oficial da súmula. O acompanhamento read-only em outros celulares permanece no roadmap.
