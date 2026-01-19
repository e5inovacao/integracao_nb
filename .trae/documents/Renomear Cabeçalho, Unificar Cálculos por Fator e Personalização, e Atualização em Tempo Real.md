## Objetivo

Atender aos 5 pontos solicitados: cálculo automático no `td` disparado pelo `div` de Personalização, restauração dos dropdowns, word-wrap com limite de 3 linhas em `h4`, total geral no `th` e padronização do assunto de e-mail.

## Implementações

### 1) Cálculo em tempo real no `td` (Quantidade × Preço Unitário × Fator × Personalização)

* `src/pages/OrcamentoForm.tsx`

  * Adicionar estado `personalizacaoFatores` (mapa nome\_tabela → faixas com `quantidade_inicial`/`final`/`fator`).

  * Criar função `obterFatorPersonalizacao(nomeTabela, quantidade)` semelhante a `obterFatorPorQuantidade` (já existente) para buscar o fator por faixa.

  * Disparar carregamento das faixas quando a Personalização (`div` com `<select>`) mudar e quando os produtos/quantidades mudarem.

  * Atualizar o cálculo dos subtotais (linhas que hoje fazem `preco × fator`) para aplicar `fatorPersonalizacao` e recalcular em tempo real:

    * Substituir `precoVendaRealN = precoN × fatorN` por `precoVendaRealN = precoN × fatorN × fatorPersonalizacao(quantidadeN)`.

  * Garantir formatação com 2 casas decimais via `formatSubtotalCurrency`.

* `src/pages/OrcamentoDetalhes.tsx`

  * Já possui `obterFatorPersonalizacao` e carregamento das faixas; validar que o cálculo use `fatorBase × fatorPersonalizacao` em todos cenários e manter 2 casas na exibição.

### 2) Restaurar dropdowns dos quatro `input` com opções e validação

* `src/pages/OrcamentoForm.tsx:3274–3308`

  * Trocar os inputs simples por `<select>` com opções pré-definidas (as versões anteriores):

    * Validade da Proposta: \["15 dias", "30 dias", "45 dias"]

    * Prazo de Entrega: \["10 dias úteis", "15 / 20 dias úteis", "25 / 30 dias úteis"]

    * Forma de Pagamento: \["À vista", "30 dias", "Parcelado"]

    * Opção de Frete: \["cliente-retira", "frete-cif-incluso", "frete-cedente"]

  * Aplicar seleção única e `required`.

  * Validar no envio/salvamento do orçamento (bloquear quando vazio e emitir aviso).

### 3) Word-wrap em `h4` com limite de 3 linhas e opção expandir

* `src/pages/OrcamentoForm.tsx:2682–2684`

  * Substituir classe `truncate` por container com estilo de clamp:

    * `display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;`

  * Adicionar estado local `showFullTitle` por item e botão "ver mais"/"ver menos" que alterna o clamp (remove o `-webkit-line-clamp`).

  * Tamanho de linha: aprox. 50 caracteres por linha via largura fixa do container; delegar quebra a `word-break`.

### 4) `th` com total geral (soma de todos os itens)

* `src/pages/OrcamentoDetalhes.tsx`

  * Calcular `totalGeral = soma(quantidade × valor_unitário × fatorBase × fatorPersonalização)` sobre todos os produtos exibidos.

  * Exibir o valor no cabeçalho "Valor Total" ou em um resumo fixo acima/abaixo da tabela, com formatação `R$ 0,00` e atualização automática quando qualquer componente mudar.

* Opcional (se desejar também no formulário): exibir um "Total do Orçamento" consolidado em `OrcamentoForm` usando a mesma fórmula.

### 5) Assunto de e-mail padronizado

* `src/pages/OrcamentoDetalhes.tsx:846`

  * Trocar para: `subject: \
    emailData.subject || \`Natureza Brindes - Orçamento \[${orcamento.solicitacao\_id}]\`\`.

  * Validação antes do envio: garantir que o assunto final contenha exatamente o formato exigido (com colchetes) e o número do orçamento; se não, ajustar automaticamente.

## Validação

* Alterar Personalização no formulário e verificar que o `td` de subtotal atualiza imediatamente com o fator de personalização aplicado.

* Confirmar que os quatro campos renderizam como dropdown, têm as opções e impedem salvar quando vazios.

* Verificar o título do produto com clamp de 3 linhas e botão de expandir/contrair.

* Conferir o valor total no `th`/resumo e sua atualização em tempo real.

* Enviar um e-mail e validar que o assunto segue o formato exato com colchetes e número do orçamento.

## Arquivos Alvo

* `src/pages/OrcamentoForm.tsx` (personalização → cálculo; dropdowns; word-wrap)

* `src/pages/OrcamentoDetalhes.tsx` (total geral; validação do assunto)

