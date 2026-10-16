# Arquitetura — CEFAS

## Estado real da main

A `main` atual está na linha V0.6.8.

Stack:
- React
- TypeScript com `strict: true`
- Vite
- CSS
- Lucide React
- GitHub Actions
- GitHub Pages
- `localStorage`

Persistência atual:
- chave: `terca-fc:state`
- schema: V7

Modelo atual, simplificado:

```text
AppState
├── version
├── teams
├── current
└── history
```

A maior parte da aplicação ainda está concentrada em `src/main.tsx`, incluindo:
- tipos;
- domínio;
- estado React;
- timer;
- rotação;
- persistência;
- migração/normalização;
- import/export;
- componentes.

O workflow atual executa:
- `npm ci`
- `npm run build`
- deploy para GitHub Pages

Ainda não há suíte de testes automatizados configurada no `package.json`.

## Dívidas conhecidas

### IDs legados
Os identificadores internos ainda são:
- `azul`
- `verde`
- `vermelho`

Hoje eles funcionam como IDs técnicos legados e podem divergir da cor exibida.

### Campo name legado
O schema V7 ainda contém `name`, embora a interface V0.6.8 derive o rótulo a partir da cor do colete.

### Timer
A implementação V0.6.8 ainda finaliza automaticamente quando o cronômetro chega a zero. A regra de negócio validada em campo exige encerramento explícito pelo operador após interrupção natural.

### Timestamps históricos
A V0.6.8 zera alguns timestamps ao finalizar/pausar, limitando análises históricas de duração.

## Direção arquitetural 0.7+

A evolução deve ser incremental para:

```text
src/
├── domain/
│   ├── types.ts
│   ├── match.ts
│   ├── rotation.ts
│   ├── session.ts
│   └── statistics.ts
├── storage/
│   ├── state.ts
│   └── migrations.ts
├── hooks/
│   └── useMatchTimer.ts
├── components/
├── App.tsx
└── main.tsx
```

### Domain
Funções puras de regras do CEFAS. Não devem depender de React, DOM ou `localStorage`.

### Application/UI
Coordena estado e interação. React apresenta o domínio; não deve ser a fonte das regras.

### Storage
Responsável por:
- carregar;
- salvar;
- exportar;
- importar;
- validar;
- migrar.

O domínio não deve conhecer `localStorage`.

## Schema futuro

0.7.0 deve introduzir uma entidade `Session` e um novo schema versionado, preservando migração a partir do V7.

Modelo conceitual:

```text
AppState
└── sessions[]
    └── Session
        ├── id
        ├── date
        ├── startedAt
        ├── finishedAt?
        ├── status
        ├── teams/coletes snapshot
        ├── current
        └── matches[]
```

Cada sessão deve guardar snapshot dos coletes para que alterar uma terça futura não reescreva visualmente o passado.

## Testes

Prioridade imediata antes/durante 0.7:
- resultado por 2 gols;
- empate da primeira partida -> pênaltis;
- empate posterior -> desafiante;
- rotação;
- estatísticas derivadas;
- Session ativa/encerrada;
- migração V7 -> próximo schema.

O backup real da primeira terça deve ser usado como fixture de regressão:
- 12 partidas preservadas;
- 27 gols preservados;
- vencedores e placares preservados;
- estatísticas derivadas preservadas.

## Quality gate desejado

```text
npm ci
  -> lint
  -> typecheck
  -> test
  -> build
  -> deploy
```

Não adicionar ferramentas apenas por aparência de maturidade; cada etapa deve proteger um risco real do projeto.
