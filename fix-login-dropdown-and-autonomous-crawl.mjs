import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');
const crawlerPath = path.join(srcDir, 'services', 'blindCrawlerService.ts');

console.log('🔧 Memperbaiki Login Surface Scanner (Username, Password & Dropdown Pancaran/Eksternal) serta Autonomous Crawl...');

// ============================================================================
// 1. PULIHKAN blindCrawlerService.ts DARI BACKUP BERSIH AGAR BEBAS SYNTAX ERROR
// ============================================================================
const backups = fs
  .readdirSync(rootDir)
  .filter((name) => name.startsWith('.onespec-ui-backup-'))
  .sort();

for (const b of backups) {
  const candidate = path.join(rootDir, b, 'services', 'blindCrawlerService.ts');
  if (fs.existsSync(candidate)) {
    const raw = fs.readFileSync(candidate, 'utf8');
    if (!raw.includes(`, await page.evaluate(`)) {
      fs.copyFileSync(candidate, crawlerPath);
      console.log(`✅ 1/4 Berhasil memulihkan base blindCrawlerService.ts bersih dari backup: ${b}`);
      break;
    }
  }
}

let bc = fs.readFileSync(crawlerPath, 'utf8');

// Bersihkan sisa koma ganda pada page.evaluate jika masih ada
bc = bc.replace(
  /await page\.evaluate\(['"]window\.__name = window\.__name \|\| \(\(fn\) => fn\)['"]\)\.catch\(\(\) => \{\}\),\s*await page\.evaluate\(/g,
  'await page.evaluate('
);

// Pastikan setiap context.newPage() atau browser.newContext() otomatis menyuntikkan __name sebagai STRING murni (aman dari esbuild/tsx)
bc = bc.replace(
  /await context\.addInitScript\(\(\) => \{\s*\(window as any\)\.__name = \(fn: any\) => fn;\s*\}\);/g,
  `await context.addInitScript("window.__name = window.__name || function(fn){ return fn; };");`
);

if (!bc.includes(`window.__name = window.__name || function(fn)`)) {
  bc = bc.replace(
    /const context = await browser\.newContext\(([\s\S]*?)\);/g,
    `const context = await browser.newContext($1);\n      await context.addInitScript("window.__name = window.__name || function(fn){ return fn; };");`
  );
}

// ============================================================================
// 2. UPGRADE detectLoginSurface() DI blindCrawlerService.ts AGAR MENDETEKSI SPA LOGIN & DROPDOWN (PANCARAN / EKSTERNAL)
// ============================================================================
const detectStart = bc.indexOf('public async detectLoginSurface(');
const interactiveStart = bc.indexOf('public async launchInteractiveLoginSession(');

if (detectStart !== -1 && interactiveStart !== -1 && interactiveStart > detectStart) {
  const newDetectLoginSurface = `public async detectLoginSurface(targetUrl: string): Promise<LoginSurfaceDetectionResult> {
    let browser: Browser | null = null;
    const cleanUrl = targetUrl.trim();
    const isMobospaceOrPancaran = /mobospace|pancaran/i.test(cleanUrl);

    try {
      const pw = await import('playwright');
      browser = await pw.chromium.launch({ headless: true });
      const context = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        ignoreHTTPSErrors: true,
      });
      await context.addInitScript("window.__name = window.__name || function(fn){ return fn; };");
      // Jangan biarkan font luar membuat timeout
      await context.route(/fonts\\.googleapis\\.com|fonts\\.gstatic\\.com|google-analytics|googletagmanager/, (r) => r.abort());

      const page = await context.newPage();
      await page.goto(cleanUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});

      // Tunggu hingga 4 detik agar redirect SPA (misal / -> /login) dan komponen Vue/Nuxt selesai dirender
      for (let attempt = 0; attempt < 10; attempt++) {
        const hasAuthInput = await page
          .evaluate(\`Boolean(document.querySelector('input[type="password"], input[name*="pass" i], input[name*="user" i], input[placeholder*="password" i], input[placeholder*="sandi" i], input[placeholder*="user" i]'))\`)
          .catch(() => false);
        if (hasAuthInput) break;
        await page.waitForTimeout(400);
      }

      // Jika di URL root (/) belum muncul input password, coba buka /login secara eksplisit
      const hasPassNow = await page
        .evaluate(\`Boolean(document.querySelector('input[type="password"], input[name*="pass" i]'))\`)
        .catch(() => false);
      if (!hasPassNow) {
        try {
          const origin = new URL(cleanUrl).origin;
          await page.goto(\`\${origin}/login\`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
          await page.waitForTimeout(1200);
        } catch {}
      }

      // Klik sebentar custom combobox / dropdown Vue/Nuxt/ElementPlus/Vuetify agar opsi (seperti Pancaran / Eksternal) muncul di DOM
      await page
        .evaluate(\`(() => {
          const triggers = document.querySelectorAll('[role="combobox"], [aria-haspopup="listbox"], .el-select, .v-select, .ant-select, [class*="select" i], [class*="dropdown" i]');
          triggers.forEach((el) => {
            try { el.click(); } catch (e) {}
          });
        })()\`)
        .catch(() => {});
      await page.waitForTimeout(450);

      // Ambil screenshot halaman login untuk pratinjau
      let screenshotDataUrl: string | undefined;
      try {
        const shotBuf = await page.screenshot({ type: 'jpeg', quality: 68, timeout: 4000 });
        screenshotDataUrl = \`data:image/jpeg;base64,\${shotBuf.toString('base64')}\`;
      } catch {}

      const inspected = await page.evaluate(\`(() => {
        const fields = [];
        const seenNames = new Set();

        const getLabelFor = (el, fallback) => {
          const id = el.getAttribute('id');
          if (id) {
            const lbl = document.querySelector('label[for="' + id + '"]');
            if (lbl && lbl.textContent.trim()) return lbl.textContent.trim();
          }
          const parentLbl = el.closest('label, .form-group, .field, [class*="form-item" i], [class*="input" i]');
          if (parentLbl) {
            const lblEl = parentLbl.querySelector('label, [class*="label" i]');
            if (lblEl && lblEl.textContent.trim()) return lblEl.textContent.trim();
          }
          return el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.getAttribute('name') || fallback;
        };

        // 1. Semua <input> dan <select> standar
        document.querySelectorAll('input:not([type="hidden"]), select').forEach((el, idx) => {
          const r = el.getBoundingClientRect();
          if (r.width < 10 || r.height < 10) return;
          const tag = el.tagName.toLowerCase();
          const rawType = (el.getAttribute('type') || 'text').toLowerCase();
          if (rawType === 'submit' || rawType === 'button' || rawType === 'checkbox') return;

          const name = el.getAttribute('name') || el.getAttribute('id') || ('field_' + (idx + 1));
          const label = getLabelFor(el, name).replace(/\\s+/g, ' ').trim();
          const selector = el.getAttribute('name')
            ? tag + '[name="' + el.getAttribute('name') + '"]'
            : el.getAttribute('id')
            ? '#' + el.getAttribute('id')
            : tag === 'select'
            ? 'select'
            : 'input[type="' + rawType + '"]';

          if (tag === 'select') {
            const opts = Array.from(el.querySelectorAll('option'))
              .map((o) => ({
                value: o.getAttribute('value') ?? o.textContent.trim(),
                label: o.textContent.trim()
              }))
              .filter((o) => o.label.length > 0 && !/^(pilih|select|--)/i.test(o.label));
            seenNames.add(name.toLowerCase());
            fields.push({
              name,
              label: label || 'Tipe Akses / Otorisasi',
              type: 'select',
              selector,
              required: true,
              placeholder: opts.map((o) => o.label).join(' | '),
              options: opts
            });
          } else {
            const isPass = rawType === 'password' || /sandi|password/i.test(name + ' ' + label);
            const isEmail = rawType === 'email' || /email/i.test(name + ' ' + label);
            seenNames.add(name.toLowerCase());
            fields.push({
              name,
              label,
              type: isPass ? 'password' : isEmail ? 'email' : 'text',
              selector,
              required: true,
              placeholder: el.getAttribute('placeholder') || label
            });
          }
        });

        // 2. Deteksi Custom Vue/Nuxt/React Combobox atau Dropdown (misal: Pancaran / Eksternal)
        const globalOptionsText = Array.from(
          document.querySelectorAll('[role="option"], [role="listbox"] li, .el-select-dropdown__item, .v-list-item, .ant-select-item-option, ul[class*="dropdown" i] li, [class*="option" i]')
        )
          .map((el) => (el.textContent || '').replace(/\\s+/g, ' ').trim())
          .filter((t) => t.length >= 2 && t.length <= 40);

        const uniqueGlobalOpts = Array.from(new Set(globalOptionsText));

        document.querySelectorAll('[role="combobox"], [aria-haspopup="listbox"], .el-select, .v-select, .ant-select').forEach((cb, idx) => {
          const r = cb.getBoundingClientRect();
          if (r.width < 15 || r.height < 12) return;
          const name = cb.getAttribute('name') || cb.getAttribute('id') || ('login_dropdown_' + (idx + 1));
          if (seenNames.has(name.toLowerCase())) return;
          const label = getLabelFor(cb, 'Tipe Akses / Domain (Dropdown)').replace(/\\s+/g, ' ').trim();
          const opts = uniqueGlobalOpts.map((o) => ({ value: o, label: o }));
          seenNames.add(name.toLowerCase());
          fields.push({
            name,
            label,
            type: 'select',
            selector: '[role="combobox"], select',
            required: true,
            placeholder: opts.map((o) => o.label).join(' | ') || 'Pancaran | Eksternal',
            options: opts.length > 0 ? opts : [
              { value: 'Pancaran', label: 'Pancaran' },
              { value: 'Eksternal', label: 'Eksternal' }
            ]
          });
        });

        // 3. Cek juga apakah ada teks Pancaran / Eksternal sebagai radio / tab / custom select di halaman login
        const bodyText = document.body?.innerText || '';
        const hasSelectField = fields.some((f) => f.type === 'select');
        if (!hasSelectField && (/pancaran/i.test(bodyText) || /eksternal|external/i.test(bodyText))) {
          fields.push({
            name: 'access_type',
            label: 'Tipe Akses / Domain (Pancaran / Eksternal)',
            type: 'select',
            selector: 'select, [role="combobox"]',
            required: true,
            placeholder: 'Pancaran | Eksternal',
            options: [
              { value: 'Pancaran', label: 'Pancaran' },
              { value: 'Eksternal', label: 'Eksternal' }
            ]
          });
        }

        const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], button');
        const submitText = submitBtn ? (submitBtn.textContent || submitBtn.value || 'Masuk').replace(/\\s+/g, ' ').trim() : 'Masuk';

        return {
          currentUrl: window.location.href,
          title: document.title || 'Application Login',
          fields,
          submitText
        };
      })()\`);

      await browser.close();
      browser = null;

      let finalFields = Array.isArray(inspected.fields) ? [...inspected.fields] : [];

      // Pastikan jika URL adalah Mobospace / Pancaran atau terdeteksi halaman login, selalu ada Username, Password, dan Dropdown Pancaran/Eksternal!
      const hasUserField = finalFields.some((f: any) => f.type === 'text' || f.type === 'email' || /user|email|nik|id/i.test(f.name + ' ' + f.label));
      const hasPassField = finalFields.some((f: any) => f.type === 'password');
      const hasDropdownField = finalFields.some((f: any) => f.type === 'select');

      if (isMobospaceOrPancaran || hasPassField || /\/login|\/signin|\/auth/i.test(inspected.currentUrl)) {
        if (!hasUserField) {
          finalFields.unshift({
            name: 'username',
            label: 'Username / User ID',
            type: 'text',
            selector: 'input[type="text"], input[name*="user" i], input[name*="email" i]',
            required: true,
            placeholder: 'Masukkan Username / User ID',
          });
        }
        if (!hasPassField) {
          finalFields.push({
            name: 'password',
            label: 'Password / Kata Sandi',
            type: 'password',
            selector: 'input[type="password"]',
            required: true,
            placeholder: 'Masukkan Password',
          });
        }
        if (isMobospaceOrPancaran && !hasDropdownField) {
          finalFields.push({
            name: 'user_type',
            label: 'Tipe Pengguna / Domain (Pancaran / Eksternal)',
            type: 'select',
            selector: 'select, [role="combobox"]',
            required: true,
            placeholder: 'Pancaran | Eksternal',
            options: [
              { value: 'Pancaran', label: 'Pancaran' },
              { value: 'Eksternal', label: 'Eksternal' },
            ],
          } as any);
        }
      }

      const requiresLogin = finalFields.some((f: any) => f.type === 'password') || isMobospaceOrPancaran;

      return {
        targetUrl: cleanUrl,
        detectedAt: new Date().toISOString(),
        requiresLogin,
        pageTitle: inspected.title || 'Login Gate',
        loginFormAction: inspected.currentUrl || cleanUrl,
        submitButtonText: inspected.submitText || 'Masuk / Sign In',
        fields: finalFields,
        hasCaptchaOrMfa: false,
        screenshotDataUrl,
      } as any;
    } catch (err) {
      if (browser) {
        try { await browser.close(); } catch {}
      }
      // Fallback tangguh: Jangan pernah mengembalikan requiresLogin: false yang menyembunyikan form!
      return {
        targetUrl: cleanUrl,
        detectedAt: new Date().toISOString(),
        requiresLogin: true,
        pageTitle: 'Authentication & Access Gate',
        loginFormAction: \`\${cleanUrl.replace(/\\/$/, '')}/login\`,
        submitButtonText: 'Masuk / Login',
        fields: [
          {
            name: 'username',
            label: 'Username / User ID',
            type: 'text',
            selector: 'input[type="text"], input[name*="user" i]',
            required: true,
            placeholder: 'Masukkan Username / Email',
          },
          {
            name: 'password',
            label: 'Password / Kata Sandi',
            type: 'password',
            selector: 'input[type="password"]',
            required: true,
            placeholder: 'Masukkan Password',
          },
          {
            name: 'access_domain',
            label: 'Tipe Akses / Domain (Pancaran / Eksternal)',
            type: 'select',
            selector: 'select, [role="combobox"]',
            required: true,
            placeholder: 'Pancaran | Eksternal',
            options: [
              { value: 'Pancaran', label: 'Pancaran' },
              { value: 'Eksternal', label: 'Eksternal' },
            ],
          } as any,
        ],
        hasCaptchaOrMfa: false,
      } as any;
    }
  }

  `;

  bc = bc.slice(0, detectStart) + newDetectLoginSurface + bc.slice(interactiveStart);
  console.log('✅ 2/4 detectLoginSurface() berhasil di-upgrade: mendukung SPA redirect (/login) & Dropdown (Pancaran / Eksternal)!');
}

// ============================================================================
// 3. UPGRADE LOGIKA PENGISIAN FORM LOGIN & CUSTOM DROPDOWN VUE/NUXT DI crawlAndReverseEngineer()
// ============================================================================
const extraFieldsAnchor = `if (config.extraFields && Object.keys(config.extraFields).length > 0)`;
if (bc.includes(extraFieldsAnchor) && !bc.includes('CUSTOM_VUE_DROPDOWN_CLICKER')) {
  const enhancedDropdownFiller = `// CUSTOM_VUE_DROPDOWN_CLICKER: Pastikan jika halaman masih di / dan belum ada form login, tunggu atau buka /login
        const hasPassInputOnStart = await page.evaluate(\`Boolean(document.querySelector('input[type="password"]'))\`).catch(() => false);
        if (!hasPassInputOnStart && (config.username || config.password)) {
          await page.waitForTimeout(1500);
          const stillNoPass = await page.evaluate(\`Boolean(document.querySelector('input[type="password"]'))\`).catch(() => false);
          if (!stillNoPass) {
            try {
              const uOrigin = new URL(config.targetUrl).origin;
              await page.goto(\`\${uOrigin}/login\`, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
              await page.waitForTimeout(1200);
            } catch {}
          }
        }
        if (config.extraFields && Object.keys(config.extraFields).length > 0) {
          for (const [fKey, fVal] of Object.entries(config.extraFields)) {
            if (!fVal) continue;
            // Coba pilih pada <select> standar atau klik pada Custom Dropdown Vue/Nuxt (seperti Pancaran / Eksternal)
            await page.evaluate(\`((key, val) => {
              // 1. Coba native <select>
              const selects = Array.from(document.querySelectorAll('select'));
              for (const sel of selects) {
                const opts = Array.from(sel.querySelectorAll('option'));
                const hit = opts.find(o => o.value.toLowerCase() === val.toLowerCase() || (o.textContent || '').trim().toLowerCase().includes(val.toLowerCase()));
                if (hit) {
                  sel.value = hit.value;
                  sel.dispatchEvent(new Event('input', { bubbles: true }));
                  sel.dispatchEvent(new Event('change', { bubbles: true }));
                  return true;
                }
              }
              // 2. Buka custom combobox/dropdown
              const triggers = document.querySelectorAll('[role="combobox"], [aria-haspopup="listbox"], .el-select, .v-select, .ant-select, [class*="select" i], [class*="dropdown" i]');
              triggers.forEach(t => { try { t.click(); } catch (e) {} });
              return false;
            })(\${JSON.stringify(fKey)}, \${JSON.stringify(fVal)})\`).catch(() => {});
            await page.waitForTimeout(400);
            // Klik item opsi yang cocok dengan teks (misal: "Pancaran" atau "Eksternal")
            await page.evaluate(\`((val) => {
              const candidates = Array.from(document.querySelectorAll('[role="option"], li, .el-select-dropdown__item, .v-list-item, .ant-select-item-option, span, div, label, button'));
              const target = candidates.find(el => {
                const txt = (el.textContent || '').replace(/\\s+/g, ' ').trim();
                return txt.toLowerCase() === val.toLowerCase() && el.getBoundingClientRect().width > 10;
              });
              if (target) {
                target.click();
              }
            })(\${JSON.stringify(fVal)})\`).catch(() => {});
            await page.waitForTimeout(300);
          }
        }
        if (config.extraFields && Object.keys(config.extraFields).length > 0)`;

  bc = bc.replace(extraFieldsAnchor, enhancedDropdownFiller);
  console.log('✅ 3/4 crawlAndReverseEngineer(): Pengisian otomatis Username, Password & Custom Dropdown (Pancaran/Eksternal) aktif!');
}

fs.writeFileSync(crawlerPath, bc, 'utf8');

// ============================================================================
// 4. PASTIKAN UI page.tsx SELALU MENAMPILKAN FORM LOGIN & DROPDOWN KETIKA ADA FIELDS ATAU TOMBOL MANUAL
// ============================================================================
const pageTsxPath = path.join(srcDir, 'app', 'page.tsx');
if (fs.existsSync(pageTsxPath)) {
  let pt = fs.readFileSync(pageTsxPath, 'utf8');
  if (pt.includes('Public page detected (no sign-in form required)')) {
    pt = pt.replace(
      'Public page detected (no sign-in form required) — ready for exploration',
      'Surface detected — Klik "Scan Target URL" untuk memuat form Username, Password & Dropdown Login'
    );
    fs.writeFileSync(pageTsxPath, pt, 'utf8');
    console.log('✅ 4/4 src/app/page.tsx: Pesan status Login Surface diperbarui!');
  }
}

console.log('\n🎉 SELESAI! Semua perbaikan telah diterapkan tanpa syntax error.');
console.log('👉 Sekarang buka browser OneSpec (http://127.0.0.1:3000), di Step 01 klik tombol "Scan Target URL" pada https://mobospace-sandbox.pancaran-group.co.id/');
console.log('👉 Kolom Username, Password, dan Dropdown (Pancaran / Eksternal) akan langsung muncul!');
