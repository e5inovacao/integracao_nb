## Diagnóstico

* Personalizações criadas não aparecem no formulário porque o `<select>` é estático (não lê `tabelas_personalizacao`). Fonte: `src/pages/OrcamentoForm.tsx:2860–2889`.

* O valor total em detalhes usa apenas `produto.fator` com fallback 1.8, sem compor o fator das personalizações. Fonte: `src/pages/OrcamentoDetalhes.tsx:1184–1241` (cálculo `quantidade × valor × fator`).

* Os quatro inputs com placeholder `Buscar configuração...` pertencem ao componente `ConfigSearchInput` e seus usos em `OrcamentoForm`. Fontes: definição `src/pages/OrcamentoForm.tsx:425–523`, placeholder alvo em `src/pages/OrcamentoForm.tsx:492`, usos em `src/pages/OrcamentoForm.tsx:3373–3407`.

* Favicon: link em `index.html` aponta para `/favicon.webp`, arquivo existe em `public/` (`public/favicon.webp`), porém o erro `net::ERR_CONNECTION_REFUSED` indica recusa de conexão do host/porta (5181). Há também tipo incorreto `image/x-icon` para `.webp`.

## Plano de Correção

### 1) Personalizações no formulário de orçamento

* Substituir `<select>` estático por lista dinâmica de tabelas ativas de `tabelas_personalizacao`.

* Carregar nomes únicos (`nome_tabela`) e popular opções do `<select>` em `OrcamentoForm`.

* Persistir o nome da tabela escolhida (ex.: `personalizacao_tabela`) junto ao item em `products_solicitacao` (reaproveitar o campo `personalizacao` ou criar `personalizacao_tabela` caso já exista padronização).

* Garantir renderização condicional correta do bloco “Personalização:” e sincronização com `selectedProducts`. Arquivo-alvo: `src/pages/OrcamentoForm.tsx:2860–2889`.

### 2) Remover os quatro inputs “Buscar configuração...”

* Remover campo secundário de busca e dropdown do componente `ConfigSearchInput`. Arquivo: `src/pages/OrcamentoForm.tsx:425–523`.

* Remover todos os usos (`validade_proposta`, `prazo_entrega`, `forma_pagamento`, `opcao_frete`). Arquivo: `src/pages/OrcamentoForm.tsx:3373–3407`.

* Eliminar estados/handlers não usados e chamada ao serviço `buscarConfiguracoes`. Se ficar sem uso em toda a base, apagar a função correspondente em `src/lib/configuracoes-service.ts:186–210`.

* Validar que a edição de orçamento continua operando com inputs diretos simples (sem busca assistida).

### 3) Valor total com fator composto (tempo real)

* Definir `fatorBase`:

  * Se `produto.fator` estiver válido, usar.

  * Senão, calcular pelo nome `tabelafator{1|2|3}` e quantidade via função como `obterFatorPorQuantidade` (já existe). Fonte: `src/pages/OrcamentoForm.tsx:732`.

* Definir `fatorPersonalizacao`:

  * Consultar `tabelas_personalizacao` pelo `nome_tabela` escolhido e faixa de quantidade.

  * Nova função: `obterFatorPersonalizacao(nomeTabela, quantidade)` análoga à de fator.

* Calcular `fatorTotal = fatorBase × fatorPersonalizacao` e aplicar no cálculo:

  * `valorComFator = quantidade × valor_unitario × fatorTotal` nas quatro combinações. Atualizar render com reatividade (recalcular quando `quantidade`, `valor_unitario`, `personalizacao_tabela` ou `tabelafatorX` mudarem).

* Implementar no `src/pages/OrcamentoDetalhes.tsx:1184–1241` e garantir que `OrcamentoForm` salve os nomes das tabelas para uso posterior.

* Precisão: manter números como `number` e aplicar arredondamento controlado somente na exibição (ex.: `formatCurrency`).

### 4) Favicon `ERR_CONNECTION_REFUSED`

* Causa raiz: requisição ao host/porta do dev server recusada; corrigir para usar apenas caminho relativo sem origin explícito e garantir servidor rodando.

* Ajustes:

  * Corrigir o `type` para `image/webp` e manter fallback SVG/ICO: adicionar `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`.

  * Garantir arquivo em `public/` (já existe `public/favicon.webp`).

  * Evitar hardcode de `http://localhost:5181` (já está relativo em `index.html`).

* Preventivo:

  * Adicionar listener de erros em dev para avisar caso o favicon falhe e seguir com fallback.

  * Incluir verificação simples em build para existência dos favicons esperados.

* Testes de regressão:

  * Subir dev server, acessar, validar carregamento dos favicons (Network/Status 200).

  * Rodar navegação entre páginas garantindo ausência do erro no console.

## Arquivos Alvo

* `src/pages/OrcamentoForm.tsx:2860–2889` (select Personalização, dinâmica e persistência)

* `src/pages/OrcamentoForm.tsx:425–523`, `3373–3407` (remoção inputs de busca)

* `src/lib/configuracoes-service.ts:186–210` (remover função de busca se não utilizada)

* `src/pages/OrcamentoDetalhes.tsx:1184–1241` (cálculo fator composto)

* `index.html:5` (favicon type/fallback)

## Validação

* Criar uma tabela de personalização (ex.: LASER) com faixas e fatores; selecionar no orçamento e conferir que o valor total em detalhes reflete `fatorBase × fatorPersonalizacao`.

* Confirmar que os quatro inputs foram removidos e nenhuma referência/erro persiste.

* Verificar que o bloco “Personalização” exibe as opções dinâmicas e persiste no banco.

* Confirmar no console que o erro do favicon não ocorre e que ícones carregam

