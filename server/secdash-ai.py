#!/usr/bin/env python3
"""Secdash AI analyzer
อ่าน report.json -> เรียก AI สรุปภัยคุกคาม -> เขียน ai_report.json
ใช้แค่ไลบรารีมาตรฐานของ Python รันได้ทั้งบน VPS และเครื่องอื่น
ไม่ส่ง log ดิบ ส่งเฉพาะสรุป และปิดเลขท้ายของ IP ก่อนส่งเสมอ
รองรับทั้ง Gemini API และ Free Cloud AI (กรณีติดข้อจำกัดภูมิภาค)
"""
import os, sys, json, re, ssl, base64, statistics, subprocess, time, tempfile
import urllib.request, urllib.error
import datetime as dt


def load_env(path):
    try:
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"\''))
    except OSError:
        pass


load_env(os.environ.get("AI_ENV_FILE", "/etc/secdash-ai.env"))
load_env(os.path.expanduser("~/.secdash-ai.env"))

SRC = os.environ.get("REPORT_SRC", "/var/lib/secdash/report.json")      # path หรือ https://...
OUT = os.environ.get("AI_OUT", "/var/lib/secdash/ai_report.json")
UPLOAD = os.environ.get("UPLOAD_TO", "")                                  # เช่น deploy@host:/var/lib/secdash/ai_report.json
MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash")
BASE = os.environ.get("GEMINI_BASE", "https://generativelanguage.googleapis.com/v1beta")
KEY = os.environ.get("GEMINI_API_KEY", "")
UTC = dt.timezone.utc
TH = dt.timezone(dt.timedelta(hours=7))


def read_report():
    if SRC.startswith("http"):
        req = urllib.request.Request(SRC)
        u, p = os.environ.get("SECDASH_USER", ""), os.environ.get("SECDASH_PASS", "")
        if u:
            req.add_header("Authorization", "Basic " + base64.b64encode(f"{u}:{p}".encode()).decode())
        ctx = ssl.create_default_context()
        if os.environ.get("INSECURE_TLS") == "1":
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
        with urllib.request.urlopen(req, timeout=30, context=ctx) as r:
            return json.load(r)
    with open(SRC) as f:
        return json.load(f)


def mask(ip):
    return re.sub(r'^(\d+\.\d+\.\d+)\.\d+$', r'\1.x', ip)


def parse_hour(s):
    return dt.datetime.strptime(s, "%Y-%m-%d %H:00").replace(tzinfo=UTC)


def to_thai(s):
    return parse_hour(s).astimezone(TH).strftime("%d/%m %H:00")


def analyze_stats(rep):
    hourly = rep.get("hourly") or []
    out = {"anomalies": [], "last24h": {"requests": 0, "attacks": 0}}
    if not hourly:
        return out
    atk = [h["attacks"] for h in hourly]
    mean = statistics.mean(atk)
    std = statistics.pstdev(atk)
    thr = mean + 3 * std
    for h in hourly:
        if h["attacks"] >= 50 and h["attacks"] > thr:
            out["anomalies"].append({"hour_th": to_thai(h["hour"]), "attacks": h["attacks"],
                                     "requests": h["requests"]})
    out["anomalies"] = sorted(out["anomalies"], key=lambda a: -a["attacks"])[:5]
    for h in hourly[-24:]:
        out["last24h"]["requests"] += h["requests"]
        out["last24h"]["attacks"] += h["attacks"]
    return out


def build_payload(rep, stats):
    ba = rep.get("before_after", {})

    def ratio(d):
        return round(d.get("attacks", 0) / d["requests"] * 100, 1) if d.get("requests") else 0
    return {
        "generated_at": rep.get("generated_at"),
        "firewall_start": rep.get("firewall_start"),
        "total_requests": rep.get("total_requests"),
        "attack_events": rep.get("attack_events"),
        "by_category": rep.get("by_category"),
        "before_firewall": {**ba.get("before", {}), "attack_percent": ratio(ba.get("before", {}))},
        "after_firewall": {**ba.get("after", {}), "attack_percent": ratio(ba.get("after", {}))},
        "last_24h": {**stats["last24h"], "attack_percent": ratio(stats["last24h"])},
        "anomalous_hours_thai_time": stats["anomalies"],
        "top_attackers": [{"ip": mask(a["ip"]), "hits": a["hits"], "types": a["types"]}
                          for a in (rep.get("top_attackers") or [])[:10]],
    }


