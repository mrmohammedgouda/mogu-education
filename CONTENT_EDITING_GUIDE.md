# دليل تعديل محتوى موقع MOGU Education 📝

## 📍 موقع الملف الرئيسي:
```
/home/user/webapp/src/index.tsx
```

---

## 🎯 الأقسام القابلة للتعديل

### **1️⃣ الصفحة الرئيسية (Home Page)**

**الموقع في الملف:** السطور 2211-2229

**النصوص القابلة للتعديل:**

```html
<!-- العنوان الرئيسي -->
<h1 class="text-5xl font-bold mb-6">MOGU Education</h1>

<!-- العنوان الفرعي -->
<p class="text-2xl mb-4">Trusted Accreditation for Quality Education</p>

<!-- الوصف -->
<p class="text-lg mb-8 max-w-3xl mx-auto">
    Canadian Registered Accreditation Body specialized in accrediting training centers, 
    professional programs, and certifications to ensure quality, credibility, and excellence.
</p>

<!-- نصوص الأزرار -->
<a href="/verify">Verify Certificate</a>
<a href="/services">Our Services</a>
```

**كيف تجده:**
```bash
grep -n "Trusted Accreditation for Quality Education" src/index.tsx
```

---

### **2️⃣ صفحة "من نحن" (About Us)**

**الموقع في الملف:** السطور 2420-2550

**النصوص القابلة للتعديل:**

```html
<!-- العنوان -->
<h1 class="text-4xl font-bold mb-4">About MOGU Education</h1>
<p class="text-xl">Canadian Registered Independent Accreditation Body</p>

<!-- قسم "من نحن" -->
<h2 class="text-3xl font-bold mb-6">Who We Are</h2>
<p>
    MOGU Education is an independent Canadian registered accreditation organization, 
    established to support quality, integrity, and accountability in education and professional training.
</p>

<!-- الرؤية -->
<h3 class="text-2xl font-bold mb-4">Our Vision</h3>
<p>عدّل نص الرؤية هنا...</p>

<!-- الرسالة -->
<h3 class="text-2xl font-bold mb-4">Our Mission</h3>
<p>عدّل نص الرسالة هنا...</p>
```

**كيف تجده:**
```bash
grep -n "About MOGU Education" src/index.tsx
```

---

### **3️⃣ صفحة الخدمات (Services)**

**الموقع في الملف:** السطور 2600-2750

**النصوص القابلة للتعديل:**

```html
<!-- العنوان -->
<h1 class="text-4xl font-bold mb-4">Our Services</h1>

<!-- الخدمات الثلاثة -->
<h3 class="text-2xl font-bold mb-4">
    <i class="fas fa-building"></i> Training Center Accreditation
</h3>
<p>عدّل وصف الخدمة...</p>

<h3 class="text-2xl font-bold mb-4">
    <i class="fas fa-book"></i> Program Accreditation
</h3>
<p>عدّل وصف الخدمة...</p>

<h3 class="text-2xl font-bold mb-4">
    <i class="fas fa-certificate"></i> Certification Accreditation
</h3>
<p>عدّل وصف الخدمة...</p>
```

**كيف تجده:**
```bash
grep -n "Our Services" src/index.tsx
```

---

### **4️⃣ صفحة المعايير (Standards - MOGU Method)**

**الموقع في الملف:** السطور 2800-3000

**النصوص القابلة للتعديل:**

```html
<!-- العنوان -->
<h1 class="text-4xl font-bold mb-4">The MOGU Edu Method</h1>
<p class="text-xl">Four Pillars of Quality Accreditation</p>

<!-- المعيار الأول: Trainer Qualification -->
<h3 class="text-2xl font-bold mb-3">1. Trainer Qualification</h3>
<p>عدّل وصف المعيار...</p>

<!-- المعيار الثاني: Training Material -->
<h3 class="text-2xl font-bold mb-3">2. Training Material</h3>
<p>عدّل وصف المعيار...</p>

<!-- المعيار الثالث: Learning Process -->
<h3 class="text-2xl font-bold mb-3">3. Learning Process</h3>
<p>عدّل وصف المعيار...</p>

<!-- المعيار الرابع: Delivery Methods -->
<h3 class="text-2xl font-bold mb-3">4. Delivery Methods</h3>
<p>عدّل وصف المعيار...</p>
```

**كيف تجده:**
```bash
grep -n "The MOGU Edu Method" src/index.tsx
```

---

### **5️⃣ صفحة التواصل (Contact)**

**الموقع في الملف:** السطور 3350-3450

**النصوص القابلة للتعديل:**

```html
<!-- العنوان -->
<h1 class="text-4xl font-bold mb-4">Contact Us</h1>

<!-- معلومات التواصل -->
<h3 class="text-xl font-bold mb-2">
    <i class="fas fa-envelope"></i> Email
</h3>
<p>info@moguedu.ca</p>

<h3 class="text-xl font-bold mb-2">
    <i class="fas fa-map-marker-alt"></i> Location
</h3>
<p>Canada</p>

<h3 class="text-xl font-bold mb-2">
    <i class="fas fa-clock"></i> Business Hours
</h3>
<p>Monday - Friday: 9:00 AM - 5:00 PM EST</p>
```

**كيف تجده:**
```bash
grep -n "info@moguedu.ca" src/index.tsx
```

---

### **6️⃣ صفحة التحقق من الشهادات (Certificate Verification)**

**الموقع في الملف:** السطور 1900-2000

**النصوص القابلة للتعديل:**

