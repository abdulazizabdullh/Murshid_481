/**
 * Direct Profile Update Test
 * 
 * Run this in your browser console (F12 → Console tab) while logged in
 * to test if the database update works directly
 */

(async function testDirectUpdate() {
  console.log("🧪 Testing Direct Profile Update...\n");

  try {
    // Import supabase
    const { supabase } = await import('/src/lib/supabase.ts');
    console.log("✅ Supabase loaded");

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("❌ Not logged in or session expired");
      console.log("Please log in first");
      return;
    }

    console.log("✅ User authenticated:", user.id);
    console.log("Email:", user.email);

    // Test simple update
    console.log("\n📝 Testing update...");
    
    const testData = {
      id: user.id,
      name: "Test User " + new Date().getTime(),
      establishment_name: "Test University " + new Date().getTime()
    };
    
    console.log("Data to update:", testData);
    
    console.log("\n⏳ Sending update request...");
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from("profiles")
      .upsert(testData)
      .select()
      .single();
    
    const endTime = Date.now();
    console.log(`⏱️ Request took ${endTime - startTime}ms`);
    
    if (error) {
      console.error("❌ Update failed!");
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Full error:", error);
      
      if (error.code === '42501') {
        console.log("\n🔧 FIX: RLS policy issue (but you said you disabled RLS?)");
        console.log("Check Supabase → Table Editor → profiles → Enable RLS is OFF");
      } else if (error.code === 'PGRST116') {
        console.log("\n🔧 FIX: No rows returned - profile might not exist");
      } else if (error.message.includes('timeout')) {
        console.log("\n🔧 FIX: Request timed out - check Supabase status");
      } else {
        console.log("\n🔧 Unknown error - see details above");
      }
      
      return;
    }
    
    console.log("✅ Update successful!");
    console.log("Updated data:", data);
    
    // Verify the update
    console.log("\n🔍 Verifying update...");
    const { data: verifyData, error: verifyError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (verifyError) {
      console.error("❌ Verification failed:", verifyError);
      return;
    }
    
    console.log("✅ Verification successful!");
    console.log("Current profile:", verifyData);
    
    console.log("\n" + "=".repeat(60));
    console.log("✅✅✅ DIRECT UPDATE WORKS! ✅✅✅");
    console.log("=".repeat(60));
    console.log("\nThis means:");
    console.log("1. Supabase connection is working");
    console.log("2. Database operations are working");
    console.log("3. The issue is in the React code or state management");
    console.log("\nNext step: Check the React component logs");
    
  } catch (error) {
    console.error("\n💥 Test failed with exception!");
    console.error("Error:", error);
    console.error("Error type:", error.constructor.name);
    console.error("Error stack:", error.stack);
    
    if (error.message.includes("Failed to fetch")) {
      console.log("\n🔧 NETWORK ERROR");
      console.log("- Check your internet connection");
      console.log("- Check Supabase project status");
      console.log("- Check if Supabase URL is correct");
    }
  }
})();

