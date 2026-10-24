# SecDash: Server Architecture & API Integration Specification

> **เอกสารสรุปสถาปัตยกรรมเซิร์ฟเวอร์ ข้อมูลที่ส่งออก และข้อกำหนด API สำหรับทีมพัฒนา SecDash**  
> *เป้าหมายระบบ:* เว็บไซต์หลักสูตร วท.บ. วิทยาการคอมพิวเตอร์ คณะวิทยาการสารสนเทศ มหาวิทยาลัยบูรพา (`https://nenenainaemak.duckdns.org`)  
> *อัปเดตล่าสุด:* 24 ตุลาคม 2026

---

## 1. ภาพรวมสถาปัตยกรรมระบบ (System Architecture)

```
[ ผู้ใช้งาน / อินเทอร์เน็ต ]
           │
           ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Ubuntu Server (Linux 7.0 Azure x86_64) • nw-server                     │
│                                                                        │
│ 1. KERNEL LAYER (iptables + ipset):                                    │
│    - Default INPUT Policy: DROP                                        │
│    - กฎ GeoIP: multiport dports 22,80,443 match-set th_allow src       │
│      (อนุญาตเฉพาะ IP ภายในประเทศไทยเท่านั้น ทราฟฟิกต่างประเทศถูกตัดทิ้ง)      │
│                                                                        │
│ 2. APPLICATION FIREWALL & RATE LIMIT:                                  │
│    - Fail2ban: Jails เฝ้าระวัง sshd, wp-login                          │
│    - Nginx: ปิดกั้น /xmlrpc.php (403), บล็อก ?author=1                  │
│                                                                        │
│ 3. SERVICES & PORTS:                                                   │
│    - Nginx (Port 80 -> 301 HTTPS, Port 443 SSL)                        │
│    - WordPress Backend (Port 8080: PHP 8.3-FPM)                        │
│    - SecDash Control API (Port 8000: FastAPI / Uvicorn)                │
│    - Report Generator (Cron / Systemd -> /var/lib/secdash/)            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. ข้อมูลที่ Server ส่งให้ Dashboard (Data Outputs)

Dashboard ดึงข้อมูลสถิติและสถานะจากเซิร์ฟเวอร์ผ่าน 3 ช่องทางหลัก:

### 2.1 ไฟล์รายงานสถิติ `report.json`
* **พาธบนเซิร์ฟเวอร์:** `/var/lib/secdash/report.json` และ `/home/deploy/secdash-new/report.json`
* **URL เข้าถึงผ่านเว็บ:** `/report.json` หรือ `/secdash/report.json`
* **โครงสร้างข้อมูลสำคัญ:**
  ```json
  {
    "generated_at": "2026-10-21T10:05:02+00:00",
    "firewall_start": "2026-10-10T15:19:00+00:00",
    "total_requests": 27902,
    "attack_events": 12996,
    "before_after": {
      "before": {
        "requests": 21916,
        "attacks": 12964
      },
      "after": {
        "requests": 5986,
        "attacks": 32
      }
    },
    "by_category": {
      "xmlrpc_abuse": 10833,
      "vuln_scan": 1317,
      "login_failed": 822,
      "user_enumeration": 20,
      "login_ratelimited": 4
    },
    "top_attackers": [
      {
        "ip": "34.182.207.28",
        "hits": 10100,
        "severity": "high",
        "types": {
          "xmlrpc_abuse": 10097,
          "user_enumeration": 3
        }
      }
    ],
    "hourly": [
      {
        "hour": "2026-10-06 00:00",
        "requests": 23,
        "attacks": 1
      }
    ]
  }
  ```

### 2.2 ไฟล์วิเคราะห์โดย AI `ai_report.json`
* **พาธบนเซิร์ฟเวอร์:** `/var/lib/secdash/ai_report.json`
* **โครงสร้างข้อมูล:**
  ```json
  {
    "risk_level": "low",
    "summary": "24 ชั่วโมงล่าสุดมี 2,319 คำขอ เป็นการโจมตี 0 ครั้ง (0.0%)",
    "findings": [
      "หลัง firewall สัดส่วนโจมตี 0.5% เทียบกับก่อน firewall 59.2%"
    ],
    "recommendations": [
      "ตรวจ fail2ban และ rate limit ว่ายังทำงาน",
      "ตรวจ IP ที่โจมตีสูงสุดในตาราง"
    ],
    "last24h": {
      "requests": 2319,
      "attacks": 0,
      "attack_percent": 0.0
    }
  }
  ```

### 2.3 ตรวจสอบสถานะ API (`GET /api/health`)
* **Endpoint:** `GET http://127.0.0.1:8000/api/health` หรือ `GET /api/health`
* **Response:**
  ```json
  {
    "status": "ok",
    "service": "SecDash Control API"
  }
  ```

