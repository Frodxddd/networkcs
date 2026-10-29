import datetime as dt
import ipaddress
import json
import os
import subprocess
from pathlib import Path
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SecDash Firewall Control API")

# อนุญาตให้ Frontend ยิงเข้ามาได้ (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_TOKEN = "SecDash-Admin-Secret-Key-2026"
STATE_FILE = Path("/opt/secdash-api/state.json")
LOGS_FILE = Path("/opt/secdash-api/admin_logs.json")

def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print("Error loading state:", e)
    return {"unbanned_ips": [], "banned_ips": [], "custom_ips": []}

def save_state(state: dict):
    try:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print("Error saving state:", e)

def load_admin_logs() -> list:
    if LOGS_FILE.exists():
        try:
            with open(LOGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print("Error loading logs:", e)
    return []

def save_admin_logs(logs: list):
    try:
        LOGS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(LOGS_FILE, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print("Error saving logs:", e)

def record_server_audit(ip: str, action: str, action_label: str, detail: str):
    now_str = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = {
        "id": f"audit-{int(dt.datetime.now().timestamp() * 1000)}",
        "timestamp": now_str,
        "ip": ip,
        "action": action,
        "actionLabel": action_label,
        "detail": detail
    }
    logs = load_admin_logs()
    logs.insert(0, entry)
    save_admin_logs(logs[:500])
    return entry

def trigger_report_regen():
    try:
        # สั่งรัน analyze-logs.py เบื้องหลังเพื่ออัปเดต report.json ทันที
        subprocess.Popen(["sudo", "python3", "/home/deploy/analyze-logs.py"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        print("Failed to regen report:", e)

class IPRequest(BaseModel):
    ip: str
    note: str = ""

class CustomIPEntry(BaseModel):
    ip: str
    attackType: str = "จัดการผ่านหน้าแดชบอร์ด"
    isUnbanned: bool = False
    hits: str = "1 ครั้ง (บล็อก)"

class AuditLogRequest(BaseModel):
    id: str = ""
    timestamp: str = ""
    ip: str
    action: str
    actionLabel: str
    detail: str

def sanitize_ip(ip_str: str) -> str:
    try:
        validated = ipaddress.ip_address(ip_str.strip())
        return str(validated)
    except ValueError:
        raise HTTPException(status_code=400, detail="รูปแบบ IP Address ไม่ถูกต้อง")

def verify_token(authorization: str = None):
    expected_header = f"Bearer {ADMIN_TOKEN}"
    if not authorization or authorization != expected_header:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid Token")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "SecDash Control API"}

@app.get("/api/state")
def get_state(request: Request):
    state = load_state()
    # ดึง client IP ของผู้เรียกผ่าน headers หรือ socket
    client_ip = request.headers.get("X-Real-IP") or request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or (request.client.host if request.client else "")
    state["client_ip"] = client_ip
    return state

@app.get("/api/logs")
def get_logs():
    return load_admin_logs()

@app.post("/api/logs")
def save_log(entry: AuditLogRequest, authorization: str = Header(None)):
    # อนุญาตให้ frontend ส่ง log มาบันทึกบนเซิร์ฟเวอร์ถาวร
    now_str = entry.timestamp or dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_id = entry.id or f"audit-{int(dt.datetime.now().timestamp() * 1000)}"
    new_entry = {
        "id": log_id,
        "timestamp": now_str,
        "ip": entry.ip,
        "action": entry.action,
        "actionLabel": entry.actionLabel,
        "detail": entry.detail
    }
    logs = load_admin_logs()
    logs = [l for l in logs if l.get("id") != log_id]
    logs.insert(0, new_entry)
    save_admin_logs(logs[:500])
    return {"status": "ok", "total": len(logs)}

@app.post("/api/custom-ip")
def add_custom_ip(entry: CustomIPEntry, authorization: str = Header(None)):
    verify_token(authorization)
    clean_ip = sanitize_ip(entry.ip)
    state = load_state()
    customs = state.get("custom_ips", [])
    customs = [c for c in customs if c.get("ip") != clean_ip]
    customs.insert(0, {
        "ip": clean_ip,
        "attackType": entry.attackType,
        "isUnbanned": entry.isUnbanned,
        "hits": entry.hits,
        "last_seen": dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })
    state["custom_ips"] = customs
    save_state(state)
    trigger_report_regen()
    return {"status": "ok", "custom_ips": customs}

@app.post("/api/unban")
def unban_ip(payload: IPRequest, authorization: str = Header(None)):
    verify_token(authorization)
    clean_ip = sanitize_ip(payload.ip)
    results = {}

    # สั่งปลดแบนผ่าน fail2ban
    try:
        f2b_cmd = ["sudo", "fail2ban-client", "unban", clean_ip]
        f2b_res = subprocess.run(f2b_cmd, capture_output=True, text=True, timeout=5)
        results["fail2ban"] = f2b_res.stdout.strip() or f2b_res.stderr.strip()
    except Exception as e:
        results["fail2ban_error"] = str(e)

    # สั่งลบ Rule ออกจาก iptables
    try:
        iptables_cmd = ["sudo", "iptables", "-D", "INPUT", "-s", clean_ip, "-j", "DROP"]
        ipt_res = subprocess.run(iptables_cmd, capture_output=True, text=True, timeout=5)
        if ipt_res.returncode == 0:
            results["iptables"] = f"Removed {clean_ip} from iptables DROP"
        else:
            results["iptables"] = ipt_res.stderr.strip() or "No matching rule found in iptables"
    except Exception as e:
        results["iptables_error"] = str(e)

    # บันทึกสถานะลง state.json ถาวร
    state = load_state()
    unbanned = set(state.get("unbanned_ips", []))
    banned = set(state.get("banned_ips", []))
    unbanned.add(clean_ip)
    banned.discard(clean_ip)
    state["unbanned_ips"] = sorted(list(unbanned))
    state["banned_ips"] = sorted(list(banned))
    
    # อัปเดตใน custom_ips ด้วยถ้ามี
    for c in state.get("custom_ips", []):
        if c.get("ip") == clean_ip:
            c["isUnbanned"] = True
    save_state(state)

    # บันทึก Audit Log ลงเซิร์ฟเวอร์ทันที
    detail = payload.note if payload.note else "ปลดแบนผ่านหน้าจัดการ IP (คำสั่ง iptables & Fail2ban สำเร็จ)"
    record_server_audit(clean_ip, "UNBAN", "ปลดแบน (โดยแอดมิน)", detail)
    trigger_report_regen()

    return {
        "status": "success",
        "action": "unban",
        "ip": clean_ip,
        "details": results,
        "unbanned_ips": state["unbanned_ips"]
    }

@app.post("/api/ban")
def ban_ip(payload: IPRequest, request: Request, authorization: str = Header(None)):
    verify_token(authorization)
    clean_ip = sanitize_ip(payload.ip)

    # ตรวจสอบและป้องกันการบล็อก IP ของผู้ดูแลระบบ (Admin Self-Ban Protection)
    caller_ip = request.headers.get("X-Real-IP") or request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or (request.client.host if request.client else "")
    if clean_ip == caller_ip:
        raise HTTPException(
            status_code=400,
            detail=f"ไม่อนุญาตให้บล็อก IP ของตนเอง ({clean_ip}) เพื่อป้องกันระบบตัดการเชื่อมต่อของผู้ดูแลระบบ"
        )
    if clean_ip in ["127.0.0.1", "::1", "localhost"]:
        raise HTTPException(
            status_code=400,
            detail="ไม่อนุญาตให้บล็อก Localhost/Loopback IP"
        )

    cmd = ["sudo", "iptables", "-I", "INPUT", "-s", clean_ip, "-j", "DROP"]
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)

    # บันทึกสถานะลง state.json ถาวร
    state = load_state()
    unbanned = set(state.get("unbanned_ips", []))
    banned = set(state.get("banned_ips", []))
    banned.add(clean_ip)
    unbanned.discard(clean_ip)
    state["unbanned_ips"] = sorted(list(unbanned))
    state["banned_ips"] = sorted(list(banned))
    
    # อัปเดตใน custom_ips ด้วยถ้ามี หรือเพิ่มใหม่ถ้ายังไม่มี
    customs = state.get("custom_ips", [])
    found = False
    for c in customs:
        if c.get("ip") == clean_ip:
            c["isUnbanned"] = False
            found = True
    if not found:
        customs.insert(0, {
            "ip": clean_ip,
            "attackType": payload.note if payload.note else "สั่งบล็อกโดยแอดมินผ่านแดชบอร์ด",
            "isUnbanned": False,
            "hits": "1 ครั้ง (บล็อก)",
            "last_seen": dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })
    state["custom_ips"] = customs
    save_state(state)

    # บันทึก Audit Log ลงเซิร์ฟเวอร์ทันที
    detail = payload.note if payload.note else "สั่งบล็อกผ่านหน้าจัดการ IP (เพิ่มกฎ iptables DROP สำเร็จ)"
    record_server_audit(clean_ip, "BAN", "บล็อก (โดยแอดมิน)", detail)
    trigger_report_regen()

    return {
        "status": "success" if res.returncode == 0 else "failed",
        "action": "ban",
        "ip": clean_ip,
        "output": res.stdout.strip() or res.stderr.strip(),
        "unbanned_ips": state["unbanned_ips"],
        "banned_ips": state["banned_ips"]
    }
