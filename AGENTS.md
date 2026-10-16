# AGENTS.md

## Projeto

CEFAS é uma aplicação web local-first para operar a pelada recorrente do grupo. O foco é reduzir fricção durante a partida e preservar a história das terças.

Antes de alterar regras de negócio, leia:
- `docs/product.md`
- `docs/business-rules.md`
- `docs/architecture.md`
- `docs/roadmap.md`

## Estado atual

A branch `main` está na linha V0.6.8. O schema persistido atual é V7 e usa `localStorage` na chave `terca-fc:state`.

Stack atual:
- React
- TypeScript
- Vite
- Lucide React
- CSS
- GitHub Actions
- GitHub Pages
- Node.js 22+

## Comandos

```bash
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

A suíte de caracterização usa o test runner nativo do Node. Antes de abrir PR, execute `npm test`, `npm run typecheck` e `npm run build`.

## Regras de trabalho

1. Não alterar uma regra de domínio sem atualizar os testes quando eles existirem e, se necessário, `docs/business-rules.md`.
2. Preservar compatibilidade com backups existentes sempre que possível. Mudanças de schema devem ter migração explícita.
3. Não usar nomes/cor de apresentação como identidade técnica. IDs devem ser estáveis.
4. Durante uma partida, priorizar poucos toques e baixa fricção operacional.
5. Registrar fatos primários e derivar estatísticas deles; evitar contadores redundantes como segunda fonte da verdade.
6. Metadados opcionais nunca devem impedir registrar rapidamente um evento essencial, como um gol.
7. Não adicionar backend, autenticação, sincronização, ranking, OVR ou outras camadas sem requisito validado.
8. Evitar reescritas amplas. Preferir refatoração incremental com comportamento preservado.
9. Tratar o backup real da primeira terça como futuro fixture de regressão para migrações V7+.
10. O comportamento canônico de tempo é o descrito em `docs/business-rules.md`, mesmo que a implementação atual ainda divirja em algum ponto.

## Fluxo de mudança recomendado

```text
decisão de produto
  -> documentação
  -> implementação pequena
  -> testes/typecheck/build
  -> revisão de diff
  -> merge
  -> validação em quadra
```

## Critério de simplicidade

O CEFAS auxilia a pelada; não transforma a pelada em operação de sistema.