---

## 3. ข้อมูลที่ Dashboard ส่งไปหา Server (API Control Endpoints)

เซิร์ฟเวอร์รันระบบควบคุมความปลอดภัยด้วย **FastAPI** (`/opt/secdash-api/main.py`) ที่พอร์ต 8000 โดยมีข้อกำหนดการยืนยันตัวตนดังนี้:

### 3.1 การยืนยันตัวตน (Authentication)
* ทุกคำสั่งที่เปลี่ยนสถานะ IP (`/api/unban` และ `/api/ban`) **ต้องแนบ Authorization Header** เสมอ:
  ```http
  Authorization: Bearer SecDash-Admin-Secret-Key-2026
  ```
  *(หากไม่ส่ง หรือคีย์ไม่ถูกต้อง เซิร์ฟเวอร์จะปฏิเสธด้วย `401 Unauthorized: Invalid Token`)*

---

### 3.2 ปลดแบน IP (`POST /api/unban`)
* **Endpoint:** `POST /api/unban`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer SecDash-Admin-Secret-Key-2026`
* **Request Body:**
  ```json
  {
    "ip": "67.205.191.35"
  }
  ```
* **การทำงานบนเซิร์ฟเวอร์ (Shell Commands Executed):**
  1. `sudo fail2ban-client unban <clean_ip>`
  2. `sudo iptables -D INPUT -s <clean_ip> -j DROP`
* **Response ตัวอย่าง (200 OK):**
  ```json
  {
    "status": "success",
    "action": "unban",
    "ip": "67.205.191.35",
    "details": {
      "fail2ban": "0",
      "iptables": "Removed 67.205.191.35 from iptables DROP"
    }
  }
  ```

---

### 3.3 บล็อก IP ซ้ำ / แบน IP เพิ่มเติม (`POST /api/ban`)
* **Endpoint:** `POST /api/ban`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer SecDash-Admin-Secret-Key-2026`
* **Request Body:**
  ```json
  {
    "ip": "34.182.207.28"
  }
  ```
* **การทำงานบนเซิร์ฟเวอร์ (Shell Command Executed):**
  * `sudo iptables -I INPUT -s <clean_ip> -j DROP`
* **Response ตัวอย่าง (200 OK):**
  ```json
  {
    "status": "success",
    "action": "ban",
    "ip": "34.182.207.28",
    "output": ""
  }
  ```

---

## 4. ตัวอย่างโค้ดเรียกใช้งาน (TypeScript Integration Example)

สำหรับเขียนใน Pinia Store หรือ Component ฝั่ง Frontend (`secdash-ui`):

```typescript
const ADMIN_API_TOKEN = 'SecDash-Admin-Secret-Key-2026'

export async function executeIpAction(action: 'unban' | 'ban', ip: string) {
  const origin = window.location.origin
  const response = await fetch(`${origin}/api/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_API_TOKEN}`
    },
    body: JSON.stringify({ ip: ip.trim() })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `Request failed with status ${response.status}`)
  }

  return await response.json()
}
```

---

## 5. สรุปตำแหน่งไฟล์และพาธสำคัญบนเซิร์ฟเวอร์ (Server File Locations)

| ส่วนประกอบ | ตำแหน่งไฟล์บนเซิร์ฟเวอร์ | คำอธิบาย |
| :--- | :--- | :--- |
| **Backend API Code** | `/opt/secdash-api/main.py` | สคริปต์ FastAPI จัดการ iptables / fail2ban |
| **Python Virtualenv** | `/opt/secdash-api/venv/` | ไบนารี Python และ Uvicorn |
| **JSON Reports** | `/var/lib/secdash/report.json` | ข้อมูลสถิติทราฟฟิกและการโจมตี |
| **AI Insights** | `/var/lib/secdash/ai_report.json` | บทวิเคราะห์และข้อแนะนำจาก AI |
| **Nginx Main Config** | `/etc/nginx/sites-enabled/*` | คอนฟิก Reverse Proxy และ SSL |
| **Nginx SecDash Snippet** | `/etc/nginx/snippets/secdash.conf` | คอนฟิกเส้นทาง `/secdash/` และ `/api/` |
| **Fail2ban Jails** | `/etc/fail2ban/jail.local` | กฎตรวจจับ SSH และ wp-login |
| **Web Root (WordPress)** | `/var/www/wordpress` | ไดเรกทอรีเว็บหลักของภาควิชา |
