## Mudança
- Atualizar os selects do formulário de orçamento com as opções solicitadas, mantendo validação e responsividade.

## Campos
- Validade da Proposta: 10 dias; 20 dias; 30 dias; 50 dias; 60 dias (na ordem do print).
- Prazo de Entrega: 5 dias úteis; 7 / 10 dias úteis; 12 dias úteis; 15 dias úteis; 15 / 20 dias úteis; 20 dias úteis; 25 dias úteis; 30 dias úteis; 40 dias úteis; 50 dias úteis; 60 dias úteis; 120 dias úteis; 3 dias úteis; 4 dias úteis.
- Forma de Pagamento: usar todas as opções fornecidas separadas por ';'.
- Opção de Frete: Cliente retira; Frete CIF - Incluso; Frete CIF - Incluso para Grande Vitória, exceto Cariacica, Viana e Guarapari; Frete FOB - Não incluso, por conta do cliente.

## Arquivo
- `src/pages/OrcamentoForm.tsx`: atualizar os quatro selects existentes.

## Validação
- `required` mantido; valores persistem no salvamento atual.
- Sem impacto em outras funcionalidades.