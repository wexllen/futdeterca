# Gestão do projeto — CEFAS

O GitHub é a fonte da verdade para código, regras, arquitetura e backlog.

## Backlog operacional

O backlog vivo está em GitHub Issues. Cada marco funcional possui uma issue agregadora:

| Marco | Issue | Estado |
| --- | --- | --- |
| V0.6.8 — MVP validado em quadra | #4 | Concluído |
| Engenharia — GitHub como fonte da verdade | #5 | Concluído |
| Engenharia — testes, CI e domínio | #6 | Concluído |
| V0.7.0 — Sessões/Terças + V8 | #7 | Concluído |
| V0.7.1 — nova terça limpa | #17 | Concluído |
| V0.7.x — consolidação arquitetural | #8 | Concluído |
| V0.7.2 — classificação da terça | #19 | Concluído |
| V0.8.0 — jogadores independentes | #9 | Concluído |
| V0.9.0 — empréstimos e goleiros | #10 | Planejado |
| V0.10.0 — eventos individuais | #11 | Planejado |
| V0.11.0 — dashboard e estatísticas | #12 | Planejado |
| V0.12.0 — sorteio automático | #13 | Planejado |
| V0.13.0 — acompanhamento read-only | #14 | Planejado |

## Marcos já concluídos

### MVP / V0.6.8
O produto foi validado em quadra com uma terça real:
- 12 partidas;
- 27 gols;
- histórico e backup usados em operação;
- importação posterior do backup validada.

Issue: https://github.com/wexllen/futdeterca/issues/4

### Fundamentos de engenharia
O repositório passou a carregar o contexto do produto e ganhou rede de segurança para evolução:
- documentação normativa;
- testes de caracterização;
- fixture V7 real;
- CI;
- primeira extração de domínio.

Issues:
- https://github.com/wexllen/futdeterca/issues/5
- https://github.com/wexllen/futdeterca/issues/6

## Marcos V0.7 concluídos

### V0.7.0 — Sessões/Terças + schema V8

Issue: https://github.com/wexllen/futdeterca/issues/7

Introduziu sessões históricas, IDs neutros, schema V8, migração V7 → V8 e a semântica de 00:00 controlada pelo operador.

### V0.7.1 — nova terça limpa

Issue: https://github.com/wexllen/futdeterca/issues/17

Uma nova sessão não herda coletes nem jogadores da sessão anterior.

### V0.7.x — consolidação arquitetural

Issue: https://github.com/wexllen/futdeterca/issues/8

Separa componentes React, timer, apresentação, persistência e domínio sem alterar a experiência funcional.

### V0.7.2 — classificação da terça

Issue: https://github.com/wexllen/futdeterca/issues/19

O Histórico passa a classificar os três times por vitórias, com medalhas/posição, empate compartilhado e sem critério artificial de desempate.

## V0.8.0 — jogadores independentes dos coletes

Issue: https://github.com/wexllen/futdeterca/issues/9

Introduz identidade persistente de jogador, presença por sessão, composição manual dos coletes, importação local da lista do WhatsApp com prévia/reconciliação e snapshots históricos.

## Próximo marco funcional

### V0.9.0 — empréstimos e goleiros

Issue: https://github.com/wexllen/futdeterca/issues/10

Objetivo: modelar participações temporárias por outro time e a rotação/alternância de goleiros sem alterar a identidade persistente do jogador.

## Convenção de trabalho

Cada mudança relevante segue:

```text
Issue / decisão de produto
    ↓
branch pequena
    ↓
implementação + testes
    ↓
PR
    ↓
CI
    ↓
review
    ↓
merge
    ↓
validação publicada / em quadra
```

## Estados sugeridos para um GitHub Project

- Backlog
- Ready
- In progress
- In review
- Done

Campos sugeridos:
- Milestone/Release
- Priority: P0 / P1 / P2
- Type: Product / Domain / Architecture / Bug / UX
- Validation: CI / Published / Court-tested

## Política de fechamento

Uma issue agregadora de versão só é fechada quando:
1. critérios de aceite estão satisfeitos;
2. CI está verde;
3. versão publicada não apresenta regressão conhecida;
4. migrações relevantes foram testadas com fixtures reais;
5. quando aplicável, houve validação em uso real.
