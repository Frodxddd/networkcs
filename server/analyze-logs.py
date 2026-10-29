#!/usr/bin/env python3
import re, gzip, glob, json, collections, os
import datetime as dt

LOG_GLOB = "/var/log/nginx/access.log*"
F2B_LOGS = sorted(glob.glob("/var/log/fail2ban.log*"))
OUT = "/var/lib/secdash/report.json"
UTC = dt.timezone.utc
FIREWALL_START = dt.datetime(2026, 10, 10, 15, 19, tzinfo=UTC)

LINE = re.compile(r'^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+)[^"]*" (\d{3}) ')
SCAN = re.compile(r'\.env|phpmyadmin|wp-config|/\.git|\.\./|union.{0,20}select|eval-stdin|boaform|cgi-bin', re.I)

def classify(method, path, status):
    p = path.lower()
    if 'xmlrpc.php' in p:
        return 'xmlrpc_abuse'
    if ('author=' in p and not p.startswith('/wp-admin/')):
        return 'user_enumeration'
    if method == 'POST' and 'wp-login.php' in p:
        if status == '200':
            return 'login_failed'
        if status == '429':
            return 'login_ratelimited'
        return None
    if SCAN.search(p):
        return 'vuln_scan'
    return None

def open_log(f):
    return gzip.open(f, 'rt', errors='ignore') if f.endswith('.gz') else open(f, errors='ignore')

total = 0
cats = collections.Counter()
ip_cats = collections.defaultdict(collections.Counter)
ip_last_seen = {}
hours = collections.defaultdict(collections.Counter)
period = {'before': collections.Counter(), 'after': collections.Counter()}
all_ips = set()
status_counts = collections.Counter()
path_counts = collections.Counter()

for f in glob.glob(LOG_GLOB):
    with open_log(f) as fh:
        for line in fh:
            m = LINE.match(line)
            if not m:
                continue
            ip, ts, method, path, status = m.groups()
            if ip == '127.0.0.1':
                continue
            try:
                t = dt.datetime.strptime(ts, '%d/%b/%Y:%H:%M:%S %z').astimezone(UTC)
            except ValueError:
                continue
            total += 1
            all_ips.add(ip)
            h = t.strftime('%Y-%m-%d %H:00')
            side = 'after' if t >= FIREWALL_START else 'before'
            hours[h]['requests'] += 1
            period[side]['requests'] += 1

            s_code = int(status)
            if 200 <= s_code < 300: status_counts['2xx'] += 1
            elif 300 <= s_code < 400: status_counts['3xx'] += 1
            elif s_code == 429: status_counts['429'] += 1
            elif 400 <= s_code < 500: status_counts['4xx'] += 1
            elif 500 <= s_code < 600: status_counts['5xx'] += 1

            p_clean = path.split('?')[0]
            if p_clean.startswith('//'): p_clean = p_clean[1:]
            path_counts[p_clean] += 1

            c = classify(method, path, status)
            if c:
                cats[c] += 1
                ip_cats[ip][c] += 1
                hours[h]['attacks'] += 1
                period[side]['attacks'] += 1
                if ip not in ip_last_seen or t > ip_last_seen[ip]:
                    ip_last_seen[ip] = t

# Check unbanned state and custom IPs from API
state_file = '/opt/secdash-api/state.json'
unbanned_ips_set = set()
custom_ips_list = []
if os.path.exists(state_file):
    try:
        with open(state_file, 'r', encoding='utf-8') as sf:
            s_data = json.load(sf)
            unbanned_ips_set = set(s_data.get('unbanned_ips', []))
            custom_ips_list = s_data.get('custom_ips', [])
    except Exception:
        pass

attackers = []
existing_ips = set()
for ip, cc in ip_cats.items():
    existing_ips.add(ip)
    n = sum(cc.values())
    sev = 'high' if n >= 100 else 'medium' if n >= 10 else 'low'
    last_dt = ip_last_seen.get(ip)
    attackers.append({
        'ip': ip,
        'hits': n,
        'severity': sev,
        'types': dict(cc),
        'last_seen': last_dt.strftime('%Y-%m-%d %H:%M:%S') if last_dt else '2026-10-10 12:00:00',
        'is_unbanned': ip in unbanned_ips_set
    })

