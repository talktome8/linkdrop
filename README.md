# Linkdrop 💧

קיצור קישורים עם אנליטיקס אישי — React + Supabase

---

## הרצה מהירה ב-VS Code

### 1. התקנת תלויות

```bash
npm install
```

### 2. הגדרת Supabase

1. צרו חשבון חינמי על https://supabase.com
2. לחצו **New Project**
3. בתפריט השמאלי: **SQL Editor** → הדביקו את כל התוכן מקובץ `supabase/schema.sql` → הריצו
4. בתפריט: **Project Settings → API**
   - העתיקו את **Project URL** ואת **anon / public key**

### 3. קובץ סביבה

```bash
cp .env.example .env
```

ערכו את `.env`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_APP_URL=http://localhost:5173
```

### 4. הגדרת Authentication ב-Supabase

**Authentication → Providers:**
- Email: הפעילו (Confirm email — לפי הצורך)
- Google: הפעילו (דרשים Client ID + Secret מ-Google Cloud Console)
- GitHub: הפעילו (דרשים OAuth App מ-GitHub)

**Authentication → URL Configuration:**
- Site URL: `http://localhost:5173`
- Redirect URLs: `http://localhost:5173/dashboard`

### 5. הרצה

```bash
npm run dev
```

פתחו: http://localhost:5173

---

## מבנה הפרויקט

```
src/
├── lib/supabase.js          ← חיבור Supabase
├── hooks/useAuth.js         ← ניהול session
├── pages/
│   ├── Landing.jsx          ← דף בית + קיצור ציבורי
│   ├── Auth.jsx             ← כניסה / הרשמה (4 שיטות)
│   ├── Dashboard.jsx        ← דשבורד אישי
│   └── Redirect.jsx         ← /:code → redirect + מדידת קליק
└── components/
    ├── QRModal.jsx          ← הורדת QR Code
    └── WAModal.jsx          ← יצירת קישור WhatsApp
```

---

## Deploy לאינטרנט (Vercel — חינם)

```bash
npm i -g vercel
vercel
```

הוסיפו את משתני הסביבה דרך `vercel env add`  
עדכנו `VITE_APP_URL` ל-URL האמיתי של האתר ב-Supabase גם כן.

---

## אבטחה — Row Level Security

כל משתמש רואה **רק את הקישורים שלו**. זה מובנה ב-Supabase RLS (ראו `schema.sql`).  
אין זליגת מידע בין משתמשים — הפוליסות אוכפות את זה ברמת מסד הנתונים.

---

## רישיון

MIT — שימוש חופשי לחלוטין, כולל תיק עבודות ושימוש מסחרי.
