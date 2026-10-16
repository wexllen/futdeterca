# Roadmap — CEFAS

O backlog operacional vive em **GitHub Issues**. Este documento mantém a visão de produto e a ordem dos marcos.

Veja também: [Gestão do projeto](./project-management.md).

## Concluído

### V0.6.8 — MVP validado em quadra — Issue #4

- [x] seleção rápida de coletes;
- [x] identidade do time pela cor do colete;
- [x] resumo J/V/D/G no Histórico;
- [x] hardening pós-primeiro uso;
- [x] operação real com 12 partidas e 27 gols;
- [x] backup V7 exportado e posteriormente reimportado com sucesso.

### Fundamentos de engenharia — Issues #5 e #6

- [x] GitHub como fonte da verdade;
- [x] `AGENTS.md` e documentação de produto/domínio/arquitetura;
- [x] testes de caracterização;
- [x] fixture real V7;
- [x] CI com test/typecheck/build;
- [x] extração inicial de tipos, partida, rotação e estatísticas.

## P0 — V0.7.0 — Sessões/Terças + schema V8 — Issue #7

- [ ] introduzir IDs neutros `team-1`, `team-2`, `team-3`;
- [ ] mapear IDs legados V7;
- [ ] introduzir schema V8;
- [ ] extrair persistência/migrações;
- [ ] introduzir `Session`;
- [ ] permitir iniciar terça;
- [ ] permitir encerrar terça;
- [ ] garantir no máximo uma terça ativa;
- [ ] arquivar terças anteriores;
- [ ] histórico por sessão;
- [ ] snapshot dos coletes por sessão;
- [ ] preservar/reconstruir `startedAt` / `finishedAt`;
- [ ] corrigir semântica de `00:00`: tempo esgotado não encerra automaticamente;
- [ ] migrar V7 para V8;
- [ ] preservar 12 partidas, 27 gols e estatísticas da fixture real;
- [ ] validar export/import V8;
- [ ] validar publicação sem regressão.

## P0 — V0.7.x — consolidação arquitetural — Issue #8

- [ ] extrair componentes React restantes;
- [ ] extrair hook de timer;
- [ ] reduzir responsabilidades de `main.tsx`;
- [ ] consolidar camada de storage/migrations;
- [ ] avaliar ESLint e Prettier;
- [ ] revisar README;
- [ ] fechar divergências restantes entre docs e implementação.

## P1 — V0.8.0 — jogadores independentes dos coletes — Issue #9

- [ ] identidade persistente de `Player`;
- [ ] seleção de presentes por sessão;
- [ ] alocação aos coletes;
- [ ] histórico individual derivado.

## P1 — V0.9.0 — empréstimos e goleiros — Issue #10

- [ ] participação temporária por outro time;
- [ ] jogador emprestado sem alterar identidade;
- [ ] rotação de jogador cedido;
- [ ] alternância de goleiro.

## P1 — V0.10.0 — eventos individuais — Issue #11

- [ ] autor do gol opcional;
- [ ] placar atualizado antes do metadado;
- [ ] gol contra opcional;
- [ ] assistência opcional.

## P2 — V0.11.0 — dashboard e estatísticas — Issue #12

- [ ] resumo por sessão;
- [ ] artilharia;
- [ ] assistências;
- [ ] participações;
- [ ] estatísticas históricas derivadas.

## P2 — V0.12.0 — sorteio automático — Issue #13

- [ ] selecionar presentes;
- [ ] sortear três times;
- [ ] distribuir nos coletes;
- [ ] considerar goleiros e ausências;
- [ ] começar sem OVR/balanceamento subjetivo.

## P1/P2 — V0.13.0 — acompanhamento read-only — Issue #14

- [ ] placar;
- [ ] cronômetro;
- [ ] times em quadra;
- [ ] próximo time;
- [ ] histórico;
- [ ] eventos individuais quando disponíveis.

Essa etapa provavelmente exige estado compartilhado/backend e deve ser um marco arquitetural separado.

## Fora do escopo atual

- nome customizado de time;
- OVR/ranking subjetivo;
- backend sem requisito concreto;
- múltiplos operadores concorrentes;
- blockchain;
- funcionalidades sociais genéricas.

## Critério de priorização

1. problemas observados em quadra;
2. pedidos espontâneos repetidos;
3. integridade dos dados;
4. redução de fricção operacional;
5. capacidades que destravam o próximo domínio.
