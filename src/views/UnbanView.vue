<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSecurityStore, type ThreatRow } from '../stores/security'
import { useToast } from '../composables/useToast'
import {
  Search,
  Plus,
  Unlock,
  Ban,
  ShieldCheck,
  RefreshCw,
  X,
  AlertTriangle,
  ShieldAlert,
  Copy,
  Check,
  Clock,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Lock,
  Key,
  Eye,
  EyeOff,
  User
} from 'lucide-vue-next'

const securityStore = useSecurityStore()
const { threatRows, isAddModalOpen, apiActionLoading, isPageLoading, clientIp } = storeToRefs(securityStore)
const { showToast } = useToast()

const ipSearchQuery = ref('')
const ipFilterStatus = ref<'all' | 'blocked' | 'allowed'>('all')

// เรียงลำดับ: ค่าเริ่มต้นคือ 'newest' (ใหม่ไปเก่า) ตามคำขอของผู้ใช้
const sortOrder = ref<'newest' | 'oldest' | 'hits'>('newest')

const toggleTimeSort = () => {
  if (sortOrder.value === 'newest') {
    sortOrder.value = 'oldest'
  } else {
    sortOrder.value = 'newest'
  }
}

const filteredThreatRows = computed(() => {
  const list = threatRows.value.filter(row => {
    const q = ipSearchQuery.value.trim().toLowerCase()
    const matchSearch =
      !q ||
      row.ip.toLowerCase().includes(q) ||
      row.attackType.toLowerCase().includes(q) ||
      (row.lastSeen && row.lastSeen.toLowerCase().includes(q))
    if (!matchSearch) return false
    if (ipFilterStatus.value === 'blocked') return !row.isUnbanned
    if (ipFilterStatus.value === 'allowed') return row.isUnbanned
    return true
  })

  return list.slice().sort((a, b) => {
    if (sortOrder.value === 'newest') {
      const timeA = a.lastSeenRaw ?? 0
      const timeB = b.lastSeenRaw ?? 0
      if (timeB !== timeA) return timeB - timeA
      const hitsA = parseInt(a.hits.replace(/[^\d]/g, ''), 10) || 0
      const hitsB = parseInt(b.hits.replace(/[^\d]/g, ''), 10) || 0
      return hitsB - hitsA
    }
    if (sortOrder.value === 'oldest') {
      const timeA = a.lastSeenRaw ?? 0
      const timeB = b.lastSeenRaw ?? 0
      if (timeA !== timeB) return timeA - timeB
      const hitsA = parseInt(a.hits.replace(/[^\d]/g, ''), 10) || 0
      const hitsB = parseInt(b.hits.replace(/[^\d]/g, ''), 10) || 0
      return hitsA - hitsB
    }
    if (sortOrder.value === 'hits') {
      const hitsA = parseInt(a.hits.replace(/[^\d]/g, ''), 10) || 0
      const hitsB = parseInt(b.hits.replace(/[^\d]/g, ''), 10) || 0
      if (hitsB !== hitsA) return hitsB - hitsA
      return (b.lastSeenRaw ?? 0) - (a.lastSeenRaw ?? 0)
    }
    return 0
  })
})

