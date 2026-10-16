# Produto — CEFAS

## Propósito

CEFAS é uma aplicação para operar e registrar uma pelada recorrente de terça-feira com três times identificados pelos coletes.

O produto nasceu de uma necessidade real do grupo e deve continuar orientado pelo uso em quadra, não por uma lista abstrata de features.

## Problema central

Durante a pelada é necessário saber rapidamente:
- quais dois times estão em quadra;
- qual time espera;
- placar;
- tempo;
- quem permanece;
- quem entra na próxima;
- como foi a noite até agora.

O software deve reduzir a carga mental do operador sem interromper a dinâmica física do jogo.

## Princípios de produto

### 1. Menor esforço possível durante o jogo
Cada toque extra compete com atenção à partida.

### 2. Registrar fatos; derivar estatísticas
Partidas e eventos são fatos. Jogos, vitórias, derrotas, gols e futuros rankings devem ser derivados sempre que possível.

### 3. O mundo físico manda no software
A aplicação representa a pelada; não tenta impor uma dinâmica artificial a ela.

### 4. Não pedir o que o sistema já sabe
Exemplo atual: selecionar o colete deve ser suficiente para obter seu rótulo visual; não é necessário digitar o nome da cor.

### 5. Metadado não bloqueia evento essencial
Futuramente, autor de gol pode ser opcional. O placar deve poder ser atualizado imediatamente.

### 6. Evoluir por evidência
Pedidos espontâneos repetidos e comportamento observado em quadra têm prioridade maior que ideias hipotéticas.

## Identidade dos times

No escopo atual, não há necessidade de nomes customizados de times.

A identidade operacional é a cor do colete, por exemplo:
- Branco
- Preto
- Vermelho
- Laranja
- Amarelo
- Azul
- Verde

Nome customizado pode ser uma opção futura para outros grupos, mas não faz parte do escopo atual.

## Local-first

A versão atual não possui backend, login nem banco remoto.

Benefícios atuais:
- baixo custo;
- simplicidade;
- funcionamento independente de serviço remoto;
- estado sob custódia do grupo;
- backup portátil em JSON.

Limitação atual:
- outro celular não acompanha o estado em tempo real.

O pedido de acompanhamento em outros celulares foi observado em uso real e está no roadmap, inicialmente como modo somente leitura.

## Validação em campo

O primeiro teste real registrou 12 partidas consecutivas e gerou um backup portátil da noite.

Feedbacks espontâneos repetidos incluíram:
- se o sistema marcava tempo;
- se registrava o jogador que fez o gol;
- se sorteava jogadores automaticamente;
- se era possível acompanhar de outro celular.

Houve surpresa positiva com:
- cronômetro;
- histórico;
- vitórias;
- possibilidade de salvar o histórico.

Também foi observado que a informação J/V/D já existia em Times, mas o operador procurou os resultados no Histórico. Isso motivou o resumo J/V/D/G no próprio Histórico.
