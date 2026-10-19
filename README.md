# CEFAS — V0.7.2

Aplicação local-first para operar e preservar o histórico da pelada de terça.

## Regras principais

- 3 times por sessão, identificados pelo colete.
- Um defende, um desafia e um espera.
- Partida: 7 minutos ou 2 gols.
- Primeira partida empatada no tempo vai para pênaltis.
- Da segunda em diante, empate no tempo favorece o desafiante.
- Ao atingir 00:00, o relógio marca **TEMPO ESGOTADO**, mas não encerra automaticamente a jogada.
- O operador encerra por tempo após a interrupção natural.

## Sessões / Terças

A V0.7 introduz sessões históricas:

- iniciar terça;
- encerrar terça;
- consultar terças anteriores;
- preservar coletes e partidas de cada sessão;
- iniciar cada nova terça com coletes e jogadores padrão, sem herdar a composição anterior;
- exportar/importar todas as sessões em um único backup;
- classificar os três times da terça por vitórias no Histórico, com empates compartilhando a mesma colocação.

## Persistência

- local-first;
- `localStorage`;
- schema V8;
- compatível com importação de backups V7.

Backups V7 são migrados automaticamente para uma sessão V8. A sessão migrada permanece ativa até o operador encerrá-la explicitamente.

## IDs de times

A identidade técnica não usa mais nomes de cores:

```text
team-1
team-2
team-3
```

A cor do colete é apenas um atributo visual da sessão.

## Estrutura

```text
src/
├── components/   # telas e componentes maiores
├── domain/       # regras puras do CEFAS
├── hooks/        # efeitos React reutilizáveis
├── storage/      # estado local e migrações
├── ui/           # helpers de apresentação
├── App.tsx       # orquestração da aplicação
├── main.tsx      # bootstrap React
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

Não há backend, login ou sincronização entre dispositivos. O aparelho do operador continua sendo a fonte oficial da súmula. O acompanhamento read-only em outros celulares está planejado para uma versão futura.
