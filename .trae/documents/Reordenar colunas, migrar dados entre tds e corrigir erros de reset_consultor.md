## Objetivo
Executar três frentes: (1) reordenar a coluna “PREÇO UNIT” para ficar imediatamente à direita de “PREÇO UNIT. FORN.” mantendo responsividade; (2) migrar dados entre `td`s garantindo integridade e validação; (3) analisar e corrigir os dois logs de erro relacionados ao fluxo de atualização/reset de consultores.

## Implementação de Layout
- Página: `src/pages/OrcamentoForm.tsx`
- A coluna “PREÇO UNIT” já foi adicionada; vamos garantir sua posição imediatamente à direita de “PREÇO UNIT. FORN.” e antes de “FATOR”.
- Validar largura mínima (`min-width`) e classes Tailwind das colunas para evitar sobreposição e manter espaçamento consistente (usar 70–90px com `px-2`).
- Testar em breakpoints (sm/md/lg) para checar responsividade e overflow horizontal controlado por `overflow-x-auto` em wrapper.

## Migração de Dados entre `td`s
- Origem/destino: transferir os valores atualmente exibidos no `td` de “Valor Unitário” calculado a partir de `(Preço Unit. Forn × Fator × Personalização)` para o novo `td` “PREÇO UNIT” no formulário.
- Precisão/formatação: manter formatação monetária com 2 casas (`formatCurrency`).
- Integridade: garantir que os cálculos reagem a mudanças de qualquer componente (preço, fator, personalização). Validar que nenhum valor inválido resulte em `NaN`; fallback `0` para preço e `1` para fatores quando ausentes.
- Confirmação: adicionar verificação no fluxo de salvar para confirmar que os três campos (quantidades/fatores/preço-fornecedor) estão consistentes.

## Ajustes na Página de Detalhes
- Exibir “Fator: <nomeTabela>” logo abaixo de “Gravação: …” (já corrigido o problema de JSX adjacente). Garantir que a coluna “Valor Unitário” reflita o mesmo cálculo usado no formulário (unitário × fator × personalização).
- Remover o `div` de total do cabeçalho, já feito.

## Análise e Correções dos 2 Logs de Erro (Reset/Consultores)
- Logs:
  1) `SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input` em `src/lib/consultor-service.ts:47` (no `resp.json()`).
  2) Mesma mensagem propagada em `ConsultorForm.tsx:122`.
- Pontos de falha:
  - O backend (`PUT /api/consultores/:id`) pode devolver resposta sem corpo (ou erro intermediário), levando o `resp.json()` a falhar.
  - Em rede/Proxy, quando o dev server cai, Vite retorna HTML e não JSON.
- Padrões recorrentes:
  - Chamadas assumem sempre JSON válido sem fallback.
- Possíveis vulnerabilidades:
  - Erros não tratados podem expor mensagens padrão; falta de verificação de `content-type` e tamanho do corpo.
- Correções propostas:
  - No frontend (`updateConsultor`): trocar parsing por `await resp.text()` com tentativa de `JSON.parse`, validando `content-type` e tamanho, e fornecer mensagens de erro amigáveis.
  - No backend (rota Express): garantir `res.json(...)` em todos caminhos de saída e nunca devolver 204/empty body.
  - Adicionar timeout e retry leve na chamada para mitigar flutuação do dev server.
- Alternativa para controle de acesso de consultores:
  - Autenticação mais robusta: usar Supabase Auth com política de senha forte, bloqueio por tentativas e expiração de sessão.
  - Recuperação de conta segura: fluxo de reset por token expira em 15 min, obrigando reconfirmação via e-mail e registro de IP.
  - Monitoramento: logs de atividade anômalos com alerta (e.g., falhas consecutivas, IPs suspeitos).
  - MFA opcional: TOTP (Google Authenticator) ou SMS/e-mail OTP para ações sensíveis (alteração de senha/dados pessoais).

## Validação
- Conferir visualmente a ordem das colunas e espaçamento em `OrcamentoForm`.
- Alterar valores (preço/fator/personalização) e confirmar atualização em tempo real dos `td`s: PREÇO UNIT e SUB-TOTAL.
- Testar fluxo de atualização de consultor com backend ativo; validar que erro de JSON não ocorre e que mensagens de sucesso/erro são consistentes.

## Arquivos Alvo
- `src/pages/OrcamentoForm.tsx` (layout e cálculo no formulário)
- `src/pages/OrcamentoDetalhes.tsx` (exibição de fator e cálculo unitário)
- `src/lib/consultor-service.ts` (tratamento seguro do parsing da resposta)
- `api/routes/consultores.ts` (garantir respostas JSON padronizadas)