# รายงานโครงงานเครือข่ายคอมพิวเตอร์ (Computer Networks Project)
## การติดตั้งเว็บเซิร์ฟเวอร์และระบบรักษาความปลอดภัยบนคลาวด์
### ด้วย Microsoft Azure, Ubuntu Server, Nginx, WordPress และ SecDash

> **รายวิชา:** 88633065-65 Computer Networks (เครือข่ายคอมพิวเตอร์)  
> **ภาควิชาวิทยาการคอมพิวเตอร์ คณะวิทยาการสารสนเทศ มหาวิทยาลัยบูรพา**  
> **ภาคเรียนที่ 1 ปีการศึกษา 2569**  
> **เสนอ:** ผศ.ภูสิต กุลเกษม  

---

### 👥 คณะผู้จัดทำ (Project Members)

| ลำดับ | ชื่อ - นามสกุล | รหัสนิสิต | สาขาวิชา |
| :---: | :--- | :---: | :--- |
| 1 | นายศิวกร พวงเงินดี | 67160056 | วิทยาการคอมพิวเตอร์ |
| 2 | นายกฤตภาส มีบุญล้ำ | 67160058 | วิทยาการคอมพิวเตอร์ |
| 3 | นายณัฐชนน แสงแก้ว | 67160090 | วิทยาการคอมพิวเตอร์ |
| 4 | นายธรรมวุติ แสนสา | 67160095 | วิทยาการคอมพิวเตอร์ |
| 5 | นายปฐวี ฤทธิ์ประเสริฐ | 67160097 | วิทยาการคอมพิวเตอร์ |
| 6 | นางสาวศศิมล โสภากุล | 67160106 | วิทยาการคอมพิวเตอร์ |
| 7 | นายกรพบ บุญล้อม | 67160246 | วิทยาการคอมพิวเตอร์ |

---

## 🌐 ลิงก์ระบบที่เปิดให้บริการจริง (Live Deployments)

อาจารย์และผู้ประเมินสามารถเข้าชมและทดสอบระบบที่เปิดให้บริการจริงบน Cloud Infrastructure (Microsoft Azure) ได้ดังนี้:

