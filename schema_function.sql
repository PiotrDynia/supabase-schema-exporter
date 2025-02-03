create or replace function get_schema_info()
returns json
language plpgsql
security definer
as $$
begin
  return (
    select json_agg(
      json_build_object(
        'schema', table_schema,
        'table', table_name,
        'description', obj_description((table_schema || '.' || table_name)::regclass, 'pg_class'),
        'estimated_row_count', (
          select reltuples::bigint 
          from pg_class c 
          where c.oid = (table_schema || '.' || table_name)::regclass
        ),
        'columns', (
          select json_agg(
            json_build_object(
              'name', column_name,
              'type', data_type,
              'is_nullable', is_nullable = 'YES',
              'column_default', column_default,
              'description', col_description((table_schema || '.' || table_name)::regclass, ordinal_position),
              'constraints', (
                select json_agg(
                  json_build_object(
                    'constraint_type', tc.constraint_type,
                    'constraint_name', tc.constraint_name
                  )
                )
                from information_schema.table_constraints tc
                join information_schema.constraint_column_usage ccu 
                  on tc.constraint_name = ccu.constraint_name
                  and tc.table_schema = ccu.table_schema
                where ccu.table_schema = c.table_schema
                  and ccu.table_name = c.table_name
                  and ccu.column_name = c.column_name
              )
            )
          )
          from information_schema.columns c
          where c.table_schema = t.table_schema
            and c.table_name = t.table_name
        ),
        'indexes', (
          select json_agg(
            json_build_object(
              'name', i.relname,
              'is_unique', ix.indisunique,
              'is_primary', ix.indisprimary,
              'definition', pg_get_indexdef(i.oid)
            )
          )
          from pg_class t2
          join pg_index ix on t2.oid = ix.indrelid
          join pg_class i on ix.indexrelid = i.oid
          where t2.oid = (table_schema || '.' || table_name)::regclass
        ),
        'foreign_keys', (
          select json_agg(
            json_build_object(
              'constraint_name', tc.constraint_name,
              'column_name', kcu.column_name,
              'foreign_table_schema', ccu.table_schema,
              'foreign_table_name', ccu.table_name,
              'foreign_column_name', ccu.column_name,
              'update_rule', rc.update_rule,
              'delete_rule', rc.delete_rule
            )
          )
          from information_schema.table_constraints tc
          join information_schema.key_column_usage kcu
            on tc.constraint_name = kcu.constraint_name
            and tc.table_schema = kcu.table_schema
          join information_schema.constraint_column_usage ccu
            on tc.constraint_name = ccu.constraint_name
            and tc.table_schema = ccu.table_schema
          join information_schema.referential_constraints rc
            on tc.constraint_name = rc.constraint_name
          where tc.constraint_type = 'FOREIGN KEY'
            and tc.table_schema = t.table_schema
            and tc.table_name = t.table_name
        ),
        'triggers', (
          select json_agg(
            json_build_object(
              'trigger_name', trigger_name,
              'event_manipulation', event_manipulation,
              'event_timing', action_timing,
              'action_statement', action_statement
            )
          )
          from information_schema.triggers
          where event_object_schema = t.table_schema
            and event_object_table = t.table_name
        )
      )
    )
    from information_schema.tables t
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
  );
end;
$$; 