-- Forçar recarga do cache do PostgREST para refletir novas colunas
NOTIFY pgrst, 'reload schema';