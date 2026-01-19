## Causa provável

* O pedido `PUT /api/consultores/:id` está chegando ao backend, mas nenhuma rota correspondente está ativa no momento (404 padronizado "API not found"). As causas usuais são: servidor Express não iniciado em `3005` (proxy falha) ou rota não registrada/estado antigo do servidor.

## Plano de correção

1. Verificação de backend

* Conferir `http://localhost:5180/api/health` antes de atualizar; se offline, exibir mensagem amigável e não tentar.

* Garantir que o servidor Express está rodando em `3005` (o proxy do Vite depende disso); reiniciar o servidor após mudanças nas rotas.

1. Ajuste do serviço frontend

* No `updateConsultor` adicionar um preflight: chamar `/api/health` e abortar com erro claro se não estiver `success:true`.

* Quando o backend retornar 404 com corpo `{success:false,error:'API not found'}`:

  * Logar o path/método e exibir dica: "Servidor não carregou rota PUT /api/consultores/:id".

  * Retry automático após 1–2s (uma vez), para cobrir janela de reinício do backend.

1. Garantir rota no backend

* Confirmar que `app.use('/api/consultores', consultoresRoutes)` está ativo e que não há exceções ao importar o módulo.

* Adicionar log no início do `router.put('/:id', ...)` para diagnosticar match.

1. Fluxo de senha (robusto)

* Para trocas de senha, usar a rota segura `PATCH /api/consultores/:id/password` que já está ativa.

* O formulário deve chamar a rota dedicada para senha; `updateConsultor` permanece para dados gerais.

## Implementação

* Atualizar `src/lib/consultor-service.ts` com health-check, retry e mensagens;

* Adicionar logs leves em `api/routes/consultores.ts` no `PUT`.

## Validação

* Acessar `/api/health` e ver `success:true`.

* Testar `GET /api/consultores/:id` (existente) e depois `PUT /api/consultores/:id`.

* Realizar troca de senha via `PATCH /api/consultores/:id/password` e confirmar sucesso.