const toggleUnbanRow = async (row: ThreatRow) => {
  const targetAction = row.isUnbanned ? 'ban' : 'unban'

  // ระบบป้องกัน Admin Self-Ban (ห้ามบล็อก IP ตัวเอง)
  if (targetAction === 'ban' && clientIp.value && row.ip === clientIp.value) {
    showToast('error', 'ไม่อนุญาตให้บล็อก IP ของคุณเอง', `IP ${row.ip} คือ IP ของคุณที่กำลังใช้งานอยู่ หากบล็อกจะทำให้ตัดขาดจากการเข้าถึงเซิร์ฟเวอร์`)
    return
  }

  apiActionLoading.value = true
  try {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost'
    const op = operatorInput.value.trim() || securityStore.currentOperator
    const res = await fetch(`${origin}/api/${targetAction}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: securityStore.getAuthHeaders(),
      body: JSON.stringify({
        ip: row.ip,
        operator: op
      }),
      signal: AbortSignal.timeout(8000)
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || `เซิร์ฟเวอร์ตอบกลับสถานะ ${res.status}`)
    }

    // อัปเดตสถานะเมื่อคำสั่งลบ/เพิ่มกฎ iptables และ fail2ban ทำงานสำเร็จจริงบนเซิร์ฟเวอร์
    const nextUnbanned = !row.isUnbanned
    securityStore.markIpUnbanned(row.ip, nextUnbanned)
    row.isUnbanned = nextUnbanned
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    row.lastSeen = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    row.lastSeenRaw = now.getTime()

    if (row.isUnbanned) {
      securityStore.addAuditLog({
        ip: row.ip,
        action: 'UNBAN',
        actionLabel: 'ปลดแบน (โดยแอดมิน)',
        detail: `ปลดแบนผ่านหน้าจัดการ IP (คำสั่งลบ iptables DROP และ Fail2ban สำเร็จจริง)`,
        operator: op
      })
      showToast('success', `ปลดแบน IP ${row.ip} เรียบร้อย`, `ระบบได้ลบกฎบล็อกออกจาก iptables DROP และ Fail2ban บนเซิร์ฟเวอร์จริงแล้ว (ผู้ดำเนินการ: ${op})`)
    } else {
      securityStore.addAuditLog({
        ip: row.ip,
        action: 'BAN',
        actionLabel: 'บล็อก (โดยแอดมิน)',
        detail: `สั่งบล็อกผ่านหน้าจัดการ IP (เพิ่มกฎ iptables DROP สำเร็จจริง)`,
        operator: op
      })
      showToast('info', `บล็อก IP ${row.ip} เรียบร้อย`, `ระบบได้เพิ่มกฎ iptables DROP บนเซิร์ฟเวอร์จริงแล้ว (ผู้ดำเนินการ: ${op})`)
    }
  } catch (err: any) {
    console.error('API Error in toggleUnbanRow:', err)
    if (err.name === 'TimeoutError' || err.message?.includes('aborted') || err.message?.includes('timeout')) {
      showToast('error', 'การเชื่อมต่อใช้เวลานานเกินไป (Timeout)', 'เซิร์ฟเวอร์ไม่ตอบสนองภายใน 8 วินาที (หากเป็น IP ของตนเอง อาจเกิดจากกฎไฟร์วอลล์บล็อกอยู่)')
    } else {
      showToast('error', `เกิดข้อผิดพลาดในการ${targetAction === 'unban' ? 'ปลดแบน' : 'บล็อก'}`, err?.message || 'ไม่สามารถส่งคำสั่งไปยังเซิร์ฟเวอร์ได้')
    }
  } finally {
    apiActionLoading.value = false
  }
}

const getDots = (score: number, total: number = 8) => {
  const activeCount = Math.round((score / 100) * total)
  return Array.from({ length: total }, (_, i) => i < activeCount)
}

const handleRefreshData = () => {
  securityStore.fetchReportData()
}

onMounted(() => {
  securityStore.fetchReportData(true)
})

// State สำหรับ Admin Auth Verification Modal (เด้งถามครั้งเดียวเมื่อกดสั่งการ)
const isAdminAuthModalOpen = ref(false)
const adminPasswordInput = ref('')
const operatorInput = ref(securityStore.currentOperator || 'แอดมิน')
const adminAuthError = ref('')
const adminAuthLoading = ref(false)
const adminPasswordVisible = ref(false)
const pendingActionRow = ref<ThreatRow | null>(null)
const adminPasswordInputRef = ref<HTMLInputElement | null>(null)

const handleActionClick = (row: ThreatRow) => {
  // บังคับกรอกรหัสผ่านผู้ดูแลระบบเสมอทุกครั้ง ไม่ว่าจะปลดแบนหรือบล็อก IP
  pendingActionRow.value = row
  adminPasswordInput.value = ''
  operatorInput.value = securityStore.currentOperator || 'แอดมิน'
  adminAuthError.value = ''
  isAdminAuthModalOpen.value = true
  setTimeout(() => {
    adminPasswordInputRef.value?.focus()
  }, 120)
}

const handleVerifyAdminSubmit = async () => {
  const pwd = adminPasswordInput.value.trim()
  if (!pwd || adminAuthLoading.value) return
  adminAuthLoading.value = true
  adminAuthError.value = ''
  try {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost'
    const res = await fetch(`${origin}/api/verify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.detail || 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง')
    }
    if (!data.token) {
      throw new Error('ไม่ได้รับโทเค็นยืนยันสิทธิ์จากเซิร์ฟเวอร์')
    }
    // ยืนยันสำเร็จ: บันทึก token ใน session และจดจำชื่อผู้ดำเนินการ
    securityStore.setAdminToken(data.token)
    if (operatorInput.value.trim()) {
      securityStore.setOperator(operatorInput.value.trim())
    }
    isAdminAuthModalOpen.value = false
    showToast('success', 'ยืนยันตัวตนแอดมินสำเร็จ', 'ระบบจดจำสิทธิ์ในรอบนี้แล้ว สามารถสั่งการไฟร์วอลล์ได้ทันที')

    // รัน action ต่อให้ทันที
    if (pendingActionRow.value) {
      const targetRow = pendingActionRow.value
      pendingActionRow.value = null
      await toggleUnbanRow(targetRow)
    }
  } catch (err: any) {
    adminAuthError.value = err.message || 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง กรุณากรอกใหม่อีกครั้ง'
  } finally {
    adminAuthLoading.value = false
  }
}

const closeAdminAuthModal = () => {
  isAdminAuthModalOpen.value = false
  pendingActionRow.value = null
  adminPasswordInput.value = ''
  adminAuthError.value = ''
}
</script>

