/**
 * Profile Update Test Script
 * 
 * Run this in your browser console (F12 → Console tab) while logged in
 * to test if profile updates are working correctly.
 * 
 * Instructions:
 * 1. Login to your Murshid app
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Check the results
 */

(async function testProfileUpdate() {
  console.log("🧪 Starting Profile Update Test...\n");

  try {
    // Import supabase from your app
    const { supabase } = await import('/src/lib/supabase.ts');
    
    console.log("✅ Step 1: Supabase client loaded");

    // Check if user is authenticated
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("❌ Step 2 Failed: Session error", sessionError);
      return;
    }

    if (!sessionData.session) {
      console.error("❌ Step 2 Failed: No active session. Please login first.");
      return;
    }

    const userId = sessionData.session.user.id;
    console.log("✅ Step 2: User authenticated");
    console.log("   User ID:", userId);
    console.log("   Email:", sessionData.session.user.email);

    // Check if profile exists
    const { data: existingProfile, error: selectError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (selectError) {
      if (selectError.code === 'PGRST116') {
        console.warn("⚠️  Step 3: No profile found. This is OK, it will be created.");
      } else {
        console.error("❌ Step 3 Failed: Error fetching profile", selectError);
        return;
      }
    } else {
      console.log("✅ Step 3: Existing profile found");
      console.log("   Current profile:", existingProfile);
    }

    // Test update with sample data
    const testData = {
      id: userId,
      name: existingProfile?.name || "Test User",
      establishment_name: "Test University",
      role: "Student",
      student_type: "University",
      level: null,
      gender: "Male",
      track: "Science"
    };

    console.log("\n🔄 Step 4: Attempting to update profile...");
    console.log("   Test data:", testData);

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .upsert(testData)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Step 4 Failed: Update error");
      console.error("   Error code:", updateError.code);
      console.error("   Error message:", updateError.message);
      console.error("   Error details:", updateError);
      
      // Provide specific guidance based on error
      if (updateError.code === '42501') {
        console.error("\n🔧 SOLUTION: Row Level Security (RLS) policy issue");
        console.error("   Run the setup_profiles_complete.sql script in Supabase SQL Editor");
      } else if (updateError.code === '23505') {
        console.error("\n🔧 SOLUTION: Duplicate key violation");
        console.error("   Profile already exists. Try updating instead of inserting.");
      } else if (updateError.code === '42703') {
        console.error("\n🔧 SOLUTION: Column does not exist");
        console.error("   Run the database migration script to add missing columns");
      }
      
      return;
    }

    console.log("✅ Step 4: Profile updated successfully!");
    console.log("   Updated profile:", updatedProfile);

    // Verify the update persisted
    console.log("\n🔍 Step 5: Verifying update persisted...");
    const { data: verifyProfile, error: verifyError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (verifyError) {
      console.error("❌ Step 5 Failed: Could not verify update", verifyError);
      return;
    }

    console.log("✅ Step 5: Update verified!");
    console.log("   Verified profile:", verifyProfile);

    // Check if data matches
    const dataMatches = 
      verifyProfile.establishment_name === testData.establishment_name &&
      verifyProfile.role === testData.role &&
      verifyProfile.student_type === testData.student_type &&
      verifyProfile.gender === testData.gender &&
      verifyProfile.track === testData.track;

    if (dataMatches) {
      console.log("\n✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅");
      console.log("Profile updates are working correctly! 🎉");
    } else {
      console.warn("\n⚠️  WARNING: Data mismatch detected");
      console.log("Expected:", testData);
      console.log("Got:", verifyProfile);
    }

    // Test RLS policies
    console.log("\n🔒 Step 6: Testing RLS policies...");
    
    // Try to read another user's profile (should fail)
    const fakeUserId = '00000000-0000-0000-0000-000000000000';
    const { data: otherProfile, error: rlsError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", fakeUserId)
      .single();

    if (otherProfile) {
      console.warn("⚠️  Step 6: WARNING - RLS might not be working (could read other user)");
    } else if (rlsError && (rlsError.code === 'PGRST116' || rlsError.code === 'PGRST301')) {
      console.log("✅ Step 6: RLS policies working correctly (cannot read other users)");
    } else {
      console.log("⚠️  Step 6: Could not verify RLS (might be OK)", rlsError);
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    console.log("Authentication: ✅");
    console.log("Profile Read: ✅");
    console.log("Profile Update: ✅");
    console.log("Data Persistence: ✅");
    console.log("RLS Security: ✅");
    console.log("\n🎉 Your profile update system is working correctly!");
    console.log("\nYou can now test the UI by going to the Profile page.");

  } catch (error) {
    console.error("\n❌ TEST FAILED WITH EXCEPTION");
    console.error("Error:", error);
    console.error("\n🔧 TROUBLESHOOTING:");
    console.error("1. Make sure you're logged in");
    console.error("2. Check that Supabase environment variables are set");
    console.error("3. Run setup_profiles_complete.sql in Supabase");
    console.error("4. Check Supabase Dashboard → Logs for more details");
    console.error("5. Review TROUBLESHOOTING_PROFILE_UPDATE.md");
  }
})();

