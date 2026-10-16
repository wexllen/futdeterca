# Regras de negócio — CEFAS

Este documento descreve o comportamento canônico do domínio. Quando houver divergência entre este documento e a implementação atual, a divergência deve ser tratada explicitamente no roadmap/issue correspondente.

## Estrutura da pelada

- Existem 3 times por noite.
- Os times são identificados pelos coletes.
- Em cada partida:
  - um time é o defensor;
  - um é o desafiante;
  - um espera.

Esses papéis são temporários e não são a identidade do time.

## Encerramento da partida

Uma partida é jogada até:
- um time atingir 2 gols; ou
- o tempo regulamentar atingir 7 minutos.

### Tempo esgotado

Chegar a `00:00` não deve obrigatoriamente encerrar a jogada de forma abrupta.

Regra operacional validada em quadra:
- o relógio informa que o tempo terminou;
- o operador pode aguardar uma interrupção natural, como a bola sair;
- então encerra a partida por tempo.

Portanto:

```text
00:00 != fim automático da jogada
```

A branch `main` V0.6.8 ainda encerra automaticamente ao atingir zero; isso é uma divergência conhecida para ser corrigida na evolução 0.7.0.

## Regra de permanência

A partir da segunda partida:
- o defensor precisa vencer para permanecer;
- se o tempo terminar empatado, o desafiante vence competitivamente e permanece.

Motivação:
- o defensor já está em ritmo, sincronizado e adaptado à quadra;
- o desafiante vem da espera e perdeu continuidade;
- jogar pelo empate compensa essa vantagem de continuidade sem alterar o placar real.

## Primeira partida da noite

A primeira partida é especial porque ainda não existe vantagem de continuidade.

Se terminar empatada no tempo:
- vai para pênaltis;
- cobranças não precisam ser registradas;
- o operador informa apenas o vencedor.

## Rotação

Se o defensor vencer:
- defensor permanece;
- time em espera vira desafiante;
- desafiante perdedor vai esperar.

Se o desafiante vencer:
- desafiante vira defensor;
- time em espera vira desafiante;
- defensor perdedor vai esperar.

## Histórico e resultado competitivo

Cada partida deve preservar:
- defensor;
- desafiante;
- time em espera;
- placar no tempo normal;
- vencedor competitivo;
- motivo do fim;
- eventos;
- timestamps adequados quando o schema suportar.

Não existe empate no resultado competitivo.

## Estatísticas

J/V/D/G devem ser derivados do histórico da sessão sempre que possível.

Não manter contadores independentes como fonte concorrente de verdade se a informação puder ser reconstruída das partidas/eventos.

## Coletes

No produto atual, colete é a identidade operacional suficiente do time.

Cores rápidas:
- Branco
- Preto
- Vermelho
- Laranja
- Amarelo
- Azul
- Verde

A opção de cor customizada pode existir, com rótulo derivado automaticamente.

A mesma cor não deve ser usada simultaneamente por dois times na mesma noite.

## Jogadores — regra observada, ainda não modelada

Jogadores devem evoluir para entidades independentes dos coletes.

Na prática:
- um jogador pode atuar temporariamente por outro time;
- quando falta jogador, o time perdedor pode ceder um jogador ao time incompleto, em rotação;
- quando falta goleiro, o goleiro do time perdedor pode alternar entre o time desafiante e o próximo time.

Esses empréstimos são participações temporárias e não devem mudar permanentemente a identidade do jogador.

## Sessões/Terças — planejado para 0.7.0

Cada terça deve ser uma sessão com:
- início;
- fim;
- coletes usados naquela noite;
- partidas;
- resumo derivado.

Deve existir no máximo uma sessão ativa.

Encerrar uma terça arquiva a sessão. Iniciar outra não deve apagar as anteriores.

## Eventos individuais — planejado

O evento de gol deve poder evoluir para conter, opcionalmente:
- autor;
- assistência;
- gol contra;
- participação como emprestado.

O registro do gol no placar deve continuar imediato, mesmo se esses metadados forem ignorados.
