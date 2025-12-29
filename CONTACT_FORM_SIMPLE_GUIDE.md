# 📝 دليل استخدام نموذج التواصل - MOGU Edu

## ✅ كيف يعمل النظام الآن (مبسط):

### **للزوار:**
1. يفتح: https://moguedu.ca/contact
2. يملأ النموذج:
   - الاسم *
   - البريد الإلكتروني *
   - المنظمة (اختياري)
   - نوع الاستفسار *
   - الرسالة *
3. يضغط "Send Message"
4. **تُحفظ الرسالة في قاعدة البيانات ✅**
5. يرى رسالة نجاح

### **لك (المسؤول):**
1. افتح: https://moguedu.ca/admin/login
2. سجل دخول (admin / admin123)
3. اذهب إلى: **Messages** في القائمة
4. شاهد جميع الرسائل
5. اضغط "View" لعرض التفاصيل
6. اضغط "Reply via Email" للرد (يفتح بريدك)
7. اضغط "Delete" للحذف

---

## 🎯 المميزات:

### **1. بسيط وسريع:**
- ✅ لا توجد إعدادات إيميل معقدة
- ✅ لا توجد API Keys خارجية
- ✅ يعمل مباشرة بدون إعداد

### **2. الرسائل محفوظة:**
- ✅ جميع الرسائل في قاعدة البيانات Cloudflare D1
- ✅ لا تُفقد أي رسالة
- ✅ يمكن البحث والفلترة

### **3. لوحة إدارة احترافية:**
- ✅ عرض جميع الرسائل في جدول
- ✅ تفاصيل كاملة لكل رسالة
- ✅ رد مباشر عبر البريد
- ✅ حذف الرسائل القديمة
- ✅ عداد للرسائل غير المقروءة

---

## 📊 قاعدة البيانات:

### **جدول contact_submissions:**
```sql
CREATE TABLE contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT,
  inquiry_type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### **عرض جميع الرسائل:**
```bash
# محلي
npx wrangler d1 execute moguedu-production --local \
  --command="SELECT * FROM contact_submissions ORDER BY created_at DESC"

# إنتاج
npx wrangler d1 execute moguedu-production --remote \
  --command="SELECT * FROM contact_submissions ORDER BY created_at DESC"
```

### **عداد الرسائل غير المقروءة:**
```bash
npx wrangler d1 execute moguedu-production --remote \
  --command="SELECT COUNT(*) as unread FROM contact_submissions WHERE is_read = 0"
```

### **تعليم رسالة كمقروءة:**
```bash
npx wrangler d1 execute moguedu-production --remote \
  --command="UPDATE contact_submissions SET is_read = 1 WHERE id = 1"
```

---

## 🔗 الروابط:

| الوصف | الرابط |
|-------|--------|
| صفحة التواصل | https://moguedu.ca/contact |
| لوحة الإدارة | https://moguedu.ca/admin/login |
| إدارة الرسائل | https://moguedu.ca/admin/messages |
| Dashboard | https://moguedu.ca/admin/dashboard |

---

## 🧪 اختبار النموذج:

### **من المتصفح:**
```
1. افتح: https://moguedu.ca/contact
2. املأ النموذج:
   - الاسم: محمد أحمد
   - البريد: mohammed@example.com
   - نوع الاستفسار: Training Center Accreditation
   - الرسالة: أريد الاستفسار عن اعتماد مركز تدريب
3. اضغط "Send Message"
4. يجب أن تظهر: "Thank you for your message!" ✅
```

### **من Terminal:**
```bash
curl -X POST https://moguedu.ca/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "inquiryType": "General Inquiry",
    "message": "This is a test message"
  }'

# النتيجة:
{
  "success": true,
  "message": "Thank you for your message! We will respond within 24-48 business hours."
}
```

---

## 📱 التحقق من الرسائل:

### **الطريقة 1: لوحة الإدارة (الأسهل)**
```
1. افتح: https://moguedu.ca/admin/login
2. سجل دخول: admin / admin123
3. اذهب إلى: Messages
4. شاهد جميع الرسائل ✅
```

### **الطريقة 2: من Terminal**
```bash
# عرض آخر 5 رسائل
npx wrangler d1 execute moguedu-production --remote \
  --command="SELECT id, name, email, inquiry_type, created_at FROM contact_submissions ORDER BY created_at DESC LIMIT 5"
```

---

## 🎨 لوحة الإدارة:

### **Dashboard - الصفحة الرئيسية:**
- ✅ إحصائيات (Certificates, Centers, Programs)
- ✅ **عداد الرسائل غير المقروءة** (badge أحمر)
- ✅ Quick Actions:
  - **View Messages** (جديد!)
  - Add Certificate
  - Add Center
  - Change Password

### **Messages Page - إدارة الرسائل:**
- ✅ جدول بجميع الرسائل
- ✅ الحقول: التاريخ، الاسم، البريد، نوع الاستفسار
- ✅ أزرار: View، Delete
- ✅ Modal لعرض التفاصيل الكاملة
- ✅ زر "Reply via Email" يفتح بريدك مباشرة

---

## 💡 كيف ترد على الرسائل:

### **الطريقة السهلة:**
```
1. افتح الرسالة في /admin/messages
2. اضغط "Reply via Email"
3. سيفتح بريدك (Hotmail) مع:
   - To: بريد المُرسل
   - Subject: Re: نوع الاستفسار
