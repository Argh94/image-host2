addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const { pathname } = new URL(request.url);
  const GITHUB_REPO = 'Argh94/image-host2'; // آدرس ریپازیتوری خودت
  const GITHUB_TOKEN = 'ghp_your_new_token_here'; // توکن گیت‌هابت (جای اینو با توکن واقعی عوض کن)
  const DOMAIN = 'https://raw.githubusercontent.com';

  // مدیریت رمز عبور
  const PASSWORD = '1234'; // رمز عبور پیش‌فرض (می‌تونی تغییرش بدی)
  const authCookie = request.headers.get('Cookie')?.includes('authenticated=true');

  if (pathname === '/login' && request.method === 'POST') {
    const formData = await request.formData();
    const password = formData.get('password');
    if (password === PASSWORD) {
      return new Response('', {
        status: 302,
        headers: {
          'Location': '/',
          'Set-Cookie': 'authenticated=true; Path=/; HttpOnly; Max-Age=3600' // کوکی برای 1 ساعت
        }
      });
    } else {
      return new Response('رمز عبور اشتباه است', { status: 401 });
    }
  }

  if (!authCookie && pathname !== '/login') {
    return await handleLoginPage();
  }

  switch (pathname) {
    case '/':
      return await handleRootRequest();
    case '/upload':
      return request.method === 'POST' ? await handleUploadRequest(request, GITHUB_TOKEN, GITHUB_REPO, DOMAIN) : new Response('روش مجاز نیست', { status: 405 });
    case '/logout':
      return new Response('', {
        status: 302,
        headers: {
          'Location': '/login',
          'Set-Cookie': 'authenticated=false; Path=/; HttpOnly; Max-Age=0' // حذف کوکی
        }
      });
    default:
      return new Response('مسیر یافت نشد', { status: 404 });
  }
}

