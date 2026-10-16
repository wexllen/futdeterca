# CEFAS — V0.6

MVP local-first para administrar uma pelada com 3 times de 6 jogadores (5 linha + goleiro).

## Regras implementadas
- 3 times: Azul, Vermelho e Amarelo.
- Um time defende a quadra, um desafia e um espera.
- Cada partida dura 7 minutos ou termina quando um time chega a 2 gols.
- O defensor precisa vencer. Se o tempo terminar empatado, o desafiante permanece.
- Ao encerrar, o time que permanece enfrenta o time que estava esperando; o perdedor vai para a espera.
- Histórico das partidas encerradas.
- Persistência automática em `localStorage`.
- Exportação/importação de backup JSON.

## Rodar
Requer Node.js 22+.

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite (normalmente http://localhost:5173).

## Build estático
```bash
npm run build
npm run preview
```

A pasta `dist/` pode ser publicada em qualquer hospedagem estática.

## Limitação intencional da V0
Os dados ficam no navegador/dispositivo que opera a súmula. Não há backend, login ou sincronização multiusuário.

## Correção V0.1
- Corrigido o cronômetro que acelerava durante a partida.
- O tempo agora usa um `endsAt` fixo (`Date.now() + tempo restante`), evitando descontar o mesmo intervalo repetidamente.
- Pausar congela o tempo restante; retomar cria um novo prazo a partir desse valor.
- Ao chegar em 00:00, a partida termina automaticamente e o empate favorece o desafiante.
- Estado salvo pela V0 é migrado automaticamente.

## Regra do primeiro jogo (V0.2)
- A primeira partida da terça é especial.
- Se terminar empatada ao fim dos 7 minutos, vai para disputa de pênaltis.
- As cobranças e o placar dos pênaltis não são registrados: o operador informa apenas qual time venceu.
- A partir da segunda partida, volta a regra normal: em caso de empate no tempo, o desafiante permanece na quadra.

## V0.3 — cores dos coletes

Na aba **Times**, cada um dos três times agora permite definir o **nome da cor** e escolher a **cor visual** do colete. A escolha é salva no `localStorage` e é aplicada na quadra, nos botões de gol, no time em espera e no histórico. Estados e backups das versões anteriores recebem automaticamente as cores padrão ao serem carregados.

## V0.5

O conceito de Overall/OVR foi removido completamente desta versão.

## V0.6.2 — cores padrão
- Times padrão: Azul, Vermelho e Amarelo.
- Migração automática corrige o antigo terceiro time Vermelho duplicado para Amarelo.

### V0.6.3 - escolher quais dois times iniciam jogando

- É possível escolher quais dois times iniciam jogando.

## V0.6.4 - Adiciona contador de resultados dos times

- Histórico das partidas encerradas.
- Contador de resultados por time:
  - Vitórias;
  - Derrotas;
  - Jogos.
- Não existe empate no resultado competitivo:
  - empate após 7 minutos conta como vitória do desafiante;
  - no primeiro jogo, empate conta como vitória de quem vencer nos pênaltis.

## V0.6.5 - Altera label para nome do time

- Altera a label "COR DO TIME" para "NOME DO TIME"

## V0.6.6 - Centraliza resultados no historico

- Os nomes ficam simétricos em torno do placar, o × fica realmente no centro e cada time ganhou seu indicador de cor.
  - Também adaptei o layout para celular, para não ficar espremido.

## V0.6.7 - Corrige edicao do nome dos times

- O campo está sendo “normalizado” cedo demais: quando o valor vira vazio, o código repõe imediatamente o nome anterior.
- Agora o campo NOME DO TIME pode ficar vazio enquanto você apaga e digita outro nome. O valor padrão só volta se você sair do campo deixando-o realmente vazio.

## V0.6.8 — seleção rápida de coletes
- A configuração dos times passa a ser feita pela cor do colete, sem campo separado para nome do time.
- Cores rápidas: Branco, Preto, Vermelho, Laranja, Amarelo, Azul e Verde.
- A opção **Outra cor** mantém o seletor livre e gera automaticamente um rótulo simples para a cor escolhida.
- O formato do estado V7 é preservado para manter compatibilidade com backups existentes; o campo interno `name` passa a ser derivado da cor do colete.
- Resumo J/V/D/G no Histórico, derivado automaticamente das partidas encerradas.

### V0.6.8 — hardening pós-primeiro uso
- Reiniciar uma partida em andamento ou já alterada pede confirmação antes de descartar placar, tempo e eventos.
- A mesma cor de colete não pode ser escolhida para dois times na configuração da noite.
- As cores dos coletes ficam bloqueadas depois do início da primeira partida, evitando que o histórico mude de identidade visual no meio da terça.
- Restauração de backup valida a estrutura básica do arquivo e pede confirmação antes de substituir os dados locais.
- O seletor de arquivo é limpo após a restauração, permitindo selecionar novamente o mesmo backup quando necessário.
- URLs temporárias criadas para download de backup são liberadas após o uso.