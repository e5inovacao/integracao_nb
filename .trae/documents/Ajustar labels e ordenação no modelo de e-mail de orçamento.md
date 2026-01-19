## O que vou alterar
- Arquivo: `src/utils/emailTemplate.ts`
- Na seção de “Frete, Validade e Prazo”:
  - Inverter posições para ficar: Validade da proposta (à esquerda) → Frete (centro) → Prazo de entrega (à direita)
  - Renomear os rótulos:
    - "Validade" → "Validade da proposta"
    - "Prazo" → "Prazo de entrega"
- Na seção “Observações e Forma de Pagamento”:
  - Renomear "Pagamento" → "Forma de Pagamento"
- Rodapé:
  - Trocar o telefone de "(27) 3238-9726" para "(27) 99958-6250"

## Validação
- Gerar um e-mail de orçamento e inspecionar o HTML para confirmar ordenação e textos.
- Verificar se os valores de `orcamento.validade_proposta`, `orcamento.prazo_entrega` e `orcamento.opcao_frete` aparecem corretamente nos novos lugares.
- Checar o rodapé para o novo telefone.
