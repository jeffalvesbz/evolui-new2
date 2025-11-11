# 🔧 Correção do Erro: Enum xp_log_event

## ❌ Erro Encontrado

```
invalid input value for enum xp_log_event: "study_session"
```

Este erro ocorre quando você tenta criar uma sessão de estudo. O problema é que o enum `xp_log_event` no banco de dados não contém o valor `'study_session'`.

## 🔍 Causa

Provavelmente há um trigger ou função no banco de dados que tenta criar automaticamente um log de XP quando uma sessão é criada, mas o enum não foi atualizado com esse valor.

## ✅ Solução

Execute o script SQL `fix_xp_log_enum.sql` no Supabase Dashboard:

### Passo a Passo:

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor:**
   - No menu lateral, clique em **"SQL Editor"**
   - Clique em **"New query"**

3. **Execute o Script:**
   - Abra o arquivo `fix_xp_log_enum.sql` neste projeto
   - Copie TODO o conteúdo do arquivo
   - Cole no SQL Editor do Supabase
   - Clique em **"Run"** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

4. **Verificar se Funcionou:**
   - O script deve executar sem erros
   - Tente criar uma sessão de estudo novamente

## 📝 Conteúdo do Script

O script `fix_xp_log_enum.sql` adiciona o valor `'study_session'` ao enum `xp_log_event` se ele ainda não existir:

```sql
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'study_session' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'xp_log_event')
    ) THEN
        ALTER TYPE xp_log_event ADD VALUE 'study_session';
    END IF;
END $$;
```

## ⚠️ Nota Importante

Se você receber um erro dizendo que o enum não existe, você precisa primeiro criar o enum completo. Nesse caso, execute o script `database_schema_complete.sql` que cria todos os enums e tabelas do zero.

## ✅ Após a Correção

Depois de executar o script, o erro deve desaparecer e você poderá criar sessões de estudo normalmente.



