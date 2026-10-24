<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSecurityStore } from '../stores/security'
import {
  ShieldAlert,
  ShieldCheck,
  Download,
  Settings,
  Flame,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ArrowRight,
  Globe,
  Calendar,
  BarChart3,
  Users,
  RefreshCw
} from 'lucide-vue-next'

const securityStore = useSecurityStore()
const router = useRouter()
const { rawReportStats, isPageLoading } = storeToRefs(securityStore)

const handleRefreshData = () => {
  securityStore.fetchReportData()
}

interface ChartPoint {
  day: string
  date: string
  x: number
  reqY: number
  atkY: number
  requests: number
  attacks: number
  rate: string
  status: string
}

type PeriodType = 'daily' | 'monthly' | 'yearly'



const selectedPeriod = ref<PeriodType>('monthly')
const isPeriodDropdownOpen = ref(false)
const setPeriod = (period: PeriodType) => {
  selectedPeriod.value = period
  isPeriodDropdownOpen.value = false
}

// คำนวณสถิติตามช่วงเวลา (รายวัน / รายเดือน / รายปี)
const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

const reportDateFormatted = computed(() => {
  if (rawReportStats.value.generatedAt) {
    const d = new Date(rawReportStats.value.generatedAt)
    if (!isNaN(d.getTime())) {
      return `${d.getDate()} ${thaiMonths[d.getMonth()]}`
    }
  }
  const now = new Date()
  return `${now.getDate()} ${thaiMonths[now.getMonth()]}`
})

const currentStats = computed(() => {
  if (selectedPeriod.value === 'daily') {
    return {
      totalRequests: 2319,
      attacksMitigated: 0,
      defenseEfficiency: '100%',
      activeRules: 15,
      trendRequests: '↗ 2.4%',
      trendAttacks: '↘ 100%',
      subLeadReq: 'นักเรียนเข้าดูข้อมูล TCAS 68',
      subLeadAtk: 'ไม่มีการโจมตีเล็ดลอดผ่าน GeoIP',
      categories: {
        xmlrpc: 0,
        vulnScan: 0,
        wpLogin: 0,
        other: 0
      },
      chartSubtitle: `ทราฟฟิกรายชั่วโมงตลอด 24 ชม. ล่าสุด (${reportDateFormatted.value}) • เว็บไซต์หลักสูตร วท.บ. วิทยาการคอมพิวเตอร์ ม.บูรพา`
    }
  } else if (selectedPeriod.value === 'yearly') {
    return {
      totalRequests: 142500,
      attacksMitigated: 54200,
      defenseEfficiency: '99.2%',
      activeRules: 28,
      trendRequests: '↗ 28%',
      trendAttacks: '↘ 84.5%',
      subLeadReq: 'ตลอดปีการศึกษา 2568',
      subLeadAtk: 'สกัดกั้นการโจมตีเว็บสะสม',
      categories: {
        xmlrpc: 38200,
        vulnScan: 9400,
        wpLogin: 5800,
        other: 800
      },
      chartSubtitle: 'สถิติตลอดทั้งปีการศึกษา 2568 • เว็บไซต์หลักสูตร วท.บ. วิทยาการคอมพิวเตอร์ ม.บูรพา'
    }
  }
  // ค่าเริ่มต้น: รายเดือน (ข้อมูลจริงจาก Stage 2 Security Report)
  return {
    totalRequests: rawReportStats.value.totalRequests,
    attacksMitigated: rawReportStats.value.attacksMitigated,
    defenseEfficiency: rawReportStats.value.defenseEfficiency,
    activeRules: rawReportStats.value.activeRules,
    trendRequests: '↗ 12.8%',
    trendAttacks: '↘ 99.1%',
    subLeadReq: 'ทราฟฟิกจริงนักศึกษา & ผู้สมัคร',
    subLeadAtk: 'บล็อกบอทเน็ตต่างชาติแล้ว',
    categories: rawReportStats.value.categories,
    chartSubtitle: 'ช่วงเวลาก่อนและหลังเปิดระบบป้องกัน GeoIP • เว็บไซต์หลักสูตร วท.บ. วิทยาการคอมพิวเตอร์ ม.บูรพา'
  }
})

// ป้ายกำกับช่วงเวลา
const periodLabels: Record<PeriodType, string> = {
  daily: 'รายวัน',
  monthly: 'รายเดือน',
  yearly: 'รายปี'
}

// จุดกราฟตามช่วงเวลา
const chartPoints = computed<ChartPoint[]>(() => {
  if (selectedPeriod.value === 'daily') {
    const dStr = reportDateFormatted.value
    return [
      { day: '00:00', date: dStr, x: 70, reqY: 185, atkY: 205, requests: 45, attacks: 0, rate: '100%', status: 'ผู้ใช้งานเข้าชมหน้าหลักสูตรปกติ' },
      { day: '04:00', date: dStr, x: 215, reqY: 195, atkY: 205, requests: 18, attacks: 0, rate: '100%', status: 'ทราฟฟิกช่วงเช้ามืด ปลอดภัยสมบูรณ์' },
      { day: '08:00', date: dStr, x: 360, reqY: 125, atkY: 205, requests: 312, attacks: 0, rate: '100%', status: 'เริ่มมีผู้เข้าชมและค้นหาข้อมูล TCAS' },
      { day: '12:00', date: dStr, x: 505, reqY: 80, atkY: 205, requests: 580, attacks: 0, rate: '100%', status: 'ช่วงทราฟฟิกเข้าชม 4 กลุ่มวิชาเอกสูงสุด' },
      { day: '16:00', date: dStr, x: 650, reqY: 95, atkY: 205, requests: 510, attacks: 0, rate: '100%', status: 'นักศึกษาและอาจารย์เข้าใช้งานปกติ' },
      { day: '20:00', date: dStr, x: 795, reqY: 110, atkY: 205, requests: 440, attacks: 0, rate: '100%', status: 'ทราฟฟิกช่วงค่ำ ปกป้องสมบูรณ์ 100%' },
      { day: '23:59', date: dStr, x: 940, reqY: 120, atkY: 205, requests: 414, attacks: 0, rate: '100%', status: 'สรุป 24 ชม. รวม 2,319 คำขอ โจมตี 0 ครั้ง' }
    ]
  } else if (selectedPeriod.value === 'yearly') {
    return [
      { day: 'พ.ค.', date: '2568', x: 70, reqY: 165, atkY: 175, requests: 12400, attacks: 5200, rate: '97.2%', status: 'เริ่มเปิดรับสมัครนิสิตใหม่ TCAS รอบ 3' },
      { day: 'มิ.ย.', date: '2568', x: 215, reqY: 140, atkY: 155, requests: 18500, attacks: 7800, rate: '98.1%', status: 'เปิดภาคเรียนที่ 1/2568 ทราฟฟิกเพิ่มขึ้น' },
      { day: 'ก.ค.', date: '2568', x: 360, reqY: 120, atkY: 130, requests: 22800, attacks: 11400, rate: '98.4%', status: 'บอทต่างประเทศเริ่มสแกนช่องโหว่ WordPress' },
      { day: 'ส.ค.', date: '2568', x: 505, reqY: 60, atkY: 75, requests: 35100, attacks: 19800, rate: '98.9%', status: 'ช่วงที่มีการโจมตียิง XML-RPC สูงสุดของปี' },
      { day: 'ก.ย.', date: '2568', x: 650, reqY: 110, atkY: 170, requests: 24200, attacks: 6100, rate: '99.3%', status: 'เปิดใช้งาน iptables GeoIP สกัดกั้นสำเร็จ' },
      { day: 'ต.ค.', date: '2568', x: 795, reqY: 100, atkY: 195, requests: 27902, attacks: 12996, rate: '99.5%', status: 'เปิดระบบ SecDash Stage 2 ตรวจจับ AI' },
      { day: 'ปัจจุบัน', date: '2568', x: 940, reqY: 175, atkY: 205, requests: 1900, attacks: 0, rate: '100%', status: 'หลังเปิดไฟร์วอลล์ สัดส่วนโจมตีเหลือ 0.0%' }
    ]
  }
  // ข้อมูลจริงรายสัปดาห์ในเดือนตุลาคม 2026
  return [
    { day: 'Mon', date: '10/06', x: 70, reqY: 175, atkY: 188, requests: 864, attacks: 270, rate: '96.2%', status: 'สแกนหาไดเรกทอรีแอดมิน /wp-admin/' },
    { day: 'Tue', date: '10/07', x: 215, reqY: 155, atkY: 172, requests: 1420, attacks: 580, rate: '98.4%', status: 'บอทต่างชาติยิง xmlrpc.php pingback' },
    { day: 'Wed', date: '10/08', x: 360, reqY: 110, atkY: 132, requests: 3840, attacks: 2460, rate: '99.1%', status: 'สุ่มรหัสผ่าน wp-login.php ถี่ผิดปกติ' },
    { day: 'Thu', date: '10/09', x: 505, reqY: 55, atkY: 68, requests: 10833, attacks: 8850, rate: '99.8%', status: 'จุดสูงสุดของบอทเน็ตยิงสแปม XML-RPC' },
    { day: 'Fri', date: '10/10', x: 650, reqY: 90, atkY: 145, requests: 5210, attacks: 2100, rate: '99.4%', status: 'เริ่มเปิดใช้ iptables DROP ตามประเทศ (GeoIP)' },
    { day: 'Sat', date: '10/11', x: 795, reqY: 130, atkY: 195, requests: 2890, attacks: 420, rate: '99.6%', status: 'ทราฟฟิกการโจมตีลดลงฮวบหลังบล็อกต่างประเทศ' },
    { day: 'Sun', date: '10/12', x: 940, reqY: 170, atkY: 205, requests: 2319, attacks: 0, rate: '100%', status: 'ไม่มีการโจมตีเล็ดลอดผ่าน GeoIP (ปลอดภัย 100%)' }
  ]
})

const activeIndex = ref(3) // ค่าเริ่มต้นที่จุดพีก
const activePoint = computed(() => chartPoints.value[activeIndex.value] || chartPoints.value[0]!)

// ฟังก์ชันสร้างเส้น Spline เรียบเนียน
function generateSpline(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ''
  let d = `M ${points[0]!.x} ${points[0]!.y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[Math.min(i + 2, points.length - 1)]!

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x} ${p2.y}`
  }
  return d
}

const requestsPath = computed(() => generateSpline(chartPoints.value.map(p => ({ x: p.x, y: p.reqY }))))
const attacksPath = computed(() => generateSpline(chartPoints.value.map(p => ({ x: p.x, y: p.atkY }))))

// พื้นที่ลายเส้นขีดแรเงาช่วงการสกัดกั้น
const hatchAreaPath = computed(() => {
  const p2 = chartPoints.value[2]
  const p3 = chartPoints.value[3]
  const p4 = chartPoints.value[4]
  if (!p2 || !p3 || !p4) return ''
  return `M ${p2.x} ${p2.reqY} Q ${p3.x} ${p3.reqY - 5} ${p4.x} ${p4.reqY} L ${p4.x} ${p4.atkY} Q ${p3.x} ${p3.atkY + 5} ${p2.x} ${p2.atkY} Z`
})

// ตำแหน่ง Tooltip บนกราฟ
const tooltipLeftPercent = computed(() => {
  const x = activePoint.value.x
  return Math.min(Math.max((x / 1000) * 100, 10), 85)
})

// สถานะการชี้เมาส์บนกราฟ (ชี้แล้วขึ้นจำนวน) และ Modal รายละเอียด (กดแล้วขึ้นรายละเอียดเชิงลึก)
const isChartHovered = ref(false)
const isDetailModalOpen = ref(false)
const detailPoint = ref<ChartPoint | null>(null)

const openDetailModal = (pt?: ChartPoint) => {
  detailPoint.value = pt || activePoint.value
  isDetailModalOpen.value = true
}