<template>
  <div class="unban-page-wrap">
      <main  class="tab-content-fade">
        <!-- 3.1 หัวข้อการจัดการปลดแบน IP -->
        <section class="section-title-bar">
          <div class="title-with-badge">
            <h1 class="page-title">ระบบจัดการการปลดแบน & กฎไฟร์วอลล์ IP</h1>
          </div>

          <div class="title-controls">
            <!-- สถานะ Session Admin -->
            <div
              class="admin-session-badge"
              :class="securityStore.isAdminAuthenticated ? 'badge-authed' : 'badge-guest'"
              :title="securityStore.isAdminAuthenticated ? 'คลิกเพื่อออกจากระบบแอดมิน' : 'ต้องยืนยันรหัสผ่านเพื่อสั่งการไฟร์วอลล์'"
            >
              <ShieldCheck v-if="securityStore.isAdminAuthenticated" class="tiny-icon text-green" />
              <Lock v-else class="tiny-icon text-amber" />
              <span>{{ securityStore.isAdminAuthenticated ? 'Admin Authenticated (พร้อมสั่งการ)' : 'Guest Mode (ต้องใส่รหัสก่อนแก้ไข)' }}</span>
              <button
                v-if="securityStore.isAdminAuthenticated"
                type="button"
                class="btn-logout-session"
                @click="securityStore.clearAdminToken()"
                title="ออกจากสิทธิ์แอดมิน"
              >
                ออกจากระบบ
              </button>
            </div>

            <button class="btn-primary-add" @click.stop="isAddModalOpen = true">
              <Plus class="tiny-icon" />
              <span>เพิ่ม IP / ปลดแบนด่วน</span>
            </button>
          </div>
        </section>

        <!-- 3.2 การ์ดสรุปสถานะ IP โดยเฉพาะ 3 การ์ด เป็นสัดส่วนชัดเจน -->
        <section class="unban-kpi-row">
          <!-- การ์ด 1: IP ที่ถูกบล็อก -->
          <div class="kpi-mini-card border-red">
            <div class="mini-icon-circle bg-red-soft text-rose">
              <Ban class="tiny-icon" />
            </div>
            <div class="mini-info">
              <span class="mini-label">IP ที่ถูกบล็อก (iptables DROP)</span>
              <div class="mini-val text-rose">{{ threatRows.filter(r => !r.isUnbanned).length }} รายการ</div>
              <span class="mini-hint">บอทต่างชาติถูกตัดการเชื่อมต่อ</span>
            </div>
          </div>

          <!-- การ์ด 2: IP ที่ได้รับอนุญาต -->
          <div class="kpi-mini-card border-green">
            <div class="mini-icon-circle bg-green-soft text-green">
              <Unlock class="tiny-icon" />
            </div>
            <div class="mini-info">
              <span class="mini-label">IP ที่ได้รับอนุญาต (Whitelist)</span>
              <div class="mini-val text-green">{{ threatRows.filter(r => r.isUnbanned).length }} รายการ</div>
              <span class="mini-hint">IP แอดมิน / อาจารย์ ม.บูรพา</span>
            </div>
          </div>

          <!-- การ์ด 3: นโยบายไฟร์วอลล์ -->
          <div class="kpi-mini-card border-purple">
            <div class="mini-icon-circle bg-purple-soft text-purple">
              <ShieldCheck class="tiny-icon" />
            </div>
            <div class="mini-info">
              <span class="mini-label">นโยบายไฟร์วอลล์ (GeoIP Policy)</span>
              <div class="mini-val text-purple">เฉพาะประเทศไทย</div>
              <span class="mini-hint">DROP ทุกการเชื่อมต่อนอกประเทศไทย</span>
            </div>
          </div>
        </section>

        <!-- 3.3 ตารางจัดการ IP และแถบค้นหา/กรอง -->
        <section class="unban-table-container">
          <!-- แถบค้นหา, กรองสถานะ และการจัดเรียง -->
          <div class="table-toolbar">
            <div class="toolbar-search-box">
              <Search class="tiny-icon text-muted" />
              <input
                v-model="ipSearchQuery"
                type="text"
                placeholder="ค้นหา IP Address, วันเวลา, หรือประเภทการโจมตี..."
                class="search-input"
              />
              <button v-if="ipSearchQuery" class="clear-search-btn" @click="ipSearchQuery = ''">
                <X class="tiny-icon" />
              </button>
            </div>

            <div class="toolbar-controls-row">
              <!-- ตัวเลือกการเรียงลำดับ (Sort: ค่าเริ่มต้น ใหม่ไปเก่า) -->
              <div class="toolbar-sort-group">
                <span class="sort-label">
                  <ArrowUpDown class="tiny-icon text-muted" />
                  <span>เรียงตาม:</span>
                </span>
                <div class="sort-pills">
                  <button
                    class="sort-pill"
                    :class="{ active: sortOrder === 'newest' }"
                    @click="sortOrder = 'newest'"
                    title="เรียงจากวันเวลาล่าสุดไปหาเก่าสุด"
                  >
                    <Clock class="tiny-icon" />
                    <span>ใหม่ไปเก่า (ล่าสุด)</span>
                  </button>
                  <button
                    class="sort-pill"
                    :class="{ active: sortOrder === 'oldest' }"
                    @click="sortOrder = 'oldest'"
                    title="เรียงจากวันเวลาเก่าสุดไปหาใหม่สุด"
                  >
                    <span>เก่าไปใหม่</span>
                  </button>
                  <button
                    class="sort-pill"
                    :class="{ active: sortOrder === 'hits' }"
                    @click="sortOrder = 'hits'"
                    title="เรียงตามจำนวนครั้งที่ถูกตรวจพบมากที่สุด"
                  >
                    <span>ตรวจพบบ่อยสุด (Hits)</span>
                  </button>
                </div>
              </div>

              <!-- กรองสถานะ -->
              <div class="toolbar-filters">
                <div class="filter-pills">
                  <button
                    class="filter-pill"
                    :class="{ active: ipFilterStatus === 'all' }"
                    @click="ipFilterStatus = 'all'"
                  >
                    ทั้งหมด ({{ threatRows.length }})
                  </button>
                  <button
                    class="filter-pill"
                    :class="{ active: ipFilterStatus === 'blocked' }"
                    @click="ipFilterStatus = 'blocked'"
                  >
                    ถูกบล็อก ({{ threatRows.filter(r => !r.isUnbanned).length }})
                  </button>
                  <button
                    class="filter-pill refresh-pill-btn"
                    @click="handleRefreshData"
                    title="รีเฟรชข้อมูล IP ล่าสุด"
                  >
                    <RefreshCw class="tiny-icon" :class="{ 'spin-anim': isPageLoading }" />
                    <span>รีเฟรช</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ตาราง IP -->
          <div class="table-scroll-wrap">
            <table class="ops-data-table">
              <thead>
                <tr>
                  <th class="th-ip">IP Address</th>
                  <th
                    class="th-time sortable-header"
                    :class="{ 'header-sorted': sortOrder === 'newest' || sortOrder === 'oldest' }"
                    @click="toggleTimeSort"
                    title="คลิกเพื่อสลับการเรียงวันเวลา ใหม่ไปเก่า / เก่าไปใหม่"
                  >
                    <div class="th-header-inner">
                      <span>วันเวลาล่าสุด</span>
                      <ArrowDown v-if="sortOrder === 'newest'" class="sort-icon-active" />
                      <ArrowUp v-else-if="sortOrder === 'oldest'" class="sort-icon-active" />
                      <ArrowUpDown v-else class="sort-icon-idle" />
                    </div>
                  </th>
                  <th class="th-type">พฤติกรรม / ประเภททราฟฟิก</th>
                  <th
                    class="th-hits sortable-header"
                    :class="{ 'header-sorted': sortOrder === 'hits' }"
                    @click="sortOrder = 'hits'"
                    title="คลิกเพื่อเรียงตามจำนวนครั้งที่ตรวจพบ"
                  >
                    <div class="th-header-inner">
                      <span>จำนวนที่ตรวจพบ</span>
                      <ArrowDown v-if="sortOrder === 'hits'" class="sort-icon-active" />
                      <ArrowUpDown v-else class="sort-icon-idle" />
                    </div>
                  </th>
                  <th class="th-status">สถานะปัจจุบัน</th>
                  <th class="th-threat">ระดับความรุนแรง</th>
                  <th class="th-action text-right">การจัดการกฎ iptables</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in filteredThreatRows"
                  :key="row.id"
                  :class="{ 'row-allowed': row.isUnbanned }"
                >
                  <!-- IP Address -->
                  <td class="td-ip">
                    <div class="ip-cell-flex">
                      <span class="mono bold-ip">{{ row.ip }}</span>
                      <span v-if="clientIp && row.ip === clientIp" class="self-ip-badge" title="IP อินเทอร์เน็ตปัจจุบันของคุณ">คุณ (Current)</span>
                    </div>
                  </td>

                  <!-- วันเวลาล่าสุด (ไม่มีกรอบ ไม่ใส่กล่อง AI slop) -->
                  <td class="td-time">
                    <span class="mono time-val">{{ row.lastSeen || '-' }}</span>
                  </td>

                  <!-- ประเภททราฟฟิก -->
                  <td class="td-type">
                    <span v-if="clientIp && row.ip === clientIp" class="type-text self-admin-type">อุปกรณ์ผู้ดูแลระบบ (Admin)</span>
                    <span v-else class="type-text">{{ row.attackType }}</span>
                  </td>

                  <!-- จำนวนที่ตรวจพบ -->
                  <td class="td-hits">
                    <span class="hits-bubble">{{ row.hits }}</span>
                  </td>

                  <!-- สถานะ -->
                  <td class="td-status">
                    <span
                      class="status-pill"
                      :class="row.isUnbanned ? 'status-allowed' : 'status-blocked'"
                    >
                      <span class="pill-dot"></span>
                      {{ row.isUnbanned ? 'อนุญาต (Whitelist)' : 'บล็อกแล้ว (DROP)' }}
                    </span>
                  </td>

                  <!-- ระดับความรุนแรง -->
                  <td class="td-threat">
                    <div class="intensity-dots-row">
                      <span
                        v-for="(isActive, dotIdx) in getDots(row.threatIntensity)"
                        :key="dotIdx"
                        class="threat-dot"
                        :class="{ active: isActive, 'allowed-dot': row.isUnbanned }"
                      ></span>
                      <span class="intensity-num">{{ row.threatIntensity }}%</span>
                    </div>
                  </td>

                  <!-- ปุ่ม Action ปลดแบน / บล็อกซ้ำ -->
                  <td class="td-action text-right">
                    <button
                      v-if="row.isUnbanned && clientIp && row.ip === clientIp"
                      class="action-pill-btn disabled-self-btn"
                      disabled
                      title="ไม่สามารถบล็อก IP ปัจจุบันของคุณเองได้ เพื่อป้องกันการถูกตัดการเชื่อมต่อจากเซิร์ฟเวอร์"
                    >
                      <ShieldAlert class="tiny-icon" />
                      <span>ห้ามบล็อกตัวเอง</span>
                    </button>
                    <button
                      v-else
                      class="action-pill-btn"
                      :class="row.isUnbanned ? 'reban-btn' : 'unban-btn'"
                      :disabled="apiActionLoading"
                      @click="handleActionClick(row)"
                      :title="row.isUnbanned ? 'คลิกเพื่อบล็อก IP นี้ซ้ำ' : 'คลิกเพื่อปลดแบน IP นี้'"
                    >
                      <Ban v-if="row.isUnbanned" class="tiny-icon" />
                      <Unlock v-else class="tiny-icon" />
                      <span>{{ row.isUnbanned ? 'บล็อกซ้ำ' : 'ปลดแบน IP' }}</span>
                    </button>
                  </td>
                </tr>

                <tr v-if="filteredThreatRows.length === 0">
                  <td colspan="7" class="empty-table-cell">
                    ไม่พบข้อมูล IP ที่ตรงกับการค้นหา "{{ ipSearchQuery }}"
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

    <!-- MODAL ยืนยันสิทธิ์ผู้ดูแลระบบ (Admin Password Verification) -->
    <div v-if="isAdminAuthModalOpen" class="modal-backdrop" @click="closeAdminAuthModal">
      <div class="modal-dialog admin-auth-dialog" @click.stop>
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title flex-title">
              <Ban v-if="pendingActionRow?.isUnbanned" class="modal-title-icon text-rose" />
              <Unlock v-else class="modal-title-icon text-green" />
              <span>{{ pendingActionRow?.isUnbanned ? 'ยืนยันการบล็อก IP (Admin Confirmation)' : 'ยืนยันการปลดแบน IP (Admin Confirmation)' }}</span>
            </h3>
            <span class="modal-subtitle">
              {{ pendingActionRow?.isUnbanned
                ? 'กรุณากรอกรหัสผ่านผู้ดูแลระบบเพื่อยืนยันการสั่งบล็อก IP ในไฟร์วอลล์ iptables DROP'
                : 'กรุณากรอกรหัสผ่านผู้ดูแลระบบเพื่อยืนยันการสั่งปลดแบน IP ในไฟร์วอลล์ iptables & Fail2ban' }}
            </span>
          </div>
          <button class="modal-close-btn" @click="closeAdminAuthModal" aria-label="ปิด">
            <X class="tiny-icon" />
          </button>
        </div>

        <div class="modal-body">
          <!-- การ์ดสรุปเป้าหมาย -->
          <div v-if="pendingActionRow" class="unban-target-card">
            <div class="target-meta">
              <span class="target-label">คำสั่งที่รอดำเนินการ:</span>
              <div class="target-ip-wrap">
                <span class="status-pill" :class="pendingActionRow.isUnbanned ? 'status-blocked' : 'status-allowed'">
                  {{ pendingActionRow.isUnbanned ? 'บล็อก IP' : 'ปลดแบน IP' }}
                </span>
                <span class="target-ip-mono">{{ pendingActionRow.ip }}</span>
              </div>
            </div>
            <div class="target-details-grid">
              <div class="detail-cell">
                <span class="detail-label">พฤติกรรม / ประเภท:</span>
                <span class="detail-val">{{ pendingActionRow.attackType }}</span>
              </div>
              <div class="detail-cell">
                <span class="detail-label">จำนวนสถิติ:</span>
                <span class="detail-val text-rose">{{ pendingActionRow.hits }}</span>
              </div>
            </div>
          </div>

          <!-- ช่องระบุชื่อผู้ดำเนินการ / รหัสนิสิต -->
          <div class="form-group admin-auth-group" style="margin-bottom: 0.85rem;">
            <label class="form-label font-medium">
              ชื่อผู้ดำเนินการ / รหัสนิสิต (Operator ID):
            </label>
            <div class="password-input-wrap">
              <User class="password-input-icon text-muted" />
              <input
                v-model="operatorInput"
                type="text"
                class="form-input admin-password-input"
                placeholder="เช่น นิสิต 67160058 หรือ แอดมิน..."
                @keyup.enter="handleVerifyAdminSubmit"
              />
            </div>
            <span class="form-hint">
              ระบุตัวตนผู้สั่งการเพื่อบันทึกลงในตารางประวัติการแก้ไข (Audit Log)
            </span>
          </div>

          <!-- ช่องกรอกรหัสผ่าน Admin -->
          <div class="form-group admin-auth-group">
            <label class="form-label font-medium">
              รหัสผ่านผู้ดูแลระบบ (Admin Password):
            </label>
            <div class="password-input-wrap">
              <Key class="password-input-icon text-muted" />
              <input
                ref="adminPasswordInputRef"
                v-model="adminPasswordInput"
                :type="adminPasswordVisible ? 'text' : 'password'"
                class="form-input admin-password-input"
                :class="{ 'input-error': !!adminAuthError }"
                placeholder="กรอกรหัสผ่านผู้ดูแลระบบ..."
                @keyup.enter="handleVerifyAdminSubmit"
              />
              <button
                type="button"
                class="btn-toggle-eye"
                @click="adminPasswordVisible = !adminPasswordVisible"
                tabindex="-1"
              >
                <EyeOff v-if="adminPasswordVisible" class="tiny-icon" />
                <Eye v-else class="tiny-icon" />
              </button>
            </div>

            <div v-if="adminAuthError" class="auth-error-msg">
              <AlertTriangle class="tiny-icon text-rose" />
              <span>{{ adminAuthError }}</span>
            </div>

            <span class="form-hint">
              {{ pendingActionRow?.isUnbanned
                ? '🔒 นโยบายความปลอดภัย: คำสั่งบล็อก IP ต้องยืนยันรหัสผ่านผู้ดูแลระบบเสมอ'
                : '🔒 นโยบายความปลอดภัย: คำสั่งปลดแบน IP ต้องยืนยันรหัสผ่านผู้ดูแลระบบเสมอ' }}
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn-cancel"
            :disabled="adminAuthLoading"
            @click="closeAdminAuthModal"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            class="btn-confirm btn-admin-auth-submit"
            :class="pendingActionRow?.isUnbanned ? 'btn-ban-submit' : 'btn-unban-submit'"
            :disabled="!adminPasswordInput.trim() || adminAuthLoading"
            @click="handleVerifyAdminSubmit"
          >
            <Ban v-if="pendingActionRow?.isUnbanned" class="tiny-icon" />
            <Unlock v-else class="tiny-icon" />
            <span v-if="adminAuthLoading">กำลังตรวจสอบ...</span>
            <span v-else>{{ pendingActionRow?.isUnbanned ? 'ยืนยันบล็อก IP' : 'ยืนยันปลดแบน IP' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==========================================================
   3. UNBAN & IP MANAGEMENT VIEW
   ========================================================== */
/* Admin Session Badge */
.admin-session-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.admin-session-badge.badge-authed {
  background: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}

.admin-session-badge.badge-guest {
  background: #fffbeb;
  color: #92400e;
  border-color: #fef3c7;
}

.btn-logout-session {
  background: none;
  border: none;
  color: #b91c1c;
  font-size: 0.72rem;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 0.25rem;
  padding: 0;
}

/* Password Input with Eye */
.password-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.password-input-icon {
  position: absolute;
  left: 0.75rem;
  pointer-events: none;
  width: 16px;
  height: 16px;
}

.admin-password-input {
  width: 100%;
  padding-left: 2.25rem;
  padding-right: 2.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  border-radius: 8px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
}

.admin-password-input.input-error {
  border-color: #ef4444;
  background: #fef2f2;
}

.btn-toggle-eye {
  position: absolute;
  right: 0.65rem;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.25rem;
}

.auth-error-msg {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #dc2626;
  font-size: 0.78rem;
  font-weight: 600;
  margin-top: 0.4rem;
}

.btn-admin-auth-submit {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #2563eb;
  color: #ffffff;
  padding: 0.55rem 1.25rem;
  border-radius: 6px;
  border: none;
  font-weight: 600;
  font-size: 0.86rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-admin-auth-submit.btn-ban-submit {
  background: #dc2626;
}

.btn-admin-auth-submit:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.btn-admin-auth-submit.btn-ban-submit:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-admin-auth-submit.btn-unban-submit {
  background: #059669;
}

.btn-admin-auth-submit.btn-unban-submit:hover:not(:disabled) {
  background: #047857;
}

.btn-admin-auth-submit:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

/* Dark mode for Admin Auth */
:global(.careops-app.dark-mode) .admin-session-badge.badge-authed {
  background: rgba(22, 101, 52, 0.25);
  color: #86efac;
  border-color: rgba(34, 197, 94, 0.4);
}

:global(.careops-app.dark-mode) .admin-session-badge.badge-guest {
  background: rgba(146, 64, 14, 0.25);
  color: #fde68a;
  border-color: rgba(245, 158, 11, 0.4);
}

:global(.careops-app.dark-mode) .admin-password-input {
  background: #0f172a;
  border-color: #334155;
  color: #f8fafc;
}

:global(.careops-app.dark-mode) .admin-password-input.input-error {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
}
.btn-primary-add {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #2563eb;
  border: none;
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-primary-add:hover {
  background: #1d4ed8;
}

.unban-kpi-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.kpi-mini-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 1.15rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.mini-icon-circle {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-red-soft { background: #fee2e2; }
.bg-green-soft { background: #d1fae5; }
.bg-purple-soft { background: #ede9fe; }

.mini-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.mini-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-muted);
}

.mini-val {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.mini-hint {
  font-size: 0.72rem;
  color: #94a3b8;
}

.unban-table-container {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.table-toolbar {
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--card-border);
  flex-wrap: wrap;
}

.toolbar-search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  width: 320px;
}

.search-input {
  border: none;
  background: transparent;
  width: 100%;
  font-size: 0.86rem;
  color: var(--text-main);
  outline: none;
}

.clear-search-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  display: flex;
  align-items: center;
  padding: 0;
}

.toolbar-controls-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.toolbar-sort-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
}

.sort-pills {
  display: flex;
  gap: 0.35rem;
}

.sort-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.32rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.sort-pill:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.sort-pill.active {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}

.sortable-header:hover {
  color: #2563eb !important;
  background: #f1f5f9;
}

.sortable-header.header-sorted {
  color: #2563eb !important;
}

.th-header-inner {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.sort-icon-active {
  width: 13px;
  height: 13px;
  color: #2563eb;
  stroke-width: 2.5;
}

.sort-icon-idle {
  width: 13px;
  height: 13px;
  color: #94a3b8;
  opacity: 0.6;
}

.th-time {
  min-width: 175px;
}

.td-time {
  white-space: nowrap;
}

.time-val {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.filter-pills {
  display: flex;
  gap: 0.4rem;
}

.filter-pill {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill:hover {
  background: #e2e8f0;
}

.filter-pill.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.table-scroll-wrap {
  width: 100%;
  overflow-x: auto;
}

.ops-data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.86rem;
}

.ops-data-table th {
  background: #f8fafc;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--card-border);
}

.ops-data-table td {
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}

.ops-data-table tbody tr:hover {
  background: #f8fafc;
}

.ip-cell-box {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.icon-avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-icon {
  width: 16px;
  height: 16px;
}

.hits-bubble {
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  font-weight: 600;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.76rem;
  font-weight: 600;
  padding: 0.22rem 0.55rem;
  border-radius: 9999px;
}

.status-blocked {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.status-blocked .pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #dc2626;
}

.status-allowed {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.status-allowed .pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #059669;
}

.intensity-dots-row {
  display: flex;
  align-items: center;
  gap: 3px;
}

.threat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e2e8f0;
}

.threat-dot.active {
  background: #dc2626;
}

.threat-dot.allowed-dot.active {
  background: #059669;
}

.intensity-num {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.74rem;
  color: #94a3b8;
  margin-left: 0.35rem;
}

.text-right {
  text-align: right;
}

.empty-table-cell {
  text-align: center;
  padding: 2.5rem;
  color: #94a3b8;
  font-style: italic;
}

/* ==========================================================
   ACTION BUTTONS (ปลดแบน / บล็อกซ้ำ)
   ========================================================== */
.action-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.42rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  font-family: inherit;
}

.action-pill-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ปุ่มปลดแบน: สไตล์ฟ้าสดใส Modern Clean สบายตา */
.action-pill-btn.unban-btn {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}

.action-pill-btn.unban-btn:hover:not(:disabled) {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
  transform: translateY(-1px);
}

/* ปุ่มบล็อกซ้ำ: สไตล์แดงเตือนภัย */
.action-pill-btn.reban-btn {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.action-pill-btn.reban-btn:hover:not(:disabled) {
  background: #dc2626;
  color: #ffffff;
  border-color: #dc2626;
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25);
  transform: translateY(-1px);
}

/* DARK MODE */
:global(.careops-app.dark-mode) .action-pill-btn.unban-btn {
  background: #172554;
  color: #60a5fa;
  border-color: #1e40af;
}

:global(.careops-app.dark-mode) .action-pill-btn.unban-btn:hover:not(:disabled) {
  background: #2563eb;
  color: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
}

:global(.careops-app.dark-mode) .action-pill-btn.reban-btn {
  background: #450a0a;
  color: #f87171;
  border-color: #991b1b;
}

:global(.careops-app.dark-mode) .action-pill-btn.reban-btn:hover:not(:disabled) {
  background: #dc2626;
  color: #ffffff;
  border-color: #ef4444;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
}

/* ==========================================================
   IP ADDRESS CELL & TYPOGRAPHY
   ========================================================== */
.ip-cell-flex {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.self-ip-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 9999px;
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  letter-spacing: 0.02em;
}

:global(.careops-app.dark-mode) .self-ip-badge {
  background: rgba(37, 99, 235, 0.2);
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.4);
}

.disabled-self-btn {
  background: #f1f5f9 !important;
  color: #94a3b8 !important;
  border: 1px dashed #cbd5e1 !important;
  cursor: not-allowed !important;
  opacity: 0.85;
}

:global(.careops-app.dark-mode) .disabled-self-btn {
  background: #1e293b !important;
  color: #64748b !important;
  border: 1px dashed #334155 !important;
}

.self-admin-type {
  color: #2563eb !important;
  font-weight: 600;
}

:global(.careops-app.dark-mode) .self-admin-type {
  color: #60a5fa !important;
}

.ip-cell-flex {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.bold-ip {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.9rem;
  letter-spacing: -0.01em;
}

:global(.careops-app.dark-mode) .bold-ip {
  color: #f8fafc;
}

/* ==========================================================
   UNBAN CONFIRMATION MODAL (พิมพ์ยืนยัน)
   ========================================================== */
.unban-confirm-dialog {
  max-width: 490px;
  width: 92%;
}

.flex-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-title-icon {
  width: 22px;
  height: 22px;
}

.unban-target-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem 1.15rem;
  margin-bottom: 1rem;
}

.target-meta {
  margin-bottom: 0.75rem;
  padding-bottom: 0.65rem;
  border-bottom: 1px dashed #cbd5e1;
}

.target-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.04em;
  margin-bottom: 0.25rem;
}

.target-ip-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.target-ip-mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.btn-copy-fill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.28rem 0.65rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-copy-fill:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
}

.target-details-grid {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.82rem;
}

.detail-cell {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.detail-label {
  color: #64748b;
  font-weight: 500;
  flex-shrink: 0;
}

.detail-val {
  color: #1e293b;
  font-weight: 600;
}

.unban-warning-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.78rem;
  color: #92400e;
  line-height: 1.5;
}

.alert-icon-svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.ip-code-chip {
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 0.85rem;
}

.confirm-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 0.4rem;
}

.confirm-type-input {
  width: 100%;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  outline: none;
  transition: all 0.15s ease;
}

.confirm-type-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.confirm-type-input.input-matched {
  border-color: #10b981;
  background: #f0fdf4;
}

.match-badge {
  position: absolute;
  right: 0.65rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #10b981;
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  animation: fadeIn 0.15s ease;
}

.form-hint {
  display: block;
  font-size: 0.74rem;
  color: #64748b;
  margin-top: 0.35rem;
}

.btn-unban-execute {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #94a3b8;
  color: #ffffff;
  border: none;
  padding: 0.55rem 1.15rem;
  border-radius: 6px;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: not-allowed;
  transition: all 0.2s ease;
}

.btn-unban-execute.btn-active-glow {
  background: #2563eb;
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-unban-execute.btn-active-glow:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

/* Dark Mode for Unban Modal */
:global(.careops-app.dark-mode) .unban-target-card {
  background: #0f172a;
  border-color: #1e293b;
}

:global(.careops-app.dark-mode) .target-meta {
  border-bottom-color: #1e293b;
}

:global(.careops-app.dark-mode) .target-ip-mono {
  color: #f8fafc;
}

:global(.careops-app.dark-mode) .btn-copy-fill {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

:global(.careops-app.dark-mode) .btn-copy-fill:hover {
  background: #1e3a8a;
  border-color: #3b82f6;
  color: #93c5fd;
}

:global(.careops-app.dark-mode) .detail-val {
  color: #e2e8f0;
}

:global(.careops-app.dark-mode) .unban-warning-alert {
  background: #451a03;
  border-color: #78350f;
  color: #fde68a;
}

:global(.careops-app.dark-mode) .ip-code-chip {
  background: #450a0a;
  color: #fca5a5;
}

:global(.careops-app.dark-mode) .confirm-type-input {
  background: #0f172a;
  border-color: #334155;
  color: #f8fafc;
}

:global(.careops-app.dark-mode) .confirm-type-input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
}

:global(.careops-app.dark-mode) .confirm-type-input.input-matched {
  border-color: #059669;
  background: #064e3b;
}

/* Dark Mode for Sort & Time Column */
:global(.careops-app.dark-mode) .toolbar-search-box {
  background: rgba(30, 41, 59, 0.5);
  border-color: #334155;
}

:global(.careops-app.dark-mode) .sort-pill {
  background: rgba(30, 41, 59, 0.6);
  border-color: #334155;
  color: #94a3b8;
}

:global(.careops-app.dark-mode) .sort-pill:hover {
  background: rgba(51, 65, 85, 0.8);
  color: #f8fafc;
}

:global(.careops-app.dark-mode) .sort-pill.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

:global(.careops-app.dark-mode) .filter-pill {
  background: rgba(30, 41, 59, 0.6);
  border-color: #334155;
  color: #94a3b8;
}

:global(.careops-app.dark-mode) .filter-pill:hover {
  background: rgba(51, 65, 85, 0.8);
  color: #f8fafc;
}

:global(.careops-app.dark-mode) .filter-pill.active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

:global(.careops-app.dark-mode) .ops-data-table th {
  background: #0b1120;
  color: #94a3b8;
  border-color: #1e293b;
}

:global(.careops-app.dark-mode) .sortable-header:hover {
  background: #1e293b;
  color: #60a5fa !important;
}

:global(.careops-app.dark-mode) .sortable-header.header-sorted {
  color: #60a5fa !important;
}

:global(.careops-app.dark-mode) .sort-icon-active {
  color: #60a5fa;
}

:global(.careops-app.dark-mode) .ops-data-table td {
  border-color: #1e293b;
  color: #cbd5e1;
}

:global(.careops-app.dark-mode) .ops-data-table tbody tr:hover {
  background: rgba(30, 41, 59, 0.4);
}

:global(.careops-app.dark-mode) .time-val {
  color: #94a3b8;
}

:global(.careops-app.dark-mode) .hits-bubble {
  background: #1e293b;
  color: #e2e8f0;
}


</style>
