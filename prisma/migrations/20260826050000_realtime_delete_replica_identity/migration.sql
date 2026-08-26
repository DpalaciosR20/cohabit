-- Supabase Realtime's postgres_changes filter (ej. listId=eq.X) needs the
-- filtered column present on DELETE events. With the default REPLICA IDENTITY,
-- Postgres only includes the primary key on deletes, so filtered DELETE
-- subscriptions never match and the event is silently dropped.
ALTER TABLE "ShoppingItem" REPLICA IDENTITY FULL;
ALTER TABLE "Expense" REPLICA IDENTITY FULL;