// ฟังก์ชันชี้เมาส์บนกราฟ (ชี้แล้วขึ้นจำนวนตัวเลขเหมือนเดิม)
const handleChartHover = (e: MouseEvent) => {
  isChartHovered.value = true
  const target = e.currentTarget as HTMLElement
  if (!target) return
  const rect = target.getBoundingClientRect()
  const mouseX = ((e.clientX - rect.left) / rect.width) * 1000

  let closestIdx = 0
  let minDiff = Infinity
  chartPoints.value.forEach((pt, idx) => {
    const diff = Math.abs(pt.x - mouseX)
    if (diff < minDiff) {
      minDiff = diff
      closestIdx = idx
    }
  })
  activeIndex.value = closestIdx
}

const selectDay = (index: number) => {
  activeIndex.value = index
  isChartHovered.value = true
}

const handleDayClick = (index: number) => {
  activeIndex.value = index
  isChartHovered.value = true
  const pt = chartPoints.value[index] || chartPoints.value[0]!
  openDetailModal(pt)
}


// ข้อมูลและสถานะการโต้ตอบของกราฟผลลัพธ์ HTTP Status (เชื่อมโยงตามตัวกรอง วัน/เดือน/ปี)
export interface HttpStatusDetail {
  code: string
  name: string
  fullLabel: string
  count: number
  pct: string
  color: string
  dotClass: string
  strokeDasharray: string
  strokeDashoffset: string
  description: string
  typicalCauses: string
  topPaths: { path: string; count: number }[]
  firewallAction: string
  isThreat: boolean
}

interface HttpPeriodData {
  total: number
  label: string
  items: HttpStatusDetail[]
}

const httpDataByPeriod: Record<PeriodType, HttpPeriodData> = {
  daily: {
    total: 2319,
    label: 'ประจำวัน (24 ชม. ล่าสุด)',
    items: [
      {
        code: '2xx',
        name: 'สำเร็จ',
        fullLabel: '2xx Success (HTTP 200 OK)',
        count: 2110,
        pct: '91.0%',
        color: '#10b981',
        dotClass: 'bg-green',
        strokeDasharray: '332 365',
        strokeDashoffset: '0',
        description: 'คำขอเข้าชมเว็บไซต์สำเร็จ ผู้ใช้งานได้รับหน้าเว็บและข้อมูลปกติ',
        typicalCauses: 'นิสิตและคณาจารย์เข้าดูหน้าหลัก CS BUU และข่าวสารการศึกษา',
        topPaths: [
          { path: '/', count: 1240 },
          { path: '/courses/cs', count: 520 },
          { path: '/admissions-tcas68', count: 350 }
        ],
        firewallAction: 'ส่งผ่านปกติ ไม่มีการปิดกั้น',
        isThreat: false
      },
      {
        code: '3xx',
        name: 'ย้ายเส้นทาง',
        fullLabel: '3xx Redirect (HTTP 301/302)',
        count: 78,
        pct: '3.4%',
        color: '#0284c7',
        dotClass: 'bg-blue',
        strokeDasharray: '12 365',
        strokeDashoffset: '-332',
        description: 'ส่งต่อผู้ใช้ไปยัง URL ใหม่โดยอัตโนมัติ (เช่น HTTP เป็น HTTPS)',
        typicalCauses: 'การเชื่อมต่อผ่าน HTTP ถูกส่งต่อไปยัง HTTPS อัตโนมัติ',
        topPaths: [
          { path: 'http:// -> https://', count: 54 },
          { path: '/login -> /wp-login.php', count: 24 }
        ],
        firewallAction: 'ส่งต่ออัตโนมัติโดย Nginx',
        isThreat: false
      },
      {
        code: '4xx',
        name: 'คำขอผิด',
        fullLabel: '4xx Client Error (404/403)',
        count: 118,
        pct: '5.1%',
        color: '#f59e0b',
        dotClass: 'bg-amber',
        strokeDasharray: '19 365',
        strokeDashoffset: '-344',
        description: 'คำขอ URL ที่ไม่มีอยู่จริง หรือบอทพยายามสแกนหาไฟล์ระบบ',
        typicalCauses: 'การสแกนหาไฟล์คอนฟิก (.env, setup.php) หรือพิมพ์ URL ผิด',
        topPaths: [
          { path: '/.env', count: 58 },
          { path: '/wp-admin/install.php', count: 34 },
          { path: '/xmlrpc.php', count: 26 }
        ],
        firewallAction: 'ปิดกั้นทันที (HTTP 403) และบันทึกลงระบบเฝ้าระวัง',
        isThreat: true
      },
      {
        code: '429',
        name: 'บล็อกถี่',
        fullLabel: '429 Too Many Requests',
        count: 12,
        pct: '0.5%',
        color: '#8b5cf6',
        dotClass: 'bg-purple',
        strokeDasharray: '2 365',
        strokeDashoffset: '-363',
        description: 'คำขอถูกตัดการเชื่อมต่อเนื่องจากยิงเข้ามาด้วยความถี่สูงผิดปกติ',
        typicalCauses: 'สคริปต์สแกนพยายามยิงคำขอต่อเนื่องเกิน 100 req/min',
        topPaths: [
          { path: '/wp-login.php (Flooding)', count: 8 },
          { path: '/xmlrpc.php (Brute-force)', count: 4 }
        ],
        firewallAction: 'ตัดการเชื่อมต่อและจำกัดอัตราทันที (Rate Limiting)',
        isThreat: true
      },
      {
        code: '5xx',
        name: 'ผิดพลาด',
        fullLabel: '5xx Server Error',
        count: 1,
        pct: '0.04%',
        color: '#ef4444',
        dotClass: 'bg-red',
        strokeDasharray: '1 365',
        strokeDashoffset: '-365',
        description: 'ข้อผิดพลาดชั่วคราวฝั่งเซิร์ฟเวอร์ ระบบทำงานเสถียร 99.96%',
        typicalCauses: 'Background Worker Timeout ชั่วขณะ',
        topPaths: [
          { path: '/api/v1/health-check', count: 1 }
        ],
        firewallAction: 'ระบบ Auto-Heal คืนสถานะปกติทันที',
        isThreat: false
      }
    ]
  },
  monthly: {
    total: 27902,
    label: 'ประจำเดือนนี้ (30 วันล่าสุด)',
    items: [
      {
        code: '2xx',
        name: 'สำเร็จ',
        fullLabel: '2xx Success (HTTP 200 OK)',
        count: 24550,
        pct: '88.0%',
        color: '#10b981',
        dotClass: 'bg-green',
        strokeDasharray: '321 365',
        strokeDashoffset: '0',
        description: 'คำขอปกติที่เซิร์ฟเวอร์ตอบสนองสำเร็จ นิสิตเข้าถึงเนื้อหาได้ราบรื่น',
        typicalCauses: 'การเข้าชมเว็บไซต์ภาควิชา ข้อมูลวิชาเรียน และการส่งงานนิสิต',
        topPaths: [
          { path: '/', count: 11420 },
          { path: '/courses/computer-science', count: 6850 },
          { path: '/admissions-tcas68', count: 3820 },
          { path: '/about-us', count: 2460 }
        ],
        firewallAction: 'ส่งผ่านปกติ แคชผ่าน Cloudflare Edge',
        isThreat: false
      },
      {
        code: '3xx',
        name: 'ย้ายเส้นทาง',
        fullLabel: '3xx Redirect (HTTP 301/302)',
        count: 980,
        pct: '3.5%',
        color: '#0284c7',
        dotClass: 'bg-blue',
        strokeDasharray: '13 365',
        strokeDashoffset: '-321',
        description: 'การส่งต่อผู้ใช้ไปยัง URL ปลายทางที่ถูกต้องและปลอดภัย',
        typicalCauses: 'การเปลี่ยนผ่าน URL เก่าสู่โครงสร้างใหม่ และการบังคับใช้ HTTPS',
        topPaths: [
          { path: 'http:// -> https://', count: 620 },
          { path: '/tcas -> /admissions-tcas68', count: 210 },
          { path: '/login -> /wp-login.php', count: 150 }
        ],
        firewallAction: 'ส่งต่ออัตโนมัติด้วย Nginx Rewrite Rule',
        isThreat: false
      },
      {
        code: '4xx',
        name: 'คำขอผิด',
        fullLabel: '4xx Client Error (404/403)',
        count: 2120,
        pct: '7.6%',
        color: '#f59e0b',
        dotClass: 'bg-amber',
        strokeDasharray: '28 365',
        strokeDashoffset: '-334',
        description: 'คำขอไม่ถูกต้องหรือบอทพยายามสแกนหาช่องโหว่ WordPress / PHP',
        typicalCauses: 'บอทยิงหาไฟล์ .env, config.json, และช่องโหว่ปลั๊กอินเก่า',
        topPaths: [
          { path: '/.env', count: 850 },
          { path: '/wp-admin/setup-config.php', count: 540 },
          { path: '/xmlrpc.php', count: 420 },
          { path: '/config.json', count: 310 }
        ],
        firewallAction: 'ตอบกลับ HTTP 403 และเพิ่ม IP เข้าสู่ Blacklist ชั่วคราว',
        isThreat: true
      },
      {
        code: '429',
        name: 'บล็อกถี่',
        fullLabel: '429 Too Many Requests',
        count: 235,
        pct: '0.8%',
        color: '#8b5cf6',
        dotClass: 'bg-purple',
        strokeDasharray: '3 365',
        strokeDashoffset: '-362',
        description: 'คำขอถูกปฏิเสธเนื่องจากยิงเข้ามาด้วยความถี่สูงเกินเกณฑ์จำกัด',
        typicalCauses: 'การพยายาม Brute-Force รหัสผ่านผู้ดูแลระบบหรือการยิงสแกนรัว',
        topPaths: [
          { path: '/wp-login.php (Flooding)', count: 145 },
          { path: '/xmlrpc.php (Multi-call)', count: 65 },
          { path: '/wp-json/wp/v2/users', count: 25 }
        ],
        firewallAction: 'บล็อกด้วย Nginx Limit Req และเพิ่มกฎ iptables DROP',
        isThreat: true
      },
      {
        code: '5xx',
        name: 'ผิดพลาด',
        fullLabel: '5xx Server Error',
        count: 17,
        pct: '0.1%',
        color: '#ef4444',
        dotClass: 'bg-red',
        strokeDasharray: '1 365',
        strokeDashoffset: '-365',
        description: 'ข้อผิดพลาดภายในฝั่งเซิร์ฟเวอร์ เกิดขึ้นน้อยมาก ระบบเสถียร 99.9%',
        typicalCauses: 'Database Connection Pool เต็มชั่วขณะตอนสำรองข้อมูล',
        topPaths: [
          { path: '/api/v1/database-backup (Timeout)', count: 11 },
          { path: '/wp-admin/admin-ajax.php', count: 6 }
        ],
        firewallAction: 'Health Check รีสตาร์ต Worker Process อัตโนมัติ',
        isThreat: false
      }
    ]
  },
  yearly: {
    total: 142500,
    label: 'ประจำปีนี้ (สะสมรายปี)',
    items: [
      {
        code: '2xx',
        name: 'สำเร็จ',
        fullLabel: '2xx Success (HTTP 200 OK)',
        count: 126820,
        pct: '89.0%',
        color: '#10b981',
        dotClass: 'bg-green',
        strokeDasharray: '325 365',
        strokeDashoffset: '0',
        description: 'คำขอปกติที่ตอบสนองสำเร็จตลอดทั้งปี มีความเสถียรสูงต่อเนื่อง',
        typicalCauses: 'ผู้เข้าชมเว็บไซต์ CS BUU ตลอดปีการศึกษา การเปิดรับสมัคร TCAS ทุกรอบ',
        topPaths: [
          { path: '/', count: 58400 },
          { path: '/courses/computer-science', count: 32600 },
          { path: '/admissions-tcas68', count: 21400 },
          { path: '/about-us', count: 14420 }
        ],
        firewallAction: 'ส่งผ่านปกติ พร้อมระบบ Caching ประสิทธิภาพสูง',
        isThreat: false
      },
      {
        code: '3xx',
        name: 'ย้ายเส้นทาง',
        fullLabel: '3xx Redirect (HTTP 301/302)',
        count: 4980,
        pct: '3.5%',
        color: '#0284c7',
        dotClass: 'bg-blue',
        strokeDasharray: '13 365',
        strokeDashoffset: '-325',
        description: 'การส่งต่อผู้ใช้ตามสถาปัตยกรรม URL ใหม่ของภาควิชา',
        typicalCauses: 'การอัปเกรดระบบเว็บและการเปลี่ยนโดเมนภายใน',
        topPaths: [
          { path: 'http:// -> https://', count: 3150 },
          { path: '/tcas -> /admissions-tcas68', count: 1120 },
          { path: '/old-site -> /new-site', count: 710 }
        ],
        firewallAction: 'ส่งต่ออัตโนมัติ 301 Permanent Redirect',
        isThreat: false
      },
      {
        code: '4xx',
        name: 'คำขอผิด',
        fullLabel: '4xx Client Error (404/403)',
        count: 9260,
        pct: '6.5%',
        color: '#f59e0b',
        dotClass: 'bg-amber',
        strokeDasharray: '24 365',
        strokeDashoffset: '-338',
        description: 'คำขอลองของและบอทยิงหาช่องโหว่สะสมตลอดทั้งปี',
        typicalCauses: 'สคริปต์สแกนช่องโหว่อัตโนมัติจากทั่วโลก',
        topPaths: [
          { path: '/.env', count: 3820 },
          { path: '/wp-admin/setup-config.php', count: 2410 },
          { path: '/xmlrpc.php', count: 1850 },
          { path: '/phpmyadmin/', count: 1180 }
        ],
        firewallAction: 'บล็อก 403 Forbidden และแบน IP อัตโนมัติสะสมกว่า 800+ IP',
        isThreat: true
      },
      {
        code: '429',
        name: 'บล็อกถี่',
        fullLabel: '429 Too Many Requests',
        count: 1340,
        pct: '0.9%',
        color: '#8b5cf6',
        dotClass: 'bg-purple',
        strokeDasharray: '3 365',
        strokeDashoffset: '-362',
        description: 'การสกัดกั้นการยิงถล่มคำขอ (Rate Limiting) ที่เกินเกณฑ์',
        typicalCauses: 'บอทพยายามโจมตีแบบ DoS/Brute-force ช่วงเปิดรับสมัคร',
        topPaths: [
          { path: '/wp-login.php (Flooding)', count: 820 },
          { path: '/xmlrpc.php (Multi-call)', count: 380 },
          { path: '/api/v1/search', count: 140 }
        ],
        firewallAction: 'ตัดการเชื่อมต่ออัตโนมัติด้วย iptables DROP',
        isThreat: true
      },
      {
        code: '5xx',
        name: 'ผิดพลาด',
        fullLabel: '5xx Server Error',
        count: 100,
        pct: '0.1%',
        color: '#ef4444',
        dotClass: 'bg-red',
        strokeDasharray: '1 365',
        strokeDashoffset: '-365',
        description: 'ข้อผิดพลาดระบบสะสมตลอดปี Uptime รวมสูงกว่า 99.9%',
        typicalCauses: 'การรีสตาร์ตเซิร์ฟเวอร์ประจำเดือนและการอัปเดตแพตช์ระบบ',
        topPaths: [
          { path: '/api/backup-sync', count: 62 },
          { path: '/wp-admin/upgrade.php', count: 38 }
        ],
        firewallAction: 'ระบบป้องกัน Failover และ Auto-Heal',
        isThreat: false
      }
    ]
  }
}

