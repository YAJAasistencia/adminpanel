/**
 * ORM Relationship & Foreign Key validation tests against live Supabase database.
 * Tests all FK-like relationships between the 22 tables, verifying referential
 * integrity for insert/query/cleanup operations.
 *
 * Run: npx vitest run __tests__/orm-relationships.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient;

// Track IDs for cleanup
const cleanup: { table: string; id: string }[] = [];

beforeAll(() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE env vars");
  supabase = createClient(url, key);
});

afterAll(async () => {
  // Delete in reverse order to respect referential dependencies
  for (const entry of cleanup.reverse()) {
    await supabase.from(entry.table).delete().eq("id", entry.id);
  }
}, 30000);

// Helper to insert and track for cleanup
async function insertTracked<T extends Record<string, unknown>>(
  table: string,
  row: T,
): Promise<T & { id: string }> {
  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select()
    .single();
  expect(error).toBeNull();
  expect(data).toBeTruthy();
  cleanup.push({ table, id: (data as any).id });
  return data as T & { id: string };
}

// ═══════════════════════════════════════════════════════════════════════════
// FK Relationship Tests
// ═══════════════════════════════════════════════════════════════════════════

describe("Driver ↔ cities (city_id)", () => {
  it("driver.city_id references cities.id", async () => {
    const city = await insertTracked("cities", {
      name: "__rel_city__",
      country: "MX",
      state: "JAL",
    });
    const driver = await insertTracked("Driver", {
      full_name: "__rel_drv_city__",
      license_plate: "CTY-001",
      approval_status: "pending",
      city_id: city.id,
      city_name: city.name,
    });

    expect(driver.city_id).toBe(city.id);

    // Verify join query works
    const { data: foundCity } = await supabase
      .from("cities")
      .select("id,name")
      .eq("id", driver.city_id!)
      .single();
    expect(foundCity!.name).toBe("__rel_city__");

    // Verify reverse lookup: find drivers in city
    const { data: driversInCity } = await supabase
      .from("Driver")
      .select("id,full_name")
      .eq("city_id", city.id);
    expect(driversInCity!.length).toBeGreaterThanOrEqual(1);
    expect(driversInCity!.some((d: any) => d.id === driver.id)).toBe(true);
  });
});

describe("ride_requests ↔ Driver (driver_id)", () => {
  it("ride.driver_id references Driver.id", async () => {
    const driver = await insertTracked("Driver", {
      full_name: "__rel_drv_ride__",
      license_plate: "RDE-001",
      approval_status: "approved",
    });
    const ride = await insertTracked("ride_requests", {
      passenger_name: "__rel_pax_ride__",
      pickup_address: "Origin A",
      driver_id: driver.id,
      driver_name: driver.full_name,
    });

    expect(ride.driver_id).toBe(driver.id);

    // Reverse: find rides for driver
    const { data: driverRides } = await supabase
      .from("ride_requests")
      .select("id,passenger_name")
      .eq("driver_id", driver.id);
    expect(driverRides!.length).toBeGreaterThanOrEqual(1);
    expect(driverRides!.some((r: any) => r.id === ride.id)).toBe(true);
  });
});

describe("ride_requests ↔ companies (company_id)", () => {
  it("ride.company_id references companies.id", async () => {
    const company = await insertTracked("companies", {
      razon_social: "__rel_co_ride__",
    });
    const ride = await insertTracked("ride_requests", {
      passenger_name: "__rel_pax_co__",
      pickup_address: "Origin B",
      company_id: company.id,
      company_name: "__rel_co_ride__",
    });

    expect(ride.company_id).toBe(company.id);

    const { data: found } = await supabase
      .from("companies")
      .select("id,razon_social")
      .eq("id", ride.company_id!)
      .single();
    expect(found!.razon_social).toBe("__rel_co_ride__");
  });
});

describe("ride_requests ↔ service_types (service_type_id)", () => {
  it("ride.service_type_id references service_types.id", async () => {
    const svcType = await insertTracked("service_types", {
      name: "__rel_svc_type__",
      base_price: 30,
      price_per_km: 5,
    });
    const ride = await insertTracked("ride_requests", {
      passenger_name: "__rel_pax_svc__",
      pickup_address: "Origin C",
      service_type_id: svcType.id,
    });

    expect(ride.service_type_id).toBe(svcType.id);

    const { data: found } = await supabase
      .from("service_types")
      .select("id,name")
      .eq("id", ride.service_type_id!)
      .single();
    expect(found!.name).toBe("__rel_svc_type__");
  });
});

describe("ride_requests ↔ geo_zones (geo_zone_id)", () => {
  it("ride.geo_zone_id references geo_zones.id", async () => {
    const zone = await insertTracked("geo_zones", {
      name: "__rel_zone__",
      coordinates: [[19.4, -99.1], [19.5, -99.0], [19.4, -99.0]],
    });
    const ride = await insertTracked("ride_requests", {
      passenger_name: "__rel_pax_zone__",
      pickup_address: "Origin D",
      geo_zone_id: zone.id,
    });

    expect(ride.geo_zone_id).toBe(zone.id);

    const { data: found } = await supabase
      .from("geo_zones")
      .select("id,name")
      .eq("id", ride.geo_zone_id!)
      .single();
    expect(found!.name).toBe("__rel_zone__");
  });
});

describe("ride_requests ↔ cities (city_id)", () => {
  it("ride.city_id references cities.id", async () => {
    const city = await insertTracked("cities", {
      name: "__rel_city_ride__",
      country: "MX",
      state: "NL",
    });
    const ride = await insertTracked("ride_requests", {
      passenger_name: "__rel_pax_city__",
      pickup_address: "Origin E",
      city_id: city.id,
    });

    expect(ride.city_id).toBe(city.id);

    const { data: found } = await supabase
      .from("cities")
      .select("id,name")
      .eq("id", ride.city_id!)
      .single();
    expect(found!.name).toBe("__rel_city_ride__");
  });
});

describe("bonus_logs ↔ Driver (driver_id)", () => {
  it("bonus_log.driver_id references Driver.id", async () => {
    const driver = await insertTracked("Driver", {
      full_name: "__rel_drv_bonus__",
      license_plate: "BNS-001",
      approval_status: "approved",
    });
    const rule = await insertTracked("bonus_rules", {
      name: "__rel_rule__",
      condition_type: "min_rides",
      condition_value: 5,
      bonus_amount: 200,
    });
    const log = await insertTracked("bonus_logs", {
      driver_id: driver.id,
      driver_name: driver.full_name,
      rule_id: rule.id,
      bonus_amount: 200,
    });

    expect(log.driver_id).toBe(driver.id);
    expect(log.rule_id).toBe(rule.id);

    // Verify driver lookup
    const { data: foundDriver } = await supabase
      .from("Driver")
      .select("id,full_name")
      .eq("id", log.driver_id)
      .single();
    expect(foundDriver!.full_name).toBe("__rel_drv_bonus__");
  });
});

describe("bonus_logs ↔ bonus_rules (rule_id)", () => {
  it("bonus_log.rule_id references bonus_rules.id", async () => {
    const rule = await insertTracked("bonus_rules", {
      name: "__rel_rule2__",
      condition_type: "min_rides",
      condition_value: 3,
      bonus_amount: 100,
    });
    const log = await insertTracked("bonus_logs", {
      driver_id: "test-drv-fk",
      driver_name: "__rel_log_rule__",
      rule_id: rule.id,
      bonus_amount: 100,
    });

    expect(log.rule_id).toBe(rule.id);

    const { data: foundRule } = await supabase
      .from("bonus_rules")
      .select("id,name")
      .eq("id", log.rule_id)
      .single();
    expect(foundRule!.name).toBe("__rel_rule2__");

    // Reverse: find logs for this rule
    const { data: logsForRule } = await supabase
      .from("bonus_logs")
      .select("id,driver_name")
      .eq("rule_id", rule.id);
    expect(logsForRule!.length).toBeGreaterThanOrEqual(1);
  });
});

describe("chat_messages ↔ ride_requests (ride_id)", () => {
  it("chat.ride_id references ride_requests.id", async () => {
    const ride = await insertTracked("ride_requests", {
      passenger_name: "__rel_pax_chat__",
      pickup_address: "Origin F",
    });
    const msg = await insertTracked("chat_messages", {
      ride_id: ride.id,
      message: "__rel_chat_msg__",
      sender_role: "admin",
    });

    expect(msg.ride_id).toBe(ride.id);

    // Reverse: find messages for ride
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("id,message")
      .eq("ride_id", ride.id);
    expect(msgs!.length).toBeGreaterThanOrEqual(1);
    expect(msgs!.some((m: any) => m.message === "__rel_chat_msg__")).toBe(true);
  });
});

describe("invoices ↔ companies (company_id)", () => {
  it("invoice.company_id references companies.id", async () => {
    const company = await insertTracked("companies", {
      razon_social: "__rel_co_inv__",
    });
    const invoice = await insertTracked("invoices", {
      company_id: company.id,
      company_name: "__rel_co_inv__",
    });

    expect(invoice.company_id).toBe(company.id);

    const { data: found } = await supabase
      .from("companies")
      .select("id,razon_social")
      .eq("id", invoice.company_id)
      .single();
    expect(found!.razon_social).toBe("__rel_co_inv__");

    // Reverse: find invoices for company
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id,company_name")
      .eq("company_id", company.id);
    expect(invoices!.length).toBeGreaterThanOrEqual(1);
  });
});

describe("survey_responses ↔ surveys (survey_id)", () => {
  it("response.survey_id references surveys.id", async () => {
    const survey = await insertTracked("surveys", {
      title: "__rel_survey__",
    });
    const response = await insertTracked("survey_responses", {
      survey_id: survey.id,
      ride_id: "test-ride-rel",
    });

    expect(response.survey_id).toBe(survey.id);

    const { data: found } = await supabase
      .from("surveys")
      .select("id,title")
      .eq("id", response.survey_id)
      .single();
    expect(found!.title).toBe("__rel_survey__");

    // Reverse: find responses for survey
    const { data: responses } = await supabase
      .from("survey_responses")
      .select("id")
      .eq("survey_id", survey.id);
    expect(responses!.length).toBeGreaterThanOrEqual(1);
  });
});

describe("survey_responses ↔ ride_requests (ride_id)", () => {
  it("response.ride_id references ride_requests.id", async () => {
    const ride = await insertTracked("ride_requests", {
      passenger_name: "__rel_pax_survey__",
      pickup_address: "Origin G",
    });
    const survey = await insertTracked("surveys", {
      title: "__rel_survey_ride__",
    });
    const response = await insertTracked("survey_responses", {
      survey_id: survey.id,
      ride_id: ride.id,
    });

    expect(response.ride_id).toBe(ride.id);

    const { data: foundRide } = await supabase
      .from("ride_requests")
      .select("id,passenger_name")
      .eq("id", response.ride_id)
      .single();
    expect(foundRide!.passenger_name).toBe("__rel_pax_survey__");
  });
});

describe("survey_responses ↔ Driver (driver_id)", () => {
  it("response.driver_id references Driver.id", async () => {
    const driver = await insertTracked("Driver", {
      full_name: "__rel_drv_survey__",
      license_plate: "SRV-001",
      approval_status: "approved",
    });
    const survey = await insertTracked("surveys", {
      title: "__rel_survey_drv__",
    });
    const response = await insertTracked("survey_responses", {
      survey_id: survey.id,
      ride_id: "test-ride-drv",
      driver_id: driver.id,
    });

    expect(response.driver_id).toBe(driver.id);

    const { data: foundDriver } = await supabase
      .from("Driver")
      .select("id,full_name")
      .eq("id", response.driver_id!)
      .single();
    expect(foundDriver!.full_name).toBe("__rel_drv_survey__");
  });
});

describe("survey_responses ↔ companies (company_id)", () => {
  it("response.company_id references companies.id", async () => {
    const company = await insertTracked("companies", {
      razon_social: "__rel_co_survey__",
    });
    const survey = await insertTracked("surveys", {
      title: "__rel_survey_co__",
    });
    const response = await insertTracked("survey_responses", {
      survey_id: survey.id,
      ride_id: "test-ride-co",
      company_id: company.id,
    });

    expect(response.company_id).toBe(company.id);

    const { data: foundCo } = await supabase
      .from("companies")
      .select("id,razon_social")
      .eq("id", response.company_id!)
      .single();
    expect(foundCo!.razon_social).toBe("__rel_co_survey__");
  });
});

describe("sos_alerts ↔ Driver (driver_id)", () => {
  it("sos.driver_id references Driver.id", async () => {
    const driver = await insertTracked("Driver", {
      full_name: "__rel_drv_sos__",
      license_plate: "SOS-001",
      approval_status: "approved",
    });
    const alert = await insertTracked("sos_alerts", {
      driver_id: driver.id,
      driver_name: driver.full_name,
      status: "active",
    });

    expect(alert.driver_id).toBe(driver.id);

    const { data: foundDriver } = await supabase
      .from("Driver")
      .select("id,full_name")
      .eq("id", alert.driver_id!)
      .single();
    expect(foundDriver!.full_name).toBe("__rel_drv_sos__");

    // Reverse: find SOS alerts for driver
    const { data: alerts } = await supabase
      .from("sos_alerts")
      .select("id,status")
      .eq("driver_id", driver.id);
    expect(alerts!.length).toBeGreaterThanOrEqual(1);
  });
});

describe("support_tickets ↔ Driver (driver_id)", () => {
  it("ticket.driver_id references Driver.id", async () => {
    const driver = await insertTracked("Driver", {
      full_name: "__rel_drv_ticket__",
      license_plate: "TKT-001",
      approval_status: "approved",
    });
    const ticket = await insertTracked("support_tickets", {
      subject: "__rel_ticket__",
      description: "test",
      driver_id: driver.id,
    });

    expect(ticket.driver_id).toBe(driver.id);

    const { data: foundDriver } = await supabase
      .from("Driver")
      .select("id,full_name")
      .eq("id", ticket.driver_id!)
      .single();
    expect(foundDriver!.full_name).toBe("__rel_drv_ticket__");
  });
});

describe("support_tickets ↔ ride_requests (ride_id)", () => {
  it("ticket.ride_id references ride_requests.id", async () => {
    const ride = await insertTracked("ride_requests", {
      passenger_name: "__rel_pax_ticket__",
      pickup_address: "Origin H",
    });
    const ticket = await insertTracked("support_tickets", {
      subject: "__rel_ticket_ride__",
      description: "test",
      ride_id: ride.id,
    });

    expect(ticket.ride_id).toBe(ride.id);

    const { data: foundRide } = await supabase
      .from("ride_requests")
      .select("id,passenger_name")
      .eq("id", ticket.ride_id!)
      .single();
    expect(foundRide!.passenger_name).toBe("__rel_pax_ticket__");
  });
});

describe("companies self-referential (parent_company_id)", () => {
  it("company.parent_company_id references companies.id", async () => {
    const parent = await insertTracked("companies", {
      razon_social: "__rel_parent_co__",
    });
    const child = await insertTracked("companies", {
      razon_social: "__rel_child_co__",
      parent_company_id: parent.id,
    });

    expect(child.parent_company_id).toBe(parent.id);

    const { data: foundParent } = await supabase
      .from("companies")
      .select("id,razon_social")
      .eq("id", child.parent_company_id!)
      .single();
    expect(foundParent!.razon_social).toBe("__rel_parent_co__");

    // Reverse: find children of parent
    const { data: children } = await supabase
      .from("companies")
      .select("id,razon_social")
      .eq("parent_company_id", parent.id);
    expect(children!.length).toBeGreaterThanOrEqual(1);
    expect(children!.some((c: any) => c.id === child.id)).toBe(true);
  });
});

describe("companies ↔ surveys (survey_id)", () => {
  it("company.survey_id references surveys.id", async () => {
    const survey = await insertTracked("surveys", {
      title: "__rel_survey_co2__",
    });
    const company = await insertTracked("companies", {
      razon_social: "__rel_co_survey2__",
      survey_id: survey.id,
    });

    expect(company.survey_id).toBe(survey.id);

    const { data: foundSurvey } = await supabase
      .from("surveys")
      .select("id,title")
      .eq("id", company.survey_id!)
      .single();
    expect(foundSurvey!.title).toBe("__rel_survey_co2__");
  });
});

// NOTE: cancellation_policies has no FK columns (service_type_id, city_id)
// Verified against live schema — only: id, name, description, fee_type, fee_amount,
// free_cancellation_minutes, applies_to_status, is_active

// ═══════════════════════════════════════════════════════════════════════════
// Multi-hop Relationship Tests (transitive)
// ═══════════════════════════════════════════════════════════════════════════

describe("Multi-hop: city → driver → ride_request → chat_message", () => {
  it("full chain traversal", async () => {
    const city = await insertTracked("cities", {
      name: "__chain_city__",
      country: "MX",
      state: "CDMX",
    });
    const driver = await insertTracked("Driver", {
      full_name: "__chain_driver__",
      license_plate: "CHN-001",
      approval_status: "approved",
      city_id: city.id,
    });
    const ride = await insertTracked("ride_requests", {
      passenger_name: "__chain_pax__",
      pickup_address: "Chain Origin",
      driver_id: driver.id,
      driver_name: driver.full_name,
      city_id: city.id,
    });
    const msg = await insertTracked("chat_messages", {
      ride_id: ride.id,
      message: "__chain_msg__",
      sender_role: "driver",
    });

    // Traverse: message → ride → driver → city
    const { data: foundRide } = await supabase
      .from("ride_requests")
      .select("id,driver_id,city_id")
      .eq("id", msg.ride_id)
      .single();
    expect(foundRide!.driver_id).toBe(driver.id);

    const { data: foundDriver } = await supabase
      .from("Driver")
      .select("id,city_id")
      .eq("id", foundRide!.driver_id!)
      .single();
    expect(foundDriver!.city_id).toBe(city.id);

    const { data: foundCity } = await supabase
      .from("cities")
      .select("id,name")
      .eq("id", foundDriver!.city_id!)
      .single();
    expect(foundCity!.name).toBe("__chain_city__");
  });
});

describe("Multi-hop: company → invoice + ride_request → survey_response", () => {
  it("full chain traversal", async () => {
    const company = await insertTracked("companies", {
      razon_social: "__chain_company__",
    });
    const invoice = await insertTracked("invoices", {
      company_id: company.id,
      company_name: "__chain_company__",
    });
    const ride = await insertTracked("ride_requests", {
      passenger_name: "__chain_pax2__",
      pickup_address: "Chain Origin 2",
      company_id: company.id,
      company_name: "__chain_company__",
    });
    const survey = await insertTracked("surveys", {
      title: "__chain_survey__",
    });
    const response = await insertTracked("survey_responses", {
      survey_id: survey.id,
      ride_id: ride.id,
      company_id: company.id,
    });

    // Verify all point to same company
    expect(invoice.company_id).toBe(company.id);
    expect(ride.company_id).toBe(company.id);
    expect(response.company_id).toBe(company.id);

    // From survey_response → ride → company matches invoice → company
    const { data: foundRide } = await supabase
      .from("ride_requests")
      .select("company_id")
      .eq("id", response.ride_id)
      .single();
    expect(foundRide!.company_id).toBe(invoice.company_id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Null FK Tests (optional FKs should work as null)
// ═══════════════════════════════════════════════════════════════════════════

describe("Nullable FK columns accept null", () => {
  it("ride_request with all optional FKs null", async () => {
    const ride = await insertTracked("ride_requests", {
      passenger_name: "__null_fk_pax__",
      pickup_address: "Null Test",
      driver_id: null,
      company_id: null,
      service_type_id: null,
      geo_zone_id: null,
      city_id: null,
    });

    expect(ride.driver_id).toBeNull();
    expect(ride.company_id).toBeNull();
    expect(ride.service_type_id).toBeNull();
    expect(ride.geo_zone_id).toBeNull();
    expect(ride.city_id).toBeNull();
  });

  it("Driver with null city_id", async () => {
    const driver = await insertTracked("Driver", {
      full_name: "__null_city_drv__",
      license_plate: "NUL-001",
      approval_status: "pending",
      city_id: null,
    });
    expect(driver.city_id).toBeNull();
  });

  it("support_ticket with null driver_id and ride_id", async () => {
    const ticket = await insertTracked("support_tickets", {
      subject: "__null_fk_ticket__",
      description: "test null fks",
      driver_id: null,
      ride_id: null,
    });
    expect(ticket.driver_id).toBeNull();
    expect(ticket.ride_id).toBeNull();
  });

  it("sos_alert requires non-null driver_id (NOT NULL constraint)", async () => {
    // sos_alerts.driver_id is NOT NULL per live schema
    const { error } = await supabase
      .from("sos_alerts")
      .insert({ driver_name: "__null_drv_sos__", status: "active", driver_id: null as any })
      .select()
      .single();
    expect(error).toBeTruthy();
    expect(error!.code).toBe("23502"); // not-null violation
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// JSON Array FK Tests (driver_ids, ride_ids, etc.)
// ═══════════════════════════════════════════════════════════════════════════

describe("JSON array FK fields", () => {
  it("driver_notificaciones.driver_ids stores array of driver IDs", async () => {
    const d1 = await insertTracked("Driver", {
      full_name: "__notif_d1__",
      license_plate: "NTF-001",
      approval_status: "approved",
    });
    const d2 = await insertTracked("Driver", {
      full_name: "__notif_d2__",
      license_plate: "NTF-002",
      approval_status: "approved",
    });
    const notif = await insertTracked("driver_notificaciones", {
      title: "__rel_notif_multi__",
      body: "Test multi-driver",
      driver_ids: [d1.id, d2.id],
      sent_by: "test",
    });

    const ids = notif.driver_ids as string[];
    expect(ids).toContain(d1.id);
    expect(ids).toContain(d2.id);

    // Verify each driver exists
    for (const did of ids) {
      const { data } = await supabase.from("Driver").select("id").eq("id", did).single();
      expect(data).toBeTruthy();
    }
  });

  it("invoices.ride_ids stores array of ride IDs", async () => {
    const r1 = await insertTracked("ride_requests", {
      passenger_name: "__inv_r1__",
      pickup_address: "R1",
    });
    const r2 = await insertTracked("ride_requests", {
      passenger_name: "__inv_r2__",
      pickup_address: "R2",
    });
    const company = await insertTracked("companies", {
      razon_social: "__inv_co_rides__",
    });
    const invoice = await insertTracked("invoices", {
      company_id: company.id,
      company_name: "__inv_co_rides__",
      ride_ids: [r1.id, r2.id],
    });

    const ids = invoice.ride_ids as string[];
    expect(ids).toContain(r1.id);
    expect(ids).toContain(r2.id);
  });
});
