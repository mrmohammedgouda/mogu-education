# 📧 دليل نموذج التواصل وإدارة الرسائل

## ✅ تم إكمال التكامل بنجاح!

### **الخطوات المنجزة:**

1. ✅ **ربط البريد الإلكتروني info@moguedu.ca** مع Cloudflare Email Routing
2. ✅ **تفعيل نموذج التواصل** في الموقع على `/contact`
3. ✅ **إرسال الإيميلات تلقائياً** باستخدام MailChannels API (مجاني)
4. ✅ **حفظ الرسائل** في قاعدة البيانات Cloudflare D1
5. ✅ **إنشاء صفحة إدارة الرسائل** في لوحة الإدارة `/admin/messages`

---

## 🌐 كيف يعمل النظام:

### **للزوار (Public):**
1. يفتح الزائر: https://moguedu.ca/contact
2. يملأ النموذج:
   - الاسم *
   - البريد الإلكتروني *
   - المنظمة (اختياري)
   - نوع الاستفسار * (Training Center Accreditation, Program Accreditation, إلخ)
   - الرسالة *
3. يضغط **Send Message**
4. النظام:
   - ✅ **يحفظ** الرسالة في قاعدة البيانات
   - ✅ **يرسل إيميل** إلى info@moguedu.ca عبر MailChannels
   - ✅ **يعرض رسالة نجاح** للزائر

### **للمسؤول (Admin):**
1. يسجل دخول إلى: https://moguedu.ca/admin/login
   - Username: `admin`
   - Password: `admin123` (غيرها من `/admin/change-password`)
2. يذهب إلى: **Messages** في القائمة العلوية
3. يرى جميع الرسائل في جدول:
   - التاريخ
   - الاسم
   - البريد الإلكتروني
   - نوع الاستفسار
4. يضغط **View** لعرض تفاصيل الرسالة
5. يضغط **Reply via Email** للرد مباشرة (يفتح بريدك)
6. يضغط **Delete** لحذف الرسالة

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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### **عرض جميع الرسائل:**
```bash
npx wrangler d1 execute moguedu-production --remote \
  --command="SELECT * FROM contact_submissions ORDER BY created_at DESC"
```

### **حذف رسالة:**
```bash
npx wrangler d1 execute moguedu-production --remote \
  --command="DELETE FROM contact_submissions WHERE id = 1"
```

---

## 📧 إعدادات البريد الإلكتروني:

### **1. Cloudflare Email Routing (الاستقبال):**
- ✅ **مُفعّل** على moguedu.ca
- ✅ **Destination:** Mohammedgouda@hotmail.com
- ✅ **Routing Rule:** info@moguedu.ca → Mohammedgouda@hotmail.com

**كيف تتحقق:**
1. افتح: https://dash.cloudflare.com
2. اختر: moguedu.ca → Email → Email Routing
3. تأكد من:
   - Status: **Active** ✅
   - Destination: **Mohammedgouda@hotmail.com Verified** ✅
   - Rule: **info@moguedu.ca → Mohammedgouda@hotmail.com** ✅

### **2. MailChannels API (الإرسال):**
- ✅ **مجاني تماماً** للمواقع المستضافة على Cloudflare Pages
- ✅ **لا يحتاج API Key**
- ✅ **يعمل تلقائياً** من Cloudflare Workers

**الإعدادات في الكود:**
```typescript
// API Endpoint للتواصل
POST /api/contact
{
  name: string,
  email: string,
  organization?: string,
  inquiryType: string,
  message: string
}

// يرسل إيميل عبر MailChannels إلى:
- To: info@moguedu.ca
- From: noreply@moguedu.ca
- Reply-To: [email address من النموذج]
```

---

## 🔗 الروابط المهمة:

### **الموقع:**
- **صفحة التواصل:** https://moguedu.ca/contact
- **لوحة الإدارة:** https://moguedu.ca/admin/login
- **إدارة الرسائل:** https://moguedu.ca/admin/messages

### **Cloudflare:**
- **Dashboard:** https://dash.cloudflare.com
- **Email Routing:** https://dash.cloudflare.com → moguedu.ca → Email
- **D1 Database:** https://dash.cloudflare.com → Workers & Pages → D1

### **GitHub:**
- **المستودع:** https://github.com/mrmohammedgouda/mogu-education

---

## 🧪 اختبار النظام:

### **اختبار 1: إرسال رسالة من الموقع**
```bash
curl -X POST https://moguedu.ca/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "inquiryType": "General Inquiry",
    "message": "This is a test message"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "message": "Thank you for your message! We will respond within 24-48 business hours."
}
```

