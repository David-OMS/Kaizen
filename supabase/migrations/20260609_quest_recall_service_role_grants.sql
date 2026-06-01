-- provision-daily-quests runs as service_role; recall step reads/writes quest_recall_schedule.
-- 20260605 granted authenticated only — caused 42501 on edge provision.

grant select, insert, update, delete on table public.quest_recall_schedule to service_role;