const currentHttpData = computed(() => httpDataByPeriod[selectedPeriod.value] || httpDataByPeriod.monthly)
const currentHttpStatusList = computed(() => currentHttpData.value.items)

// ค่าคงที่และสูตรคำนวณ SVG Donut กราฟใหญ่ เด่นชัด ปรับสัดส่วนให้อ่านง่ายและแตะได้ทุกหมวด
// กล่องขนาด 230x230, จุดกึ่งกลาง (115, 115), รัศมี r = 82 (เส้นรอบวง Circumference ≈ 515.22)
const DONUT_RADIUS = 82
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS

// คำนวณความยาวเส้นแบบปรับสัดส่วน (Perceptual Scaling):
// หมวดที่มีคำขอน้อย (เช่น 429 หรือ 5xx) จะได้รับการการันตีขนาดขั้นต่ำ (22px)
// เพื่อให้มองเห็นได้ชัดเจนเป็นแถบสี ไม่กลืนเป็นเส้นด้าย และสามารถแตะเพื่อดูสถิติได้ง่าย
const computedDonutSegments = computed(() => {
  const items = currentHttpStatusList.value
  const total = currentHttpData.value.total
  if (!total || items.length === 0) return []

  const MIN_ARC = 22 // ขนาดขั้นต่ำ 22px ให้เห็นชัดเจนและจิ้มได้สบายตา
  const rawLengths = items.map(item => (item.count / total) * DONUT_CIRCUMFERENCE)

  let boostedTotal = 0
  let unboostedRawTotal = 0
  const finalLengths: number[] = Array.from({ length: items.length }, () => 0)

  // จัดสรรขนาดขั้นต่ำให้หมวดที่มีข้อมูลแต่น้อยกว่า 22px
  items.forEach((item, i) => {
    const raw = rawLengths[i] ?? 0
    if (item.count > 0 && raw < MIN_ARC) {
      finalLengths[i] = MIN_ARC
      boostedTotal += MIN_ARC
    } else {
      unboostedRawTotal += raw
    }
  })

  // กระจายเส้นรอบวงส่วนที่เหลือให้หมวดที่เหลือตามสัดส่วนเดิมอย่างแม่นยำ
  const remaining = Math.max(DONUT_CIRCUMFERENCE - boostedTotal, 0)
  items.forEach((_, i) => {
    if (finalLengths[i] === 0) {
      const raw = rawLengths[i] ?? 0
      finalLengths[i] = unboostedRawTotal > 0 ? (raw / unboostedRawTotal) * remaining : 0
    }
  })

  // สร้าง dasharray และ dashoffset พร้อมเว้นช่องไฟเล็กน้อย (GAP = 2.5px) เพื่อแยกแต่ละเซกเมนต์ให้คมชัด
  const GAP = 2.5
  let accumulated = 0

  return items.map((item, i) => {
    const segmentLen = finalLengths[i] ?? 0
    const visibleLen = Math.max(segmentLen - GAP, 4)
    const dasharray = `${visibleLen.toFixed(1)} ${DONUT_CIRCUMFERENCE.toFixed(1)}`
    const dashoffset = `-${accumulated.toFixed(1)}`
    accumulated += segmentLen
    return {
      ...item,
      dasharray,
      dashoffset
    }
  })
})

const httpSuccessRate = computed(() => {
  const total = currentHttpData.value.total
  if (!total) return '0.0'
  const item2xx = currentHttpStatusList.value.find(i => i.code === '2xx')
  const count = item2xx ? item2xx.count : 0
  return ((count / total) * 100).toFixed(1)
})

const selectedHttpCode = ref<string | null>(null)
const isHttpModalOpen = ref(false)

const currentSelectedStatus = computed<HttpStatusDetail | null>(() => {
  if (!selectedHttpCode.value) return null
  return currentHttpStatusList.value.find(item => item.code === selectedHttpCode.value) || null
})

// แตะที่เซกเมนต์หรือชิป: ครั้งแรกแสดงข้อมูลในกราฟทันที, หากแตะซ้ำเปิดหน้าต่างวิเคราะห์เจาะลึก
const handleSelectHttpStatus = (item: HttpStatusDetail) => {
  if (selectedHttpCode.value === item.code) {
    isHttpModalOpen.value = true
  } else {
    selectedHttpCode.value = item.code
  }
}

// เปิดหน้าต่างเจาะลึก
const handleOpenHttpModal = () => {
  const firstItem = currentHttpStatusList.value[0]
  if (!selectedHttpCode.value && firstItem) {
    selectedHttpCode.value = firstItem.code
  }
  isHttpModalOpen.value = true
}

const handleClearHttpStatus = () => {
  selectedHttpCode.value = null
  isHttpModalOpen.value = false
}

// สถานะ Loading และ Progress Bar (หน้าโหลดเมื่อเข้าเว็บ และตอนกดรีเฟรชข้อมูล)


onMounted(() => {
  securityStore.fetchReportData()
})
</script>


