# Community Content Reporting System - Implementation Complete

## Overview
A complete reporting system has been implemented to allow users to report inappropriate content (posts, answers, comments) in the community. Admins can review reports and take appropriate actions.

---

## ✅ Implementation Summary

### 1. Database Schema
**File:** `Murshid-Frontend/supabase_community_reports.sql`

**Table:** `community_reports`
- Fields: id, reporter_id, reporter_name, reported_content_type, reported_content_id, reason, description, status, reviewed_by, reviewed_at, resolution_notes, created_at, updated_at
- Constraints: Check constraints for content types, reasons, and statuses
- Indexes: On status, content type/ID, reporter, and creation date
- Unique constraint: Prevents duplicate pending reports from same user on same content
- RLS Policies: Users can create/view own reports; Admins can view/update all reports

### 2. TypeScript Types
**File:** `Murshid-Frontend/src/types/community.ts`

Added interfaces:
- `Report` - Main report interface
- `CreateReportRequest` - For submitting new reports
- `UpdateReportRequest` - For admin updates
- `ReportWithContent` - Extended report with content details
- Type aliases: `ReportReason`, `ReportStatus`, `ReportContentType`

### 3. API Functions
**File:** `Murshid-Frontend/src/lib/communityApi.ts`

Added functions:
- `createReport()` - Submit a new report
- `getReports()` - Admin: Fetch all reports with optional filtering
- `getReportById()` - Fetch single report
- `updateReportStatus()` - Admin: Update report status
- `checkExistingReport()` - Check if user already reported content
- `getReportWithContent()` - Fetch report with full content details
- `deleteReport()` - Admin: Delete a report

### 4. UI Components

**A. ReportDialog Component**
**File:** `Murshid-Frontend/src/components/community/ReportDialog.tsx`

- Modal dialog for submitting reports
- 4 predefined reasons with bilingual labels
- Optional description textarea (500 char limit)
- Prevents duplicate reports
- Shows success/error toast messages
- Fully internationalized (English/Arabic)

**B. ReportButton Component**
**File:** `Murshid-Frontend/src/components/community/ReportButton.tsx`

- Checks if content already reported (disables if true)
- Two rendering modes: standalone button or menu item
- Opens ReportDialog on click
- Shows "Reported" if already reported
- Only visible to logged-in users (not content author)

### 5. User-Facing Integration

**A. PostDetail Page**
**File:** `Murshid-Frontend/src/pages/PostDetail.tsx`

**For Posts:**
- Report button appears next to Edit button (for non-authors)
- Passes post title to dialog for context

**For Answers:**
- Report option in dropdown menu (if user can modify content)
- Standalone report button if user cannot modify
- Hidden for answer authors

**For Comments:**
- Would be integrated via CommentSection component (future enhancement)

### 6. Admin Interface

**A. AdminCommunity Page**
**File:** `Murshid-Frontend/src/pages/AdminCommunity.tsx`

**New Reports Tab:**
- Filter dropdown: All, Pending, Reviewed, Dismissed, Actioned
- Shows pending reports count badge
- Each report card displays:
  - Report reason and status badges
  - Reporter name and timestamp
  - Optional description
  - Reported content preview (first 200 chars)
  - Content author information
  - Action buttons (for pending reports)

**Admin Actions:**
- **View Content** - Navigate to the reported content
- **Dismiss** - Mark as reviewed, no action needed
- **Delete Content** - Remove the reported content + mark as actioned
- **Suspend User** - Indefinitely suspend the content author + mark as actioned
- Optional notes field for all actions

**Stats Card:**
- Added 4th stats card showing pending reports count
- Highlighted in orange if there are pending reports

**Visual Indicators:**
- Pending reports have orange border
- Badge notification on Reports tab showing pending count
- Color-coded status badges

---

## Internationalization (i18n)

All text is fully bilingual (English/Arabic):

**Report Reasons:**
- Spam or advertising / رسائل غير مرغوب فيها أو إعلانات
- Harassment or hate speech / تحرش أو خطاب كراهية
- Inappropriate content / محتوى غير لائق
- Misinformation / معلومات مضللة

**Report Statuses:**
- Pending / قيد الانتظار
- Reviewed / تمت المراجعة
- Dismissed / مرفوضة
- Actioned / تم اتخاذ إجراء

**All UI elements** (buttons, labels, dialogs, toast messages) support RTL for Arabic.

---

## Security Features

