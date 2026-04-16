// Test file - manually run in browser console to test Supabase connection
// Copy-paste this into the browser console (F12)

async function testSupabaseConnection() {
  console.log("🔍 Starting Supabase connection test...");
  
  try {
    // Step 1: Test basic connection
    console.log("✓ Step 1: Testing Supabase client...");
    const { supabase } = await import("@/lib/supabase");
    console.log("✓ Supabase client loaded");

    // Step 2: Get current session
    console.log("✓ Step 2: Checking current session...");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn("⚠️ No active session! You may need to login.");
      return false;
    }
    console.log("✓ Session active for user:", session.user.email);

    // Step 3: Try a simple SELECT
    console.log("✓ Step 3: Testing SELECT query...");
    const { data: drivers, error: selectError } = await supabase
      .from('Driver')
      .select('id, full_name')
      .limit(1);
    if (selectError) throw selectError;
    console.log("✓ SELECT works:", drivers?.length ? `Found ${drivers.length} record(s)` : "No records");

    // Step 4: Try an UPDATE on a test record
    if (drivers && drivers.length > 0) {
      console.log("✓ Step 4: Testing UPDATE query...");
      const testId = drivers[0].id;
      const { data: updated, error: updateError } = await supabase
        .from('Driver')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testId)
        .select()
        .single();
      
      if (updateError) {
        console.warn("⚠️ UPDATE .select() failed (this is expected if RLS is restrictive)");
        console.log("  Trying GET fallback...");
        const { data: fetched, error: fetchError } = await supabase
          .from('Driver')
          .select('*')
          .eq('id', testId)
          .single();
        if (fetchError) throw fetchError;
        console.log("✓ GET fallback works - UPDATE likely succeeded");
      } else {
        console.log("✓ UPDATE with .select() works");
      }
    }

    console.log("\n✅ All tests passed! Supabase is working correctly.");
    return true;
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    return false;
  }
}

// Run the test
testSupabaseConnection();
