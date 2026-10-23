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
    fetchReportData
  }
})
