import { expect, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { userHasAnyLists, userOwnsAnyLists } from "../src/lib/lists/server";

type Recorder = {
  table?: string;
  selectedColumns?: string;
  eqColumn?: string;
  eqValue?: string;
  limitValue?: number;
};

function buildSupabaseMock(
  recorder: Recorder,
  result: { data: Array<{ id: string }> | null; error: { message: string; code?: string } | null }
): SupabaseClient {
  return {
    from(table: string) {
      recorder.table = table;
      return {
        select(columns: string) {
          recorder.selectedColumns = columns;
          return {
            eq(column: string, value: string) {
              recorder.eqColumn = column;
              recorder.eqValue = value;
              return {
                limit(limitValue: number) {
                  recorder.limitValue = limitValue;
                  return Promise.resolve(result);
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
}

test("userOwnsAnyLists scopes lookup by owner_id", async () => {
  const recorder: Recorder = {};
  const supabase = buildSupabaseMock(recorder, {
    data: [{ id: "list-1" }],
    error: null,
  });

  const hasLists = await userOwnsAnyLists(supabase, "user-123");

  expect(hasLists).toBe(true);
  expect(recorder.table).toBe("lists");
  expect(recorder.selectedColumns).toBe("id");
  expect(recorder.eqColumn).toBe("owner_id");
  expect(recorder.eqValue).toBe("user-123");
  expect(recorder.limitValue).toBe(1);
});

test("userHasAnyLists keeps caller behavior while using owner scope", async () => {
  const recorder: Recorder = {};
  const supabase = buildSupabaseMock(recorder, {
    data: [],
    error: null,
  });

  const hasLists = await userHasAnyLists(supabase, "user-456");

  expect(hasLists).toBe(false);
  expect(recorder.eqColumn).toBe("owner_id");
  expect(recorder.eqValue).toBe("user-456");
});