# รวม custom_ips ที่แอดมินเพิ่มเองผ่านแดชบอร์ด
for c in custom_ips_list:
    c_ip = c.get('ip')
    if c_ip and c_ip not in existing_ips:
        existing_ips.add(c_ip)
        attackers.append({
            'ip': c_ip,
            'hits': 1,
            'severity': 'medium',
            'types': {'manual_action': 1},
            'last_seen': c.get('last_seen', dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')),
            'is_unbanned': c.get('isUnbanned', False) or (c_ip in unbanned_ips_set)
        })

attackers.sort(key=lambda x: -x['hits'])

top_targets = [
    {'path': '/xmlrpc.php', 'count': cats['xmlrpc_abuse'], 'name': 'XML-RPC Abuse'},
    {'path': '/wp-login.php', 'count': cats['login_failed'], 'name': 'WordPress Brute Force'},
    {'path': 'Vuln Probing', 'count': cats['vuln_scan'], 'name': 'Vulnerability Scanning'},
    {'path': 'User Enumeration', 'count': cats['user_enumeration'], 'name': 'Author / User Enum'},
    {'path': 'Rate Limited', 'count': cats['login_ratelimited'], 'name': 'Rate Limit Exceeded'}
]

# Extract real audit events from Fail2ban logs & Admin API logs
admin_logs_file = '/opt/secdash-api/admin_logs.json'
server_admin_logs = []
if os.path.exists(admin_logs_file):
    try:
        with open(admin_logs_file, 'r', encoding='utf-8') as alf:
            server_admin_logs = json.load(alf)
    except Exception:
        pass

F2B_PAT = re.compile(r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}),\d+ fail2ban\S*\s+\[\d+\]: (?:INFO|NOTICE)\s+\[(\S+)\] (Ban|Unban) (\S+)')
audit_logs = list(server_admin_logs)
for f in F2B_LOGS:
    open_fn = gzip.open(f, 'rt', errors='ignore') if f.endswith('.gz') else open(f, errors='ignore')
    with open_fn as fh:
        for line in fh:
            m = F2B_PAT.search(line)
            if m:
                ts, jail, act, ip = m.groups()
                is_unban = act.upper() == 'UNBAN'
                audit_logs.append({
                    'id': f'f2b-{len(audit_logs) + 1}',
                    'timestamp': ts,
                    'ip': ip,
                    'action': act.upper(),
                    'actionLabel': 'หมดเวลาแบน (Auto)' if is_unban else 'บล็อกอัตโนมัติ (Fail2ban)',
                    'detail': f'ระบบ Fail2ban ปลดอัตโนมัติหลังครบกำหนดเวลาแบน • Jail [{jail}]' if is_unban else f'ระบบตรวจพบพฤติกรรมผิดปกติและบล็อกอัตโนมัติ • Jail [{jail}]'
                })
audit_logs.sort(key=lambda x: x['timestamp'], reverse=True)

report = {
    'generated_at': dt.datetime.now(UTC).isoformat(timespec='seconds'),
    'firewall_start': FIREWALL_START.isoformat(),
    'total_requests': total,
    'attack_events': sum(cats.values()),
    'unique_ips': len(all_ips),
    'status_counts': dict(status_counts),
    'by_category': dict(cats),
    'top_targets': top_targets,
    'top_attackers': attackers,
    'audit_logs': audit_logs,
    'hourly': [{'hour': h, 'requests': v['requests'], 'attacks': v['attacks']} for h, v in sorted(hours.items())],
    'before_after': {k: dict(v) for k, v in period.items()},
}
with open(OUT, 'w') as fo:
    json.dump(report, fo, ensure_ascii=False, indent=1)

print("Updated /var/lib/secdash/report.json successfully.")
print("Total logs:", total, "| Attacks:", sum(cats.values()), "| Real attackers:", len(attackers), "| Real audit events:", len(audit_logs))