<template>
  <div class="dashboard-page-wrap" @click="isPeriodDropdownOpen = false">
      <main  class="tab-content-fade">
        <!-- 2.1 ส่วนบนตามภาพ: การ์ดน้ำเงินเข้มศูนย์วิเคราะห์ความปลอดภัยอัจฉริยะ -->
        <section class="hero-navy-card">
          <div class="hero-main-col">
            <!-- ป้ายด้านบน: ระบบเฝ้าระวังอัตโนมัติ 24/7 • AI Cybersecurity Shield • SecDash -->
            <div class="hero-top-badge">
              <span class="gold-pulse-dot"></span>
              <span>ระบบเฝ้าระวังอัตโนมัติ 24/7 • AI Cybersecurity Shield • SecDash</span>
            </div>

            <!-- แถวหัวข้อ: ศูนย์วิเคราะห์ความปลอดภัยอัจฉริยะ + ป้าย Real-Time SecOps -->
            <div class="hero-title-row">
              <h2 class="hero-main-title">ศูนย์วิเคราะห์ความปลอดภัยอัจฉริยะ</h2>
              <span class="hero-secops-pill">Real-Time SecOps</span>
            </div>

            <!-- คำอธิบายย่อย -->
            <p class="hero-desc-text">
              วิเคราะห์พฤติกรรมการเข้าถึงและตรวจจับภัยคุกคามแบบ Near Real-Time ด้วย Google Gemini AI • แดชบอร์ดตรวจสอบระบบป้องกันเว็บไซต์ คณะวิทยาการสารสนเทศ มหาวิทยาลัยบูรพา ปกป้องเว็บ CS BUU (nenenainaemak.duckdns.org)
            </p>
          </div>


        </section>

        <!-- 2.2 แถวการ์ด 4 ใบแรกตามภาพ (ตัดใบที่ 5 ออกตามที่สั่ง) -->
        <section class="kpi-4-grid">
          <!-- การ์ด 1: คำขอทั้งหมด -->
          <div class="kpi-card-box">
            <div class="kpi-card-head">
              <span class="kpi-card-label">คำขอทั้งหมด</span>
              <div class="kpi-icon-pill icon-blue">
                <TrendingUp class="card-icon" />
              </div>
            </div>
            <div class="kpi-card-val-row">
              <span class="kpi-card-val">
                {{ selectedPeriod === 'daily' ? '2,319' : (selectedPeriod === 'yearly' ? '142,500' : '7,156') }}
              </span>
              <span class="kpi-badge-trend">{{ selectedPeriod === 'daily' ? '+2.4%' : (selectedPeriod === 'yearly' ? '+28%' : '+12.4%') }}</span>
            </div>
            <span class="kpi-card-subnote">คำขอที่บันทึกไว้ตั้งแต่เริ่มเก็บข้อมูล</span>
          </div>

          <!-- การ์ด 2: IP ที่ไม่ซ้ำ (UNIQUE) -->
          <div class="kpi-card-box">
            <div class="kpi-card-head">
              <span class="kpi-card-label">IP ที่ไม่ซ้ำ (UNIQUE)</span>
              <div class="kpi-icon-pill icon-purple">
                <Users class="card-icon" />
              </div>
            </div>
            <div class="kpi-card-val-row">
              <span class="kpi-card-val">85</span>
              <span class="kpi-sub-country">จาก 14 ประเทศ</span>
            </div>
            <span class="kpi-card-subnote">จำนวน IP ต้นทางที่เข้าถึงเว็บไซต์</span>
          </div>

          <!-- การ์ด 3: เหตุการณ์ความปลอดภัย -->
          <div class="kpi-card-box">
            <div class="kpi-card-head">
              <span class="kpi-card-label">เหตุการณ์ความปลอดภัย</span>
              <div class="kpi-icon-pill icon-amber">
                <AlertTriangle class="card-icon" />
              </div>
            </div>
            <div class="kpi-card-val-row">
              <span class="kpi-card-val text-amber-val">
                {{ selectedPeriod === 'daily' ? '0' : (selectedPeriod === 'yearly' ? '54,200' : '865') }}
              </span>
              <span class="kpi-badge-watch">{{ selectedPeriod === 'daily' ? 'ปกติ' : 'เฝ้าระวัง' }}</span>
            </div>
            <span class="kpi-card-subnote">เหตุการณ์ที่ระบบและ AI ดักตรวจจับได้</span>
          </div>

          <!-- การ์ด 4: ความเสี่ยงสูง (HIGH RISK) ขอบแดง -->
          <div class="kpi-card-box card-high-risk">
            <div class="kpi-card-head">
              <span class="kpi-card-label text-rose-label">ความเสี่ยงสูง (HIGH RISK)</span>
              <div class="kpi-icon-pill icon-rose">
                <ShieldAlert class="card-icon" />
              </div>
            </div>
            <div class="kpi-card-val-row">
              <span class="kpi-card-val text-rose-val">
                {{ selectedPeriod === 'daily' ? '0' : (selectedPeriod === 'yearly' ? '2,450' : '117') }}
              </span>
              <button class="kpi-badge-inspect-btn" @click="router.push('/unban')" title="ดูรายละเอียด IP เสี่ยงสูงในหน้าจัดการ IP">
                <span>ตรวจสอบด่วน →</span>
              </button>
            </div>
            <span class="kpi-card-subnote text-rose-sub">เหตุการณ์ระดับความเสี่ยงสูงต้องแก้ไข</span>
          </div>
        </section>

        <!-- 2.3 หัวข้อแดชบอร์ด & ตัวเลือกช่วงเวลา (รายวัน / รายเดือน / รายปี) -->
        <section class="section-title-bar">
          <div class="title-with-badge">
            <h1 class="page-title">แดชบอร์ดความปลอดภัยเว็บ CS BUU</h1>

          </div>

          <!-- ตัวเลือกช่วงเวลา: รายวัน / รายเดือน / รายปี -->
          <div class="title-controls">
            <div class="period-dropdown-container" @click.stop>
              <button
                class="period-select-btn"
                @click="isPeriodDropdownOpen = !isPeriodDropdownOpen"
                aria-label="เลือกช่วงเวลา"
              >
                <Calendar class="tiny-icon text-purple" />
                <span class="period-label">{{ periodLabels[selectedPeriod] }}</span>
                <ChevronDown class="tiny-icon text-muted" :class="{ 'rotate-180': isPeriodDropdownOpen }" />
              </button>

              <!-- เมนูดรอปดาวน์เลือกช่วงเวลา -->
              <div v-if="isPeriodDropdownOpen" class="period-dropdown-menu">
                <button
                  class="dropdown-item"
                  :class="{ active: selectedPeriod === 'daily' }"
                  @click="setPeriod('daily')"
                >
                  <span class="item-title">รายวัน</span>
                  <span class="item-desc">24 ชม. ล่าสุด ({{ reportDateFormatted }})</span>
                </button>
                <button
                  class="dropdown-item"
                  :class="{ active: selectedPeriod === 'monthly' }"
                  @click="setPeriod('monthly')"
                >
                  <span class="item-title">รายเดือน</span>
                  <span class="item-desc">เดือนตุลาคม 2026 (ข้อมูลจริง)</span>
                </button>
                <button
                  class="dropdown-item"
                  :class="{ active: selectedPeriod === 'yearly' }"
                  @click="setPeriod('yearly')"
                >
                  <span class="item-title">รายปี</span>
                  <span class="item-desc">สถิติตลอดปี 2026</span>
                </button>
              </div>
            </div>

            <!-- ปุ่มรีเฟรชข้อมูลความปลอดภัย -->
            <button
              class="action-square-btn"
              @click="handleRefreshData"
              aria-label="รีเฟรชข้อมูล"
              title="รีเฟรชข้อมูลความปลอดภัยล่าสุด"
            >
              <RefreshCw class="action-btn-icon" :class="{ 'spin-anim': isPageLoading }" />
            </button>

            <button class="action-square-btn" aria-label="ส่งออกข้อมูล" title="ส่งออกรายงานความปลอดภัย">
              <Download class="action-btn-icon" />
            </button>

            <button class="action-square-btn" aria-label="การตั้งค่า" title="ตั้งค่าไฟร์วอลล์">
              <Settings class="action-btn-icon" />
            </button>
          </div>
        </section>

        <!-- 2.3 กราฟคลื่นคู่อันเดิม (INTERACTIVE THREAT & TRAFFIC TRENDS "ชี้ได้") -->
        <section class="chart-card">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <h3 class="card-title">แนวโน้มทราฟฟิกและการโจมตี ({{ periodLabels[selectedPeriod] }})</h3>
              <span class="chart-subtext">{{ currentStats.chartSubtitle }}</span>
            </div>

            <div class="chart-legend-box">
              <div class="legend-item">
                <span class="legend-bar purple-bar"></span>
                <span>คำขอทั้งหมด</span>
              </div>
              <div class="legend-item">
                <span class="legend-bar orange-bar"></span>
                <span>การโจมตีที่สกัดกั้น</span>
              </div>
              <div class="legend-item">
                <span class="legend-bar gray-bar"></span>
                <span>ทราฟฟิกปกติ</span>
              </div>
            </div>
          </div>

          <!-- กราฟ SVG (ชี้แล้วขึ้นจำนวนตัวเลขเหมือนเดิม แต่เวลากดจะขึ้นรายละเอียดเชิงลึก) -->
          <div
            class="chart-svg-stage"
            @mousemove="handleChartHover"
            @mouseenter="isChartHovered = true"
            @mouseleave="isChartHovered = false"
            @click="openDetailModal(activePoint)"
          >
            <svg class="trend-svg" viewBox="0 0 1000 240" preserveAspectRatio="none">
              <defs>
                <pattern id="chartHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#8b5cf6" stroke-width="1.2" stroke-opacity="0.3" />
                </pattern>
              </defs>

              <!-- เส้นกริดแนวนอนแกน Y -->
              <line x1="45" y1="30" x2="980" y2="30" class="chart-grid-line" stroke="#f1f0f5" stroke-width="1" />
              <line x1="45" y1="75" x2="980" y2="75" class="chart-grid-line" stroke="#f1f0f5" stroke-width="1" />
              <line x1="45" y1="120" x2="980" y2="120" class="chart-grid-line" stroke="#f1f0f5" stroke-width="1" />
              <line x1="45" y1="165" x2="980" y2="165" class="chart-grid-line" stroke="#f1f0f5" stroke-width="1" />
              <line x1="45" y1="210" x2="980" y2="210" class="chart-grid-line" stroke="#f1f0f5" stroke-width="1" />

              <!-- ตัวเลขแกน Y -->
              <text x="32" y="34" class="axis-txt">15k</text>
              <text x="32" y="79" class="axis-txt">10k</text>
              <text x="32" y="124" class="axis-txt">5k</text>
              <text x="32" y="169" class="axis-txt">2k</text>
              <text x="32" y="214" class="axis-txt">0</text>

              <!-- ลายตารางแสดงช่วงที่สกัดกั้นการโจมตี -->
              <path v-if="selectedPeriod !== 'daily'" :d="hatchAreaPath" fill="url(#chartHatch)" />

              <!-- เส้นกราฟสีส้ม: การโจมตี -->
              <path :d="attacksPath" fill="none" stroke="#fb923c" stroke-width="2.5" />

              <!-- เส้นกราฟสีม่วง: คำขอทั้งหมด -->
              <path :d="requestsPath" fill="none" stroke="#5e48e8" stroke-width="2.5" />

              <!-- เส้นประแนวตั้งและจุดบนกราฟ (แสดงเมื่อเอาเมาส์ไปชี้) -->
              <g v-if="isChartHovered">
                <line
                  :x1="activePoint.x"
                  y1="40"
                  :x2="activePoint.x"
                  y2="210"
                  stroke="#a78bfa"
                  stroke-width="1.5"
                  stroke-dasharray="3 3"
                  class="smooth-indicator"
                />

                <circle
                  :cx="activePoint.x"
                  :cy="activePoint.reqY"
                  r="5"
                  fill="#5e48e8"
                  stroke="#ffffff"
                  stroke-width="2.5"
                  class="smooth-dot"
                />
                <circle
                  :cx="activePoint.x"
                  :cy="activePoint.atkY"
                  r="5"
                  fill="#fb923c"
                  stroke="#ffffff"
                  stroke-width="2.5"
                  class="smooth-dot"
                />
              </g>

              <!-- แผ่นตรวจจับการชี้เมาส์ & คลิกดูรายละเอียดเชิงลึก -->
              <rect
                v-for="(pt, idx) in chartPoints"
                :key="idx"
                :x="pt.x - 35"
                y="0"
                width="70"
                height="240"
                fill="transparent"
                class="chart-hit-rect"
                @mouseenter="activeIndex = idx; isChartHovered = true"
                @click.stop="openDetailModal(pt)"
                title="คลิกเพื่อดูรายละเอียดเชิงลึก"
              />
            </svg>

            <!-- กล่องข้อความลอยสีดำ (แสดงเมื่อเอาเมาส์ไปชี้ และกดคลิกเพื่อดูรายละเอียดได้) -->
            <div
              v-if="isChartHovered"
              class="chart-dark-tooltip"
              :style="{ left: `${tooltipLeftPercent}%`, top: '16px' }"
              @click.stop="openDetailModal(activePoint)"
              title="คลิกเพื่อดูรายละเอียดเชิงลึก"
            >
              <div class="tooltip-header-date">{{ activePoint.day }} • {{ activePoint.date }}</div>

              <div class="tooltip-row">
                <span class="tooltip-color-bar bg-purple"></span>
                <span class="tooltip-num">{{ activePoint.requests.toLocaleString() }} คำขอ</span>
              </div>
              <div class="tooltip-row">
                <span class="tooltip-color-bar bg-orange"></span>
                <span class="tooltip-num">{{ activePoint.attacks.toLocaleString() }} การโจมตี</span>
              </div>
              <div class="tooltip-row">
                <span class="tooltip-color-bar bg-white"></span>
                <span class="tooltip-num">{{ activePoint.rate }} ป้องกันสำเร็จ</span>
              </div>
              <div class="tooltip-footer">{{ activePoint.status }}</div>
              
              <div class="tooltip-click-action">
                <span>คลิกเพื่อดูรายละเอียดเชิงลึก</span>
                <ArrowRight class="tiny-icon" />
              </div>
              <div class="tooltip-cursor-arrow"></div>
            </div>

            <!-- ป้ายชื่อวัน/เวลาแกน X -->
            <div class="chart-x-labels">
              <span
                v-for="(pt, idx) in chartPoints"
                :key="idx"
                class="day-lbl"
                :class="{ 'active-day': activeIndex === idx }"
                @mouseenter="selectDay(idx)"
                @click.stop="handleDayClick(idx)"
                title="คลิกเพื่อดูรายละเอียดเชิงลึก"
              >
                {{ pt.day }}
              </span>
            </div>
          </div>
        </section>

        <!-- 2.4 โซนแดชบอร์ดด้านล่าง 3 คอลัมน์ (เปลี่ยนเป็นแดชบอร์ดตามที่สั่ง) -->
        <section class="bottom-3-dashboard-grid">
          <!-- การ์ด 1: ผลลัพธ์ HTTP (Donut Chart ใหญ่ เด่นชัด ดูง่าย ไม่เป็นเส้นด้าย พร้อมการ์ดแจกแจง 2 คอลัมน์) -->
          <div class="dash-card http-donut-card prominent-donut-card">
            <div class="dash-card-header">
              <div class="dash-title-group">
                <div class="dash-title-with-pill">
                  <h3 class="dash-card-title">ผลลัพธ์ HTTP ({{ periodLabels[selectedPeriod] }})</h3>
                  <button
                    type="button"
                    class="dash-clickable-pill"
                    @click="handleOpenHttpModal"
                    :title="currentSelectedStatus ? 'คลิกเพื่อดูรายงานเจาะลึกแบบเต็ม' : 'คลิกเพื่อเปิดกล่องวิเคราะห์ HTTP'"
                  >
                    {{ currentSelectedStatus ? 'คลิกดูรายงานเชิงลึก ➔' : 'แตะกราฟเพื่อดูสถิติ' }}
                  </button>
                </div>
                <span class="dash-card-subtitle">สัดส่วนการตอบสนอง {{ currentHttpData.label }}</span>
              </div>
              <div class="dash-icon-box bg-blue-soft text-blue">
                <BarChart3 class="tiny-icon" />
              </div>
            </div>

            <!-- กราฟ Donut ขนาดใหญ่ 230px ปรับสัดส่วนให้อ่านง่าย แตะได้ทุกหมวด -->
            <div class="prominent-donut-container">
              <div class="prominent-donut-svg-wrap">
                <svg viewBox="0 0 230 230" width="230" height="230" class="prominent-donut-svg">
                  <!-- วงแหวนพื้นหลัง -->
                  <circle
                    cx="115"
                    cy="115"
                    :r="DONUT_RADIUS"
                    fill="none"
                    stroke="#f1f5f9"
                    stroke-width="22"
                    class="donut-bg-ring"
                  />

                  <!-- ห่วงเซกเมนต์ Donut แบบปรับสัดส่วน มองเห็นและแตะได้ชัดเจนทุกหมวด -->
                  <circle
                    v-for="item in computedDonutSegments"
                    :key="item.code"
                    cx="115"
                    cy="115"
                    :r="DONUT_RADIUS"
                    fill="none"
                    :stroke="item.color"
                    :stroke-width="selectedHttpCode === item.code ? 28 : 22"
                    :class="{
                      'donut-seg-circle': true,
                      'active': selectedHttpCode === item.code,
                      'dimmed': selectedHttpCode && selectedHttpCode !== item.code
                    }"
                    :stroke-dasharray="item.dasharray"
                    :stroke-dashoffset="item.dashoffset"
                    @click="handleSelectHttpStatus(item)"
                  >
                    <title>{{ item.code }} {{ item.name }}: {{ item.count.toLocaleString() }} ({{ item.pct }}) - คลิกเพื่อดูในกราฟ</title>
                  </circle>
                </svg>

                <!-- Center Hub: กลางกราฟ แสดงผลสถิติที่จิ้มได้ทันที ชัดเจน โปร่งตา ไม่ซ้อนทับ -->
                <div
                  class="prominent-center-hub"
                  :class="{ 'is-selected': !!currentSelectedStatus }"
                  @click="currentSelectedStatus ? (isHttpModalOpen = true) : null"
                  :title="currentSelectedStatus ? 'คลิกเพื่อเปิดดูรายงานเจาะลึกฉบับเต็ม' : 'สถิติคำขอทั้งหมด'"
                >
                  <template v-if="currentSelectedStatus">
                    <span
                      class="hub-status-badge"
                      :style="{
                        backgroundColor: `${currentSelectedStatus.color}18`,
                        color: currentSelectedStatus.color,
                        borderColor: `${currentSelectedStatus.color}45`
                      }"
                    >
                      <span class="hub-status-dot" :style="{ backgroundColor: currentSelectedStatus.color }"></span>
                      {{ currentSelectedStatus.code }} {{ currentSelectedStatus.name }}
                    </span>
                    <div class="hub-hero-num" :style="{ color: currentSelectedStatus.color }">
                      {{ currentSelectedStatus.count.toLocaleString() }}
                    </div>
                    <span class="hub-stat-pct">{{ currentSelectedStatus.pct }} ของทราฟฟิก</span>
                    <div class="hub-action-row">
                      <span class="hub-action-cta">ดูเชิงลึก 🔍</span>
                      <button
                        type="button"
                        class="hub-reset-btn"
                        @click.stop="handleClearHttpStatus"
                        title="กลับสู่ภาพรวมทั้งหมด"
                      >
                        ✕ ดูทั้งหมด
                      </button>
                    </div>
                  </template>
                  <template v-else>
                    <span class="hub-period-tag">{{ periodLabels[selectedPeriod] }}</span>
                    <div class="hub-hero-num text-slate">
                      {{ currentHttpData.total.toLocaleString() }}
                    </div>
                    <span class="hub-caption-text">คำขอทั้งหมด</span>
                    <div class="hub-success-pill">
                      <span class="hub-success-dot"></span>
                      ปกติ {{ httpSuccessRate }}%
                    </div>
                  </template>
                </div>
              </div>

              <!-- การ์ดแจกแจงสถานะ 2 คอลัมน์สมดุล สวยงาม อ่านง่าย ไม่ตกบรรทัด -->
              <div class="http-status-cards-grid">
                <button
                  v-for="item in currentHttpStatusList"
                  :key="item.code"
                  type="button"
                  class="http-card-tile prominent-chip-btn"
                  :class="{
                    'active': selectedHttpCode === item.code,
                    'is-span-full': item.code === '5xx'
                  }"
                  @click="handleSelectHttpStatus(item)"
                  :title="`${item.code} ${item.name}: ${item.count.toLocaleString()} (${item.pct})`"
                >
                  <div class="tile-top-row">
                    <div class="tile-title-group">
                      <span class="tile-dot" :style="{ backgroundColor: item.color }"></span>
                      <span class="tile-code">{{ item.code }}</span>
                      <span class="tile-name">{{ item.name }}</span>
                    </div>
                    <span class="tile-pct" :style="{ color: item.color }">{{ item.pct }}</span>
                  </div>
                  <div class="tile-bottom-row">
                    <span class="tile-count">{{ item.count.toLocaleString() }} ครั้ง</span>
                    <span
                      class="tile-badge"
                      :class="item.code === '2xx' ? 'badge-success' : item.isThreat ? 'badge-threat' : 'badge-neutral'"
                    >
                      {{ item.code === '2xx' ? 'ปกติ' : item.isThreat ? 'สแกน/ยิงถี่' : 'ขัดข้อง' }}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- การ์ด 2: สัดส่วนระดับความเสี่ยง (Risk Distribution) -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div class="dash-title-group">
                <h3 class="dash-card-title">สัดส่วนระดับความเสี่ยง</h3>
                <span class="dash-card-subtitle">อัตราส่วนระหว่างความเสี่ยงสูง ปานกลาง และต่ำ</span>
              </div>
              <div class="dash-icon-box bg-rose-soft text-rose">
                <ShieldAlert class="tiny-icon" />
              </div>
            </div>

            <div class="risk-distribution-list">
              <!-- ระดับ 1: สูง -->
              <div class="risk-item">
                <div class="risk-item-head">
                  <span class="risk-item-name text-rose font-bold">ความเสี่ยงสูง</span>
                  <span class="risk-item-count">117 เหตุการณ์</span>
                </div>
                <div class="risk-bar-track">
                  <div class="risk-bar-fill bg-rose" style="width: 67%;"></div>
                </div>
                <span class="risk-item-desc">เหตุการณ์ระดับความเสี่ยงสูงและบอทเน็ตโจมตี</span>
              </div>

              <!-- ระดับ 2: ปานกลาง -->
              <div class="risk-item">
                <div class="risk-item-head">
                  <span class="risk-item-name text-amber font-bold">ความเสี่ยงปานกลาง</span>
                  <span class="risk-item-count">42 เหตุการณ์</span>
                </div>
                <div class="risk-bar-track">
                  <div class="risk-bar-fill bg-amber" style="width: 24%;"></div>
                </div>
                <span class="risk-item-desc">การสแกนหาไฟล์และไดเรกทอรีที่ไม่ได้เปิดเผย</span>
              </div>

              <!-- ระดับ 3: ต่ำ -->
              <div class="risk-item">
                <div class="risk-item-head">
                  <span class="risk-item-name text-green font-bold">ความเสี่ยงต่ำ</span>
                  <span class="risk-item-count">14 เหตุการณ์</span>
                </div>
                <div class="risk-bar-track">
                  <div class="risk-bar-fill bg-green" style="width: 9%;"></div>
                </div>
                <span class="risk-item-desc">ทราฟฟิกค้นหาจากผู้ใช้ทั่วไปในประเทศไทย</span>
              </div>
            </div>
          </div>

          <!-- การ์ด 3: เป้าหมายที่ถูกโจมตีบ่อยที่สุด (Top Attacked URLs) -->
          <div class="dash-card">
            <div class="dash-card-header">
              <div class="dash-title-group">
                <h3 class="dash-card-title">เป้าหมายที่ถูกโจมตีบ่อยที่สุด</h3>
                <span class="dash-card-subtitle">เส้นทาง URL ที่ถูกโจมตีหรือสแกนหาช่องโหว่สูงสุด</span>
              </div>
              <div class="dash-icon-box bg-amber-soft text-amber">
                <Flame class="tiny-icon" />
              </div>
            </div>

            <div class="target-paths-list">
              <div class="target-path-item">
                <span class="target-rank">1</span>
                <div class="target-info">
                  <div class="target-name-row">
                    <span class="target-url mono">/xmlrpc.php</span>
                    <span class="target-hits mono">10,833 ครั้ง</span>
                  </div>
                  <div class="target-bar-track">
                    <div class="target-bar-fill" style="width: 92%;"></div>
                  </div>
                </div>
              </div>

              <div class="target-path-item">
                <span class="target-rank">2</span>
                <div class="target-info">
                  <div class="target-name-row">
                    <span class="target-url mono">/wp-login.php</span>
                    <span class="target-hits mono">822 ครั้ง</span>
                  </div>
                  <div class="target-bar-track">
                    <div class="target-bar-fill" style="width: 45%;"></div>
                  </div>
                </div>
              </div>

              <div class="target-path-item">
                <span class="target-rank">3</span>
                <div class="target-info">
                  <div class="target-name-row">
                    <span class="target-url mono">/wp-admin/</span>
                    <span class="target-hits mono">419 ครั้ง</span>
                  </div>
                  <div class="target-bar-track">
                    <div class="target-bar-fill" style="width: 28%;"></div>
                  </div>
                </div>
              </div>

              <div class="target-path-item">
                <span class="target-rank">4</span>
                <div class="target-info">
                  <div class="target-name-row">
                    <span class="target-url mono">/?author=1</span>
                    <span class="target-hits mono">254 ครั้ง</span>
                  </div>
                  <div class="target-bar-track">
                    <div class="target-bar-fill" style="width: 18%;"></div>
                  </div>
                </div>
              </div>

              <div class="target-path-item">
                <span class="target-rank">5</span>
                <div class="target-info">
                  <div class="target-name-row">
                    <span class="target-url mono">/wp-json/wp/v2/users</span>
                    <span class="target-hits mono">120 ครั้ง</span>
                  </div>
                  <div class="target-bar-track">
                    <div class="target-bar-fill" style="width: 12%;"></div>
                  </div>
                </div>
              </div>
            </div>

            <button class="target-bottom-action-btn" @click="router.push('/unban')">
              <span>จัดการ IP ผู้โจมตีทั้งหมด</span>
              <ArrowRight class="tiny-icon" />
            </button>
          </div>
        </section>
      </main>

    <!-- MODAL POPUP แสดงรายละเอียดเชิงลึกประจำช่วงเวลา (คลิกจากกราฟ) -->
    <div v-if="isDetailModalOpen && detailPoint" class="modal-backdrop" @click="isDetailModalOpen = false">
      <div class="modal-dialog modal-lg" @click.stop>
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title">รายงานความปลอดภัยเชิงลึก ({{ detailPoint.day }} • {{ detailPoint.date }})</h3>
            <span class="modal-subtitle">ข้อมูลการวิเคราะห์ทราฟฟิกและการตรวจจับภัยคุกคามแบบ Near Real-Time</span>
          </div>
          <button class="modal-close-btn" @click="isDetailModalOpen = false" aria-label="ปิดหน้าต่าง">
            <X class="tiny-icon" />
          </button>
        </div>

        <div class="modal-body detail-modal-body">
          <!-- สรุป 4 กล่องตัวเลขในวันนั้น -->
          <div class="detail-kpi-4-grid">
            <div class="detail-mini-kpi">
              <span class="mini-kpi-label">คำขอทั้งหมด</span>
              <div class="mini-kpi-val text-purple">{{ detailPoint.requests.toLocaleString() }}</div>
              <span class="mini-kpi-sub">คำขอที่ส่งถึงเซิร์ฟเวอร์</span>
            </div>
            <div class="detail-mini-kpi">
              <span class="mini-kpi-label">ภัยคุกคามที่สกัดกั้น</span>
              <div class="mini-kpi-val text-rose">{{ detailPoint.attacks.toLocaleString() }}</div>
              <span class="mini-kpi-sub">บล็อกด้วย iptables DROP</span>
            </div>
            <div class="detail-mini-kpi">
              <span class="mini-kpi-label">ทราฟฟิกปกติ</span>
              <div class="mini-kpi-val text-green">{{ Math.max(0, detailPoint.requests - detailPoint.attacks).toLocaleString() }}</div>
              <span class="mini-kpi-sub">ผู้ใช้งานทั่วไปและนิสิต</span>
            </div>
            <div class="detail-mini-kpi">
              <span class="mini-kpi-label">ประสิทธิภาพป้องกัน</span>
              <div class="mini-kpi-val text-green">{{ detailPoint.rate }}</div>
              <span class="mini-kpi-sub">ป้องกันสำเร็จ</span>
            </div>
          </div>

          <!-- สถานะและบทวิเคราะห์ประจำช่วงเวลา -->
          <div class="detail-status-banner">
            <div class="detail-banner-head">
              <span class="detail-badge-pill" :class="detailPoint.attacks > 0 ? 'badge-rose' : 'badge-green'">
                {{ detailPoint.attacks > 0 ? 'ตรวจพบพฤติกรรมผิดปกติ' : 'ปลอดภัยสมบูรณ์ 100%' }}
              </span>
              <span class="detail-time-text">บันทึกเวลา: {{ detailPoint.day }} ({{ detailPoint.date }})</span>
            </div>
            <p class="detail-status-desc">
              <strong>สรุปพฤติกรรม:</strong> {{ detailPoint.status }}
            </p>
            <p class="detail-ai-note">
              ระบบตรวจสอบความปลอดภัย SecDash ร่วมกับ Google Gemini AI ได้ทำการคัดกรองและสกัดกั้นทราฟฟิกอันตรายออกอัตโนมัติ ทำให้เว็บหลักสูตร วท.บ. วิทยาการคอมพิวเตอร์ ม.บูรพา ให้บริการแก่อาจารย์ นิสิต และผู้สมัคร TCAS ได้อย่างต่อเนื่องไม่มีสะดุด
            </p>
          </div>

          <!-- การแจกแจงเป้าหมายที่ถูกเรียกในรอบนี้ -->
          <div class="detail-breakdown-card">
            <h4 class="detail-section-title">สัดส่วนเส้นทางที่ถูกเรียกใช้งานในรอบเวลานี้</h4>
            <div class="detail-paths-list">
              <div class="detail-path-row" v-if="detailPoint.attacks > 0">
                <span class="path-name mono">/xmlrpc.php (XML-RPC Pingback DDoS)</span>
                <span class="path-val mono text-rose">{{ Math.round(detailPoint.attacks * 0.78).toLocaleString() }} ครั้ง</span>
              </div>
              <div class="detail-path-row" v-if="detailPoint.attacks > 0">
                <span class="path-name mono">/wp-login.php (Password Brute Force)</span>
                <span class="path-val mono text-amber">{{ Math.round(detailPoint.attacks * 0.22).toLocaleString() }} ครั้ง</span>
              </div>
              <div class="detail-path-row">
                <span class="path-name mono">/ (หน้าแรกหลักสูตร CS BUU & TCAS)</span>
                <span class="path-val mono text-green">{{ Math.max(15, Math.round((detailPoint.requests - detailPoint.attacks) * 0.65)).toLocaleString() }} ครั้ง</span>
              </div>
              <div class="detail-path-row">
                <span class="path-name mono">/curriculum/ (แผนการเรียน 4 กลุ่มวิชาเอก)</span>
                <span class="path-val mono text-green">{{ Math.max(8, Math.round((detailPoint.requests - detailPoint.attacks) * 0.35)).toLocaleString() }} ครั้ง</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="isDetailModalOpen = false">
            ปิดหน้าต่าง
          </button>
          <button class="btn-confirm btn-blue" @click="isDetailModalOpen = false; router.push('/unban')">
            <span>ไปที่หน้าจัดการ IP</span>
            <ArrowRight class="tiny-icon" />
          </button>
        </div>
      </div>
    </div>

    <!-- COMPACT & MODERN HTTP DETAIL DIALOG (กะทัดรัด สบายตา เชื่อมโยงตามตัวกรอง) -->
    <div v-if="isHttpModalOpen && currentSelectedStatus" class="modal-backdrop" @click="isHttpModalOpen = false">
      <div class="compact-http-dialog" @click.stop>
        <!-- ส่วนหัว Dialog แบบโมเดิร์น กระชับ สบายตา -->
        <div class="compact-dialog-header">
          <div class="compact-header-left">
            <div
              class="compact-status-pill"
              :style="{
                backgroundColor: `${currentSelectedStatus.color}15`,
                color: currentSelectedStatus.color,
                borderColor: `${currentSelectedStatus.color}35`
              }"
            >
              <span class="compact-pill-dot" :style="{ backgroundColor: currentSelectedStatus.color }"></span>
              {{ currentSelectedStatus.code }} {{ currentSelectedStatus.name }}
            </div>
            <span class="compact-period-badge">{{ periodLabels[selectedPeriod] }}</span>
          </div>
          <button class="compact-close-btn" @click="isHttpModalOpen = false" aria-label="ปิดหน้าต่าง">
            <X class="tiny-icon" />
          </button>
        </div>

        <!-- ตัวเลขเด่นชัดแบบสถิติระดับโปร -->
        <div class="compact-hero-stat">
          <div class="compact-stat-num" :style="{ color: currentSelectedStatus.color }">
            {{ currentSelectedStatus.count.toLocaleString() }}
          </div>
          <div class="compact-stat-meta">
            <span class="compact-stat-pct">{{ currentSelectedStatus.pct }} ของทราฟฟิก</span>
            <span class="compact-stat-sub">({{ currentHttpData.label }})</span>
          </div>
        </div>

        <!-- คำอธิบายสถานะภาษาไทย เข้าใจง่าย 1 บล็อก -->
        <div class="compact-summary-card">
          <p class="compact-summary-desc">{{ currentSelectedStatus.description }}</p>
          <div class="compact-cause-line">
            <span class="cause-label">สาเหตุ:</span>
            <span>{{ currentSelectedStatus.typicalCauses }}</span>
          </div>
        </div>

        <!-- ลิสต์ 3 เส้นทาง URL ที่ถูกเรียกบ่อย -->
        <div class="compact-paths-block">
          <div class="compact-block-title">
            <Globe class="tiny-icon text-blue" />
            <span>เส้นทาง URL ที่ถูกเรียกบ่อย</span>
          </div>
          <div class="compact-path-list">
            <div v-for="p in currentSelectedStatus.topPaths" :key="p.path" class="compact-path-item">
              <span class="compact-path-text mono">{{ p.path }}</span>
              <span class="compact-path-count">{{ p.count.toLocaleString() }} ครั้ง</span>
            </div>
          </div>
        </div>

        <!-- การจัดการของระบบไฟร์วอลล์ -->
        <div class="compact-firewall-pill" :class="{ 'is-threat': currentSelectedStatus.isThreat }">
          <ShieldAlert v-if="currentSelectedStatus.isThreat" class="tiny-icon text-amber" />
          <ShieldCheck v-else class="tiny-icon text-green" />
          <div class="compact-firewall-text">
            <strong>ไฟร์วอลล์:</strong> {{ currentSelectedStatus.firewallAction }}
          </div>
        </div>

        <!-- ปุ่ม Action ด้านล่างแบบกะทัดรัด -->
        <div class="compact-dialog-footer">
          <button
            v-if="currentSelectedStatus.isThreat"
            class="compact-btn-unban"
            @click="isHttpModalOpen = false; router.push('/unban')"
          >
            <ShieldAlert class="tiny-icon" />
            <span>ไปตรวจสอบในหน้าจัดการ IP</span>
            <ArrowRight class="tiny-icon" />
          </button>
          <button class="compact-btn-dismiss" @click="isHttpModalOpen = false">
            ปิด
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>


