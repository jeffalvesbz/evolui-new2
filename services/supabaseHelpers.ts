import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import type { Database, Tables, TablesInsert, TablesUpdate } from '../types/supabase';

type TableName = keyof Database['public']['Tables'];

type SelectBuilder = (query: any) => any;

type InsertOptions = {
  select?: string;
  single?: boolean;
};

type UpdateOptions = {
  select?: string;
  single?: boolean;
};

type SelectOptions = {
  select?: string;
  single?: boolean;
  builder?: SelectBuilder;
};

type DeleteFilter<T extends TableName> = Partial<Tables<T>> | SelectBuilder;

const handleError = <T>(data: T, error: PostgrestError | null): T => {
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const fromTable = (table: TableName) => supabase.from(table as any);

export const selectFrom = async <T extends TableName, Result = Tables<T>[]>(
  table: T,
  options: SelectOptions = {}
): Promise<Result> => {
  const { select = '*', single = false, builder } = options;
  let query = fromTable(table).select(select);
  if (builder) {
    query = builder(query);
  }

  if (single) {
    const { data, error } = await query.maybeSingle();
    return handleError(data as Result, error);
  }

  const { data, error } = await query;
  return handleError(data as Result, error);
};

export const insertInto = async <T extends TableName, Result = Tables<T>>(
  table: T,
  payload: TablesInsert<T> | TablesInsert<T>[],
  options: InsertOptions = {}
): Promise<Result> => {
  const { select = '*', single = true } = options;
  let query = fromTable(table).insert(payload).select(select);

  if (single) {
    const { data, error } = await query.single();
    return handleError(data as Result, error);
  }

  const { data, error } = await query;
  return handleError(data as Result, error);
};

export const updateRow = async <T extends TableName, Result = Tables<T>>(
  table: T,
  match: Partial<Tables<T>>,
  payload: TablesUpdate<T>,
  options: UpdateOptions = {}
): Promise<Result> => {
  const { select = '*', single = true } = options;
  let query = fromTable(table).update(payload).match(match).select(select);

  if (single) {
    const { data, error } = await query.single();
    return handleError(data as Result, error);
  }

  const { data, error } = await query;
  return handleError(data as Result, error);
};

export const deleteFrom = async <T extends TableName>(
  table: T,
  filter: DeleteFilter<T>
): Promise<void> => {
  let query = fromTable(table).delete();
  if (typeof filter === 'function') {
    query = filter(query);
  } else {
    query = query.match(filter as Record<string, any>);
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }
};
