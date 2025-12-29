# دليل إعداد إرسال الإيميلات من الموقع 📧

## المشكلة
نموذج Contact في الموقع لا يرسل إيميلات فعلياً إلى info@moguedu.ca

## الحل
استخدام Resend API لإرسال الإيميلات من النموذج

---

## الخطوة 1️⃣: إنشاء حساب Resend

1. **اذهب إلى:** https://resend.com/signup
2. **سجل حساب جديد** بالبريد الإلكتروني
3. **فعّل الحساب** من الإيميل المرسل لك

---

## الخطوة 2️⃣: إضافة الدومين

1. **من Dashboard:** اضغط على "Domains"
2. **اضغط "Add Domain"**
3. **أدخل:** moguedu.ca
4. **سيعطيك Resend سجلات DNS:**
   - SPF Record
   - DKIM Records
   - Return-Path Record

---

## الخطوة 3️⃣: إضافة DNS Records في GoDaddy

1. **اذهب إلى GoDaddy Dashboard**
2. **Domains → My Domains → moguedu.ca → DNS**
3. **أضف السجلات التي أعطاها لك Resend:**

```
مثال:
Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all

Type: TXT  
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3...

Type: CNAME
Name: resend
Value: feedback-smtp.us-east-1.amazonses.com
```

---

## الخطوة 4️⃣: الحصول على API Key

1. **من Resend Dashboard:** اضغط "API Keys"
2. **اضغط "Create API Key"**
3. **Name:** MOGU Website Contact Form
4. **Permission:** Sending access
5. **Domain:** moguedu.ca
6. **اضغط "Create"**
7. **انسخ API Key** (يبدأ بـ re_...)

**مثال:**
```
re_123abc456def789ghi012jkl345mno678pqr
```

---

## الخطوة 5️⃣: إضافة API Key في Cloudflare

```bash
cd /home/user/webapp
npx wrangler secret put RESEND_API_KEY --env production

# عندما يطلب منك، الصق الـ API Key
```

---

## الخطوة 6️⃣: تفعيل كود إرسال الإيميل

سأضيف الكود تلقائياً في المشروع.

---

## الخطوة 7️⃣: اختبار النظام

1. **اذهب إلى:** https://moguedu.ca/contact
2. **املأ النموذج**
3. **اضغط "Send Message"**
4. **ستصلك رسالة على:** info@moguedu.ca

---

## 📊 الخطة البديلة (إذا لم تعمل Resend)

### **استخدام Cloudflare Email Workers**

Cloudflare لديه ميزة Email Routing مجانية:

1. **Cloudflare Dashboard → Email → Email Routing**
2. **Enable Email Routing**
3. **Add Destination Address:** info@moguedu.ca (إيميلك على GoDaddy)
4. **Verify:** سيرسل Cloudflare إيميل تأكيد لـ info@moguedu.ca
5. **Create Route:**
   - From: contact@moguedu.ca
   - To: info@moguedu.ca

بعدها سيمكن استقبال الإيميلات من النموذج.

---

## ✅ الفوائد

- ✅ إرسال إيميلات حقيقية من النموذج
- ✅ استقبال الرسائل على info@moguedu.ca (GoDaddy)
- ✅ مجاني 100%
- ✅ لا حدود على عدد الرسائل
- ✅ أمان عالي

---

## 🆘 إذا واجهت مشكلة

أخبرني في أي خطوة واجهت مشكلة وسأساعدك!

---

**آخر تحديث:** 29 ديسمبر 2025