async function handleLoginPage() {
  const html = `
  <!DOCTYPE html>
  <html lang="fa">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ورود به آپلودر</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/vazir-font@27.2.0/dist/font-face.css" rel="stylesheet">
    <style>
      body { font-family: 'Vazir', sans-serif; background: #f0f0f0; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
      .login-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
    </style>
  </head>
  <body>
    <div class="login-card">
      <h1 class="text-2xl font-bold mb-4">ورود</h1>
      <form method="POST" action="/login">
        <input type="password" name="password" class="border p-2 rounded w-full mb-4" placeholder="رمز عبور را وارد کنید" required>
        <button type="submit" class="bg-blue-500 text-white p-2 rounded w-full">ورود</button>
      </form>
    </div>
  </body>
  </html>
  `;
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

async function handleRootRequest() {
  const backgroundImages = [
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
    'https://images.unsplash.com/photo-1494790108377-b927f5330c5b',
    'https://images.unsplash.com/photo-1519681393784-d1202679330a',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206',
    'https://images.unsplash.com/photo-1490736142200-216ce25e80c3',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05'
  ];

  const html = `
  <!DOCTYPE html>
  <html lang="fa">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>آپلودر تصاویر با گیت‌هاب</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/vazir-font@27.2.0/dist/font-face.css" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: 'Vazir', sans-serif;
        transition: background-image 1s ease;
        background-size: cover;
        background-position: center;
      }
      .upload-card {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 10px;
        padding: 20px;
        text-align: center;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      .preview-image {
        max-width: 100%;
        max-height: 200px;
        margin-bottom: 10px;
        border-radius: 5px;
        display: none;
      }
      .upload-btn {
        background: #0088cc;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
      .upload-btn:hover {
        background: #006bb3;
      }
      #imageLink {
        display: none;
        margin-top: 15px;
      }
      #copyBtn {
        background: #28a745;
        color: white;
        padding: 8px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
      #copyBtn:hover {
        background: #218838;
      }
      input[type="file"] {
        display: none;
      }
      .file-label {
        background: #f0f0f0;
        padding: 10px;
        border-radius: 5px;
        cursor: pointer;
        margin-bottom: 10px;
        display: inline-block;
      }
      .file-label:hover {
        background: #e0e0e0;
      }
      .footer {
        position: fixed;
        bottom: 10px;
        text-align: center;
        width: 100%;
      }
      .footer a {
        color: #007bff;
        text-decoration: none;
      }
      .footer a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body id="body">
    <div class="upload-card">
      <h1 class="text-2xl font-bold mb-4">آپلود تصویر</h1>
      <img id="previewImage" class="preview-image" alt="پیش‌نمایش تصویر">
      <label for="imageInput" class="file-label">فایل را انتخاب کنید</label>
      <input type="file" name="image" id="imageInput" accept="image/*" required>
      <button id="uploadBtn" class="upload-btn">آپلود</button>
      <div id="imageLink">
        <p class="text-sm text-gray-600 mb-2">لینک تصویر:</p>
        <input type="text" id="linkOutput" class="w-full p-2 border rounded-lg bg-gray-100" readonly>
        <button id="copyBtn">کپی لینک</button>
      </div>
    </div>
    <div class="footer">
      <p>ساخته شده با GitHub <a href="https://github.com/Argh94" target="_blank">Argh94</a></p>
    </div>
    <a href="/logout" style="position: fixed; top: 10px; right: 10px; color: red;">خروج</a>
    <script>
      const uploadBtn = document.getElementById('uploadBtn');
      const imageInput = document.getElementById('imageInput');
      const previewImage = document.getElementById('previewImage');
      const imageLinkDiv = document.getElementById('imageLink');
      const linkOutput = document.getElementById('linkOutput');
      const copyBtn = document.getElementById('copyBtn');
      const body = document.getElementById('body');

      const backgroundImages = [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e',
        'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d',
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
        'https://images.unsplash.com/photo-1494790108377-b927f5330c5b',
        'https://images.unsplash.com/photo-1519681393784-d1202679330a',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        'https://images.unsplash.com/photo-1519046904884-53103b34b206',
        'https://images.unsplash.com/photo-1490736142200-216ce25e80c3',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05'
      ];

      let currentIndex = 0;
      setInterval(() => {
        currentIndex = (currentIndex + 1) % backgroundImages.length;
        body.style.backgroundImage = 'url("' + backgroundImages[currentIndex] + '")';
      }, 6000); // هر 6 ثانیه تغییر کن

      imageInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = function(e) {
            if (e.target.result) {
              previewImage.src = e.target.result;
              previewImage.style.display = 'block';
            } else {
              alert('خطا در خواندن فایل تصویر!');
            }
          };
          reader.onerror = function() {
            alert('خطا در بارگذاری پیش‌نمایش تصویر.');
          };
          reader.readAsDataURL(file);
        } else {
          alert('لطفاً یک فایل تصویر انتخاب کنید!');
        }
      });

      uploadBtn.addEventListener('click', async () => {
        if (!imageInput.files[0]) {
          alert('لطفاً یک تصویر انتخاب کنید!');
          return;
        }
        const formData = new FormData();
        formData.append('image', imageInput.files[0]);
        try {
          const response = await fetch('/upload', { method: 'POST', body: formData });
          const text = await response.text(); // اول متن پاسخ رو می‌خونیم
          let data;
          try {
            data = JSON.parse(text); // سعی می‌کنیم به JSON تبدیل کنیم
          } catch (e) {
            console.log('پاسخ سرور:', text); // برای دیباگ
            alert('خطا در آپلود: پاسخ سرور JSON معتبر نیست - لطفاً توکن یا دسترسی‌ها رو چک کنید. جزئیات: ' + text.substring(0, 100));
            return;
          }
          if (data && data.imageUrl) {
            imageLinkDiv.style.display = 'block';
            linkOutput.value = data.imageUrl;
            previewImage.style.display = 'none';
          } else {
            alert('خطا در آپلود: ' + (data.error || 'پاسخ سرور نامعتبر است'));
          }
        } catch (error) {
          alert('خطا در ارتباط با سرور: ' + error.message);
        }
      });

      copyBtn.addEventListener('click', () => {
        linkOutput.select();
        document.execCommand('copy');
        copyBtn.textContent = 'کپی شد!';
        setTimeout(() => copyBtn.textContent = 'کپی لینک', 2000);
      });
    </script>
  </body>
  </html>
  `;
  return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

async function handleUploadRequest(request, GITHUB_TOKEN, GITHUB_REPO, DOMAIN) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    if (!image) throw new Error('تصویری انتخاب نشده');
    if (image.size > 100 * 1024 * 1024) throw new Error('حجم این فایل بیشتر از 100 مگ است');

    const timestamp = Date.now();
    const extension = image.name.split('.').pop();
    const fileName = `${timestamp}.${extension}`;
    const imageUrl = `${DOMAIN}/${GITHUB_REPO}/main/${fileName}`;

    const imageBuffer = await image.arrayBuffer();
    const content = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${fileName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'image-uploader-worker',
      },
      body: JSON.stringify({
        message: `Upload ${fileName}`,
        content: content,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('پاسخ خطای GitHub:', errorText); // برای دیباگ
      throw new Error('خطا در آپلود به گیت‌هاب: ' + errorText);
    }

    return new Response(JSON.stringify({ imageUrl }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
    }