PROMPT = """คุณเป็นนักวิเคราะห์ความปลอดภัยเว็บไซต์ WordPress ของโครงงานนักศึกษา
ข้อมูลด้านล่างเป็นสรุปจาก access log ของ Nginx (ตัดคำขอจาก 127.0.0.1 ออกแล้ว, IP ถูกปิดเลขท้ายเป็น .x)
เซิร์ฟเวอร์เปิด firewall จำกัดให้เข้าได้เฉพาะ IP ไทย ณ เวลา firewall_start
หมายเหตุ: login_failed อาจมาจากเพื่อนในทีมพิมพ์รหัสผิดได้ด้วย
มาตรการที่ติดตั้งแล้ว (ห้ามแนะนำซ้ำ): firewall เฉพาะ IP ไทย, ปิด xmlrpc.php (403), บล็อก author= enumeration, จำกัดความถี่ล็อกอินด้วย Nginx limit_req, fail2ban, SSH ปิด root ปิดรหัสผ่าน ใช้ key เท่านั้น, HTTPS+HSTS
กฎเพิ่ม: ห้ามระบุว่า IP มาจากประเทศใดหากข้อมูลไม่ได้ระบุ และแนะนำเฉพาะสิ่งที่ยังไม่ได้ทำ
ข้อมูลนี้มาจาก access log ของ HTTP เท่านั้น ห้ามสรุปว่าไม่มีการบุกรุกสำเร็จ หรือระบบปลอดภัยแล้ว ให้พูดแค่ว่าไม่พบพฤติกรรมโจมตีในคำขอ และเวลาเทียบตัวเลขให้ระบุช่วงเวลาให้ชัด (ก่อน firewall / หลัง firewall / 24 ชั่วโมงล่าสุด) ห้ามนำตัวเลขคนละช่วงมาเทียบกันในประโยคเดียว ห้ามใช้คำว่าสกัดกั้นได้ ถ้าข้อมูลไม่ได้บอกผลการตอบกลับ

กติกา: ใช้เฉพาะข้อมูลที่ให้ ห้ามแต่งตัวเลขหรือ IP เพิ่ม ตอบเป็นภาษาไทย กระชับ
ตอบเป็น JSON ล้วน รูปแบบนี้เท่านั้น:
{"risk_level":"low|medium|high","summary":"สรุป 2-3 ประโยค เน้น 24 ชั่วโมงล่าสุดและผลของ firewall",
 "findings":["ข้อสังเกตสำคัญ 3-5 ข้อ พร้อมตัวเลขจากข้อมูล"],
 "recommendations":["คำแนะนำที่ทำได้จริง 3-5 ข้อ"]}

ข้อมูล:
"""


def call_gemini(payload):
    url = f"{BASE}/models/{MODEL}:generateContent"
    body = json.dumps({
        "contents": [{"parts": [{"text": PROMPT + json.dumps(payload, ensure_ascii=False)}]}],
        "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
    }).encode()
    last = None
    for attempt in range(3):
        req = urllib.request.Request(url, data=body, method="POST",
                                     headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.load(r)
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            text = re.sub(r'^```(?:json)?|```$', '', text.strip(), flags=re.M).strip()
            return json.loads(text)
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}"
            if e.code not in (429, 500, 502, 503, 504):
                break
        except (urllib.error.URLError, KeyError, IndexError, ValueError) as e:
            last = type(e).__name__
        time.sleep(5 * (attempt + 1))
    raise RuntimeError(last or "unknown error")


def call_free_ai(payload):
    url = "https://text.pollinations.ai/"
    prompt = PROMPT + json.dumps(payload, ensure_ascii=False)
    data = json.dumps({
        "messages": [
            {"role": "system", "content": "You are a cybersecurity expert analyzing WordPress logs. Output ONLY valid JSON matching the requested schema exactly, no markdown fences."},
            {"role": "user", "content": prompt}
        ],
        "model": "openai",
        "jsonMode": True
    }).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=45) as r:
        text = r.read().decode("utf-8")
    text = re.sub(r'^```(?:json)?|```$', '', text.strip(), flags=re.M).strip()
    return json.loads(text)