/* ==========================================================
   HERO NAVY CARD (ส่วนบนตามภาพตัวอย่าง)
   ========================================================== */
.hero-navy-card {
  background: linear-gradient(135deg, #0e1e38 0%, #15284f 100%);
  border-radius: 16px;
  padding: 1.5rem 1.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  box-shadow: 0 4px 20px rgba(14, 30, 56, 0.25);
}

.hero-main-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.hero-top-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.35);
  color: #fbbf24;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.22rem 0.7rem;
  border-radius: 9999px;
  width: fit-content;
}

.gold-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #f59e0b;
  box-shadow: 0 0 8px #f59e0b;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.hero-main-title {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.015em;
  line-height: 1.25;
}

.hero-secops-pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.45);
  color: #60a5fa;
  padding: 0.15rem 0.55rem;
  border-radius: 6px;
  letter-spacing: 0.02em;
}

.hero-desc-text {
  margin: 0;
  font-size: 0.84rem;
  color: #cbd5e1;
  line-height: 1.45;
  font-weight: 400;
  max-width: 820px;
}

/* Right model card */
.hero-model-box {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: rgba(10, 20, 38, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 0.85rem 1.15rem;
  flex-shrink: 0;
}

.model-icon-wrap {
  width: 42px;
  height: 42px;
  background: rgba(37, 99, 235, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.35);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #60a5fa;
}

.model-monitor-icon {
  width: 20px;
  height: 20px;
}

.model-info-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.model-sublabel {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 500;
}

.model-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: #ffffff;
}

