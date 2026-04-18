/**
 * CRUD validation tests against live Supabase database.
 * Verifies that all 22 tables accept correct columns and reject phantoms.
 * Uses the service role key to bypass RLS.
 *
 * Run: npx vitest run __tests__/database-crud.test.ts
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient;

beforeAll(() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE env vars — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  supabase = createClient(url, key);
});

// ─── Helper: insert → read → update → delete round-trip ──────────────────
async function crudRoundTrip(
  table: string,
  insertRow: Record<string, unknown>,
  updateFields: Record<string, unknown>,
) {
  // INSERT
  const { data: inserted, error: insertErr } = await supabase
    .from(table)
    .insert(insertRow)
    .select()
    .single();
  expect(insertErr).toBeNull();
  expect(inserted).toBeTruthy();
  const id = (inserted as any).id;
  expect(id).toBeTruthy();

  // READ
  const { data: read, error: readErr } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();
  expect(readErr).toBeNull();
  for (const [key, value] of Object.entries(insertRow)) {
    if (value !== undefined && value !== null && typeof value !== "object") {
      // Timestamps may lose trailing Z when stored as `timestamp without time zone`
      const actual = String((read as any)[key]);
      const expected = String(value);
      expect(actual.replace(/Z$/, "")).toEqual(expected.replace(/Z$/, ""));
    }
  }

  // UPDATE
  const { error: updateErr } = await supabase
    .from(table)
    .update(updateFields)
    .eq("id", id);
  expect(updateErr).toBeNull();

  const { data: updated } = await supabase.from(table).select("*").eq("id", id).single();
  for (const [key, value] of Object.entries(updateFields)) {
    if (value !== undefined && value !== null && typeof value !== "object") {
      expect((updated as any)[key]).toEqual(value);
    }
  }

  // DELETE
  const { error: deleteErr } = await supabase.from(table).delete().eq("id", id);
  expect(deleteErr).toBeNull();

  const { data: gone } = await supabase.from(table).select("id").eq("id", id).maybeSingle();
  expect(gone).toBeNull();

  return inserted;
}

// ─── Helper: verify phantom column is rejected ────────────────────────────
async function expectPhantomRejected(table: string, phantomCol: string) {
  const { error } = await supabase
    .from(table)
    .select(phantomCol)
    .limit(1);
  // PostgREST returns 400 for unknown columns on select
  expect(error).toBeTruthy();
}

// ═══════════════════════════════════════════════════════════════════════════
// Table CRUD tests
// ═══════════════════════════════════════════════════════════════════════════

describe("cities", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "cities",
      { name: "__test_city__", country: "Test", state: "TS" },
      { state: "TX" },
    );
  });
});

describe("Driver", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "Driver",
      { full_name: "__test_driver__", license_plate: "TEST-001", approval_status: "pending" },
      { admin_notes: "test update" },
    );
  });
  it("rejects phantom column 'name'", () => expectPhantomRejected("Driver", "name"));
});

describe("ride_requests", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "ride_requests",
      { passenger_name: "__test_pax__", pickup_address: "Test Origin" },
      { status: "cancelled", cancellation_reason: "test" },
    );
  });
  it("rejects phantom 'created_at'", () => expectPhantomRejected("ride_requests", "created_at"));
  it("rejects phantom 'updated_at'", () => expectPhantomRejected("ride_requests", "updated_at"));
});

describe("app_settings", () => {
  it("can read settings", async () => {
    const { data, error } = await supabase.from("app_settings").select("*").limit(1);
    expect(error).toBeNull();
    expect(data).toBeTruthy();
    if (data && data.length > 0) {
      expect(data[0]).toHaveProperty("company_name");
      expect(data[0]).toHaveProperty("maps_provider");
      expect(data[0]).toHaveProperty("google_maps_api_key");
      expect(data[0]).toHaveProperty("promotions");
    }
  });
});

describe("companies", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "companies",
      { razon_social: "__test_company__" },
      { notas: "test note" },
    );
  });
  it("rejects phantom 'name'", () => expectPhantomRejected("companies", "name"));
});

describe("chat_messages", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "chat_messages",
      { ride_id: "test-ride-id", message: "__test_msg__", sender_role: "admin" },
      { read_by_admin: true },
    );
  });
  it("rejects phantom 'created_at'", () => expectPhantomRejected("chat_messages", "created_at"));
});

describe("support_tickets", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "support_tickets",
      { subject: "__test_ticket__", description: "test desc" },
      { status: "closed", admin_response: "resolved" },
    );
  });
  it("rejects phantom 'created_at'", () => expectPhantomRejected("support_tickets", "created_at"));
});

describe("sos_alerts", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "sos_alerts",
      { driver_id: "test-drv", driver_name: "__test_sos__", status: "active" },
      { status: "resolved", admin_notes: "handled" },
    );
  });
  it("rejects phantom 'created_at'", () => expectPhantomRejected("sos_alerts", "created_at"));
});

describe("driver_notificaciones", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "driver_notificaciones",
      { title: "__test_notif__", body: "Test body", driver_ids: ["d1"], sent_by: "test" },
      { tag: "updated" },
    );
  });
  it("rejects phantom 'created_at'", () => expectPhantomRejected("driver_notificaciones", "created_at"));
});

describe("geo_zones", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "geo_zones",
      { name: "__test_zone__", coordinates: [[19.4, -99.1], [19.5, -99.0], [19.4, -99.0]] },
      { color: "#FF0000" },
    );
  });
});

describe("red_zones", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "red_zones",
      { name: "__test_red__", coordinates: [[19.4, -99.1], [19.5, -99.0]] },
      { reason: "test danger" },
    );
  });
});

describe("service_types", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "service_types",
      { name: "__test_svc__", base_price: 50, price_per_km: 10 },
      { description: "updated desc" },
    );
  });
});

describe("admin_users", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "admin_users",
      { email: "__test@test.com", full_name: "__test_admin__", password: "testpass123" },
      { role: "admin" },
    );
  });
});

describe("invoices", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "invoices",
      { company_id: "test-co", company_name: "__test_inv__" },
      { status: "sent", notes: "test" },
    );
  });
});

describe("bonus_rules", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "bonus_rules",
      { name: "__test_rule__", condition_type: "min_rides", condition_value: 10, bonus_amount: 100 },
      { is_active: false },
    );
  });
});

describe("bonus_logs", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "bonus_logs",
      { driver_id: "test-drv", driver_name: "__test_log__", rule_id: "test-rule", bonus_amount: 50 },
      { status: "approved" },
    );
  });
});

describe("cancellation_policies", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "cancellation_policies",
      { name: "__test_policy__", fee_amount: 25 },
      { description: "updated" },
    );
  });
});

describe("cash_cutoffs", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "cash_cutoffs",
      { cutoff_date: new Date().toISOString() },
      { notes: "test cutoff" },
    );
  });
});

describe("announcements", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "announcements",
      { title: "__test_ann__", body: "Test announcement" },
      { is_active: false },
    );
  });
});

describe("surveys", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "surveys",
      { title: "__test_survey__" },
      { description: "updated survey" },
    );
  });
});

describe("survey_responses", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "survey_responses",
      { survey_id: "test-survey", ride_id: "test-ride" },
      { answers: { q1: "yes" } },
    );
  });
});

describe("road_assist_users", () => {
  it("CRUD round-trip", async () => {
    await crudRoundTrip(
      "road_assist_users",
      { email: "__test_ra@test.com", full_name: "__test_ra__", phone: "0000000000" },
      { is_active: false },
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Relationship / join tests
// ═══════════════════════════════════════════════════════════════════════════

describe("Relationships", () => {
  it("ride → driver lookup via driver_id", async () => {
    // Create a driver
    const { data: driver } = await supabase
      .from("Driver")
      .insert({ full_name: "__rel_driver__", license_plate: "REL-001", approval_status: "pending" })
      .select("id")
      .single();

    // Create a ride referencing that driver
    const { data: ride } = await supabase
      .from("ride_requests")
      .insert({ passenger_name: "__rel_pax__", pickup_address: "A", driver_id: driver!.id, driver_name: "__rel_driver__" })
      .select("id,driver_id")
      .single();

    expect(ride!.driver_id).toBe(driver!.id);

    // Look up driver from ride
    const { data: foundDriver } = await supabase
      .from("Driver")
      .select("id,full_name")
      .eq("id", ride!.driver_id)
      .single();
    expect(foundDriver!.full_name).toBe("__rel_driver__");

    // Cleanup
    await supabase.from("ride_requests").delete().eq("id", ride!.id);
    await supabase.from("Driver").delete().eq("id", driver!.id);
  });

  it("ride → company lookup via company_id", async () => {
    const { data: company } = await supabase
      .from("companies")
      .insert({ razon_social: "__rel_company__" })
      .select("id")
      .single();

    const { data: ride } = await supabase
      .from("ride_requests")
      .insert({ passenger_name: "__rel_pax2__", pickup_address: "B", company_id: company!.id, company_name: "__rel_company__" })
      .select("id,company_id")
      .single();

    expect(ride!.company_id).toBe(company!.id);

    const { data: foundCo } = await supabase
      .from("companies")
      .select("id,razon_social")
      .eq("id", ride!.company_id)
      .single();
    expect(foundCo!.razon_social).toBe("__rel_company__");

    await supabase.from("ride_requests").delete().eq("id", ride!.id);
    await supabase.from("companies").delete().eq("id", company!.id);
  });
});