def fallback(payload, why):
    l24 = payload["last_24h"]
    pct = l24["attack_percent"]
    risk = "high" if pct >= 30 else "medium" if pct >= 5 else "low"
    return {
        "risk_level": risk,
        "summary": f"24 ชั่วโมงล่าสุดมี {l24['requests']:,} คำขอ เป็นการโจมตี {l24['attacks']:,} ครั้ง ({pct}%) "
                   f"(สรุปโดยกฎ ไม่ได้ใช้ AI: {why})",
        "findings": [f"หลัง firewall สัดส่วนโจมตี {payload['after_firewall']['attack_percent']}% "
                     f"เทียบกับก่อน firewall {payload['before_firewall']['attack_percent']}%"],
        "recommendations": ["ตรวจ fail2ban และ rate limit ว่ายังทำงาน", "ตรวจ IP ที่โจมตีสูงสุดในตาราง"],
    }


def clean(res):
    risk = res.get("risk_level")
    if risk not in ("low", "medium", "high"):
        risk = "medium"
    lst = lambda v: [str(x)[:400] for x in (v if isinstance(v, list) else [])][:6]
    return {"risk_level": risk, "summary": str(res.get("summary", ""))[:900],
            "findings": lst(res.get("findings")), "recommendations": lst(res.get("recommendations"))}


BANNED = ("ไม่มีสัญญาณการบุกรุก", "ไม่มีการบุกรุก", "ปลอดภัยในระดับ", "ปลอดภัยแล้ว", "ปลอดภัยสูง", "สกัดกั้น")


def harden(res, payload):
    """ตัดข้อความที่ข้อมูลไม่รองรับ และสร้างสรุปตัวเลขจากข้อมูลโดยตรง (ไม่ให้ AI เขียนตัวเลขเอง)"""
    ok = lambda t: not any(b in t for b in BANNED)
    res["findings"] = [t for t in res["findings"] if ok(t)]
    res["recommendations"] = [t for t in res["recommendations"] if ok(t)]
    b, a, l = payload["before_firewall"], payload["after_firewall"], payload["last_24h"]
    res["summary"] = (
        f"ก่อน firewall สัดส่วนโจมตี {b['attack_percent']}% ({b.get('attacks', 0):,} จาก {b.get('requests', 0):,} คำขอ) "
        f"หลัง firewall {a['attack_percent']}% ({a.get('attacks', 0):,} จาก {a.get('requests', 0):,} คำขอ) "
        f"และ 24 ชั่วโมงล่าสุด {l['attack_percent']}% ({l['attacks']:,} จาก {l['requests']:,} คำขอ) "
        f"วิเคราะห์จาก access log (HTTP) เท่านั้น จึงยืนยันไม่ได้ว่ามีการบุกรุกสำเร็จหรือไม่"
    )
    return res


def write_out(obj):
    d = os.path.dirname(OUT) or "."
    fd, tmp = tempfile.mkstemp(dir=d, suffix=".tmp")
    with os.fdopen(fd, "w") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    os.chmod(tmp, 0o644)
    os.replace(tmp, OUT)


def main():
    rep = read_report()
    stats = analyze_stats(rep)
    payload = build_payload(rep, stats)
    source, err = "ai", None
    used_model = MODEL
    try:
        if not KEY:
            raise RuntimeError("ไม่มี GEMINI_API_KEY")
        res = harden(clean(call_gemini(payload)), payload)
    except Exception as e:
        # Fallback to free Cloud AI (No region lock, works from any VPS)
        try:
            raw_ai = call_free_ai(payload)
            res = harden(clean(raw_ai), payload)
            source = "ai"
            used_model = "gpt-4o-mini (Free Cloud AI)"
            err = None
        except Exception as e2:
            source, err = "fallback", str(e)
            res = fallback(payload, err)
            used_model = "rule-based"

    res.update({"generated_at": dt.datetime.now(UTC).isoformat(timespec="seconds"),
                "model": used_model, "source": source,
                "anomalies": stats["anomalies"], "last24h": payload["last_24h"]})
    if err:
        res["error"] = err
    elif "error" in res:
        del res["error"]

    write_out(res)
    if UPLOAD:
        subprocess.run(["scp", "-q", "-o", "BatchMode=yes", OUT, UPLOAD], check=True, timeout=60)
    print(f"ok source={source} risk={res['risk_level']}" + (f" ({err})" if err else ""))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("ล้มเหลว:", e, file=sys.stderr)
        sys.exit(1)
