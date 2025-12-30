# 🔧 دليل الصيانة السريع - MOGU Edu

> **الهدف:** قائمة مراجعة سريعة وسهلة لضمان استمرار الموقع بدون مشاكل

---

## ⏰ جدول الصيانة الدوري

### **كل أسبوع (5 دقائق):**

```bash
# 1. تحقق من عمل الموقع
curl -I https://moguedu.ca

# 2. افتح لوحة الإدارة
# https://moguedu.ca/admin/login

# 3. راجع الرسائل الجديدة
# https://moguedu.ca/admin/messages
```

**Checklist:**
- ☐ الموقع يعمل (200 OK)
- ☐ لوحة الإدارة تفتح بشكل طبيعي
- ☐ لا توجد رسائل غير مقروءة مهمة
- ☐ لا توجد تحذيرات في Cloudflare Dashboard

---

### **كل شهر (30 دقيقة):**

```bash
# 1. نسخة احتياطية من قاعدة البيانات
cd /home/user/webapp
bash backups/backup-database.sh local

# 2. تحميل النسخة الاحتياطية
# انسخ آخر ملف backup من مجلد backups/
# واحفظه على Google Drive أو Dropbox

# 3. تحديث الموقع (إذا كان هناك تغييرات)
git pull origin main
npm run build
npx wrangler pages deploy dist --project-name moguedu

# 4. تحديث كلمة مرور المسؤول
# افتح https://moguedu.ca/admin/change-password
```

**Checklist:**
- ☐ نسخة احتياطية تمت بنجاح
- ☐ النسخة الاحتياطية محفوظة في مكان آمن
- ☐ كلمة مرور Admin محدّثة
- ☐ استخدام Cloudflare ضمن الحدود المجانية
- ☐ تحميل نسخة من الكود من GitHub

---

### **كل سنة (1 ساعة):**

```bash
# 1. تجديد النطاق على GoDaddy
# https://account.godaddy.com
# ⚠️ هذا الأهم - لا تنساه!

# 2. مراجعة أمان الحسابات
# - Cloudflare: غيّر كلمة المرور
# - GitHub: غيّر كلمة المرور
# - GoDaddy: غيّر كلمة المرور
# - Admin Panel: غيّر كلمة المرور

# 3. فحص التحديثات
cd /home/user/webapp
npm outdated
npm update

# 4. إعادة نشر بعد التحديثات
npm run build
npx wrangler pages deploy dist --project-name moguedu
```

**Checklist:**
- ☐ ✅ **النطاق moguedu.ca مُجدَّد** (الأهم!)
- ☐ Auto-Renewal مفعّل على GoDaddy
- ☐ جميع كلمات المرور محدّثة
- ☐ 2FA مفعّل على جميع الحسابات
- ☐ Recovery Codes محفوظة في مكان آمن
- ☐ فحص خطة Cloudflare (هل تحتاج ترقية؟)

---

## 🚨 حالات الطوارئ

### **الموقع لا يعمل:**

```bash
# 1. تحقق من Cloudflare Status
# https://www.cloudflarestatus.com/

# 2. تحقق من DNS
nslookup moguedu.ca

# 3. راجع Cloudflare Dashboard
# https://dash.cloudflare.com

# 4. إذا لزم الأمر، أعد النشر
cd /home/user/webapp
git pull origin main
npm run build
npx wrangler pages deploy dist --project-name moguedu
```

---

### **فقدان البيانات:**

```bash
# استعادة من آخر نسخة احتياطية
cd /home/user/webapp
npx wrangler d1 execute moguedu-production --remote \
  --file=backups/moguedu-backup-latest.sql
```

---

### **نسيت كلمة مرور Admin:**

```bash
# الحل المؤقت: إعادة تعيين كلمة المرور من القاعدة
cd /home/user/webapp

# إعادة تعيين كلمة مرور admin إلى admin123
npx wrangler d1 execute moguedu-production --remote \
  --command="UPDATE admin_users SET password = 'admin123' WHERE username = 'admin'"

# ثم سجل دخول وغيّر كلمة المرور من لوحة الإدارة
```

---

## 📋 قائمة الأوامر المهمة

### **الموقع:**

```bash
# اختبار الموقع
curl -I https://moguedu.ca

# اختبار API
curl https://moguedu.ca/api/stats

# اختبار صفحة التحقق
curl -I https://moguedu.ca/verify

# اختبار لوحة الإدارة
curl -I https://moguedu.ca/admin/login
```

---

### **قاعدة البيانات:**

```bash
# نسخة احتياطية محلية
bash backups/backup-database.sh local

# نسخة احتياطية من الإنتاج (إذا كان لديك صلاحيات)
bash backups/backup-database.sh remote

# عرض جميع الشهادات
npx wrangler d1 execute moguedu-production --local \
  --command="SELECT * FROM certificates"

# عرض عدد الرسائل
npx wrangler d1 execute moguedu-production --local \
  --command="SELECT COUNT(*) as count FROM contact_submissions"
```

---

### **Git & GitHub:**

```bash
# تحديث الكود من GitHub
cd /home/user/webapp
git pull origin main

# رفع التغييرات إلى GitHub
git add .
git commit -m "Update site"
git push origin main

# عرض آخر 5 commits
git log --oneline -5

# استعادة من commit قديم
git checkout <commit-hash>
```