.model-status-line {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: #94a3b8;
}

.model-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #10b981;
  box-shadow: 0 0 6px #10b981;
}

/* ==========================================================
   KPI 4-GRID (4 การ์ดแรกตามภาพเป๊ะ)
   ========================================================== */
.kpi-4-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

.kpi-card-box {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 1.25rem 1.35rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.kpi-card-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.kpi-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.kpi-card-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

.kpi-icon-pill {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon {
  width: 17px;
  height: 17px;
}

.icon-blue { background: #eff6ff; color: #3b82f6; }
.icon-purple { background: #f5f3ff; color: #8b5cf6; }
.icon-amber { background: #fffbeb; color: #f59e0b; }
.icon-rose { background: #fef2f2; color: #dc2626; }

.kpi-card-val-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.15rem;
}

.kpi-card-val {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.03em;
  line-height: 1;
}

.text-amber-val {
  color: #d97706;
}

.text-rose-val {
  color: #dc2626;
}

.kpi-badge-trend {
  background: #ecfdf5;
  color: #059669;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.18rem 0.45rem;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
}

.kpi-sub-country {
  font-size: 0.78rem;
  color: #94a3b8;
  font-weight: 500;
}

.kpi-badge-watch {
  background: #fef3c7;
  color: #b45309;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.18rem 0.55rem;
  border-radius: 6px;
}

.kpi-card-subnote {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.15rem;
}

/* การ์ดที่ 4 - ความเสี่ยงสูง (HIGH RISK) ขอบแดงตามภาพ */
.kpi-card-box.card-high-risk {
  border: 1.5px solid #fecaca;
  background: #ffffff;
}

.text-rose-label {
  color: #dc2626;
  font-weight: 700;
}

.text-rose-sub {
  color: #e11d48;
}

.kpi-badge-inspect-btn {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.kpi-badge-inspect-btn:hover {
  background: #dc2626;
  color: #ffffff;
  border-color: #dc2626;
}



/* ==========================================================
   2.2 KPI GRID CARD สไตล์เดิม (4 COLUMNS DUAL-TONE)
   ========================================================== */
.kpi-grid-card {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 1.4rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.kpi-col {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0 1.25rem;
}

.kpi-col:first-child {
  padding-left: 0;
}

.kpi-col:not(:last-child) {
  border-right: 1px solid #f1f5f9;
}

.kpi-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: -0.01em;
}

.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 0.15rem;
}

.val-bold {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 1.85rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  line-height: 1;
}

.val-muted {
  font-family: 'Inter', -apple-system, sans-serif;
  font-size: 1.45rem;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: -0.03em;
  line-height: 1;
}

.kpi-sub-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.78rem;
  margin-top: 0.2rem;
}

.sub-lead {
  color: #64748b;
  font-size: 0.76rem;
}

.trend-arrow {
  font-weight: 700;
  font-size: 0.78rem;
}

.text-green {
  color: #059669;
}

.text-rose {
  color: #dc2626;
}

.text-purple {
  color: #5e48e8;
}

/* ==========================================================
   2.3 CHART CARD กราฟคลื่นคู่อันเดิม ("ชี้ได้")
   ========================================================== */
.chart-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 1.4rem 1.5rem 1.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.chart-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.card-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.chart-subtext {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.chart-legend-box {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
}

.legend-bar {
  width: 14px;
  height: 4px;
  border-radius: 2px;
}

.purple-bar {
  background-color: #5e48e8;
}

.orange-bar {
  background-color: #fb923c;
}

.gray-bar {
  background-color: #94a3b8;
}

.chart-svg-stage {
  position: relative;
  width: 100%;
  padding-bottom: 0.5rem;
}

.trend-svg {
  width: 100%;
  height: 230px;
  overflow: visible;
  display: block;
}

.chart-grid-line {
  transition: stroke 0.25s ease;
}

.axis-txt {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  fill: #94a3b8;
  text-anchor: end;
}

.smooth-indicator {
  transition: x1 0.12s ease, x2 0.12s ease;
}

.smooth-dot {
  transition: cx 0.12s ease, cy 0.12s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.chart-hit-rect {
  cursor: pointer;
}

/* Tooltip ชี้ได้ */
.chart-dark-tooltip {
  position: absolute;
  pointer-events: none;
  background: #0f172a;
  color: #ffffff;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  min-width: 175px;
  transform: translateX(-50%);
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
  z-index: 20;
  transition: left 0.12s ease;
}

.tooltip-header-date {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.3rem;
  margin-bottom: 0.4rem;
}

.tooltip-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.25rem;
  font-size: 0.82rem;
  font-weight: 600;
}

.tooltip-color-bar {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.bg-purple { background-color: #8b5cf6; }
.bg-orange { background-color: #fb923c; }
.bg-white { background-color: #10b981; }

.tooltip-footer {
  margin-top: 0.45rem;
  padding-top: 0.35rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.72rem;
  color: #cbd5e1;
  line-height: 1.25;
}

.tooltip-cursor-arrow {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #0f172a;
}

.chart-x-labels {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 2rem 0;
}

.day-lbl {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.day-lbl:hover,
.day-lbl.active-day {
  color: #5e48e8;
  background: rgba(94, 72, 232, 0.1);
}

/* ==========================================================
   2.4 BOTTOM DUAL GRID สไตล์เดิม
   ========================================================== */
.bottom-dual-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.grid-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 1.4rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.card-title-box {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.card-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.link-to-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: transparent;
  border: none;
  color: #2563eb;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: gap 0.15s ease;
}

.link-to-tab-btn:hover {
  gap: 0.55rem;
}

.badge-pill-soft {
  background: #f1f5f9;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}

/* SNAPSHOT LIST */
.snapshot-list {
  display: flex;
  flex-direction: column;
}

.snapshot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.snapshot-row:last-child {
  border-bottom: none;
}

.snapshot-ip-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dept-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ip-meta {
  display: flex;
  flex-direction: column;
}

.bold-ip {
  font-weight: 700;
  font-size: 0.88rem;
  color: #0f172a;
}

.ip-type-label {
  font-size: 0.76rem;
  color: #64748b;
}

.snapshot-action-group {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.hits-tag {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 0.74rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
}

.action-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.32rem 0.75rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.action-pill-btn.unban-btn {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.action-pill-btn.unban-btn:hover {
  background: #dc2626;
  color: #ffffff;
}

.action-pill-btn.reban-btn {
  background: #ecfdf5;
  color: #059669;
  border-color: #a7f3d0;
}

.action-pill-btn.reban-btn:hover {
  background: #059669;
  color: #ffffff;
}

/* STRUCTURE OF THREATS METRICS */
.structure-metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.65rem;
}

.struct-stat {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.struct-label {
  font-size: 0.72rem;
  color: #64748b;
}

.struct-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.pill-bars-container {
  display: flex;
  height: 8px;
  border-radius: 9999px;
  overflow: hidden;
  gap: 2px;
  margin-top: 0.25rem;
}

.struct-bar {
  height: 100%;
  border-radius: 2px;
}

.bar-dark-purple { background-color: #5e48e8; }
.bar-mid-purple { background-color: #8b5cf6; }
.bar-light-purple { background-color: #c4b5fd; }
.bar-striped { background-color: #e2e8f0; }

.struct-percentages-row {
  display: flex;
  gap: 2px;
}

.pct-item {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
}

.defense-status-banner {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 0.75rem 0.95rem;
  border-radius: 8px;
  margin-top: 0.5rem;
}

.defense-badge-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.pulse-green {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #16a34a;
  box-shadow: 0 0 6px #16a34a;
}

.status-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #15803d;
}

.status-code {
  font-size: 0.72rem;
  color: #166534;
  font-weight: 500;
}

.defense-desc {
  margin: 0;
  font-size: 0.76rem;
  color: #334155;
  line-height: 1.35;
}



/* ==========================================================
   BOTTOM 3 DASHBOARD GRID
   ========================================================== */
.bottom-3-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.dash-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 1.35rem 1.45rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dash-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.dash-title-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.dash-card-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
  letter-spacing: -0.01em;
}

.dash-card-subtitle {
  font-size: 0.76rem;
  color: var(--text-muted);
}

.dash-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-blue-soft { background: #eff6ff; }
.text-blue { color: #2563eb; }
.bg-rose-soft { background: #fef2f2; }
.text-rose { color: #dc2626; }
.bg-amber-soft { background: #fffbeb; }
.text-amber { color: #d97706; }
.font-bold { font-weight: 700; }

/* Clickable Pill in Card Header */
.dash-title-with-pill {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.dash-clickable-pill {
  font-size: 0.68rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: all 0.15s ease;
}

.dash-clickable-pill:hover {
  background: #dbeafe;
}

.careops-app.dark-mode .dash-clickable-pill {
  background: #1e293b;
  border-color: #3b82f6;
  color: #93c5fd;
}

/* ==========================================================
   PROMINENT & ENLARGED HTTP DONUT CHART (ใหญ่ตรงกลาง เด่นชัด ดูง่าย ไม่เป็นเส้นด้าย)
   ========================================================== */
.prominent-donut-card {
  display: flex;
  flex-direction: column;
}

.prominent-donut-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.15rem;
  padding: 0.35rem 0 0.15rem;
  width: 100%;
}

.prominent-donut-svg-wrap {
  position: relative;
  width: 230px;
  height: 230px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin: 0 auto;
}

.prominent-donut-svg {
  width: 230px;
  height: 230px;
  transform: rotate(-90deg);
  transform-origin: center;
  overflow: visible;
}

.donut-bg-ring {
  fill: none;
  stroke: #f1f5f9;
  transition: stroke 0.2s ease;
}

.careops-app.dark-mode .donut-bg-ring {
  stroke: #1e293b;
}

/* Donut Segments with Smooth Hover & Active Effects */
.donut-seg-circle {
  cursor: pointer;
  transition: stroke-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, filter 0.25s ease;
  transform-origin: center;
}

.donut-seg-circle:hover {
  stroke-width: 25;
  filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.18));
}

.donut-seg-circle.active {
  stroke-width: 28;
  filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.28));
}

.donut-seg-circle.dimmed {
  opacity: 0.28;
}

/* Prominent Center Hub (โปร่งตา ชัดเจน อ่านง่าย ไม่ซ้อนทับ) */
.prominent-center-hub {
  position: absolute;
  inset: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 50%;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  background: transparent;
  z-index: 2;
}

.prominent-center-hub:hover {
  transform: scale(1.03);
}

.prominent-center-hub.is-selected {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.75) 100%);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05);
}

.careops-app.dark-mode .prominent-center-hub.is-selected {
  background: radial-gradient(circle, rgba(30, 41, 59, 0.96) 0%, rgba(15, 23, 42, 0.75) 100%);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.3);
}

.hub-period-tag {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-hover, #f1f5f9);
  padding: 0.12rem 0.55rem;
  border-radius: 9999px;
  margin-bottom: 0.2rem;
  letter-spacing: 0.01em;
}

.hub-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.18rem 0.65rem;
  border-radius: 9999px;
  border: 1px solid transparent;
  margin-bottom: 0.2rem;
  letter-spacing: -0.01em;
}

.hub-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.hub-hero-num {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1.85rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  transition: color 0.2s ease;
}

.hub-hero-num.text-slate {
  color: var(--text-main);
}

.hub-stat-pct {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text-muted);
  margin-top: 0.1rem;
}

.hub-caption-text {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-top: 0.15rem;
}

.hub-success-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #059669;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  margin-top: 0.35rem;
}

.hub-success-dot {
  width: 6px;
  height: 6px;
  background-color: #10b981;
  border-radius: 50%;
}

.careops-app.dark-mode .hub-success-pill {
  background: #064e3b;
  border-color: #047857;
  color: #6ee7b7;
}

.hub-action-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.35rem;
}

.hub-action-cta {
  font-size: 0.66rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.12rem 0.45rem;
  border-radius: 9999px;
  border: 1px solid #bfdbfe;
  transition: all 0.15s ease;
}

.careops-app.dark-mode .hub-action-cta {
  background: #1e293b;
  color: #93c5fd;
  border-color: #3b82f6;
}

.hub-reset-btn {
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-muted);
  background: #ffffff;
  border: 1px solid var(--card-border);
  padding: 0.12rem 0.45rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hub-reset-btn:hover {
  background: #f1f5f9;
  color: var(--text-main);
}

.careops-app.dark-mode .hub-reset-btn {
  background: #1e293b;
  border-color: #334155;
}

.careops-app.dark-mode .hub-reset-btn:hover {
  background: #334155;
}

/* ==========================================================
   2-COLUMN BALANCED HTTP STATUS CARDS (อ่านง่าย ไม่ตกบรรทัด)
   ========================================================== */
.http-status-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.45rem;
  width: 100%;
}

.http-card-tile {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem 0.65rem;
  background: var(--bg-hover, #f8fafc);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  user-select: none;
}

.http-card-tile.is-span-full {
  grid-column: span 2;
}

.http-card-tile:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.http-card-tile.active {
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1.5px #3b82f6, 0 3px 8px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.careops-app.dark-mode .http-card-tile {
  background: #1e293b;
  border-color: #334155;
}

.careops-app.dark-mode .http-card-tile:hover {
  background: #334155;
  border-color: #475569;
}

.careops-app.dark-mode .http-card-tile.active {
  background: #1e3a8a;
  border-color: #60a5fa;
  box-shadow: 0 0 0 1.5px #60a5fa, 0 3px 8px rgba(96, 165, 250, 0.25);
}

.tile-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.tile-title-group {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.tile-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tile-code {
  font-weight: 700;
  font-size: 0.78rem;
  color: var(--text-main);
  letter-spacing: -0.01em;
}

.tile-name {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.tile-pct {
  font-size: 0.74rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
}

.tile-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
}

.tile-count {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text-main);
  font-family: 'Inter', -apple-system, sans-serif;
}

.tile-badge {
  font-size: 0.62rem;
  font-weight: 600;
  padding: 0.08rem 0.35rem;
  border-radius: 4px;
}

.badge-success {
  background: #ecfdf5;
  color: #059669;
}

.badge-threat {
  background: #fef2f2;
  color: #dc2626;
}

.badge-neutral {
  background: #f1f5f9;
  color: #64748b;
}

.careops-app.dark-mode .badge-success {
  background: #064e3b;
  color: #6ee7b7;
}

.careops-app.dark-mode .badge-threat {
  background: #7f1d1d;
  color: #fca5a5;
}

.careops-app.dark-mode .badge-neutral {
  background: #334155;
  color: #94a3b8;
}

/* Horizontal Quick-Select Chips Bar (แนวนอนด้านล่าง ไร้แถบด้านข้าง) */
.prominent-chips-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.45rem;
  width: 100%;
}

.prominent-chip-btn {
  user-select: none;
}

/* HTTP Status Rows (Clickable) */
.http-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  padding: 0.3rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s ease;
  border: 1px solid transparent;
}

.http-status-row:hover {
  background: #f1f5f9;
  transform: translateX(3px);
}

.careops-app.dark-mode .http-status-row:hover {
  background: #1e293b;
}

.http-status-row.active {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.careops-app.dark-mode .http-status-row.active {
  background: #1e293b;
  border-color: #3b82f6;
}

.http-status-left {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.http-status-right {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.http-chevron-icon {
  width: 13px;
  height: 13px;
  color: #94a3b8;
  opacity: 0.6;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.http-status-row:hover .http-chevron-icon {
  transform: translateX(2px);
  opacity: 1;
  color: #2563eb;
}

.http-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.bg-green { background-color: #10b981; }
.bg-blue { background-color: #0284c7; }
.bg-amber { background-color: #f59e0b; }
.bg-purple { background-color: #8b5cf6; }
.bg-red { background-color: #ef4444; }

.http-code {
  font-weight: 600;
  color: var(--text-main);
}

.http-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: var(--text-muted);
}

/* ==========================================================
   COMPACT & MODERN HTTP DETAIL DIALOG (กะทัดรัด สบายตา)
   ========================================================== */
.compact-http-dialog {
  background: #ffffff;
  border-radius: 20px;
  width: 92%;
  max-width: 440px;
  padding: 1.35rem 1.45rem;
  box-shadow: 0 20px 45px -10px rgba(15, 39, 68, 0.25), 0 0 1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: dialog-pop 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.careops-app.dark-mode .compact-http-dialog {
  background: #151d2e;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
}

@keyframes dialog-pop {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.compact-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.compact-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.compact-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid;
}

.compact-pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.compact-period-badge {
  font-size: 0.7rem;
  font-weight: 600;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
}

.careops-app.dark-mode .compact-period-badge {
  background: #1e293b;
  color: #93c5fd;
}

.compact-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
  align-items: center;
  padding: 0.35rem;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.compact-close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.careops-app.dark-mode .compact-close-btn:hover {
  background: #1e293b;
  color: #ffffff;
}

/* Hero Stat Row */
.compact-hero-stat {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.careops-app.dark-mode .compact-hero-stat {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.compact-stat-num {
  font-family: 'Inter', sans-serif;
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}

.compact-stat-meta {
  display: flex;
  flex-direction: column;
}

.compact-stat-pct {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
}

.careops-app.dark-mode .compact-stat-pct {
  color: #f8fafc;
}

.compact-stat-sub {
  font-size: 0.72rem;
  color: #64748b;
}

.careops-app.dark-mode .compact-stat-sub {
  color: #94a3b8;
}

/* Summary Card */
.compact-summary-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 0.85rem 1rem;
  font-size: 0.82rem;
  border: 1px solid #eef2f6;
}

.careops-app.dark-mode .compact-summary-card {
  background: #1a2333;
  border-color: rgba(255, 255, 255, 0.06);
}

.compact-summary-desc {
  margin: 0 0 0.5rem 0;
  color: #334155;
  line-height: 1.5;
}

.careops-app.dark-mode .compact-summary-desc {
  color: #cbd5e1;
}

.compact-cause-line {
  font-size: 0.76rem;
  color: #64748b;
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.careops-app.dark-mode .compact-cause-line {
  color: #94a3b8;
}

.cause-label {
  font-weight: 700;
  color: #0f172a;
}

.careops-app.dark-mode .cause-label {
  color: #f1f5f9;
}

/* Paths Block */
.compact-paths-block {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.compact-block-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
}

.careops-app.dark-mode .compact-block-title {
  color: #cbd5e1;
}

.compact-path-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.compact-path-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.35rem 0.55rem;
  background: #f8fafc;
  border-radius: 6px;
  font-size: 0.76rem;
}

.careops-app.dark-mode .compact-path-item {
  background: #1a2333;
}

.compact-path-text {
  color: #2563eb;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 250px;
}

.careops-app.dark-mode .compact-path-text {
  color: #60a5fa;
}

.compact-path-count {
  font-size: 0.7rem;
  font-weight: 600;
  color: #64748b;
  background: #e2e8f0;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.careops-app.dark-mode .compact-path-count {
  background: #25334a;
  color: #cbd5e1;
}

/* Firewall Pill */
.compact-firewall-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  font-size: 0.78rem;
  color: #166534;
}

.compact-firewall-pill.is-threat {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

.careops-app.dark-mode .compact-firewall-pill {
  background: #142820;
  border-color: #166534;
  color: #86efac;
}

.careops-app.dark-mode .compact-firewall-pill.is-threat {
  background: #2a2012;
  border-color: #92400e;
  color: #fde047;
}

.compact-firewall-text {
  line-height: 1.4;
}

/* Dialog Footer */
.compact-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

.compact-btn-unban {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.85rem;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.compact-btn-unban:hover {
  background: #1d4ed8;
}

.compact-btn-dismiss {
  padding: 0.5rem 0.85rem;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.compact-btn-dismiss:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.careops-app.dark-mode .compact-btn-dismiss {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.careops-app.dark-mode .compact-btn-dismiss:hover {
  background: #25334a;
  color: #ffffff;
}

/* Risk Distribution */
.risk-distribution-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.risk-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.risk-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.82rem;
}

.risk-item-count {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-main);
}

.risk-bar-track {
  width: 100%;
  height: 6px;
  background: #f1f5f9;
  border-radius: 9999px;
  overflow: hidden;
}

.risk-bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.risk-item-desc {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Top Attacked URLs */
.target-paths-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.target-path-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.target-rank {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  color: #94a3b8;
  width: 14px;
}

.target-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.target-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
}

.target-url {
  font-weight: 600;
  color: var(--text-main);
}

.target-hits {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.target-bar-track {
  width: 100%;
  height: 4px;
  background: #f1f5f9;
  border-radius: 9999px;
  overflow: hidden;
}

.target-bar-fill {
  height: 100%;
  background: #2563eb;
  border-radius: 9999px;
}

.target-bottom-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #2563eb;
  padding: 0.5rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.25rem;
  transition: all 0.15s ease;
}

.target-bottom-action-btn:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
}


.careops-app.dark-mode .dash-card {
  background: #151c2e;
  border-color: #222f46;
}

.careops-app.dark-mode .donut-bg-ring {
  stroke: #222f46;
}

.careops-app.dark-mode .risk-bar-track,
.careops-app.dark-mode .target-bar-track {
  background: #222f46;
}

.careops-app.dark-mode .target-bottom-action-btn {
  background: #1e293b;
  border-color: #334155;
  color: #60a5fa;
}

.careops-app.dark-mode .target-bottom-action-btn:hover {
  background: #27354f;
}


@media (max-width: 1024px) {
  .bottom-3-dashboard-grid {
    grid-template-columns: 1fr;
  }
}



.tooltip-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.3rem;
  margin-bottom: 0.4rem;
}

.tooltip-header-row .tooltip-header-date {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.tooltip-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.1rem;
  border-radius: 4px;
  transition: color 0.15s ease, background 0.15s ease;
}

.tooltip-close-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
}

.tooltip-detail-action-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: rgba(37, 99, 235, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.35);
  color: #60a5fa;
  padding: 0.35rem 0.55rem;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.45rem;
  transition: all 0.15s ease;
}

.tooltip-detail-action-btn:hover {
  background: rgba(37, 99, 235, 0.35);
  color: #ffffff;
  border-color: #3b82f6;
}

/* Tooltip Click Action */
.chart-dark-tooltip {
  cursor: pointer;
  transition: left 0.12s ease, transform 0.15s ease, box-shadow 0.15s ease;
}

.chart-dark-tooltip:hover {
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.5);
}

.tooltip-click-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.45rem;
  padding-top: 0.35rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.2);
  font-size: 0.72rem;
  color: #60a5fa;
  font-weight: 600;
  transition: color 0.15s ease;
}

.tooltip-click-action:hover {
  color: #93c5fd;
  text-decoration: underline;
}

/* Detail Modal Styles */
.modal-dialog.modal-lg {
  max-width: 680px;
}

.detail-modal-body {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.detail-kpi-4-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.detail-mini-kpi {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.mini-kpi-label {
  font-size: 0.74rem;
  font-weight: 600;
  color: #64748b;
}

.mini-kpi-val {
  font-family: 'Inter', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.mini-kpi-sub {
  font-size: 0.68rem;
  color: #94a3b8;
}

.detail-status-banner {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.detail-banner-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.detail-badge-pill {
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
}

.badge-rose {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.badge-green {
  background: #d1fae5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.detail-time-text {
  font-size: 0.76rem;
  color: #64748b;
  font-weight: 500;
}

.detail-status-desc {
  margin: 0;
  font-size: 0.84rem;
  color: #1e293b;
  line-height: 1.4;
}

.detail-ai-note {
  margin: 0;
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.45;
  border-top: 1px solid #e2e8f0;
  padding-top: 0.45rem;
}

.detail-breakdown-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.detail-section-title {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 700;
  color: #0f172a;
}

.detail-paths-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.detail-path-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  padding: 0.45rem 0.65rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #f1f5f9;
}

.path-name {
  color: #334155;
  font-weight: 500;
}

.path-val {
  font-weight: 700;
}

.btn-blue {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #2563eb;
  color: #ffffff;
}

.btn-blue:hover {
  background: #1d4ed8;
}

/* Dark Mode Overrides for Detail Modal */
.careops-app.dark-mode .detail-mini-kpi {
  background: #0f172a;
  border-color: #24324d;
}

.careops-app.dark-mode .detail-status-banner,
.careops-app.dark-mode .detail-breakdown-card {
  background: #0f172a;
  border-color: #24324d;
}

.careops-app.dark-mode .detail-status-desc {
  color: #f1f5f9;
}

.careops-app.dark-mode .detail-ai-note {
  border-top-color: #24324d;
  color: #94a3b8;
}

.careops-app.dark-mode .detail-section-title {
  color: #ffffff;
}

.careops-app.dark-mode .detail-path-row {
  background: #151c2e;
  border-color: #24324d;
}

.careops-app.dark-mode .path-name {
  color: #cbd5e1;
}




</style>
