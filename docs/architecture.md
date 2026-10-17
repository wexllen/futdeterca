# Arquitetura — CEFAS

## V0.7.1

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
- schema atual: V8
- leitura compatível com backup V7

## Modelo V8

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
├── domain/
│   ├── types.ts
│   ├── kits.ts
│   ├── match.ts
│   ├── rotation.ts
│   ├── session.ts
│   └── statistics.ts
├── storage/
│   ├── state.ts
│   └── migrations.ts
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

### Storage
Responsável por:
- carregar/salvar V8;
- validar backups;
- migrar V7 para V8;
- manter a mesma chave de `localStorage`.

### UI
`main.tsx` ainda concentra componentes e coordenação React. A extração de componentes/hook de timer fica para V0.7.x.

### Nova terça

Uma nova `Session` começa com a composição padrão da aplicação:
- coletes Azul, Vermelho e Amarelo;
- jogadores placeholder/default.

Ela não herda coletes nem jogadores da sessão anterior. Sessões encerradas permanecem preservadas para consulta histórica.

## Migração V7 → V8

Mapeamento técnico:

```text
azul      -> team-1
verde     -> team-2
vermelho  -> team-3
```

Os hex dos coletes são preservados, portanto o backup real Laranja/Branco/Preto continua visualmente igual.

A migração:
- cria uma Session;
- considera a sessão migrada ativa, pois o V7 não registrava formalmente o encerramento da terça;
- infere a data pela menor marca temporal de eventos;
- reconstrói `startedAt` e `finishedAt` de partidas a partir dos eventos quando possível;
- preserva histórico, placares, vencedores, motivos e eventos.

## Tempo

`00:00` agora significa estado `expired`.

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

## Testes / CI

O test runner nativo do Node cobre:
- regras de resultado;
- rotação;
- estatísticas;
- estado `expired`;
- gol após 00:00;
- migração do backup V7 real;
- IDs neutros;
- preservação de 12 partidas / 27 gols;
- ciclo encerrar sessão → iniciar outra;
- nova sessão com defaults sem alterar a sessão anterior.

O CI executa:
- `npm ci`
- `npm test`
- `npm run typecheck`
- `npm run build`

## Próxima consolidação

V0.7.x:
- extrair componentes;
- extrair hook do timer;
- reduzir `main.tsx`;
- revisar lint/format;
- amadurecer storage/migrations conforme novos schemas surgirem.
