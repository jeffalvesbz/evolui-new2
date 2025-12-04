-- Atualizações para suportar fluxo de clone dos editais padrão

-- 1) Garante coluna status_validacao na tabela editais_default
alter table if exists public.editais_default
    add column if not exists status_validacao text
        default 'pendente'
        check (status_validacao = any (array['pendente', 'aprovado', 'oculto']));

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'editais_default'
          and column_name = 'visivel'
    ) then
        update public.editais_default
        set status_validacao = case
            when status_validacao is not null then status_validacao
            when visivel is true then 'aprovado'
            when visivel is false then 'oculto'
            else 'pendente'
        end;
    end if;
end
$$;

alter table if exists public.editais_default
    drop column if exists visivel;

-- 2) Função para clonar edital padrão gerando study_plan, disciplinas e tópicos do usuário
create or replace function public.clone_edital_default(
    edital_default_id uuid,
    user_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
    v_edital record;
    v_new_study_plan_id uuid;
    v_disc record;
    v_new_disciplina_id uuid;
    v_topic record;
    v_data_alvo date;
begin
    -- Busca dados do edital padrão solicitado
    select * into v_edital
    from public.editais_default
    where id = clone_edital_default.edital_default_id;

    if v_edital is null then
        raise exception 'Edital padrão % não encontrado', clone_edital_default.edital_default_id;
    end if;

    -- Define data alvo baseada no ano do edital (se existir)
    if v_edital.ano is not null then
        v_data_alvo := make_date(v_edital.ano, 12, 31);
    else
        v_data_alvo := null;
    end if;

    -- Cria um novo study_plan para o usuário
    insert into public.study_plans (
        user_id,
        nome,
        descricao,
        data_alvo,
        banca,
        orgao,
        categoria,
        versao,
        ano,
        is_oficial,
        status_validacao
    )
    values (
        clone_edital_default.user_id,
        v_edital.nome,
        'Clonado automaticamente do edital padrão ' || v_edital.nome,
        v_data_alvo,
        v_edital.banca,
        v_edital.cargo,
        'edital_padrao',
        '1.0',
        v_edital.ano,
        false,
        'aprovado'
    )
    returning id into v_new_study_plan_id;

    -- Copia disciplinas padrão
    for v_disc in
        select id, nome, ordem
        from public.disciplinas_default
        where edital_default_id = clone_edital_default.edital_default_id
        order by ordem nulls last, nome
    loop
        insert into public.disciplinas (
            user_id,
            study_plan_id,
            nome,
            anotacoes,
            progresso,
            edital_id
        )
        values (
            clone_edital_default.user_id,
            v_new_study_plan_id,
            v_disc.nome,
            null,
            0,
            null
        )
        returning id into v_new_disciplina_id;

        -- Copia tópicos vinculados
        for v_topic in
            select id, nome, ordem
            from public.topicos_default
            where disciplina_default_id = v_disc.id
            order by ordem nulls last, nome
        loop
            insert into public.topicos (
                user_id,
                disciplina_id,
                titulo,
                nivel_dificuldade,
                concluido
            )
            values (
                clone_edital_default.user_id,
                v_new_disciplina_id,
                v_topic.nome,
                'médio',
                false
            );
        end loop;
    end loop;

    return v_new_study_plan_id;
end;
$$;