1. **Duplicate Prevention:** Unique index prevents users from spamming reports on same content
2. **RLS Policies:** Enforced at database level - users can only see their own reports
3. **Admin-Only Actions:** Only admins can view all reports and update statuses
4. **Audit Trail:** Tracks who reviewed reports, when, and resolution notes
5. **Validation:** Backend validates report reasons match allowed enum values

---

## Workflow

### User Reporting Flow:
1. User clicks "Report" button on post/answer/comment
2. Dialog opens with reason selection + optional description
3. On submit, report is created (or error if duplicate)
4. Success toast confirms submission
5. Button changes to "Reported" and disables

### Admin Review Flow:
1. Admin navigates to Admin Community → Reports tab
2. Sees pending reports count badge
3. Reviews report details and reported content
4. Takes action:
   - **Dismiss:** Report closed, no action on content
   - **Delete Content:** Content removed, report marked as actioned
   - **Suspend User:** User suspended indefinitely, report marked as actioned
5. Can add optional notes for record-keeping
6. Report status updates and disappears from pending filter

---

## Files Created/Modified

### New Files:
1. `Murshid-Frontend/supabase_community_reports.sql`
2. `Murshid-Frontend/src/components/community/ReportDialog.tsx`
3. `Murshid-Frontend/src/components/community/ReportButton.tsx`
4. `REPORTING_SYSTEM_IMPLEMENTATION.md` (this file)

### Modified Files:
1. `Murshid-Frontend/src/types/community.ts` - Added Report types
2. `Murshid-Frontend/src/lib/communityApi.ts` - Added 7 report API functions
3. `Murshid-Frontend/src/pages/PostDetail.tsx` - Integrated report buttons for posts & answers
4. `Murshid-Frontend/src/pages/AdminCommunity.tsx` - Added Reports tab with full review UI

---

## Next Steps to Complete

### 1. Database Migration (REQUIRED)
**You must run the SQL migration before testing:**

```bash
# Option A: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy contents of Murshid-Frontend/supabase_community_reports.sql
4. Execute the SQL

# Option B: Via Supabase CLI (if configured)
supabase db push
```

### 2. Testing Checklist

**As Regular User:**
- [ ] Report a post (check all 4 reason options)
- [ ] Try to report same post again (should show "already reported")
- [ ] Add optional description when reporting
- [ ] Report an answer
- [ ] Verify "Report" button only shows on content you didn't create
- [ ] Test in both English and Arabic

**As Admin:**
- [ ] View Reports tab in Admin Community
- [ ] See pending reports count badge
- [ ] Filter reports by status (All, Pending, Dismissed, Actioned)
- [ ] Dismiss a report (add notes)
- [ ] Delete reported content (verify content removed from tabs)
- [ ] Suspend a user via report (check user profile is suspended)
- [ ] View resolved reports in different status filters
- [ ] Test all actions in both languages

**Edge Cases:**
- [ ] Report content that gets deleted by author (content preview should show "not available")
- [ ] Multiple users reporting same content (should create separate reports)
- [ ] Suspended user cannot log in
- [ ] Report button hidden for admins on any content

### 3. Optional Enhancements

**Future improvements could include:**
- Add report button to comments (integrate into CommentSection component)
- Email notifications to admins when new reports arrive
- Report analytics dashboard (most common reasons, users with most reports, etc.)
- Temporary suspensions with auto-unsuspend after date
- Appeal system for suspended users
- Batch actions for multiple reports
- Report history view for content (show all reports on a piece of content)

---

## Troubleshooting

**Issue:** "Permission denied" when submitting report
- **Solution:** Ensure RLS policies were created correctly in migration

**Issue:** Reports not showing in Admin tab
- **Solution:** Verify user has `is_admin: true` in profiles table

**Issue:** Cannot delete reported content
- **Solution:** Check RLS policies allow admins to delete from community tables

**Issue:** "Already reported" when it's a different user
- **Solution:** Check unique index was created correctly with WHERE clause

**Issue:** Suspend not working
- **Solution:** Verify profiles table has is_suspended, suspended_reason, suspended_until columns

---

## Summary

The reporting system is **fully implemented** and ready for testing after running the database migration. It provides:

✅ Complete user reporting workflow with duplicate prevention
✅ Comprehensive admin review interface with multiple action types
✅ Full bilingual support (English/Arabic)
✅ Security via RLS policies
✅ Audit trail for all actions
✅ Visual indicators for pending reports

The system integrates seamlessly with the existing community feature and follows the same architectural patterns used throughout the application.
