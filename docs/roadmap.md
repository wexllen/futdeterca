# Roadmap — CEFAS

## Estado atual

### V0.6.8 — concluída
- [x] Seleção rápida de cores de colete
- [x] Eliminar nome manual do time na interface
- [x] Resumo J/V/D/G no Histórico
- [x] Hardenings pós-primeiro uso
  - confirmação ao reiniciar partida com progresso;
  - impedir coletes duplicados;
  - bloquear coletes após início da noite;
  - validação básica de backup;
  - confirmação antes de restaurar backup.

A `main` está atualmente neste estágio.

## P0 — V0.7.0 — Sessões/Terças + início da evolução arquitetural

- [x] Criar testes de caracterização do comportamento atual
- [x] Adicionar test runner
- [x] Extrair tipos de domínio
- [x] Extrair regras de partida
- [x] Extrair rotação
- [x] Extrair estatísticas
- [ ] Extrair persistência/migrações
- [ ] Introduzir `Session`
- [ ] Permitir iniciar terça
- [ ] Permitir encerrar terça
- [ ] Garantir no máximo uma terça ativa
- [ ] Arquivar terças anteriores
- [ ] Histórico por sessão
- [ ] Snapshot dos coletes por sessão
- [ ] Preservar `startedAt` / `finishedAt`
- [ ] Corrigir semântica de `00:00`: tempo esgotado não encerra automaticamente
- [ ] Migrar V7 para novo schema
- [ ] Usar backup real da primeira terça como fixture de regressão
- [x] Atualizar pipeline para testes/typecheck/build antes do deploy

## P0 — V0.7.x — consolidação

- [ ] Extrair componentes React restantes
- [ ] Extrair hook de timer
- [ ] ESLint
- [ ] Prettier
- [ ] Quality gate completo
- [ ] Revisar README para refletir arquitetura e regras atuais

Observação: `strict: true` já está ativo no `tsconfig.json` atual.

## P1 — V0.8.0 — jogadores independentes dos coletes

- [ ] Criar identidade persistente de `Player`
- [ ] Selecionar presentes por sessão
- [ ] Alocar jogadores aos coletes da terça
- [ ] Preparar histórico individual derivado

## P1 — V0.9.0 — empréstimos e goleiros

- [ ] Registrar participação temporária em outro colete
- [ ] Modelar jogador emprestado sem alterar identidade permanente
- [ ] Modelar rotação de jogador cedido quando há time incompleto
- [ ] Modelar alternância de goleiro quando falta goleiro

## P1 — V0.10.0 — eventos individuais

- [ ] Autor do gol opcional
- [ ] Preservar atualização imediata do placar
- [ ] Gol contra opcional
- [ ] Assistência opcional, se validada no uso

## P2 — V0.11.0 — dashboard e estatísticas

- [ ] Resumo da terça
- [ ] Artilharia
- [ ] Assistências
- [ ] Participações
- [ ] Estatísticas históricas derivadas

## P2 — V0.12.0 — sorteio

- [ ] Selecionar jogadores presentes
- [ ] Sortear três times
- [ ] Distribuir nos coletes
- [ ] Começar aleatório, sem OVR
- [ ] Só adicionar balanceamento se o uso demonstrar necessidade

## P1/P2 — V0.13.0+ — acompanhamento em outros celulares

Primeiro estágio: somente leitura.

- [ ] Placar
- [ ] Cronômetro
- [ ] Times em quadra
- [ ] Próximo time
- [ ] Histórico

Essa etapa provavelmente exige estado compartilhado/backend e deve ser tratada como marco arquitetural separado.

## Fora do escopo atual

- nome customizado de time;
- OVR/ranking subjetivo de habilidade;
- backend sem requisito concreto;
- múltiplos operadores concorrentes;
- blockchain;
- funcionalidades sociais genéricas.

## Critério de priorização

Prioridade maior para:
1. problemas observados em quadra;
2. pedidos espontâneos repetidos;
3. integridade dos dados;
4. redução de fricção operacional;
5. capacidades que destravam itens seguintes do domínio.