```html
<!-- العنوان -->
<h1 class="text-4xl font-bold mb-4">Certificate Verification</h1>
<p class="text-xl">Verify the authenticity of MOGU certified documents</p>

<!-- تعليمات الإدخال -->
<label>Certificate Number</label>
<input placeholder="Enter certificate number (e.g., MOGU-2024-001)">

<label>Holder Name</label>
<input placeholder="Enter holder name">

<label>Training Provider</label>
<input placeholder="Enter training provider name (optional)">

<!-- نص الزر -->
<button>
    <i class="fas fa-search"></i> Verify Certificate
</button>
```

**كيف تجده:**
```bash
grep -n "Certificate Verification" src/index.tsx
```

---

### **7️⃣ صفحة المراكز المعتمدة (Accredited Centers)**

**الموقع في الملف:** السطور 3200-3300

**النصوص القابلة للتعديل:**

```html
<!-- العنوان -->
<h1 class="text-4xl font-bold mb-4">Accredited Training Centers</h1>
<p class="text-xl">Certified institutions meeting MOGU quality standards</p>

<!-- وصف -->
<p class="text-gray-700 mb-8">
    Our accredited training centers have demonstrated excellence in professional training...
</p>
```

**كيف تجده:**
```bash
grep -n "Accredited Training Centers" src/index.tsx
```

---

## 🛠️ خطوات التعديل العملية

### **الطريقة 1: استخدام محرر نصوص**

```bash
# 1. افتح الملف
cd /home/user/webapp
nano src/index.tsx

# أو استخدم vim
vim src/index.tsx

# 2. ابحث عن النص (في nano: Ctrl+W، في vim: /النص)

# 3. عدّل النص

# 4. احفظ (nano: Ctrl+O ثم Enter، vim: :wq)
```

---

### **الطريقة 2: استخدام sed (للتعديلات السريعة)**

```bash
# استبدال نص واحد
cd /home/user/webapp
sed -i 's/النص القديم/النص الجديد/g' src/index.tsx

# مثال: تغيير البريد الإلكتروني
sed -i 's/info@moguedu.ca/contact@moguedu.ca/g' src/index.tsx
```

---

### **الطريقة 3: استخدام أدوات GenSpark**

يمكنك أن تطلب مني:
- "غيّر عنوان الصفحة الرئيسية إلى..."
- "عدّل وصف الخدمات إلى..."
- "حدّث معلومات التواصل إلى..."

وسأقوم بالتعديل مباشرة!

---

## 🚀 بعد التعديل: النشر

### **1. Build المشروع:**
```bash
cd /home/user/webapp
npm run build
```

### **2. اختبار محلي:**
```bash
npm run clean-port
pm2 restart moguedu

# افتح: http://localhost:3000
```

### **3. حفظ في Git:**
```bash
git add src/index.tsx
git commit -m "Update website content: [وصف التعديل]"
git push origin main
```

### **4. نشر على Cloudflare:**
```bash
export CLOUDFLARE_API_TOKEN="your-token"
npx wrangler pages deploy dist --project-name moguedu
```

---

## 📊 قائمة النصوص الشائعة للتعديل

### **نصوص رئيسية:**
- ✅ `MOGU Education` - اسم الموقع
- ✅ `Trusted Accreditation for Quality Education` - الشعار
- ✅ `Canadian Registered Accreditation Body` - الوصف
- ✅ `info@moguedu.ca` - البريد الإلكتروني
- ✅ `Verify Certificate` - نص الزر

### **روابط Navigation:**
- ✅ `Home` - الرئيسية
- ✅ `About Us` - من نحن
- ✅ `Services` - الخدمات
- ✅ `Standards` - المعايير
- ✅ `Verify` - التحقق
- ✅ `Centers` - المراكز
- ✅ `Contact` - التواصل

---

## 🔍 أدوات البحث المفيدة

### **ابحث عن نص معين:**
```bash
cd /home/user/webapp/src
grep -n "النص" index.tsx
```

### **ابحث في كل النص:**
```bash
grep -i "النص" index.tsx  # case-insensitive
```

### **عدد مرات ظهور نص:**
```bash
grep -c "النص" index.tsx
```

### **ابحث عن كل العناوين:**
```bash
grep -n "<h[1-6]" index.tsx
```

### **ابحث عن كل الأزرار:**
```bash
grep -n "<button\|<a.*class.*button" index.tsx
```

---

## 💡 نصائح مهمة

### ✅ افعل:
- احفظ نسخة احتياطية قبل التعديل الكبير
- اختبر التعديلات محلياً قبل النشر
- استخدم Git لتتبع التغييرات
- اكتب commit messages واضحة

### ❌ لا تفعل:
- لا تعدل HTML structure بدون معرفة
- لا تحذف `class` attributes
- لا تعدل JavaScript code إلا إذا كنت متأكداً
- لا تنشر بدون اختبار

---

## 🆘 إذا واجهت مشكلة

### **استعادة الملف الأصلي:**
```bash
cd /home/user/webapp
git checkout src/index.tsx
```

### **عرض التغييرات:**
```bash
git diff src/index.tsx
```

### **التراجع عن آخر commit:**
```bash
git revert HEAD
```

---

## 📞 المساعدة

إذا كنت تريد تعديل أي قسم، فقط أخبرني:
- "غيّر [النص القديم] إلى [النص الجديد]"
- "عدّل صفحة [اسم الصفحة]"
- "حدّث [القسم] في الموقع"

وسأقوم بالتعديل مباشرة! 😊

---

**آخر تحديث:** 29 ديسمبر 2025
