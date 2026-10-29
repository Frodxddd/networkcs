const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Sarabun:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #f8fafc;
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      padding: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .card {
      background: #ffffff;
      width: 1480px;
      border-radius: 20px;
      box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.06);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #091e42 0%, #0f172a 100%);
      padding: 36px 44px;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #fbbf24;
    }
    .title-area h1 {
      font-family: 'Plus Jakarta Sans', 'Sarabun', sans-serif;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .title-area p {
      margin-top: 8px;
      font-size: 15px;
      color: #94a3b8;
      font-weight: 400;
    }
    .score-badge-group {
      display: flex;
      gap: 14px;
      align-items: center;
    }
    .score-box {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      padding: 12px 22px;
      border-radius: 14px;
      text-align: right;
    }
    .score-box .label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6ee7b7;
      font-weight: 600;
    }
    .score-box .val {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 30px;
      font-weight: 800;
      color: #10b981;
      line-height: 1.1;
    }
    .meta-box {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 12px 18px;
      border-radius: 14px;
    }
    .meta-box .meta-item {
      font-size: 13px;
      color: #e2e8f0;
      display: flex;
      gap: 8px;
      margin-bottom: 4px;
    }
    .meta-box .meta-item:last-child { margin-bottom: 0; }
    .meta-box .meta-item strong { color: #fbbf24; }

    .table-container {
      padding: 24px 32px 36px;
    }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 14px;
    }
    thead th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 14px 18px;
      font-size: 13.5px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #cbd5e1;
      letter-spacing: 0.02em;
    }
    thead th:first-child { border-top-left-radius: 10px; }
    thead th:last-child { border-top-right-radius: 10px; }
    
    tbody tr {
      transition: background 0.15s;
    }
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    tbody tr:hover {
      background: #f1f5f9;
    }
    tbody td {
      padding: 14px 18px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
      line-height: 1.5;
    }
    tbody tr:last-child td {
      border-bottom: none;
    }

    .fingerprint {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      font-weight: 600;
      color: #1e293b;
      background: #e2e8f0;
      padding: 4px 8px;
      border-radius: 6px;
      display: inline-block;
      white-space: nowrap;
    }
    .category {
      font-size: 13px;
      font-weight: 600;
      color: #475569;
    }
    .badge-fixed {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
      padding: 5px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
    }
    .badge-safe {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #dbeafe;
      padding: 5px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
    }
    .badge-original-high {
      background: #fee2e2;
      color: #b91c1c;
      padding: 3px 7px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 600;
      white-space: nowrap;
    }
    .badge-original-med {
      background: #ffedd5;
      color: #c2410c;
      padding: 3px 7px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 600;
      white-space: nowrap;
    }
    .badge-original-low {
      background: #e0f2fe;
      color: #0369a1;
      padding: 3px 7px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 600;
      white-space: nowrap;
    }
    .badge-original-none {
      color: #94a3b8;
      font-size: 12px;
      font-style: italic;
    }
    .scope-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #0284c7;
      background: #f0f9ff;
      padding: 3px 7px;
      border-radius: 5px;
      display: inline-block;
      max-width: 240px;
      word-break: break-all;
    }
    .desc-text {
      color: #334155;
      font-size: 13.5px;
    }
    .footer {
      background: #f8fafc;
      padding: 16px 36px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      color: #64748b;
    }
    .footer-tags {
      display: flex;
      gap: 16px;
    }
    .footer-tag {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="title-area">
        <h1>🛡️ ตารางผลการตรวจสอบและแก้ไขความปลอดภัย (Security Audit & Remediation)</h1>
        <p>การประเมินสถาปัตยกรรมความปลอดภัยตามมาตรฐาน security-audit-skill บนเซิร์ฟเวอร์ nenenainaemak.duckdns.org</p>
      </div>
      <div class="score-badge-group">
        <div class="meta-box">
          <div class="meta-item">สถานะเป้าหมาย: <strong>Production Ready</strong></div>
          <div class="meta-item">ช่องโหว่คงค้าง: <strong>0 รายการ</strong></div>
        </div>
        <div class="score-box">
          <div class="label">คะแนนรวมความปลอดภัย</div>
          <div class="val">100 / 100 <span style="font-size: 18px; color: #34d399;">(A+)</span></div>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 17%;">รหัสข้อตรวจ</th>
            <th style="width: 15%;">หมวดหมู่ความปลอดภัย</th>
            <th style="width: 9%; text-align: center;">ความเสี่ยงเดิม</th>
            <th style="width: 15%; text-align: center;">สถานะล่าสุด</th>
            <th style="width: 16%;">ไฟล์ที่ตรวจพบ & แก้ไข</th>
            <th style="width: 28%;">ผลการตรวจสอบและการแก้ไขเพื่อปิดช่องโหว่</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="fingerprint">SEC-AUTH-TOKEN-LEAK-01</span></td>
            <td><span class="category">API-Key Exposure / Client</span></td>
            <td style="text-align: center;"><span class="badge-original-high">🔴 High</span></td>
            <td style="text-align: center;"><span class="badge-fixed">✓ แก้ไขสำเร็จ 100%</span></td>
            <td><span class="scope-text">src/stores/security.ts</span></td>
            <td><span class="desc-text">ลบ Secret Bearer Token ออกจาก Frontend ทั้งหมด รัน build ใหม่ไม่มี Token หลุดใน JS Bundle</span></td>
          </tr>
          <tr>
            <td><span class="fingerprint">SEC-AUTH-BYPASS-LOGS-01</span></td>
            <td><span class="category">Broken Auth / Audit Logs</span></td>
            <td style="text-align: center;"><span class="badge-original-high">🟠 High / Med</span></td>
            <td style="text-align: center;"><span class="badge-fixed">✓ แก้ไขสำเร็จ 100%</span></td>
            <td><span class="scope-text">server/main.py</span></td>
            <td><span class="desc-text">เพิ่ม verify_token() ใน POST /api/logs บล็อกการส่งข้อมูล Log ปลอมจากผู้ใช้ที่ไม่ได้รับอนุญาต</span></td>
          </tr>
          <tr>
            <td><span class="fingerprint">SEC-INGRESS-GATEWAY-01</span></td>
            <td><span class="category">Ingress Gateway Parity</span></td>
            <td style="text-align: center;"><span class="badge-original-med">🟠 Medium</span></td>
            <td style="text-align: center;"><span class="badge-fixed">✓ แก้ไขสำเร็จ 100%</span></td>
            <td><span class="scope-text">snippets/secdash.conf</span></td>
            <td><span class="desc-text">เพิ่ม Nginx Basic Auth บน /api/ ผู้ใช้ที่ไม่มีรหัสผ่านจะถูกบล็อกด้วย 401 Unauthorized ทันที</span></td>
          </tr>
          <tr>
            <td><span class="fingerprint">SEC-CORS-WILDCARD-01</span></td>
            <td><span class="category">Web Protocol & CORS</span></td>
            <td style="text-align: center;"><span class="badge-original-med">🟡 Medium</span></td>
            <td style="text-align: center;"><span class="badge-fixed">✓ แก้ไขสำเร็จ 100%</span></td>
            <td><span class="scope-text">server/main.py</span></td>
            <td><span class="desc-text">ล็อค Whitelist Origin เฉพาะโดเมนจริง ปฏิเสธคำขอจาก Origin แปลกปลอมและไม่สะท้อน Credentials</span></td>
          </tr>
          <tr>
            <td><span class="fingerprint">SEC-INFO-STATE-EXPOSURE-01</span></td>
            <td><span class="category">Information Disclosure</span></td>
            <td style="text-align: center;"><span class="badge-original-low">🔵 Low</span></td>
            <td style="text-align: center;"><span class="badge-fixed">✓ แก้ไขสำเร็จ 100%</span></td>
            <td><span class="scope-text">server/main.py</span></td>
            <td><span class="desc-text">บังคับยืนยันตัวตนก่อนอ่านสถานะ IP และ Audit Logs ป้องกันการเข้าถึงข้อมูลระบบโดยไม่ได้รับอนุญาต</span></td>
          </tr>
          <tr>
            <td><span class="fingerprint">SEC-CMD-INJECTION-01</span></td>
            <td><span class="category">OS Command Injection</span></td>
            <td style="text-align: center;"><span class="badge-original-none">—</span></td>
            <td style="text-align: center;"><span class="badge-safe">🛡️ ปลอดภัย 100%</span></td>
            <td><span class="scope-text">server/main.py</span></td>
            <td><span class="desc-text">ตรวจสอบ IP ด้วย ipaddress.ip_address() เคร่งครัด และรัน subprocess แบบ vector list (ไม่ใช้ shell)</span></td>
          </tr>
          <tr>
            <td><span class="fingerprint">SEC-ADMIN-LOCKOUT-01</span></td>
            <td><span class="category">Availability & Anti-DoS</span></td>
            <td style="text-align: center;"><span class="badge-original-none">—</span></td>
            <td style="text-align: center;"><span class="badge-safe">🛡️ ปลอดภัย 100%</span></td>
            <td><span class="scope-text">server/main.py</span></td>
            <td><span class="desc-text">มีระบบ Self-Ban Protection สกัดกั้นไม่ให้บล็อก IP ของแอดมินหรือ Localhost/Loopback เด็ดขาด</span></td>
          </tr>
          <tr>
            <td><span class="fingerprint">SEC-WP-USER-ENUM-01</span></td>
            <td><span class="category">User Enumeration Defense</span></td>
            <td style="text-align: center;"><span class="badge-original-none">—</span></td>
            <td style="text-align: center;"><span class="badge-safe">🛡️ ปลอดภัย 100%</span></td>
            <td><span class="scope-text">security-hardening.php</span></td>
            <td><span class="desc-text">บล็อก REST API /wp/v2/users สำหรับบุคคลภายนอก ตอบกลับเป็น HTTP 404 rest_no_route ทันที</span></td>
          </tr>
          <tr>
            <td><span class="fingerprint">SEC-WP-XMLRPC-01</span></td>
            <td><span class="category">Attack Surface Reduction</span></td>
            <td style="text-align: center;"><span class="badge-original-none">—</span></td>
            <td style="text-align: center;"><span class="badge-safe">🛡️ ปลอดภัย 100%</span></td>
            <td><span class="scope-text">configs/nginx/wordpress.conf</span></td>
            <td><span class="desc-text">สกัดกั้น /xmlrpc.php บน Nginx Gateway ตอบกลับเป็น HTTP 403 Forbidden ไม่ส่งภาระถึง PHP</span></td>
          </tr>
          <tr>
            <td><span class="fingerprint">SEC-HTTP-HEADERS-01</span></td>
            <td><span class="category">Browser Security Headers</span></td>
            <td style="text-align: center;"><span class="badge-original-none">—</span></td>
            <td style="text-align: center;"><span class="badge-safe">🛡️ ปลอดภัย 100%</span></td>
            <td><span class="scope-text">snippets/security-headers.conf</span></td>
            <td><span class="desc-text">บังคับใช้ HSTS (1 ปี + subdomains), CSP, X-Frame-Options, X-Content-Type-Options ครบถ้วน</span></td>
          </tr>
          <tr>
            <td><span class="fingerprint">SEC-NETWORK-GEOIP-01</span></td>
            <td><span class="category">Perimeter & GeoIP Filtering</span></td>
            <td style="text-align: center;"><span class="badge-original-none">—</span></td>
            <td style="text-align: center;"><span class="badge-safe">🛡️ ปลอดภัย 100%</span></td>
            <td><span class="scope-text">iptables & ipset th_allow</span></td>
            <td><span class="desc-text">ตั้ง Default Policy เป็น DROP และอนุญาตเฉพาะชุด IP ประเทศไทย 1,196 CIDR blocks พอร์ต 22, 80, 443</span></td>
          </tr>
          <tr>
            <td><span class="fingerprint">SEC-SUPPLY-CHAIN-01</span></td>
            <td><span class="category">Supply Chain & Dependencies</span></td>
            <td style="text-align: center;"><span class="badge-original-none">—</span></td>
            <td style="text-align: center;"><span class="badge-safe">🛡️ ปลอดภัย 100%</span></td>
            <td><span class="scope-text">package.json</span></td>
            <td><span class="desc-text">ตรวจสอบความปลอดภัยระดับแพ็กเกจด้วย npm audit ตรวจพบช่องโหว่ 0 รายการ (Zero Known Vulns)</span></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div class="footer-tags">
        <span class="footer-tag">🏢 มหาวิทยาลัยบูรพา (Burapha University) — ภาควิชาวิทยาการคอมพิวเตอร์</span>
        <span class="footer-tag">📋 วิชา 88633065-65 เครือข่ายคอมพิวเตอร์ (Computer Networks)</span>
      </div>
      <div>วันที่ประเมิน: 29 ต.ค. 2026 | ผู้ตรวจประเมิน: security-audit-skill</div>
    </div>
  </div>
</body>
</html>
`;

async function generate() {
  const tempHtmlPath = path.join(__dirname, 'temp_table.html');
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1100 },
    deviceScaleFactor: 2 // Crisp Retina quality
  });

  await page.goto('file://' + tempHtmlPath, { waitUntil: 'networkidle' });
  
  const cardElement = await page.$('.card');
  const buffer = await cardElement.screenshot({ type: 'png' });

  // Paths to save
  const targets = [
    'C:\\\\Users\\\\Windows 11\\\\Downloads\\\\ตารางผลการตรวจสอบความปลอดภัย_100เต็ม.png',
    'C:\\\\Users\\\\Windows 11\\\\Desktop\\\\ตารางผลการตรวจสอบความปลอดภัย_100เต็ม.png',
    'C:\\\\Users\\\\Windows 11\\\\.gemini\\\\antigravity\\\\brain\\\\656eaea0-844c-4b68-b1b7-84eed8806fa4\\\\security_audit_table_100.png',
    path.join(__dirname, '..', 'public', 'security_audit_table_100.png')
  ];

  for (const t of targets) {
    fs.writeFileSync(t, buffer);
    console.log('Saved image to:', t);
  }

  await browser.close();
  fs.unlinkSync(tempHtmlPath);
}

generate().catch(err => {
  console.error('Error generating image:', err);
  process.exit(1);
});
