# 🔧 Correções Aplicadas - Problemas do Banco de Dados

## Problemas Identificados

1. **Erro 406 no profiles** - Perfil do usuário não existe
2. **Erro 409 no study_plans** - Conflito ao criar edital
3. **Erro 400 no Gemini** - API key inválida (não relacionado ao banco)

## Correções Aplicadas

### 1. Criação Automática de Perfil ✅

**Arquivo:** `stores/useOnboardingStore.ts`

- Adicionada lógica para criar perfil automaticamente quando não existe
- Quando o código detecta que o perfil não existe (erro PGRST116), cria automaticamente
- Funciona tanto em `checkOnboardingStatus` quanto em `markOnboardingAsSeen`

### 2. Script SQL para Trigger Automático ✅

**Arquivo:** `fix_profile_creation.sql`

Criado script que:
- Cria função `handle_new_user()` que cria perfil automaticamente no signup
- Cria trigger que executa quando um novo usuário é criado em `auth.users`
- Cria perfis para usuários existentes que não têm perfil

## Próximos Passos

### 1. Executar o Script SQL

Execute o arquivo `fix_profile_creation.sql` no SQL Editor do Supabase:

```sql
-- Isso criará:
-- 1. Função para criar perfil automaticamente
-- 2. Trigger para executar no signup
-- 3. Perfis para usuários existentes sem perfil
```

### 2. Verificar Erro 409 no study_plans

O erro 409 pode ser causado por:
- Tentativa de criar registro duplicado
- Violação de constraint única
- Problema com RLS

**Para investigar:**
1. Verifique se há constraints únicas na tabela `study_plans`
2. Verifique os logs do Supabase para ver a mensagem de erro completa
3. Teste criar um edital com nome diferente

### 3. Verificar RLS

Certifique-se de que as políticas RLS estão permitindo:
- INSERT em `profiles` para o próprio usuário
- INSERT em `study_plans` para o próprio usuário

## Testes Recomendados

1. ✅ Teste criar um novo usuário (deve criar perfil automaticamente)
2. ✅ Teste fazer login com usuário existente (deve criar perfil se não existir)
3. ⚠️ Teste criar um edital (verificar erro 409)
4. ✅ Teste verificar status de onboarding

## Arquivos Modificados

- `stores/useOnboardingStore.ts` - Criação automática de perfil
- `fix_profile_creation.sql` - Script SQL para trigger automático

## Notas

- O erro do Gemini (API key) não é relacionado ao banco de dados
- O erro "Maximum update depth exceeded" é um problema de React (loop infinito no useEffect)
- Foque primeiro em resolver os problemas do banco de dados




