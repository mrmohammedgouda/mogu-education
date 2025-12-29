# دليل سريع: أمثلة تعديل جاهزة 🚀

## 📝 أمثلة تعديل شائعة

---

## 1️⃣ تغيير البريد الإلكتروني

```bash
cd /home/user/webapp
sed -i 's/info@moguedu.ca/contact@moguedu.ca/g' src/index.tsx
npm run build
pm2 restart moguedu
```

---

## 2️⃣ تغيير رقم الهاتف (إذا كان موجوداً)

```bash
cd /home/user/webapp
sed -i 's/+1-xxx-xxx-xxxx/+1-234-567-8900/g' src/index.tsx
npm run build
pm2 restart moguedu
```

---

## 3️⃣ تغيير العنوان الرئيسي

```bash
cd /home/user/webapp
sed -i 's/Trusted Accreditation for Quality Education/اعتماد موثوق للتعليم الجيد/g' src/index.tsx
npm run build
pm2 restart moguedu
```

---

## 4️⃣ تغيير اسم الموقع

```bash
cd /home/user/webapp
sed -i 's/MOGU Education/تعليم MOGU/g' src/index.tsx
npm run build
pm2 restart moguedu
```

---

## 5️⃣ تحديث ساعات العمل

```bash
cd /home/user/webapp
sed -i 's/Monday - Friday: 9:00 AM - 5:00 PM EST/الإثنين - الجمعة: 9 صباحاً - 5 مساءً/g' src/index.tsx
npm run build
pm2 restart moguedu
```

---

## 6️⃣ تعديل نص زر "Verify Certificate"

```bash
cd /home/user/webapp
sed -i 's/>Verify Certificate</>تحقق من الشهادة</g' src/index.tsx
npm run build
pm2 restart moguedu
```

---

## 7️⃣ تعديل نص زر "Our Services"

```bash
cd /home/user/webapp
sed -i 's/>Our Services</>خدماتنا</g' src/index.tsx
npm run build
pm2 restart moguedu
```

---

## 8️⃣ تغيير وصف الموقع

```bash
cd /home/user/webapp

# استبدال الوصف الكامل
sed -i 's/Canadian Registered Accreditation Body specialized in accrediting training centers, professional programs, and certifications to ensure quality, credibility, and excellence./هيئة اعتماد كندية متخصصة في اعتماد مراكز التدريب والبرامج المهنية والشهادات لضمان الجودة والمصداقية والتميز./g' src/index.tsx

npm run build
pm2 restart moguedu
```

---

## 9️⃣ تعديل قسم "من نحن" كاملاً

يمكنك استخدام محرر نصوص:

```bash
cd /home/user/webapp
nano src/index.tsx

# ابحث عن: About MOGU Education (Ctrl+W)
# عدّل النصوص التالية
# احفظ: Ctrl+O ثم Enter
# اخرج: Ctrl+X

npm run build
pm2 restart moguedu
```

---

## 🔟 تعديل معلومات التواصل كاملة

```bash
cd /home/user/webapp

# البريد الإلكتروني
sed -i 's/info@moguedu.ca/support@moguedu.com/g' src/index.tsx

# الموقع
sed -i 's/>Canada</>مصر - القاهرة</g' src/index.tsx

# ساعات العمل
sed -i 's/Monday - Friday: 9:00 AM - 5:00 PM EST/الأحد - الخميس: 9 صباحاً - 5 مساءً/g' src/index.tsx

npm run build
pm2 restart moguedu
```

---

## ⚡ تعديلات سريعة متعددة

```bash
cd /home/user/webapp

# قم بعدة تعديلات دفعة واحدة
sed -i \
  -e 's/info@moguedu.ca/contact@moguedu.ca/g' \
  -e 's/>Canada</>Egypt</g' \
  -e 's/>Verify Certificate</>Verify</g' \
  src/index.tsx

npm run build
pm2 restart moguedu
```

---

## 📋 سكريبت تعديل شامل

احفظ هذا في ملف `update-content.sh`:

```bash
#!/bin/bash

cd /home/user/webapp

# تحديث معلومات التواصل
sed -i 's/info@moguedu.ca/NEW_EMAIL@moguedu.ca/g' src/index.tsx

# تحديث الموقع
sed -i 's/>Canada</>NEW_LOCATION</g' src/index.tsx

# تحديث ساعات العمل
sed -i 's/Monday - Friday: 9:00 AM - 5:00 PM EST/NEW_HOURS/g' src/index.tsx

# Build و Restart
npm run build
npm run clean-port
pm2 restart moguedu

echo "✅ Content updated successfully!"
echo "🌐 Test: http://localhost:3000"
```

استخدمه:
```bash
chmod +x update-content.sh
./update-content.sh
```

---

## 🎯 تعديل بدون أوامر (طريقة سهلة)

**فقط أخبرني ماذا تريد أن تغيّر:**

مثال:
- "غيّر البريد الإلكتروني إلى contact@moguedu.ca"
- "عدّل العنوان الرئيسي إلى..."
- "حدّث ساعات العمل إلى..."

وسأقوم بالتعديل مباشرة! 😊

---

## ✅ بعد كل تعديل، تذكر:

```bash
# 1. Build
npm run build

# 2. Test محلياً
pm2 restart moguedu
curl http://localhost:3000

# 3. Git commit
git add src/index.tsx
git commit -m "Update: [وصف التعديل]"
git push origin main

# 4. Deploy على Cloudflare
export CLOUDFLARE_API_TOKEN="your-token"
npx wrangler pages deploy dist --project-name moguedu
```

---

## 🔍 بحث سريع

```bash
cd /home/user/webapp/src

# ابحث عن أي نص
grep -n "النص" index.tsx

# ابحث عن البريد الإلكتروني
grep -n "@" index.tsx

# ابحث عن الأزرار
grep -n "button\|<a.*class" index.tsx

# ابحث عن العناوين
grep -n "<h[1-6]" index.tsx
```

---

**آخر تحديث:** 29 ديسمبر 2025
