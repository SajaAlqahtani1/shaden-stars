# نجوم شادن · Shaden Stars

## English

Shaden Stars is a small Arabic (RTL) web app that helps parents encourage their children with stars.

- **Guardians** sign in, add their children, and give stars for daily tasks and the five prayers.
- **Rewards** are set by the guardian. When a child collects enough stars, the reward is reached and any extra stars carry over to the next one.
- **The child's view** (`/view/:childId`) is a read-only page made for the child's iPad. It shows today's stars, the path to the next reward, and a celebration screen when a reward is reached. It can be added to the iPad home screen.
- Girls and boys get their own theme and the correct Arabic gender forms.

**Built with:** React, Vite, React Router, and Firebase (Authentication and Firestore).

### Run locally

1. `npm install`
2. Create `.env.local` with your Firebase web app settings:
   ```
   VITE_FIREBASE_API_KEY=
   VITE_FIREBASE_AUTH_DOMAIN=
   VITE_FIREBASE_PROJECT_ID=
   VITE_FIREBASE_STORAGE_BUCKET=
   VITE_FIREBASE_MESSAGING_SENDER_ID=
   VITE_FIREBASE_APP_ID=
   ```
3. `npm run dev`

Other commands: `npm run lint`, `npm run build`.

### Deploy (Vercel)

1. Add the six `VITE_FIREBASE_*` variables in Vercel → Settings → Environment Variables, then redeploy.
2. `vercel.json` already sends every path to `index.html`, so links like `/view/:childId` work.
3. In Firebase → Authentication → Settings → Authorized domains, add your Vercel domain.
4. Paste `firestore.rules` into Firebase → Firestore → Rules and publish.

### Data

`children/{childId}` holds the child and their star counts, with three subcollections: `tasks`, `rewards`, and `days/{YYYY-MM-DD}`. A day starts at 3:00 AM, so anything recorded before that counts for the previous day.

---

## العربية

نجوم شادن تطبيق ويب عربي بسيط يساعد الأهل على تشجيع أطفالهم بالنجوم.

- **الأهل** يسجلون الدخول، ويضيفون أطفالهم، ويعطونهم نجوماً على المهام اليومية والصلوات الخمس.
- **المكافآت** يحددها الأهل، وعندما يجمع الطفل النجوم المطلوبة يصل للمكافأة، والنجوم الزائدة تنتقل للمكافأة التالية.
- **شاشة الطفل** (`/view/:childId`) صفحة للعرض فقط مخصصة لآيباد الطفل، تعرض نجوم اليوم وطريقه إلى المكافأة وشاشة احتفال عند الوصول لها، ويمكن إضافتها للشاشة الرئيسية في الآيباد.
- لكل من البنات والأولاد ألوانه الخاصة وصيغ المخاطبة الصحيحة.

**التقنيات:** React و Vite و React Router و Firebase (تسجيل الدخول و Firestore).

### التشغيل محلياً

1. `npm install`
2. أنشئ ملف `.env.local` فيه إعدادات تطبيق Firebase (المتغيرات الستة المذكورة في القسم الإنجليزي).
3. `npm run dev`

### النشر على Vercel

1. أضف متغيرات `VITE_FIREBASE_*` الستة في إعدادات المشروع على Vercel ثم أعد النشر.
2. ملف `vercel.json` يوجّه كل الروابط إلى `index.html` حتى تعمل روابط مثل `/view/:childId`.
3. أضف نطاق Vercel في Firebase ضمن Authentication ← Settings ← Authorized domains.
4. انسخ محتوى `firestore.rules` إلى قواعد Firestore في لوحة Firebase وانشرها.

### البيانات

اليوم يبدأ الساعة ٣ فجراً، فأي شيء يُسجَّل قبلها يُحسب لليوم السابق.
