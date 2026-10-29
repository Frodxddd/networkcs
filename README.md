# SecDash: Cloud Security Dashboard & Threat Mitigation System

> โครงงานวิชา **88633065-65 Computer Networks (เครือข่ายคอมพิวเตอร์)**  
> ภาควิชาวิทยาการคอมพิวเตอร์ คณะวิทยาการสารสนเทศ มหาวิทยาลัยบูรพา  
> **อาจารย์ผู้สอน:** ผศ.ภูษิต กุลเกษม

---

## 📌 ภาพรวมโครงงาน (Overview)
**SecDash** คือระบบศูนย์เฝ้าระวังความปลอดภัยเครือข่ายอัจฉริยะ (SecOps) และแดชบอร์ดบริหารจัดการไฟร์วอลล์แบบ Real-time บนระบบคลาวด์ Microsoft Azure ทำงานร่วมกับเว็บเซิร์ฟเวอร์ Nginx, ระบบตรวจจับการบุกรุก Fail2ban, Linux iptables/ipset และโมเดลปัญญาประดิษฐ์ (AI SecOps)

### สถาปัตยกรรมระบบ (Architecture)
1. **Network Layer (L3/L4):** กรองแพ็กเก็ตด้วย Linux `iptables` ร่วมกับ `ipset` (GeoIP `th_allow` จำนวน 1,195 CIDR blocks) ด้วยความเร็ว $O(1)$ Hash Table Lookup
2. **Web Layer (L7 Frontend):** Nginx Reverse Proxy รองรับ HTTPS (TLS 1.2/1.3, Let's Encrypt DNS-01 Challenge, HSTS) พร้อม Rate Limiting และสกัดกั้นคำขอขยะ (`/xmlrpc.php`, `?author=`)
3. **Application Layer (L7 Backend):** Nginx Backend (`127.0.0.1:8080`) เชื่อมต่อ PHP-FPM 8.3 และ WordPress โดยแยกขาดจากเครือข่ายภายนอก
4. **Monitoring & AI Automation:** สคริปต์ Python ประมวลผล Nginx Access Log ทุกชั่วโมง สรุปเป็น `report.json` และส่งวิเคราะห์ผ่าน AI SecOps (Read-Only Advisor & Masked IP)
5. **Dashboard & Firewall Control:** เว็บแอปพลิเคชัน Single-Page Application (Vue 3 + TypeScript + Tailwind CSS) ควบคุมกฎไฟร์วอลล์ผ่าน FastAPI พร้อมระบบ **Admin Self-Ban Protection**

---

## 📂 โครงสร้างไดเรกทอรี (Directory Structure)

```text
networkdashboard/
├── wordpress/                    # ไฟล์แกนหลักและปลั๊กอินความปลอดภัยของเว็บ WordPress
│   ├── wp-content/
│   │   └── mu-plugins/           # Must-Use Security Plugins (Zero-Trust, Anti-Enumeration, Strict CORS)
│   ├── wp-config.safe.php        # ไฟล์ตั้งค่า WordPress ฉบับปลอดภัย (เซ็นเซอร์รหัสผ่าน/คีย์ทั้งหมด)
│   └── index.php
├── configs/                      # ไฟล์คอนฟิกเซิร์ฟเวอร์และระบบเครือข่ายความปลอดภัย
│   ├── nginx/                    # คอนฟิก Nginx Reverse Proxy (Frontend & Backend, Security Headers)
│   ├── fail2ban/                 # คอนฟิก Jail & Filters ตรวจจับการบุกรุก
│   └── iptables/                 # สคริปต์เซ็ตอัปไฟร์วอลล์ iptables และ ipset th_allow
├── server/                       # Backend API & Automation Scripts บนเซิร์ฟเวอร์
│   ├── main.py                   # FastAPI Firewall Control API (/api/unban, /api/ban, /api/logs)
│   ├── analyze-logs.py           # สคริปต์ประมวลผล Nginx Access Log เป็น JSON
│   ├── secdash-ai.py             # สคริปต์เชื่อมต่อ AI วิเคราะห์แนวโน้มภัยคุกคาม
│   └── nginx/secdash.conf        # Nginx Configuration Snippet
├── src/                          # Frontend Source Code (Vue 3 + TypeScript)
│   ├── components/               # UI Components (Charts, Modals, Navbar, KPIs)
│   ├── views/                    # หน้าจอหลัก (DashboardView, UnbanView, AuditLogs)
│   ├── stores/                   # สถานะระบบ Pinia (security.ts)
│   └── composables/              # Logic Hooks (useToast, etc.)
├── docs/                         # เอกสารประกอบโครงงาน
│   └── REPORT_REVISION_GUIDE.md  # บทวิเคราะห์และข้อเสนอแนะการปรับปรุงรายงานโครงงาน
└── package.json                  # การตั้งค่า Dependencies ของโปรเจกต์
```

---

## 🚀 การติดตั้งและพัฒนา (Setup & Development)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันโหมด Development (Hot-Reload)
```bash
npm run dev
```

### 3. ตรวจสอบ Type และทดสอบระบบ
```bash
npm run build
```

---

## 🛡️ ฟีเจอร์เด่นด้านความปลอดภัย (Security Features)
* **Real-time Firewall Control:** สั่งลบ/เพิ่มกฎ `iptables -I/D INPUT -s <IP> -j DROP` และ `fail2ban-client unban <IP>` ได้ทันทีผ่านหน้าเว็บ
* **Admin Self-Ban Protection:** ระบบตรวจสอบ IP ของผู้ดูแลระบบอัตโนมัติทั้งในชั้น Frontend และ Backend API เพื่อป้องกันการสั่งบล็อก IP ของตนเอง
* **Persistent Audit Logging:** บันทึกประวัติการกระทำของผู้ดูแลระบบและบอท Fail2ban ลงบนเซิร์ฟเวอร์อย่างถาวร
* **8-Second Timeout Guard:** ควบคุมการเชื่อมต่อ API ด้วย AbortSignal ป้องกันปัญหาหน้าต่างค้างเมื่อสัญญาณเครือข่ายขาดหาย