| บริการ / เว็บไซต์ | ลิงก์เข้าใช้งาน (URL) | รายละเอียดและสถานะการทำงาน |
| :--- | :--- | :--- |
| 🏫 **เว็บหลัก (CS BUU Web Portal)** | 🔗 **[https://nenenainaemak.duckdns.org/](https://nenenainaemak.duckdns.org/)** | หน้าเว็บหลักของหลักสูตรวิทยาการคอมพิวเตอร์ มหาวิทยาลัยบูรพา พัฒนาด้วยเทคโนโลยีโมเดล 3D แบบเรียลไทม์ (Three.js) และระบบ **Continuous Scroll-Driven Scrubbing Animation** การ์ดและชิ้นส่วน 3D บินเข้า-ออกตามการเลื่อนของผู้ใช้จริง |
| 🛡️ **แดชบอร์ดความปลอดภัย (SecDash)** | 🔗 **[https://nenenainaemak.duckdns.org/secdash/](https://nenenainaemak.duckdns.org/secdash/)** | ศูนย์เฝ้าระวังความปลอดภัยอัจฉริยะ (SecOps) แสดงสถิติทราฟฟิก วิเคราะห์ภัยคุกคามด้วย AI จัดการบล็อก/ปลดแบน IP ผ่าน Linux iptables & Fail2ban พร้อมระบบ **Admin Self-Ban Protection** |
| 💻 **เว็บหลัก (Local Development)** | `http://localhost:8080/portal_code.html` | เซิร์ฟเวอร์ทดสอบ Local สำหรับรันโค้ด `wordpress/portal_code.html` แบบ Offline |
| 💻 **แดชบอร์ด (Local Development)** | `http://localhost:5173/` | Frontend Dev Server (Vite Hot-Reload) |

---

## 📄 เล่มรายงานโครงงานฉบับสมบูรณ์ (PDF Report)

เอกสารรายงานฉบับสมบูรณ์ (จำนวน 23 หน้า) ถูกจัดเก็บอยู่ในไดเรกทอรี [`docs/`](docs/) สามารถเปิดอ่านและดาวน์โหลดได้โดยตรง:

* 📥 **[ดาวน์โหลดเล่มรายงานโครงงานฉบับสมบูรณ์ (PDF - Direct Link)](docs/Computer_Networks_Cloud_Security_Report_CS_BUU.pdf)**
* 📥 **[ดาวน์โหลดเล่มรายงานภาษาไทย (PDF)](docs/รายงานโครงงานเครือข่ายคอมพิวเตอร์_SecWeb_SecDash.pdf)**

---

## 📌 ภาพรวมสถาปัตยกรรมระบบ (System Architecture)

โครงงานนี้ประยุกต์ใช้แนวคิด **แบบจำลอง OSI 7 Layers** และ **TCP/IP Model** ในสถานการณ์จริงบนระบบคลาวด์ โดยออกแบบระบบการป้องกันแบบหลายชั้น (**Defense-in-Depth**):

```text
[ ผู้ใช้ทั่วไป / ผู้โจมตี (Internet Client) ]
                     │
                     ▼ (DNS Query: UDP/TCP Port 53)
   [ DuckDNS Domain: nenenainaemak.duckdns.org ]
                     │
                     ▼ (Public IP: Microsoft Azure VM)
   [ Azure Network Security Group (NSG) ]
                     │
                     ▼
   [ ชั้นที่ 1: Linux Kernel Firewall (L3/L4) ]
   ├── Default Policy: INPUT DROP
   ├── ipset th_allow: กรองเฉพาะช่วง IP ในประเทศไทย (1,196 CIDR blocks)
   └── หากเป็นทราฟฟิกต่างประเทศ -> DROP ทิ้งทันที (Connection Timeout)
                     │ (อนุญาต Port 22, 80, 443 เฉพาะในไทย)
                     ▼
   [ ชั้นที่ 2: Nginx Frontend / Edge Reverse Proxy (L7) ]
   ├── Port 443 HTTPS (TLS 1.2 / TLS 1.3 - Let's Encrypt DNS-01 Challenge)
   ├── HSTS (max-age=31536000), CSP, X-Frame-Options, X-Content-Type-Options
   ├── Nginx Fast Micro-Cache (HIT 0.005s สำหรับหน้าที่แคชได้)
   ├── Rate Limiting (จำกัดความถี่คำขอบน /wp-login.php)
   └── บล็อกเส้นทางอันตราย: /xmlrpc.php (HTTP 403), ?author= (HTTP 403)
                     │ (Proxy Pass 127.0.0.1:8080)
                     ▼
   [ ชั้นที่ 3: Nginx Backend & Application Runtime (L7) ]
   ├── Backend Nginx (ฟังเฉพาะ Loopback 127.0.0.1:8080 แยกขาดจากภายนอก)
   ├── PHP-FPM 8.3 (เชื่อมต่อผ่าน Unix Domain Socket)
   ├── WordPress Core พร้อม Must-Use Security Plugins (mu-plugins)
   └── MySQL 8.0 Database (เชื่อมต่อภายในเครื่อง Port 3306 เท่านั้น)

[ ศูนย์เฝ้าระวังและการควบคุม (SecOps Control Plane) ]
├── Nginx Access Log Analysis: สคริปต์ Python สรุปสถิติคำขอทุกชั่วโมงเป็น report.json
├── AI SecOps Threat Advisor: โมเดล AI วิเคราะห์แนวโน้มภัยคุกคามแบบ Read-Only และ Mask IP
├── SecDash UI: แดชบอร์ดตรวจสอบสถานะและควบคุมไฟร์วอลล์แบบ Real-time
└── FastAPI Daemon (/opt/secdash-api): ควบคุม iptables/fail2ban พร้อมบันทึก Audit Logs
```

---

## 📂 โครงสร้าง Source Code และ Configuration Files

คลังข้อมูลนี้จัดเก็บ Source Code และไฟล์คอนฟิกทุกส่วนไว้อย่างเป็นหมวดหมู่ ครบถ้วนตามมาตรฐานการส่งโครงงาน:

```text
networkcs/
├── docs/                                  # เล่มรายงานโครงงาน
│   ├── Computer_Networks_Cloud_Security_Report_CS_BUU.pdf  # เล่มรายงานฉบับสมบูรณ์ (PDF)
│   └── รายงานโครงงานเครือข่ายคอมพิวเตอร์_SecWeb_SecDash.pdf # เล่มรายงานฉบับสมบูรณ์ (ชื่อภาษาไทย)
│
├── configs/                               # ไฟล์คอนฟิกเซิร์ฟเวอร์และระบบเครือข่าย
│   ├── nginx/                             # คอนฟิก Nginx Web Server & Reverse Proxy
│   │   ├── wordpress.conf                 # คอนฟิก Frontend HTTPS (พอร์ต 443), Cache, Rate Limit
│   │   ├── wp-backend.conf                # คอนฟิก Backend Nginx (127.0.0.1:8080) และ FastCGI
│   │   └── snippets/
│   │       ├── security-headers.conf      # HSTS, CSP, X-Frame, X-Content-Type, Permissions Policy
│   │       └── secdash.conf               # Nginx Snippet สำหรับเสิร์ฟ SecDash UI และ Proxy /api/
│   ├── fail2ban/                          # คอนฟิก Intrusion Prevention System
│   │   ├── jail.local                     # การตั้งค่า Jails (sshd, wp-login, nginx-http-auth)
│   │   └── filter.d/
│   │       └── wp-login.conf              # Regex กรองความถี่การล็อกอินผิดพลาด
│   ├── iptables/                          # กฎไฟร์วอลล์ระดับเคอร์เนล Linux
│   │   └── setup_firewall.sh              # สคริปต์ตั้งค่านโยบาย DROP, ipset th_allow 1,196 ช่วง
│   └── systemd/                           # การจัดการ Services บนเซิร์ฟเวอร์
│       └── secdash-api.service            # Systemd Service Unit สำหรับ FastAPI Control Daemon
│
├── server/                                # Backend API & สคริปต์เฝ้าระวังอัตโนมัติ
│   ├── main.py                            # FastAPI Control API (/api/ban, /api/unban, /api/logs)
│   ├── analyze-logs.py                    # สคริปต์วิเคราะห์ Nginx Access Log เป็น JSON ทุกชั่วโมง
│   └── secdash-ai.py                      # สคริปต์เชื่อมต่อ AI ให้คำแนะนำเชิงวิเคราะห์แบบ Read-Only
│
├── wordpress/                             # Source Code หน้าเว็บหลัก CS BUU Portal
│   ├── portal_code.html                   # โค้ดหน้าเว็บหลัก CS BUU (Three.js 3D + Scroll Scrubbing)
│   ├── page_98_home.html                  # เพย์โหลดหน้าแรก (Gutenberg HTML Block) บน WordPress
│   ├── buu-style.css                      # คอมไพล์ Static Tailwind CSS ปลอดภัย ไร้ Console Warning
│   ├── images/                            # รูปภาพตราสัญลักษณ์มหาวิทยาลัย คณาจารย์ และข่าวกิจกรรม
│   ├── wp-config.safe.php                 # ไฟล์ตั้งค่า WordPress ฉบับเซ็นเซอร์ข้อมูลลับ
│   └── wp-content/
│       └── mu-plugins/                    # Must-Use Plugins เสริมความปลอดภัย
│           ├── proxy-https.php            # บังคับ HTTPS หลัง Reverse Proxy
│           └── security-hardening.php     # ปิด XML-RPC, ซ่อนเวอร์ชัน WP, ป้องกัน User Enum, CORS
│
├── src/                                   # Source Code แดชบอร์ด SecDash (Frontend SPA)
│   ├── components/                        # คอมโพเนนต์ UI (StatCard, AuditTable, Modals, Navbar)
│   ├── views/                             # หน้าหลัก (DashboardView, UnbanView, AuditView)
│   ├── stores/                            # State Management Pinia (security.ts)
│   └── types/                             # TypeScript Interface คำจำกัดความโครงสร้างข้อมูล
│
├── scripts/                               # สคริปต์ตรวจสอบและทดสอบระบบอัตโนมัติ
│   ├── run_security_recheck.py            # สคริปต์ตรวจความปลอดภัยซ้ำตามมาตรฐาน Security Audit
│   └── verify_live_wp.cjs                 # สคริปต์ Playwright ตรวจสอบความถูกต้องบน Production
│
└── package.json                           # การตั้งค่า Dependencies ของโปรเจกต์ Frontend
```

---

## 🛡️ สรุปผลการทดสอบความปลอดภัยและการทำงานจริง (Verification & Audit)

1. **การกรองทราฟฟิก GeoIP (L3/L4 Firewall):**
   - อนุญาตเฉพาะทราฟฟิกจากประเทศไทยผ่าน `ipset match-set th_allow` (1,196 CIDR blocks)
   - ทราฟฟิกจากต่างประเทศจะถูกปฏิเสธด้วยสถานะ Connection Timeout ทันทีที่ระดับ Linux Kernel
2. **การป้องกันเว็บเซิร์ฟเวอร์ (L7 Nginx & WordPress):**
   - เข้ารหัส HTTPS 100% ด้วยใบรับรอง Let's Encrypt ผ่าน **DNS-01 Challenge**
   - เปิดใช้งาน **HSTS (`max-age=31536000`)**, X-Frame-Options (`SAMEORIGIN`), X-Content-Type-Options (`nosniff`)
   - บล็อกเส้นทางโจมตี `/xmlrpc.php` (HTTP 403), ป้องกัน User Enumeration `/?author=1` (HTTP 403), และซ่อนไฟล์ Sensitive Configurations (HTTP 404)
3. **ระบบจัดการไฟร์วอลล์และ Audit Logging (SecDash Control API):**
   - สั่งบล็อกหรือปลดแบน IP ผ่านหน้าเว็บได้แบบ Real-time โดยส่งคำสั่งตรงไปยัง `iptables -I/D INPUT` และ `fail2ban-client unban`
   - มีระบบ **Admin Self-Ban Protection** ป้องกันไม่ให้แอดมินเผลอสั่งบล็อก IP ของตัวเอง
   - บันทึกประวัติการแก้ไขลงใน **Audit Logs** อย่างละเอียด โดยบันทึกเฉพาะ IP ของผู้ดำเนินการและไม่มีการบันทึกรหัสผ่านหรือข้อมูลลับรั่วไหล
4. **ประสิทธิภาพการแสดงผลและการตอบสนองต่อผู้ใช้ (Continuous Scroll Engine):**
   - หน้าเว็บหลัก CS BUU ใช้ระบบคำนวณพิกัด 3D แบบ Lerp Smoothing บน `requestAnimationFrame` ที่ทำงานตามการเลื่อน Scroll ของผู้ใช้จริงแบบ 1:1 ปราศจากอาการกระตุก (60–120 FPS)

---

## 🚀 การติดตั้งและรันในโหมด Development (Local Run)

### 1. การรันหน้าเว็บหลัก CS BUU (Local Portal)
```bash
# รัน HTTP Server ในไดเรกทอรี wordpress/
python -m http.server 8080 --directory wordpress
# เปิดเบราว์เซอร์: http://localhost:8080/portal_code.html
```

### 2. การรันแดชบอร์ด SecDash (Local UI)
```bash
# ติดตั้ง dependencies
npm install

# รันในโหมด Development
npm run dev
# เปิดเบราว์เซอร์: http://localhost:5173/

# บิลด์สำหรับ Production
npm run build
```

---

*จัดทำโดย คณะผู้จัดทำโครงงานวิชา Computer Networks (88633065-65) ภาควิชาวิทยาการคอมพิวเตอร์ คณะวิทยาการสารสนเทศ มหาวิทยาลัยบูรพา*
