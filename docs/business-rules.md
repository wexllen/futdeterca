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

Na V0.7.0, `00:00` coloca a partida em estado de tempo esgotado. O operador encerra por tempo após a interrupção natural.

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

## Classificação da terça

O resumo da terça no Histórico é uma classificação derivada exclusivamente da quantidade de vitórias.

Regras:
- ordenar os três times por vitórias, em ordem decrescente;
- manter J/V/D/G visíveis;
- times com a mesma quantidade de vitórias compartilham a mesma colocação;
- usar ranking de competição, portanto 1º/1º/3º quando houver empate no topo;
- não usar saldo de gols, gols marcados, aproveitamento ou confronto direto como desempate;
- enquanto nenhuma partida tiver sido encerrada, não exibir medalhas nem colocação.

A classificação não altera a ordem cronológica das partidas exibidas abaixo.

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

## Jogadores — V0.8.0

Jogador é uma identidade persistente independente do colete.

Cada terça possui sua própria lista de participantes. A presença e a alocação daquela noite são registradas em `SessionParticipant`, preservando nome, indicação de goleiro, colete e vaga como snapshot histórico.

Regras:
- adicionar um jogador à terça não o vincula permanentemente a um colete;
- remover do colete apenas o devolve aos disponíveis;
- remover da terça não apaga sua identidade persistente;
- o mesmo jogador não pode ocupar dois coletes simultaneamente no fluxo normal;
- alterações futuras no cadastro persistente não reescrevem sessões encerradas;
- dados legados podem preservar `playerId: null` quando a identidade não pode ser inferida com segurança.

Empréstimos entre times e rotação/alternância de goleiros continuam planejados para V0.9 e não fazem parte da V0.8.

## Sessões/Terças — V0.7.0

Cada terça deve ser uma sessão com:
- início;
- fim;
- coletes usados naquela noite;
- partidas;
- resumo derivado.

Deve existir no máximo uma sessão ativa.

Encerrar uma terça arquiva a sessão. Iniciar outra não apaga as anteriores. O histórico pode ser consultado por sessão.

Uma nova terça começa como uma nova composição operacional:
- não herda as cores dos coletes da sessão anterior;
- não herda presença da sessão anterior;
- usa os coletes padrão Azul, Vermelho e Amarelo;
- começa sem jogadores presentes;
- permite preencher a presença manualmente ou pela importação revisada da lista do WhatsApp.

As sessões encerradas preservam integralmente seus próprios coletes, participantes e partidas.

## Eventos individuais — planejado

O evento de gol deve poder evoluir para conter, opcionalmente:
- autor;
- assistência;
- gol contra;
- participação como emprestado.

O registro do gol no placar deve continuar imediato, mesmo se esses metadados forem ignorados.


## Importação da lista do WhatsApp — V0.8.0

A lista do grupo pode ser usada como entrada de presença, mas não é fonte oficial de estado.

Regras:
- o texto é interpretado localmente por parser determinístico;
- a importação exige prévia antes de alterar a sessão;
- nomes inequívocos podem reutilizar `Player` existente;
- nomes ambíguos exigem decisão explícita do operador;
- novos nomes só criam identidade persistente na confirmação;
- goleiros identificados entram como presentes com indicação de goleiro no snapshot da sessão;
- data, hora e local encontrados na mensagem são apenas informativos e não sobrescrevem silenciosamente a sessão;
- cancelar a prévia não altera a presença.
