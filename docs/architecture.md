# Arquitetura — CEFAS

## Linha V0.8 em desenvolvimento — Schema V9

Stack:
- React
- TypeScript com `strict: true`
- Vite
- CSS
- Lucide React
- GitHub Actions
- GitHub Pages
- `localStorage`

Persistência:
- chave: `terca-fc:state`
- schema da linha V0.8: V9
- leitura compatível com backups V8 e V7

## Modelo V9

O V9 separa identidade persistente de jogador da composição histórica de uma sessão.

```text
AppState
├── version: 9
├── players[]            # identidades persistentes
├── activeSessionId
└── sessions[]
    └── Session
        ├── teams        # somente identidade técnica + colete
        ├── participants # snapshot da composição daquela terça
        ├── current
        └── history[]
```

`SessionParticipant` preserva nome, indicação de goleiro, colete e posição usados naquela noite. O vínculo `playerId` é opcional para permitir migrar dados antigos sem inventar uma identidade que o legado não registrava.

Na migração V8 → V9, os jogadores históricos são preservados como snapshots com `playerId: null`. A aplicação não tenta deduzir silenciosamente que nomes iguais em sessões antigas representam a mesma pessoa.

## Modelo V8 legado

```text
AppState
├── version: 8
├── activeSessionId
└── sessions[]
    └── Session
        ├── id
        ├── date
        ├── startedAt
        ├── finishedAt
        ├── status
        ├── teams
        ├── current
        └── history[]
```

Os IDs técnicos de time são neutros:

```text
team-1
team-2
team-3
```

A cor do colete é atributo da sessão e não identidade técnica.

## Camadas atuais

```text
src/
├── components/
│   ├── Court.tsx
│   ├── HistoryPanel.tsx
│   ├── SessionLanding.tsx
│   ├── SettingsPanel.tsx
│   └── Teams.tsx
├── domain/
│   ├── types.ts
│   ├── kits.ts
│   ├── match.ts
│   ├── rotation.ts
│   ├── session.ts
│   └── statistics.ts
├── hooks/
│   └── useMatchTimer.ts
├── storage/
│   ├── state.ts
│   └── migrations.ts
├── ui/
│   └── presentation.ts
├── App.tsx
├── main.tsx
└── styles.css
```

### Domain

Regras puras do CEFAS:
- IDs e tipos;
- coletes;
- resultado competitivo;
- expiração do relógio;
- rotação;
- sessões;
- estatísticas.

O domínio não depende de componentes React.

### Storage

Responsável por:
- carregar/salvar V9;
- validar backups;
- migrar V8 para V9;
- manter a cadeia V7 → V8 → V9;
- manter a mesma chave de `localStorage`.

### Hooks

`useMatchTimer.ts` contém o efeito temporal do React:
- observa uma partida em execução;
- recalcula `remaining`;
- leva a partida para `expired` quando chega a 00:00.

O hook não decide o vencedor nem encerra fisicamente a partida. A semântica de resultado continua no domínio e a interrupção natural continua sob controle do operador.

### Components

Os componentes maiores foram separados por responsabilidade visual:
- `Court`: placar, controles e resultado da partida;
- `Teams`: confronto inicial, coletes e jogadores da sessão;
- `HistoryPanel`: resumo e partidas por terça;
- `SettingsPanel`: backup/importação e reset local;
- `SessionLanding`: entrada quando não há terça ativa.

### App

`App.tsx` é a camada de orquestração React. Ela:
- mantém o `AppState`;
- coordena navegação;
- chama regras de domínio;
- conecta telas, timer e persistência.

Ela não contém mais a implementação visual completa das telas.

### Bootstrap

`main.tsx` possui apenas a responsabilidade de inicializar o React e montar `App`.

### UI helpers

`ui/presentation.ts` reúne formatação e apresentação compartilhadas, como data/hora, cronômetro e nome/cor de colete. Esses helpers não alteram estado de domínio.

## Nova terça

Uma nova `Session` começa com a composição padrão da aplicação:
- coletes Azul, Vermelho e Amarelo;
- jogadores placeholder/default.

Ela não herda coletes nem jogadores da sessão anterior. Sessões encerradas permanecem preservadas para consulta histórica.

## Migrações V7 → V8 → V9

Mapeamento técnico:

```text
azul      -> team-1
verde     -> team-2
vermelho  -> team-3
```

Os hex dos coletes são preservados, portanto o backup real Laranja/Branco/Preto continua visualmente igual.

A etapa V7 → V8:
- cria uma Session;
- considera a sessão migrada ativa, pois o V7 não registrava formalmente o encerramento da terça;
- infere a data pela menor marca temporal de eventos;
- reconstrói `startedAt` e `finishedAt` de partidas a partir dos eventos quando possível;
- preserva histórico, placares, vencedores, motivos e eventos.

A etapa V8 → V9:
- remove jogadores de dentro de `Team`;
- converte a composição antiga em `SessionParticipant[]`;
- preserva nomes, goleiros, coletes e slots como snapshot histórico;
- não infere identidade persistente para dados legados;
- mantém `players[]` disponível para as identidades criadas na V0.8.

## Tempo

`00:00` significa estado `expired`.

```text
running
  ↓
00:00
  ↓
expired
  ↓
operador aguarda interrupção natural
  ↓
Encerrar por tempo
```

O relógio não decide sozinho o fim físico da jogada.

## Quality gate

A suíte usa o test runner nativo do Node e cobre:
- regras de resultado;
- rotação;
- estatísticas;
- estado `expired`;
- gol após 00:00;
- migração do backup V7 real até V9;
- migração direta de backup V8 para V9;
- IDs neutros;
- preservação de 12 partidas / 27 gols;
- ciclo encerrar sessão → iniciar outra;
- nova sessão com defaults sem alterar a sessão anterior.

O comando local consolidado é:

```bash
npm run check
```

Ele executa testes, typecheck e build. O GitHub Actions mantém as etapas explícitas:
- `npm ci`;
- `npm test`;
- `npm run typecheck`;
- `npm run build`.

### ESLint e Prettier

Foram avaliados nesta consolidação e não foram adicionados agora.

Decisão:
- manter TypeScript `strict`, testes, typecheck e build como gate obrigatório;
- evitar uma mudança ampla de dependências/formatação sem um problema concreto observado;
- reavaliar ESLint quando regras adicionais de hooks ou complexidade de componentes justificarem o custo;
- reavaliar Prettier quando divergência de formatação começar a gerar ruído real em PRs.

A ausência dessas ferramentas não deve ser interpretada como proibição futura; é uma decisão de simplicidade para o estágio atual.

## Princípio de evolução

A modularização deve reduzir raio de impacto e facilitar as próximas capacidades do domínio. Não criar camadas genéricas, abstrações ou serviços sem requisito concreto.
