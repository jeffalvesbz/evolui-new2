-- Corrige tópicos que foram salvos como strings JSON em vez de extrair o título
-- Esta migração detecta e corrige tópicos que começam com "{" e contêm "titulo"

-- Função para extrair o título de uma string JSON
CREATE OR REPLACE FUNCTION extract_titulo_from_json(json_string TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    parsed_json JSONB;
    extracted_titulo TEXT;
BEGIN
    -- Verifica se a string parece ser um JSON
    IF json_string IS NULL OR json_string = '' THEN
        RETURN json_string;
    END IF;
    
    -- Verifica se começa com { (objeto JSON)
    IF NOT (json_string LIKE '{%') THEN
        RETURN json_string; -- Não é JSON, retorna como está
    END IF;
    
    BEGIN
        -- Tenta fazer parse do JSON
        parsed_json := json_string::JSONB;
        
        -- Extrai o campo titulo ou nome
        IF parsed_json ? 'titulo' THEN
            extracted_titulo := parsed_json->>'titulo';
        ELSIF parsed_json ? 'nome' THEN
            extracted_titulo := parsed_json->>'nome';
        ELSE
            -- Se não tem titulo nem nome, retorna a string original
            RETURN json_string;
        END IF;
        
        -- Retorna o título extraído, ou a string original se estiver vazia
        RETURN COALESCE(extracted_titulo, json_string);
        
    EXCEPTION WHEN OTHERS THEN
        -- Se falhar o parse, retorna a string original
        RETURN json_string;
    END;
END;
$$;

-- Atualiza os tópicos que são strings JSON
UPDATE topicos_default
SET nome = extract_titulo_from_json(nome)
WHERE nome LIKE '{%'
  AND (nome LIKE '%"titulo"%' OR nome LIKE '%"nome"%');

-- Limpa a função auxiliar (opcional, pode manter para uso futuro)
-- DROP FUNCTION IF EXISTS extract_titulo_from_json(TEXT);

COMMENT ON FUNCTION extract_titulo_from_json IS 'Extrai o título de uma string JSON que representa um objeto com campo titulo ou nome';



