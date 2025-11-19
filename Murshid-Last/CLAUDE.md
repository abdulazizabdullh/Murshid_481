# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Murshid** is an educational guidance platform with a React/Vite frontend and Spring Boot backend. The frontend provides:
- User authentication via Supabase (email/password)
- Role-based access: Student, Specialist, Admin
- Career/major discovery and assessment features
- University and major catalog browsing
- Bookmarks and profile management
- Admin dashboard for managing universities and majors

## Frontend Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS + custom UI components (Radix UI)
- **Auth**: Supabase (Email/Password)
- **Routing**: React Router v6
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner (toast)
- **Internationalization**: Custom I18nContext (English/Arabic support)
- **Theme**: Dark/Light mode support via ThemeContext

## Getting Started

### Prerequisites
- Node.js 18+ with npm
- Supabase project with Email/Password auth enabled
- Backend running at `VITE_BACKEND_URL`

### Setup

```bash
cd Murshid-Frontend
npm install
cp env.example .env
npm run dev
```

### Environment Variables

Create a `.env` file with:
```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_BACKEND_URL=http://localhost:8081
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (Vite on port 8080) |
| `npm run build` | Production build (output to `dist/`) |
| `npm run build:dev` | Development mode build (with sourcemaps disabled) |
| `npm run lint` | Run ESLint checks |
| `npm run preview` | Preview production build locally |
| `npm run backend` | Start Spring Boot backend |

## Project Structure

```
Murshid-Frontend/src/
├── pages/           # Route pages (Login, Signup, Profile, AdminDashboard, etc.)
├── components/      # Reusable React components
│   ├── ui/         # Radix UI wrapper components (Button, Card, Select, etc.)
│   ├── ProtectedRoute.tsx
│   └── [feature-specific components]
├── contexts/        # Global state
│   ├── AuthContext.tsx    # User auth & profile state
│   ├── ThemeContext.tsx   # Dark/light mode
│   └── I18nContext.tsx    # Internationalization (en/ar)
├── lib/            # Utilities & API helpers
│   ├── api.ts      # apiFetch() - authenticated HTTP wrapper
│   ├── supabase.ts # Supabase client init
│   ├── universitiesApi.ts
│   ├── majorsApi.ts
│   ├── bookmarksApi.ts
│   └── utils.ts
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
└── App.tsx         # Main router setup
```

## Key Architectural Patterns

### Authentication Flow
- **AuthContext** (`src/contexts/AuthContext.tsx`) manages user state
- Uses `useAuth()` hook to access user data and auth functions
- Supabase email/password auth with profile augmentation from `profiles` table
- **Important**: Suspended users are redirected to `/suspended` page
- User data extended with profile fields: `name`, `establishment_name`, `level`, `gender`, `role`, `student_type`, `track`, `is_admin`, `avatar_url`, `is_suspended`

### Protected Routes
- `ProtectedRoute` component wraps pages requiring authentication
- Example: `<ProtectedRoute><Profile /></ProtectedRoute>`
- Checks user auth state via `useAuth()` hook

### API Communication
- **apiFetch()** in `src/lib/api.ts` is the universal HTTP client
- Automatically injects Supabase bearer token for authenticated requests
- Usage: `const data = await apiFetch<DataType>('/endpoint', { method: 'POST', body: JSON.stringify(...) })`
- Base URL from `VITE_BACKEND_URL` environment variable

### Form Handling
- React Hook Form + Zod validation schema pattern
- Example in `Login.tsx`, `Signup.tsx`, profile edit forms
- Schemas defined with `useMemo()` to respect language changes for i18n messages

### Internationalization
- **I18nContext** provides `t()` function for translations
- Supports English (`en`) and Arabic (`ar`)
- Language affects layout direction (`dir={language === 'ar' ? 'rtl' : 'ltr'}`)
- Icons/spacing adjusted for RTL: `language === "ar" ? "ml-2 rotate-180" : "mr-2"`

### Styling
- Tailwind CSS with custom Shadcn/ui components
- Dark mode: Use `dark:` prefix for dark theme styles
- Custom CSS variables in Tailwind config for consistent theming
- Component library in `src/components/ui/` (auto-generated from Shadcn/ui)

## Development Guidelines

### Adding a New Page
1. Create file in `src/pages/YourPage.tsx`
2. Add route in `App.tsx` `<Routes>`
3. Use `useAuth()` if auth required, wrap with `<ProtectedRoute>` if needed
4. Import and use i18n with `const { t, language } = useI18n()`

### Adding Authentication to a Page
```typescript
import { useAuth } from '@/contexts/AuthContext';

const YourPage = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  // Your page content
};
```

### Making API Calls
```typescript
import { apiFetch } from '@/lib/api';

const data = await apiFetch<ResponseType>('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' })
});
```

### Using Forms with Validation
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

### Adding Translations
- Edit translation files (location: check I18nContext for structure)
- Use `t('namespace.key')` in components
- Wrap dynamic i18n-affected styles in `useMemo()` with `language` dependency

## Special Pages & Features

### Admin Dashboard (`/admin`)
- Only accessible to users with `is_admin: true`
- Manage universities, majors, and university-major relationships
- Pages: `AdminDashboard.tsx`, `AdminUniversities.tsx`, `AdminMajors.tsx`, `AdminUniversityMajors.tsx`

### Specialist Role
- Requires proof file upload during signup
- Must select university from list
- Has different level/track options than students
- Specialist data stored in `specialist_verification` table

### Suspension System
- Suspended users redirected to `/suspended` page (cannot access other routes)
- Admin can suspend users with reason and end date
- Fields: `is_suspended`, `suspended_reason`, `suspended_until`

### Signup Flow
- Role selection: Student or Specialist (affects form fields shown)
- Students: Choose student_type (High School/University) → conditional fields
- Specialists: Upload proof file + select university
- University selection triggers `establishment_name` auto-fill from selected university

## Database Schema (Supabase)

### profiles table
```sql
id (uuid, pk, ref auth.users.id)
name, establishment_name, university_id, level, gender
role, student_type, track
is_admin, avatar_url
is_suspended, suspended_reason, suspended_until
```

### specialist_verification table
```sql
id, user_id, proof_file_url, verification_status, created_at
```

## Debugging Tips

- **Auth issues**: Check Supabase project URL and anon key in `.env`
- **Backend calls fail**: Ensure backend is running and `VITE_BACKEND_URL` is correct
- **Type errors**: Check `src/types/database.ts` for correct shape of data
- **Build fails**: Run `npm run build` to see full error (check chunks are not >500kB)
- **i18n not updating**: Ensure component using `useI18n()` and `language` in dependencies
- **RLS errors**: Check Supabase Row Level Security policies on `profiles` table

## Build & Deployment

- **Development build**: `npm run build:dev`
- **Production build**: `npm run build` (minified, no sourcemaps)
- **Vercel**: Use `vercel.json` config (already set up)
  - Build command: `cd Murshid-Frontend && npm run build`
  - Output: `Murshid-Frontend/dist`

## Known Issues & Considerations

1. **Package-lock.json changes**: Build process may modify lock file; commit if intentional
2. **Chunk size warning**: Build shows warning for chunks >500kB; configure in `vite.config.ts` if needed
3. **Profile fetch timeout**: AuthContext has 5-second timeout for profile data to prevent hanging
4. **CORS**: Ensure backend is configured to accept requests from frontend domain
5. **Specialist proof file**: Only images accepted; stored in Supabase storage