---

### **النشر:**

```bash
# نشر الموقع على Cloudflare Pages
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name moguedu

# فحص حالة النشر
npx wrangler pages deployment list --project-name moguedu

# عرض logs
npx wrangler pages deployment tail --project-name moguedu
```

---

## 🔒 نصائح الأمان السريعة

### **قواعد ذهبية:**

1. ✅ **غيّر كلمة مرور Admin كل 3 أشهر**
2. ✅ **خذ نسخة احتياطية قبل أي تعديل كبير**
3. ✅ **فعّل 2FA على جميع الحسابات**
4. ✅ **لا تشارك بيانات الدخول أبداً**
5. ✅ **احتفظ بملف EMERGENCY_INFO.txt في مكان آمن**

---

### **كلمة مرور قوية:**

```
✅ جيدة: M0gU@Edu2025!SecurE#
❌ ضعيفة: admin123

المواصفات:
- 12+ حرف
- أحرف كبيرة وصغيرة
- أرقام
- رموز خاصة
- لا تستخدم كلمات قاموس
```

---

## 💰 التكاليف المتوقعة

### **الحالي:**

```
💰 النطاق moguedu.ca: ~$15/سنة
🆓 Cloudflare Pages: مجاني
🆓 Cloudflare D1: مجاني (حتى 5GB)
🆓 Email Routing: مجاني
───────────────────────────
الإجمالي: ~$15 سنوياً
```

### **إذا احتجت ترقية:**

```
💰 Cloudflare Pro: $20/شهر
💰 D1 مدفوع: $5/شهر (بعد 5GB)
───────────────────────────
الإجمالي: ~$25/شهر (إذا لزم)
```

---

## 📞 جهات الاتصال السريعة

| الخدمة | الرابط | الدعم |
|--------|--------|-------|
| **Cloudflare** | [dash.cloudflare.com](https://dash.cloudflare.com) | [support.cloudflare.com](https://support.cloudflare.com) |
| **GoDaddy** | [account.godaddy.com](https://account.godaddy.com) | 1-480-505-8877 |
| **GitHub** | [github.com](https://github.com) | support@github.com |

---

## 🎯 الخطوات الأولى (إعداد أولي)

**إذا لم تفعل هذه الخطوات بعد، افعلها الآن:**

```bash
# 1. فعّل Auto-Renewal للنطاق
# https://account.godaddy.com → moguedu.ca → Settings → Auto-Renewal

# 2. فعّل 2FA على Cloudflare
# https://dash.cloudflare.com → Profile → Authentication → 2FA

# 3. فعّل 2FA على GitHub
# https://github.com/settings/security → 2FA

# 4. فعّل 2FA على GoDaddy
# https://account.godaddy.com → Security → 2-Step Verification

# 5. احفظ Recovery Codes في مكان آمن
# لكل خدمة، احفظ الـ Recovery Codes في ملف نصي وخزّنه في مكان آمن

# 6. خذ أول نسخة احتياطية
cd /home/user/webapp
bash backups/backup-database.sh local

# 7. احفظ النسخة على Google Drive
# انسخ ملف backups/moguedu-backup-*.sql واحفظه في مكان آمن

# 8. غيّر كلمة مرور Admin
# https://moguedu.ca/admin/change-password
```

**Checklist الإعداد الأولي:**
- ☐ Auto-Renewal مفعّل على GoDaddy
- ☐ 2FA مفعّل على Cloudflare
- ☐ 2FA مفعّل على GitHub
- ☐ 2FA مفعّل على GoDaddy
- ☐ Recovery Codes محفوظة
- ☐ أول نسخة احتياطية تمت
- ☐ كلمة مرور Admin تم تغييرها من الافتراضية

---

## ✅ ملخص سريع

### **لضمان استمرار الموقع:**

1. ✅ **أسبوعياً:** تحقق من عمل الموقع (5 دقائق)
2. ✅ **شهرياً:** نسخة احتياطية + تحديث كلمة مرور (30 دقيقة)
3. ✅ **سنوياً:** تجديد النطاق + مراجعة أمنية (1 ساعة)

### **التكلفة:**
- 💰 ~$15 سنوياً فقط

### **الوقت المطلوب:**
- 🕐 5 دقائق/أسبوع
- 🕐 30 دقيقة/شهر
- 🕐 1 ساعة/سنة

---

## 🔗 روابط مهمة

**الموقع:**
- https://moguedu.ca
- https://moguedu.ca/admin/login
- https://moguedu.ca/verify

**Dashboards:**
- https://dash.cloudflare.com
- https://github.com/mrmohammedgouda/mogu-education
- https://account.godaddy.com

**الأدلة:**
- WEBSITE_SUSTAINABILITY_GUIDE.md (دليل شامل)
- EMERGENCY_INFO.txt (معلومات الطوارئ)
- backup-database.sh (سكريبت النسخ الاحتياطي)

---

**✨ الموقع مصمم ليعمل لسنوات بدون مشاكل - فقط اتبع هذه الإرشادات البسيطة!**

📅 **تاريخ الإنشاء:** 2025-12-30  
📝 **آخر تحديث:** 2025-12-30
