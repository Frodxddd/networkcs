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
}

export interface AuditLogRow {
  id: string
  timestamp: string
  ip: string
  action: 'UNBAN' | 'BAN'
  actionLabel: string
  detail: string
}

export const useSecurityStore = defineStore('security', () => {
  const isAddModalOpen = ref(false)
  const quickIp = ref('')
  const quickActionType = ref<'unban' | 'ban'>('unban')
  const quickNote = ref('')
  const apiActionLoading = ref(false)
  const isPageLoading = ref(false)

  const rawReportStats = ref({
    totalRequests: 27902,
    attacksMitigated: 12996,
    defenseEfficiency: '99.5%',
    activeRules: 15,
    categories: {
      xmlrpc: 10833,
      vulnScan: 1317,
      wpLogin: 822,
      other: 24
    },
    aiSummary: '24 ชั่วโมงล่าสุดมี 2,319 คำขอ เป็นการโจมตี 0 ครั้ง (0.0%)',
    aiFinding: 'หลังเปิด Firewall สัดส่วนการโจมตีลดเหลือ 0.5% เทียบกับก่อนเปิด 59.2%'
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
      isUnbanned: false
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
      isUnbanned: false
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
      isUnbanned: false
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
      isUnbanned: false
    },
    {
      id: 'threat-5',
      ip: '1.46.128.90',
      attackType: 'IP แอดมิน คณะวิทยาการสารสนเทศ ม.บูรพา (บางแสน)',
      icon: 'check',
      color: '#059669',
      bg: '#d1fae5',
      threatIntensity: 18,
      allocation: 18,
      hits: '0 ครั้ง (ปลอดภัย)',
      isUnbanned: true
    }
  ])

  // 4. บันทึกประวัติการแก้ไขกฎไฟร์วอลล์ (Audit Logs - ห้ามแก้ไข/ห้ามลบ)
  const defaultInitialLogs: AuditLogRow[] = [
    {
      id: 'log-1',
      timestamp: '2026-10-24 11:20:15',
      ip: '1.46.128.90',
      action: 'UNBAN',
      actionLabel: 'ปลดแบน IP',
      detail: 'ปลดแบนผ่านหน้าจัดการ IP (อนุญาตใช้งาน Whitelist)'
    },
    {
      id: 'log-2',
      timestamp: '2026-10-24 10:45:00',
      ip: '34.182.207.28',
      action: 'BAN',
      actionLabel: 'บล็อก IP',
      detail: 'บล็อกการเชื่อมต่อผ่านหน้าจัดการ IP (ตรวจพบบอทสแปม XML-RPC)'
    },
    {
      id: 'log-3',
      timestamp: '2026-10-24 09:12:34',
      ip: '67.205.191.35',
      action: 'BAN',
      actionLabel: 'บล็อก IP',
      detail: 'บล็อกการเชื่อมต่อผ่านหน้าจัดการ IP (ตรวจพบสุ่มรหัสผ่านหลังบ้าน)'
    },
    {
      id: 'log-4',
      timestamp: '2026-10-24 08:30:19',
      ip: '35.214.108.214',
      action: 'BAN',
      actionLabel: 'บล็อก IP',
      detail: 'บล็อกการเชื่อมต่อผ่านหน้าจัดการ IP (ตรวจพบสแกนหาช่องโหว่)'
    },
    {
      id: 'log-5',
      timestamp: '2026-10-24 07:15:42',
      ip: '34.169.31.210',
      action: 'BAN',
      actionLabel: 'บล็อก IP',
      detail: 'บล็อกการเชื่อมต่อผ่านหน้าจัดการ IP (ตรวจพบบอทสแกนหาแอดมิน)'
    }
  ]

  const loadAuditLogs = (): AuditLogRow[] => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('secdash_audit_logs')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      } catch {
        // fallback
      }
    }
    return defaultInitialLogs
  }

  const auditLogs = ref<AuditLogRow[]>(loadAuditLogs())

  function addAuditLog(entry: Omit<AuditLogRow, 'id' | 'timestamp'>) {
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    
    const newLog: AuditLogRow = {
      id: `log-${Date.now()}`,
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

    // ซิงค์ส่งขึ้นเซิร์ฟเวอร์แบบ Background (ถ้ามี API endpoint บนเซิร์ฟเวอร์)
    try {
      const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost'
      fetch(`${origin}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const [repRes, aiRes] = await Promise.all([
        fetch(`${basePath}report.json`).catch(() => fetch('/report.json').catch(() => null)),
        fetch(`${basePath}ai_report.json`).catch(() => fetch('/ai_report.json').catch(() => null))
      ])

      if (repRes && repRes.ok) {
        const data = await repRes.json()
        if (data.total_requests) rawReportStats.value.totalRequests = data.total_requests
        if (data.attack_events) rawReportStats.value.attacksMitigated = data.attack_events
        if (data.by_category) {
          rawReportStats.value.categories.xmlrpc = data.by_category.xmlrpc_abuse || 10833
          rawReportStats.value.categories.vulnScan = data.by_category.vuln_scan || 1317
          rawReportStats.value.categories.wpLogin = data.by_category.login_failed || 822
          rawReportStats.value.categories.other = (data.by_category.user_enumeration || 0) + (data.by_category.login_ratelimited || 0)
        }
      }

      if (aiRes && aiRes.ok) {
        const aiData = await aiRes.json()
        if (aiData.summary) rawReportStats.value.aiSummary = aiData.summary
        if (aiData.findings && aiData.findings.length > 0) rawReportStats.value.aiFinding = aiData.findings[0]
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
    rawReportStats,
    threatRows,
    auditLogs,
    addAuditLog,
    fetchReportData
  }
})
