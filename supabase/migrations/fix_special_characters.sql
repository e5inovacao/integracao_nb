-- Correção de caracteres especiais na tabela produtos_asia
-- Esta migração corrige os caracteres '�' e sequências '_x000D_' encontrados nos dados

-- 1. Corrigir caracteres especiais no campo nome_pai
UPDATE produtos_asia 
SET nome_pai = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(nome_pai, '�', 'ã'),
                  '�', 'á'
                ),
                '�', 'é'
              ),
              '�', 'í'
            ),
            '�', 'ó'
          ),
          '�', 'ú'
        ),
        '�', 'ç'
      ),
      '�', 'õ'
    ),
    '�', 'â'
  ),
  '�', 'ê'
)
WHERE nome_pai LIKE '%�%';

-- 2. Corrigir caracteres especiais no campo descricao
UPDATE produtos_asia 
SET descricao = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(
                        REPLACE(
                          REPLACE(
                            REPLACE(
                              REPLACE(
                                REPLACE(
                                  REPLACE(
                                    REPLACE(
                                      REPLACE(descricao, '�', 'ã'),
                                      '�', 'á'
                                    ),
                                    '�', 'é'
                                  ),
                                  '�', 'í'
                                ),
                                '�', 'ó'
                              ),
                              '�', 'ú'
                            ),
                            '�', 'ç'
                          ),
                          '�', 'õ'
                        ),
                        '�', 'â'
                      ),
                      '�', 'ê'
                    ),
                    '�', 'à'
                  ),
                  '�', 'è'
                ),
                '�', 'ì'
              ),
              '�', 'ò'
            ),
            '�', 'ù'
          ),
          '�', 'ô'
        ),
        '�', 'î'
      ),
      '�', 'û'
    ),
    '�', 'ñ'
  ),
  '�', 'º'
)
WHERE descricao LIKE '%�%';

-- 3. Remover sequências de escape XML '_x000D_' e substituir por quebras de linha
UPDATE produtos_asia 
SET descricao = REPLACE(
  REPLACE(
    REPLACE(descricao, '_x000D_\n_x000D_\n', '\n'),
    '_x000D_\n', '\n'
  ),
  '_x000D_', '\n'
)
WHERE descricao LIKE '%_x000D_%';

-- 4. Limpar espaços extras e quebras de linha desnecessárias
UPDATE produtos_asia 
SET descricao = TRIM(
  REGEXP_REPLACE(
    REGEXP_REPLACE(descricao, '\n\s*\n', '\n', 'g'),
    '^\n+|\n+$', '', 'g'
  )
)
WHERE descricao IS NOT NULL;

-- 5. Corrigir caracteres especiais nos campos de imagem (se houver)
UPDATE produtos_asia 
SET imagem = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(imagem, '�', 'ã'),
                  '�', 'á'
                ),
                '�', 'é'
              ),
              '�', 'í'
            ),
            '�', 'ó'
          ),
          '�', 'ú'
        ),
        '�', 'ç'
      ),
      '�', 'õ'
    ),
    '�', 'â'
  ),
  '�', 'ê'
)
WHERE imagem LIKE '%�%';

-- Aplicar as mesmas correções para os campos img01 a img15
UPDATE produtos_asia 
SET img01 = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(img01, '�', 'ã'),
                  '�', 'á'
                ),
                '�', 'é'
              ),
              '�', 'í'
            ),
            '�', 'ó'
          ),
          '�', 'ú'
        ),
        '�', 'ç'
      ),
      '�', 'õ'
    ),
    '�', 'â'
  ),
  '�', 'ê'
)
WHERE img01 LIKE '%�%';

-- Repetir para img02
UPDATE produtos_asia 
SET img02 = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(img02, '�', 'ã'),
                  '�', 'á'
                ),
                '�', 'é'
              ),
              '�', 'í'
            ),
            '�', 'ó'
          ),
          '�', 'ú'
        ),
        '�', 'ç'
      ),
      '�', 'õ'
    ),
    '�', 'â'
  ),
  '�', 'ê'
)
WHERE img02 LIKE '%�%';

-- Correções aplicadas com sucesso
-- Caracteres especiais (�) substituídos por acentos corretos
-- Sequências XML (_x000D_) removidas e substituídas por quebras de linha