# ⚠️ IMPORTANT: RUN THIS MIGRATION FIRST!

## Before you can use the new community features, you MUST run the database migration.

### Step-by-Step Instructions:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Murshid project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Copy the Migration File**
   - Open this file: `Murshid-Frontend/supabase_community_features.sql`
   - Select ALL content (Ctrl+A)
   - Copy (Ctrl+C)

4. **Paste and Run**
   - Paste into Supabase SQL Editor (Ctrl+V)
   - Click the **"Run"** button (or press Ctrl+Enter)
   - Wait for "Success. No rows returned" message

5. **Verify Migration**
   Run this query to verify tables were created:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE 'community%';
   ```

   You should see these tables:
   - community_posts (already existed)
   - community_answers (already existed)
   - community_post_likes (NEW)
   - community_answer_likes (NEW)
   - community_comments (NEW)
   - community_comment_likes (NEW)

6. **Start Development Server**
   ```bash
   cd Murshid-Frontend
   npm run dev
   ```

7. **Test Features**
   - Create a post
   - Like the post (heart icon should fill red)
   - Add a comment on an answer
   - Edit your post
   - Accept an answer

---

## What if I get errors?

### Error: "relation already exists"
**Solution**: Some tables already exist. This is OK, the migration will skip them. Continue.

### Error: "permission denied"
**Solution**: Make sure you're logged into the correct Supabase project as owner/admin.

### Error: "syntax error"
**Solution**: Make sure you copied the ENTIRE file, including the first and last lines.

---

## Quick Test

After running migration, test with this query:
```sql
-- This should return 0 (no likes yet)
SELECT COUNT(*) FROM community_post_likes;
```

If no error, you're good to go! ✅

---

## Need the migration file location?

**Full path**: `C:\SWE444-MURSHID-v2\Murshid-Frontend\supabase_community_features.sql`

---

**Once migration is done, see IMPLEMENTATION_COMPLETE.md for full testing guide.**
