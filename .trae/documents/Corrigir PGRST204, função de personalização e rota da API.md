## Problemas
- PGRST204: PostgREST não encontra a coluna `valor` em `tabelas_personalizacao` (cache desatualizado ou migração não aplicada).
- ReferenceError: `obterFatorPersonalizacao is not defined` — o código ainda referencia a função antiga após mudança para preço fixo (valor).
- API not found/Failed to fetch: requisições ao backend falham (servidor não iniciado ou rota indisponível).

## Correções Planejadas
1) Banco e Cache
- Aplicar a migração que adiciona `valor` em `tabelas_personalizacao`.
- Forçar reload do cache do PostgREST via `NOTIFY pgrst, 'reload schema'` para reconhecer a nova coluna.

2) Código – Personalização por Valor
- Substituir todas as referências a `obterFatorPersonalizacao` por `obterValorPersonalizacao`.
- Garantir que os cálculos de `PREÇO UNIT` usem soma: preçoBase + valorPersonalização + freteUnit, em todos os trechos.
- Ajustar os `select` em `TabelaPersonalizacao` para ler/escrever `valor` (e inputs exibirem R$).

3) Backend/Serviço
- Validar health `/api/health` antes de chamadas críticas.
- Reiniciar servidor Express (porta 3005) e manter proxy Vite em `5180`.
- Confirmar rota `PUT /api/consultores/:id` e rotas de senha (`PATCH /:id/password`).

## Validação
- Inserir/editar valores de `valor` na página de personalização sem erro PGRST204.
- Abrir edição de orçamento sem ReferenceError e com cálculos atualizados (soma).
- Atualizar consultor sem “API not found”; health OK e rota ativa.