4. اكتب ردك وأرسل
```

### **الطريقة اليدوية:**
```
1. شاهد الرسالة في لوحة الإدارة
2. انسخ البريد الإلكتروني
3. افتح Hotmail يدوياً
4. أرسل الرد
```

---

## ⚠️ ملاحظات مهمة:

### **1. لا يوجد إرسال تلقائي للإيميل:**
- ❌ النظام **لا يرسل** إيميلات تلقائية
- ✅ الرسائل **تُحفظ فقط** في قاعدة البيانات
- ✅ يجب أن تتحقق من `/admin/messages` بشكل منتظم
- ✅ سترى **عداد أحمر** في Dashboard للرسائل غير المقروءة

### **2. قاعدة البيانات:**
- ✅ **المحلية (Local):** `.wrangler/state/v3/d1/moguedu-production`
- ✅ **الإنتاج (Remote):** Cloudflare D1
- ⚠️ **يجب إضافة عمود is_read** في الإنتاج:
  ```bash
  npx wrangler d1 execute moguedu-production --remote \
    --command="ALTER TABLE contact_submissions ADD COLUMN is_read INTEGER DEFAULT 0"
  ```

### **3. الأمان:**
- ✅ Contact API **عام** - متاح لجميع الزوار
- ✅ Messages API **محمي** - يتطلب تسجيل دخول
- ⚠️ **غيّر كلمة مرور admin** من: https://moguedu.ca/admin/change-password

---

## 🚀 الخطوات القادمة (اختياري):

### **إذا أردت إرسال إيميلات تلقائية:**
استخدم **Resend API** (مجاني 100 إيميل/يوم):
1. سجل في: https://resend.com
2. احصل على API Key
3. أضف في Cloudflare Pages Settings → Environment Variables:
   ```
   RESEND_API_KEY=re_xxxxx
   ```
4. سنضيف الكود لإرسال الإيميلات

### **إضافة إشعارات:**
- Telegram Bot (لإشعارك فوراً بالرسائل الجديدة)
- WhatsApp Business API
- SMS عبر Twilio

---

## 🔧 API Endpoints:

### **إرسال رسالة (Public):**
```
POST /api/contact
Content-Type: application/json

Body:
{
  "name": "محمد أحمد",
  "email": "mohammed@example.com",
  "organization": "شركة ABC",
  "inquiryType": "Training Center Accreditation",
  "message": "أريد الاستفسار عن..."
}

Response:
{
  "success": true,
  "message": "Thank you for your message! We will respond within 24-48 business hours."
}
```

### **عرض الرسائل (Admin):**
```
GET /api/admin/messages
Cookie: admin_session=[token]

Response:
{
  "success": true,
  "messages": [...]
}
```

### **حذف رسالة (Admin):**
```
DELETE /api/admin/messages/:id
Cookie: admin_session=[token]
```

---

## 🆘 حل المشاكل:

### **المشكلة: الرسائل لا تُحفظ**
```bash
# تحقق من الجدول
npx wrangler d1 execute moguedu-production --remote \
  --command="SELECT COUNT(*) FROM contact_submissions"

# إذا لم يكن موجوداً، أنشئه
npx wrangler d1 execute moguedu-production --remote \
  --command="CREATE TABLE IF NOT EXISTS contact_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    organization TEXT,
    inquiry_type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )"
```

### **المشكلة: لا أرى الرسائل في لوحة الإدارة**
```
1. تأكد من تسجيل الدخول
2. افتح Console في المتصفح (F12)
3. افحص الأخطاء
4. تحقق من أن الجدول موجود في قاعدة البيانات
```

---

## 📞 الخلاصة:

✅ **النموذج يعمل بنجاح!**
- الزوار يرسلون الرسائل من `/contact`
- الرسائل تُحفظ في قاعدة البيانات
- تشاهدها في `/admin/messages`
- ترد عليها عبر بريدك الشخصي

**الروابط المهمة:**
- صفحة التواصل: https://moguedu.ca/contact
- لوحة الإدارة: https://moguedu.ca/admin/messages

**بيانات الدخول:**
- Username: admin
- Password: admin123
- **⚠️ غيّر كلمة المرور فوراً!**

---

**تاريخ الإنشاء:** 2025-12-29  
**الإصدار:** 2.0 (مبسط - بدون إرسال إيميل)  
**الحالة:** ✅ يعمل بنجاح
