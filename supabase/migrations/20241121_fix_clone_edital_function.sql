-- Corrige a função de clonagem para usar a estrutura atual das tabelas
drop function if exists public.clone_edital_default(uuid, uuid);
drop function if exists public.clone_edital_default_impl(uuid, uuid);

create or replace function public.clone_edital_default_impl(
    p_edital_default_id uuid,
    p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_edital record;
    v_new_study_plan_id uuid;
    v_disc record;
    v_new_disciplina_id uuid;
    v_topic record;
    v_data_alvo date;
begin
    select *
    into v_edital
    from public.editais_default
    where id = p_edital_default_id;

    if v_edital is null then
        raise exception 'Edital padrão % não encontrado', p_edital_default_id;
    end if;

    if v_edital.ano is not null then
        v_data_alvo := make_date(v_edital.ano, 12, 31);
    else
        v_data_alvo := null;
    end if;

    insert into public.study_plans (
        user_id,
        nome,
        descricao,
        data_alvo,
        banca,
        orgao
    )
    values (
        p_user_id,
        v_edital.nome,
        'Clonado automaticamente do edital padrão ' || v_edital.nome,
        v_data_alvo,
        v_edital.banca,
        v_edital.cargo
    )
    returning id into v_new_study_plan_id;

    for v_disc in
        select id, nome, ordem
        from public.disciplinas_default
        where edital_default_id = p_edital_default_id
        order by ordem nulls last, nome
    loop
        insert into public.disciplinas (
            user_id,
            study_plan_id,
            nome,
            anotacoes,
            progresso
        )
        values (
            p_user_id,
            v_new_study_plan_id,
            v_disc.nome,
            null,
            0
        )
        returning id into v_new_disciplina_id;

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
                p_user_id,
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

create or replace function public.clone_edital_default(
    edital_default_id uuid,
    user_id uuid
)
returns uuid
language sql
security definer
set search_path = public
as $$
    select public.clone_edital_default_impl(edital_default_id, user_id);
$$;

grant execute on function public.clone_edital_default_impl(uuid, uuid) to authenticated;
grant execute on function public.clone_edital_default_impl(uuid, uuid) to service_role;
grant execute on function public.clone_edital_default(uuid, uuid) to authenticated;
grant execute on function public.clone_edital_default(uuid, uuid) to service_role;