### **اختبار 2: التحقق من حفظ الرسالة**
```bash
npx wrangler d1 execute moguedu-production --remote \
  --command="SELECT COUNT(*) as total FROM contact_submissions"
```

### **اختبار 3: عرض الرسائل في لوحة الإدارة**
1. افتح: https://moguedu.ca/admin/login
2. سجل دخول (admin / admin123)
3. اذهب إلى: **Messages**
4. يجب أن ترى الرسالة التجريبية ✅

---

## ⚠️ ملاحظات مهمة:

### **1. البريد الإلكتروني:**
- ✅ **الاستقبال:** يعمل عبر Cloudflare Email Routing → Hotmail
- ✅ **الإرسال:** يعمل عبر MailChannels من نموذج الموقع
- ❌ **لا يمكن الإرسال مباشرة من info@moguedu.ca**
  - للإرسال المباشر، استخدم Microsoft 365 أو Google Workspace ($6/شهر)

### **2. قاعدة البيانات:**
- ✅ **المحلية (Local):** `.wrangler/state/v3/d1/moguedu-production`
- ✅ **الإنتاج (Remote):** Cloudflare D1
- ⚠️ **الجداول منفصلة** - يجب تطبيق migrations على الإنتاج:
  ```bash
  npx wrangler d1 migrations apply moguedu-production --remote
  ```

### **3. الأمان:**
- ✅ **Admin API محمي** - يتطلب تسجيل دخول
- ✅ **Contact API عام** - متاح لجميع الزوار
- ⚠️ **غيّر كلمة مرور admin** من: https://moguedu.ca/admin/change-password

---

## 📋 API Endpoints:

### **1. إرسال رسالة (Public):**
```
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "organization": "ABC Company",
  "inquiryType": "Training Center Accreditation",
  "message": "I would like to inquire about..."
}

Response:
{
  "success": true,
  "message": "Thank you for your message..."
}
```

### **2. عرض جميع الرسائل (Admin):**
```
GET /api/admin/messages
Cookie: admin_session=[token]

Response:
{
  "success": true,
  "messages": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "organization": "ABC Company",
      "inquiry_type": "Training Center Accreditation",
      "message": "I would like to inquire about...",
      "created_at": "2024-12-29 12:00:00"
    }
  ]
}
```

### **3. حذف رسالة (Admin):**
```
DELETE /api/admin/messages/:id
Cookie: admin_session=[token]

Response:
{
  "success": true
}
```

---

## 🚀 الخطوات التالية (اختيارية):

### **1. إضافة إشعارات فورية:**
- استخدام Cloudflare Queues لإرسال إشعارات فورية
- دمج مع Telegram Bot API أو WhatsApp Business API

### **2. تصدير الرسائل:**
- إضافة زر **Export to CSV** في صفحة Messages
- إضافة زر **Export to PDF** لرسالة واحدة

### **3. فلترة وبحث متقدم:**
- فلترة حسب نوع الاستفسار
- بحث حسب الاسم أو البريد الإلكتروني
- فلترة حسب التاريخ

### **4. إحصائيات:**
- عدد الرسائل الإجمالي
- الرسائل حسب نوع الاستفسار
- مخطط بياني للرسائل اليومية

---

## 🆘 حل المشاكل:

### **المشكلة 1: الرسائل لا تصل إلى Hotmail**
**الحل:**
1. افتح Cloudflare Email Routing
2. تأكد من:
   - Status: **Active** ✅
   - Destination **Verified** ✅
3. افحص مجلد **Spam/Junk** في Hotmail

### **المشكلة 2: الرسائل لا تُحفظ في قاعدة البيانات**
**الحل:**
```bash
# تطبيق migrations على الإنتاج
npx wrangler d1 migrations apply moguedu-production --remote

# التحقق من الجدول
npx wrangler d1 execute moguedu-production --remote \
  --command="SELECT COUNT(*) FROM contact_submissions"
```

### **المشكلة 3: صفحة Messages فارغة**
**الحل:**
1. أرسل رسالة تجريبية من `/contact`
2. افتح لوحة الإدارة وتحقق من التحديث
3. افتح Console في المتصفح وافحص الأخطاء

---

## 📞 الدعم:

إذا واجهت أي مشكلة:
1. افتح GitHub Issues: https://github.com/mrmohammedgouda/mogu-education/issues
2. تحقق من Logs:
   ```bash
   # Local
   pm2 logs moguedu --nostream
   
   # Production
   npx wrangler pages deployment tail --project-name moguedu
   ```

---

**تاريخ الإنشاء:** 2025-12-29  
**الإصدار:** 1.0  
**الحالة:** ✅ نشط ويعمل بنجاح
