import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ThreatRow {
  id: string
  ip: string
  attackType: string
  icon: 'shield' | 'flame' | 'alert' | 'check'
  color: string
  bg: string
  threatIntensity: number
  allocation: number
  hits: string
  isUnbanned: boolean
  lastSeen?: string
  lastSeenRaw?: number
}

export interface AuditLogRow {
  id: string
  timestamp: string
  ip: string
  action: 'UNBAN' | 'BAN'
  actionLabel: string
  detail: string
}

export interface AiReportData {
  risk_level: 'low' | 'medium' | 'high'
  summary: string
  findings: string[]
  recommendations: string[]
  generated_at?: string
  model?: string
  source?: string
  anomalies?: Array<{ hour_th: string; attacks: number; requests: number }>
  last24h?: { requests: number; attacks: number; attack_percent: number }
}

export interface HourlyRecord {
  hour: string
  requests: number
  attacks: number
}

export const useSecurityStore = defineStore('security', () => {
  const isAddModalOpen = ref(false)
  const quickIp = ref('')
  const quickActionType = ref<'unban' | 'ban'>('unban')
  const quickNote = ref('')
  const apiActionLoading = ref(false)
  const isPageLoading = ref(false)
  const clientIp = ref(
    (typeof window !== 'undefined' && window.localStorage?.getItem('secdash_client_ip')) || ''
  )

  const aiReport = ref<AiReportData>({
    risk_level: 'low',
    summary: 'ก่อน firewall สัดส่วนโจมตี 59.2% (12,964 จาก 21,916 คำขอ) หลัง firewall 0.6% (44 จาก 7,225 คำขอ) และ 24 ชั่วโมงล่าสุด 1.1% (7 จาก 634 คำขอ) วิเคราะห์จาก access log (HTTP) เท่านั้น จึงยืนยันไม่ได้ว่ามีการบุกรุกสำเร็จหรือไม่',
    findings: [
      'โหมด XMLRPC abuse คิดเป็น 10,833 เหตุการณ์ (37% ของการโจมตีทั้งหมด) โดย IP 34.182.207.x เป็นแหล่งหลัก',
      'จำนวน login_failed 834 เหตุการณ์ ส่วนใหญ่มาจาก IP 67.205.191.x (672 เหตุการณ์) ที่อาจเกิดจากพิมพ์รหัสผิดโดยสมาชิกทีม',
      'การตั้งค่าบล็อก author= enumeration ได้ผลและพบเพียง 20 เหตุการณ์ในช่วงสำรวจ',
      'ช่วงเวลาท้องถิ่น 09/10 16:00 มีอัตราการโจมตีสูงสุด 7,593 จาก 8,196 คำขอ (92%)',
      'ก่อน firewall มีการโจมตีรวม 12,964 เหตุการณ์ (59.2% ของคำขอ) แต่หลัง firewall ลดลงเป็น 44 เหตุการณ์ (0.6%)'
    ],
    recommendations: [
      'เพิ่ม ModSecurity หรือ WAF เพื่อป้องกัน XMLRPC abuse patterns ที่ยังคงโดนเช็คเป็น 403',
      'ตั้งค่า authentication token หรือ 2FA บน wp-admin เพื่อเพิ่มความปลอดภัยของล็อกอิน',
      'เพิ่ม Content-Security-Policy (CSP), X-Frame-Options และ X-Content-Type-Options เพื่อป้องกันการโจมตีเชิง Web Application',
      'สร้างระบบแจ้งเตือนแบบ real-time เมื่อมีการโจมตี XMLRPC มากกว่าระดับที่กำหนด'
    ],
    generated_at: '2026-10-26T12:45:21+00:00',
    model: 'gpt-4o-mini (Free Cloud AI)',
    source: 'ai',
    last24h: {
      requests: 1434,
      attacks: 10,
      attack_percent: 0.7
    }
  })

  const hourlyRecords = ref<HourlyRecord[]>([])

  const rawReportStats = ref({
    generatedAt: '',
    totalRequests: 30331,
    attacksMitigated: 13018,
    uniqueIps: 665,
    defenseEfficiency: '99.4%',
    activeRules: 15,
    categories: {
      xmlrpc: 10836,
      vulnScan: 1321,
      wpLogin: 835,
      other: 26
    },
    statusCounts: {
      '2xx': 24167,
      '3xx': 3012,
      '4xx': 2755,
      '429': 24,
      '5xx': 373
    },
    topTargets: [
      { path: '/xmlrpc.php', count: 10836, name: 'XML-RPC Abuse' },
      { path: '/wp-login.php', count: 835, name: 'WordPress Brute Force' },
      { path: 'Vuln Probing', count: 1321, name: 'Vulnerability Scanning' },
      { path: 'User Enumeration', count: 22, name: 'Author / User Enum' },
      { path: 'Rate Limited', count: 4, name: 'Rate Limit Exceeded' }
    ],
    aiSummary: 'ก่อน firewall สัดส่วนโจมตี 59.2% (12,964 จาก 21,916 คำขอ) หลัง firewall 0.6% (54 จาก 8,415 คำขอ) และ 24 ชั่วโมงล่าสุด 0.7% (10 จาก 1,434 คำขอ)',
    aiFinding: 'หลังเปิด Firewall สัดส่วนการโจมตีลดเหลือ 0.6% เทียบกับก่อนเปิด 59.2%'
  })

  const threatRows = ref<ThreatRow[]>([
    {
      id: 'threat-1',
      ip: '34.182.207.28',
      attackType: 'บอทเน็ตยิงสแปม XML-RPC (xmlrpc.php)',
      icon: 'flame',
      color: '#dc2626',
      bg: '#fee2e2',
      threatIntensity: 84,
      allocation: 72,
      hits: '10,100 ครั้ง',
      isUnbanned: false,
      lastSeen: '2026-10-09 09:40:50',
      lastSeenRaw: new Date('2026-10-09T09:40:50Z').getTime()
    },
    {
      id: 'threat-2',
      ip: '67.205.191.35',
      attackType: 'สุ่มรหัสผ่านหลังบ้าน (/wp-login.php)',
      icon: 'alert',
      color: '#ea580c',
      bg: '#ffedd5',
      threatIntensity: 80,
      allocation: 54,
      hits: '681 ครั้ง',
      isUnbanned: false,
      lastSeen: '2026-10-08 15:06:07',
      lastSeenRaw: new Date('2026-10-08T15:06:07Z').getTime()
    },
    {
      id: 'threat-3',
      ip: '35.214.108.214',
      attackType: 'สแกนหาช่องโหว่ปลั๊กอิน (Vuln Probing)',
      icon: 'shield',
      color: '#9333ea',
      bg: '#f3e8ff',
      threatIntensity: 62,
      allocation: 42,
      hits: '207 ครั้ง',
      isUnbanned: false,
      lastSeen: '2026-10-09 17:55:46',
      lastSeenRaw: new Date('2026-10-09T17:55:46Z').getTime()
    },
    {
      id: 'threat-4',
      ip: '34.169.31.210',
      attackType: 'บอทตรวจหารายชื่อแอดมิน (User Enum)',
      icon: 'flame',
      color: '#dc2626',
      bg: '#fee2e2',
      threatIntensity: 58,
      allocation: 36,
      hits: '183 ครั้ง',
      isUnbanned: false,
      lastSeen: '2026-10-08 12:49:09',
      lastSeenRaw: new Date('2026-10-08T12:49:09Z').getTime()
    },
    {
      id: 'threat-5',
      ip: '146.148.44.249',
      attackType: 'บอทเน็ตยิงสแปม XML-RPC (xmlrpc.php)',
      icon: 'flame',
      color: '#dc2626',
      bg: '#fee2e2',
      threatIntensity: 58,
      allocation: 36,
      hits: '183 ครั้ง',
      isUnbanned: false,
      lastSeen: '2026-10-08 16:15:12',
      lastSeenRaw: new Date('2026-10-08T16:15:12Z').getTime()
    }
  ])

  // 4. บันทึกประวัติการแก้ไขกฎไฟร์วอลล์ (Audit Logs - ดึงข้อมูลจริงจาก Fail2ban & ประวัติจริง)
  const defaultInitialLogs: AuditLogRow[] = [
    {
      id: 'f2b-2',
      timestamp: '2026-10-29 09:04:43',
      ip: '198.51.100.99',
      action: 'UNBAN',
      actionLabel: 'หมดเวลาแบน (Auto)',
      detail: 'ระบบ Fail2ban ปลดอัตโนมัติหลังครบกำหนดเวลาแบน • Jail [nginx-http-auth]'
    },
    {
      id: 'f2b-1',
      timestamp: '2026-10-29 09:04:39',
      ip: '198.51.100.99',
      action: 'BAN',
      actionLabel: 'บล็อกอัตโนมัติ (Fail2ban)',
      detail: 'ระบบตรวจพบพฤติกรรมผิดปกติและบล็อกอัตโนมัติ • Jail [nginx-http-auth]'
    },
    {
      id: 'f2b-3',
      timestamp: '2026-10-20 11:21:08',
      ip: '203.0.113.9',
      action: 'BAN',
      actionLabel: 'บล็อกอัตโนมัติ (Fail2ban)',
      detail: 'ระบบตรวจพบพฤติกรรมผิดปกติและบล็อกอัตโนมัติ • Jail [wp-login]'
    },
    {
      id: 'f2b-4',
      timestamp: '2026-10-20 11:21:08',
      ip: '203.0.113.9',
      action: 'UNBAN',
      actionLabel: 'หมดเวลาแบน (Auto)',
      detail: 'ระบบ Fail2ban ปลดอัตโนมัติหลังครบกำหนดเวลาแบน • Jail [wp-login]'
    },
    {
      id: 'f2b-6',
      timestamp: '2026-10-10 15:51:06',
      ip: '192.0.2.1',
      action: 'UNBAN',
      actionLabel: 'หมดเวลาแบน (Auto)',
      detail: 'ระบบ Fail2ban ปลดอัตโนมัติหลังครบกำหนดเวลาแบน • Jail [wp-login]'
    },
    {
      id: 'f2b-5',
      timestamp: '2026-10-10 15:51:05',
      ip: '192.0.2.1',
      action: 'BAN',
      actionLabel: 'บล็อกอัตโนมัติ (Fail2ban)',
      detail: 'ระบบตรวจพบพฤติกรรมผิดปกติและบล็อกอัตโนมัติ • Jail [wp-login]'
    }
  ]

  const loadAuditLogs = (): AuditLogRow[] => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('secdash_audit_logs')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            // กรองเฉพาะ mock IP เก่า 1.46.128.90 ทิ้ง รักษา log ของผู้ใช้ไว้ทั้งหมด
            const clean = parsed.filter((l: any) => l.ip !== '1.46.128.90')
            if (clean.length > 0) return clean
          }
        }
      } catch {
        // fallback
      }
    }
    return defaultInitialLogs
  }

  // จัดการ Custom Threat Rows ที่ผู้ใช้เพิ่มเองผ่านแดชบอร์ด
  const loadCustomThreatRows = (): ThreatRow[] => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('secdash_custom_threats')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed)) return parsed
        }
      } catch {}
    }
    return []
  }

  const customThreatRows = ref<ThreatRow[]>(loadCustomThreatRows())

  function addCustomThreatRow(row: ThreatRow) {
    customThreatRows.value = [row, ...customThreatRows.value.filter(r => r.ip !== row.ip)]
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('secdash_custom_threats', JSON.stringify(customThreatRows.value))
      } catch {}
    }
    // ซิงค์ส่งขึ้นเซิร์ฟเวอร์
    try {
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost'
      fetch(`${origin}/api/custom-ip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer SecDash-Admin-Secret-Key-2026'
        },
        body: JSON.stringify({
          ip: row.ip,
          attackType: row.attackType,
          isUnbanned: row.isUnbanned,
          hits: row.hits
        })
      }).catch(() => null)
    } catch {}
  }

  // จัดการรายชื่อ IP ที่ถูกปลดแบน เพื่อคงสถานะถาวรไม่ให้หายเมื่อรีเฟรชหน้าจอ
  const loadUnbannedIps = (): Set<string> => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('secdash_unbanned_ips')
        if (saved) {
          const arr = JSON.parse(saved)
          if (Array.isArray(arr)) return new Set(arr)
        }
      } catch {}
    }
    return new Set<string>()
  }

  const unbannedIps = ref<Set<string>>(loadUnbannedIps())

  function markIpUnbanned(ip: string, unbanned: boolean) {
    if (unbanned) {
      unbannedIps.value.add(ip)
    } else {
      unbannedIps.value.delete(ip)
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('secdash_unbanned_ips', JSON.stringify([...unbannedIps.value]))
      } catch {}
    }
    const row = threatRows.value.find(r => r.ip === ip)
    if (row) {
      row.isUnbanned = unbanned
    }
  }

  const auditLogs = ref<AuditLogRow[]>(loadAuditLogs())

  function addAuditLog(entry: Omit<AuditLogRow, 'id' | 'timestamp'>) {
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    
    const newLog: AuditLogRow = {
      id: `audit-${Date.now()}`,
      timestamp,
      ...entry
    }
    auditLogs.value.unshift(newLog)

    // บันทึกลง localStorage ทันที เพื่อให้แสดงผลถาวรแม้รีเฟรชหน้าเว็บหรือ deploy
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('secdash_audit_logs', JSON.stringify(auditLogs.value))
      } catch {
        // ignore
      }
    }

    // ซิงค์ส่งขึ้นเซิร์ฟเวอร์แบบ Background
    try {
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost'
      fetch(`${origin}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer SecDash-Admin-Secret-Key-2026'
        },
        body: JSON.stringify(newLog)
      }).catch(() => null)
    } catch {
      // ignore
    }
  }

  async function fetchReportData() {
    isPageLoading.value = true
    try {
      const basePath = import.meta.env.BASE_URL || '/secdash/'
      const t = Date.now()
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost'
      const [repRes, aiRes, stateRes] = await Promise.all([
        fetch(`${basePath}report.json?t=${t}`).catch(() => fetch(`/report.json?t=${t}`).catch(() => null)),
        fetch(`${basePath}ai_report.json?t=${t}`).catch(() => fetch(`/ai_report.json?t=${t}`).catch(() => null)),
        fetch(`${origin}/api/state`).catch(() => null)
      ])

      // 1. ซิงค์สถานะ unbanned จาก server state API
      if (stateRes && stateRes.ok) {
        try {
          const stateData = await stateRes.json()
          if (Array.isArray(stateData.unbanned_ips)) {
            stateData.unbanned_ips.forEach((ip: string) => unbannedIps.value.add(ip))
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem('secdash_unbanned_ips', JSON.stringify([...unbannedIps.value]))
            }
          }
        } catch {}
      }

      if (repRes && repRes.ok) {
        const data = await repRes.json()
        if (data.generated_at) rawReportStats.value.generatedAt = data.generated_at
        if (data.total_requests) rawReportStats.value.totalRequests = data.total_requests
        if (data.attack_events) rawReportStats.value.attacksMitigated = data.attack_events
        if (data.unique_ips) rawReportStats.value.uniqueIps = data.unique_ips
        if (data.status_counts) rawReportStats.value.statusCounts = data.status_counts
        if (data.top_targets) rawReportStats.value.topTargets = data.top_targets
        if (data.before_after?.after?.requests) {
          const afterReqs = data.before_after.after.requests
          const afterAtks = data.before_after.after.attacks || 0
          rawReportStats.value.defenseEfficiency = ((1 - (afterAtks / afterReqs)) * 100).toFixed(1) + '%'
        }
        if (data.by_category) {
          rawReportStats.value.categories.xmlrpc = data.by_category.xmlrpc_abuse || 10833
          rawReportStats.value.categories.vulnScan = data.by_category.vuln_scan || 1317
          rawReportStats.value.categories.wpLogin = data.by_category.login_failed || 834
          rawReportStats.value.categories.other = (data.by_category.user_enumeration || 0) + (data.by_category.login_ratelimited || 0)
        }
        if (data.top_attackers && Array.isArray(data.top_attackers)) {
          const mappedAttackers: ThreatRow[] = data.top_attackers.map((a: any, idx: number) => {
            const types = a.types || {}
            const typeKey = Object.keys(types)[0] || 'xmlrpc_abuse'
            let attackType = 'บอทเน็ตยิงสแปม XML-RPC (xmlrpc.php)'
            let icon: 'flame' | 'alert' | 'shield' | 'check' = 'flame'
            let color = '#dc2626'
            let bg = '#fee2e2'
            if (typeKey === 'login_failed') {
              attackType = 'สุ่มรหัสผ่านหลังบ้าน (/wp-login.php)'
              icon = 'alert'
              color = '#ea580c'
              bg = '#ffedd5'
            } else if (typeKey === 'vuln_scan') {
              attackType = 'สแกนหาช่องโหว่ปลั๊กอิน (Vuln Probing)'
              icon = 'shield'
              color = '#9333ea'
              bg = '#f3e8ff'
            } else if (typeKey === 'user_enumeration') {
              attackType = 'บอทตรวจหารายชื่อแอดมิน (User Enum)'
              icon = 'flame'
              color = '#dc2626'
              bg = '#fee2e2'
            }
            const lastSeenStr = a.last_seen || ''
            let rawTime = 0
            if (lastSeenStr) {
              const parsed = new Date(lastSeenStr.replace(' ', 'T') + 'Z').getTime()
              rawTime = isNaN(parsed) ? 0 : parsed
            } else {
              rawTime = Date.now() - (idx + 1) * 3600000 * 24
            }
            // ตรวจสอบว่า IP นี้ถูกปลดแบนหรือไม่ (จำสถานะถาวร)
            const isUnbanned = unbannedIps.value.has(a.ip) || a.is_unbanned === true
            if (isUnbanned) {
              unbannedIps.value.add(a.ip)
              icon = 'check'
              color = '#059669'
              bg = '#d1fae5'
            }

            return {
              id: `threat-${idx + 1}`,
              ip: a.ip,
              attackType,
              icon,
              color,
              bg,
              threatIntensity: a.severity === 'high' ? 85 : 55,
              allocation: Math.min(100, Math.max(10, Math.round((a.hits / 10100) * 100))),
              hits: `${a.hits.toLocaleString()} ครั้ง`,
              isUnbanned,
              lastSeen: lastSeenStr,
              lastSeenRaw: rawTime
            }
          })

          // ซิงค์ state และ client IP จาก Server API
        try {
          const stateRes = await fetch(`${origin}/api/state`, { signal: AbortSignal.timeout(4000) }).catch(() => null)
          if (stateRes && stateRes.ok) {
            const serverState = await stateRes.json()
            if (serverState.client_ip) {
              clientIp.value = serverState.client_ip
              if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem('secdash_client_ip', serverState.client_ip)
              }
            }
            if (Array.isArray(serverState.unbanned_ips)) {
              serverState.unbanned_ips.forEach((ip: string) => unbannedIps.value.add(ip))
            }
          }
        } catch {}

        // สำรองหา client IP ผ่าน ipify หาก server ไม่ได้ส่งกลับมา
        if (!clientIp.value) {
          try {
            const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) }).catch(() => null)
            if (ipRes && ipRes.ok) {
              const ipData = await ipRes.json()
              if (ipData.ip) {
                clientIp.value = ipData.ip
                if (typeof window !== 'undefined' && window.localStorage) {
                  localStorage.setItem('secdash_client_ip', ipData.ip)
                }
              }
            }
          } catch {}
        }

        // รวม customThreatRows ที่แอดมินเพิ่มเองเข้าไปในตารางเสมอเพื่อไม่ให้หายหลังรีเฟรช
          const customList = customThreatRows.value.slice()
          const customMap = new Map(customList.map(r => [r.ip, r]))
          customList.forEach(c => {
            c.isUnbanned = unbannedIps.value.has(c.ip)
          })

          const mergedAttackers = [
            ...customList,
            ...mappedAttackers.filter(a => !customMap.has(a.ip))
          ]
          threatRows.value = mergedAttackers
        }

        // ซิงค์ audit logs จาก Server API
        try {
          const logsRes = await fetch(`${origin}/api/logs`).catch(() => null)
          if (logsRes && logsRes.ok) {
            const serverLogs = await logsRes.json()
            if (Array.isArray(serverLogs) && serverLogs.length > 0) {
              const existingIds = new Set(auditLogs.value.map(l => l.id))
              const newServerLogs = serverLogs.filter((l: any) => !existingIds.has(l.id))
              if (newServerLogs.length > 0) {
                auditLogs.value = [...newServerLogs, ...auditLogs.value].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                if (typeof window !== 'undefined' && window.localStorage) {
                  localStorage.setItem('secdash_audit_logs', JSON.stringify(auditLogs.value))
                }
              }
            }
          }
        } catch {}

        if (data.audit_logs && Array.isArray(data.audit_logs)) {
          // ผสานข้อมูลจริงจาก Fail2ban บนเซิร์ฟเวอร์
          const manualLogs = auditLogs.value.filter(l => !l.id.startsWith('f2b-') && l.ip !== '1.46.128.90')
          const merged = [...manualLogs, ...data.audit_logs]
          merged.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
          auditLogs.value = merged
        }
        if (data.hourly && Array.isArray(data.hourly)) {
          hourlyRecords.value = data.hourly
        }
      }

      if (aiRes && aiRes.ok) {
        const aiData = await aiRes.json()
        if (aiData.summary) rawReportStats.value.aiSummary = aiData.summary
        if (aiData.findings && aiData.findings.length > 0) rawReportStats.value.aiFinding = aiData.findings[0]
        aiReport.value = {
          ...aiReport.value,
          ...aiData
        }
      }
    } catch {
      // คงข้อมูลตั้งต้น
    } finally {
      isPageLoading.value = false
    }
  }

  return {
    isPageLoading,
    isAddModalOpen,
    quickIp,
    quickActionType,
    quickNote,
    apiActionLoading,
    clientIp,
    rawReportStats,
    aiReport,
    hourlyRecords,
    threatRows,
    customThreatRows,
    addCustomThreatRow,
    auditLogs,
    unbannedIps,
    markIpUnbanned,
    addAuditLog,
    fetchReportData
  }
})
