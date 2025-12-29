# دليل سريع: ربط moguedu.ca بالموقع في 10 دقائق ⚡

## 🎯 الهدف
ربط دومين moguedu.ca (أو أي دومين آخر) بموقع MOGU Edu

## ⏱️ الوقت المطلوب
- **الإعداد**: 10-15 دقيقة
- **انتظار تفعيل DNS**: 2-48 ساعة (يتم تلقائياً)

---

## 📋 الخطوات السريعة

### 🔴 المرحلة 1: تجهيز Cloudflare (5 دقائق)

#### الخطوة 1: إنشاء حساب Cloudflare
```
1. اذهب إلى: https://dash.cloudflare.com/sign-up
2. سجل بالبريد الإلكتروني (مجاني 100%)
3. افتح البريد وفعّل الحساب
```

#### الخطوة 2: الحصول على API Token
```
1. من لوحة تحكم Cloudflare
2. اضغط على صورتك (أعلى يمين)
3. My Profile → API Tokens
4. Create Token
5. استخدم قالب "Edit Cloudflare Workers"
6. Create Token
7. انسخ الـ Token (مهم جداً!)
```

---

### 🟠 المرحلة 2: إضافة الدومين (5 دقائق)

#### الخطوة 3: إضافة موقعك لـ Cloudflare
```
1. من لوحة Cloudflare: Add a Site
2. أدخل: moguedu.ca
3. اختر: Free Plan
4. Continue
```

#### الخطوة 4: نسخ الـ Nameservers
ستحصل على شيء مثل:
```
adrian.ns.cloudflare.com
jade.ns.cloudflare.com
```
**انسخها!**

#### الخطوة 5: تحديث الـ Nameservers عند مزود الدومين

**إذا الدومين من GoDaddy:**
```
1. سجل دخول GoDaddy
2. My Products → اختر الدومين
3. Manage DNS
4. Nameservers → Change
5. Custom
6. احذف القديم وضع nameservers Cloudflare
7. Save
```

**إذا الدومين من Namecheap:**
```
1. سجل دخول Namecheap
2. Domain List → Manage
3. Nameservers → Custom DNS
4. ضع nameservers Cloudflare
5. Save
```

**إذا الدومين من مزود آخر:**
ابحث في لوحة التحكم عن "Nameservers" أو "DNS Settings" وضع القيم من Cloudflare.

⏰ **انتظر**: التحديث يستغرق 2-48 ساعة (عادة 2-4 ساعات)

---

### 🟢 المرحلة 3: نشر الموقع (في GenSpark)

#### الخطوة 6: تشغيل الأوامر في GenSpark

**انسخ والصق الأوامر التالية واحداً تلو الآخر:**

**1️⃣ إعداد Cloudflare API:**
```
اكتب في الشات: setup_cloudflare_api_key
```
الصق الـ API Token الذي نسخته في الخطوة 2

**2️⃣ إنشاء قاعدة البيانات:**
```
اكتب في الشات: 
cd /home/user/webapp && npx wrangler d1 create moguedu-production
```
انسخ الـ `database_id` من النتيجة

**3️⃣ تحديث الإعدادات:**
```
اكتب في الشات:
قم بتحديث wrangler.jsonc واستبدل database_id بالقيمة التي حصلت عليها
```

**4️⃣ إنشاء جداول قاعدة البيانات:**
```
cd /home/user/webapp && npx wrangler d1 migrations apply moguedu-production
```

**5️⃣ إضافة بيانات تجريبية:**
```
cd /home/user/webapp && npx wrangler d1 execute moguedu-production --file=./seed.sql
```

**6️⃣ نشر الموقع:**
```
cd /home/user/webapp && npm run build
npx wrangler pages project create moguedu --production-branch main
npx wrangler pages deploy dist --project-name moguedu
```

✅ **مبروك!** موقعك الآن على: `https://moguedu.pages.dev`

---

### 🔵 المرحلة 4: ربط الدومين (دقيقة واحدة!)

#### الخطوة 7: ربط moguedu.ca

**الطريقة 1: من Cloudflare Dashboard**
```
1. اذهب إلى: https://dash.cloudflare.com
2. Workers & Pages → moguedu
3. Custom domains → Set up a custom domain
4. اكتب: moguedu.ca
5. Continue → Activate domain
```

**الطريقة 2: من GenSpark (أسهل)**
```
اكتب في الشات:
npx wrangler pages domain add moguedu.ca --project-name moguedu
```

✅ **تم!** موقعك الآن على: `https://moguedu.ca`

---

## 🎉 النتيجة

بعد اكتمال الخطوات:

| الرابط | الحالة |
|--------|--------|
| https://moguedu.ca | ✅ يعمل |
| https://www.moguedu.ca | ✅ يعمل (بعد إضافته) |
| https://moguedu.pages.dev | ✅ يعمل |
| https://3000-ife4zimfunsdxfan09n1m-dfc00ec5.sandbox.novita.ai | ✅ للتطوير فقط |

---

## ⚡ ملخص للنسخ واللصق

**إذا تريد تنفيذ كل شيء مرة واحدة في GenSpark:**

```
1. setup_cloudflare_api_key
   (الصق API Token)

2. cd /home/user/webapp && npx wrangler d1 create moguedu-production
   (انسخ database_id)

3. قم بتحديث wrangler.jsonc بالـ database_id

4. cd /home/user/webapp && npx wrangler d1 migrations apply moguedu-production

5. cd /home/user/webapp && npx wrangler d1 execute moguedu-production --file=./seed.sql

6. cd /home/user/webapp && npm run build

7. cd /home/user/webapp && npx wrangler pages project create moguedu --production-branch main

8. cd /home/user/webapp && npx wrangler pages deploy dist --project-name moguedu

9. npx wrangler pages domain add moguedu.ca --project-name moguedu
```

---

## 🆘 حل المشاكل الشائعة

### ❌ "الموقع لا يفتح"
✅ **الحل:** انتظر 2-48 ساعة حتى يتم تحديث DNS

### ❌ "API Token خطأ"
✅ **الحل:** تأكد من استخدام قالب "Edit Cloudflare Workers" عند إنشاء Token

### ❌ "database_id خطأ"
✅ **الحل:** انسخ القيمة بدقة من نتيجة الأمر `d1 create`

### ❌ "الموقع يفتح بدون تصميم"
✅ **الحل:** تأكد من تشغيل `npm run build` قبل النشر

---

## 📞 هل تحتاج مساعدة؟

**أخبرني فقط أين أنت:**
- "أنا عند الخطوة 2"
- "الأمر X لم يعمل"
- "هل نجح النشر؟"

**وسأساعدك فوراً!** 🚀

---

**آخر تحديث:** ديسمبر 2024
**الموقع:** MOGU Education
**الدومين المستهدف:** moguedu.ca
