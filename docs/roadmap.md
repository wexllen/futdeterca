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

- [x] introduzir IDs neutros `team-1`, `team-2`, `team-3`;
- [x] mapear IDs legados V7;
- [x] introduzir schema V8;
- [x] extrair persistência/migrações;
- [x] introduzir `Session`;
- [x] permitir iniciar terça;
- [x] permitir encerrar terça;
- [x] garantir no máximo uma terça ativa;
- [x] arquivar terças anteriores;
- [x] histórico por sessão;
- [x] snapshot dos coletes por sessão;
- [x] preservar/reconstruir `startedAt` / `finishedAt`;
- [x] corrigir semântica de `00:00`: tempo esgotado não encerra automaticamente;
- [x] migrar V7 para V8;
- [x] preservar 12 partidas, 27 gols e estatísticas da fixture real;
- [x] validar export/import V8;
- [x] validar publicação sem regressão.

## PATCH — V0.7.1 — nova terça limpa — Issue #17 — concluído

- [x] não herdar coletes da sessão anterior;
- [x] não herdar jogadores da sessão anterior;
- [x] restaurar Azul / Vermelho / Amarelo como coletes padrão;
- [x] restaurar jogadores placeholder/default;
- [x] preservar intacta a sessão anterior no histórico;
- [x] cobrir o cenário com o backup real V7.

## PATCH — V0.7.2 — classificação da terça — Issue #19 — concluído

- [x] ordenar os três times por quantidade de vitórias;
- [x] exibir 🥇🥈🥉/posição no resumo do Histórico;
- [x] manter J/V/D/G visíveis;
- [x] empates em vitórias compartilham colocação;
- [x] não criar critério artificial de desempate;
- [x] não exibir medalhas antes da primeira partida encerrada;
- [x] manter partidas em ordem cronológica.

## P0 — V0.7.x — consolidação arquitetural — Issue #8

- [x] extrair componentes React maiores;
- [x] extrair hook de timer;
- [x] reduzir `main.tsx` ao bootstrap React;
- [x] consolidar camada de storage/migrations;
- [x] extrair helpers compartilhados de apresentação;
- [x] avaliar ESLint e Prettier — adoção adiada até existir necessidade concreta;
- [x] revisar README;
- [x] alinhar documentação e implementação;
- [x] manter testes/typecheck/build como quality gate.

## PRÓXIMO — V0.8.0 — jogadores independentes dos coletes — Issue #9

- [x] identidade persistente de `Player`;
- [x] seleção de presentes por sessão;
- [x] alocação aos coletes;
- [x] importação local da lista do WhatsApp com prévia/reconciliação;
- [x] composição histórica por sessão;
- [x] helper de histórico individual derivado;
- [ ] integração final e release V0.8.0.

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
- [ ] eventos individuais quando disponíveis;
- [ ] link/QR público da sessão;
- [ ] modelo público read-only separado do AppState;
- [ ] manter o operador local-first como fonte oficial;
- [ ] sincronização por API + PostgreSQL;
- [ ] polling inicial com evolução opcional para SSE/WebSocket.

A sincronização remota deve ser uma réplica. A operação local não pode depender da internet.

## Futuro — experiência da terça em vídeo — Issue #20

- [ ] associar uma gravação contínua à Session;
- [ ] usar timestamps existentes para capítulos por partida;
- [ ] navegar para gols/eventos sem visão computacional;
- [ ] gerar clipes a partir dos eventos registrados;
- [ ] compartilhar a experiência após o fim da terça;
- [ ] avaliar streaming apenas se houver demanda;
- [ ] avaliar IA/visão computacional somente depois, aproveitando dados já registrados.

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
