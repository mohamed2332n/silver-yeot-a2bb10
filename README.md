# Gym Coaching PWA

تطبيق ويب (PWA) لتدريب الجيم: داشبورد للمدرب لإدارة مكتبة التمارين والبرامج والمتدربين، وواجهة للمتدرب لتسجيل الأوزان والعدّات والراحة والحالة ومتابعة التقدّم. يدعم العربية/الإنجليزية ودارك/لايت مود مريح للعين، والباك إند على Supabase.

A smart gym coaching PWA: a coach dashboard to manage an exercise library, training programs and trainees; and a trainee app to log weights, reps, rest and condition and track progress. Arabic/English, eye-comfortable dark/light themes, Supabase backend.

## المميزات / Features

- مصادقة بالإيميل وكلمة المرور مع دورين: مدرب / متدرب.
- ربط المتدرب بالمدرب عبر كود انضمام (Join Code).
- مكتبة تمارين كاملة (عضلة، جهاز، فيديو، صورة، تعليمات، تمارين بديلة).
- بناء برامج تدريبية (أيام + تمارين + أهداف: مجموعات/عدّات/وزن/راحة).
- إسناد البرامج مباشرة للمتدربين.
- تسجيل الجلسة: الوزن، العدّاد، الراحة، الحالة لكل مجموعة + تبديل تمرين بديل عند الألم أو انشغال الجهاز.
- متابعة وزن الجسم.
- تقارير وتقدّم (يومي/أسبوعي/شهري) برسوم بيانية + تنبيهات الألم.
- تخصيص اسم النادي واللوجو من الداشبورد.
- PWA قابل للتثبيت على الموبايل.
- **مساعد AI (OpenRouter):** للمدرب (تحليل أي لاعب + ملفاته) وللمتدرب (بياناته هو فقط) مع دعم vision للصور/PDF.

## التقنيات / Stack

- React + Vite + TypeScript
- Tailwind CSS (design tokens via CSS variables)
- React Router, TanStack Query
- react-i18next (ar/en, RTL/LTR)
- Recharts
- Supabase (Auth, Postgres, RLS, Storage)
- vite-plugin-pwa

## الإعداد / Setup

1. تثبيت الحزم:

```bash
npm install
```

2. أنشئ ملف `.env` (موجود نموذج في `.env.example`):

```
VITE_SUPABASE_URL=https://fhlpkdzotobztindxwpq.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

3. التشغيل:

```bash
npm run dev
```

4. البناء للإنتاج:

```bash
npm run build
npm run preview
```

## إعداد الذكاء الاصطناعي / AI setup

1. من [OpenRouter](https://openrouter.ai/) أنشئ API key.
2. من Supabase Dashboard → **Edge Functions** → **Secrets** أضف:
   - `OPENROUTER_API_KEY` = مفتاحك
   - (اختياري) `OPENROUTER_MODEL` = مثلاً `openai/gpt-4o-mini` (الافتراضي)
3. Edge Function `ai-chat` منشورة على المشروع. بدون المفتاح، واجهة المحادثة تظهر رسالة خطأ واضحة وباقي التطبيق يعمل.

**العزل:** المتدرب يرى ويحلّل بياناته فقط (RLS). المدرب يحلّل لاعبيه فقط عبر `is_coach_of`. المفتاح لا يُرسل للمتصفح أبداً.

## ملاحظات Supabase / Notes

- قاعدة البيانات والـ RLS و buckets التخزين تم إنشاؤها عبر migrations على مشروع `Gym`.
- لتجربة "التسجيل والدخول فورًا" بدون تأكيد بريد: من لوحة Supabase → Authentication → Providers → Email، عطّل "Confirm email". لو فعّال، المستخدم لازم يأكد بريده قبل أول تسجيل دخول.
- يُنصح بتفعيل "Leaked password protection" من Authentication → Policies لمزيد من الأمان.
- buckets التخزين عامة للقراءة (logos / exercise-media / avatars)، والكتابة محصورة في مجلد المستخدم `{uid}/...`.

## بنية المشروع / Structure

```
src/
  components/        مكوّنات مشتركة (Layout, ReportView, icons, ...)
  context/           AuthProvider
  hooks/             react-query data hooks
  i18n/              الترجمات والإعداد
  lib/               supabase client, helpers
  pages/
    coach/           صفحات المدرب
    trainee/         صفحات المتدرب
  theme/             ThemeProvider + tokens
  types/             أنواع قاعدة البيانات
```
