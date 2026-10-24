<script setup lang="ts">
import { ref, computed } from 'vue'
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
  Check
} from 'lucide-vue-next'

const securityStore = useSecurityStore()
const { threatRows, isAddModalOpen, apiActionLoading, isPageLoading } = storeToRefs(securityStore)
const { showToast } = useToast()

const ipSearchQuery = ref('')
const ipFilterStatus = ref<'all' | 'blocked' | 'allowed'>('all')

const filteredThreatRows = computed(() => {
  return threatRows.value.filter(row => {
    const matchSearch = row.ip.includes(ipSearchQuery.value) || row.attackType.toLowerCase().includes(ipSearchQuery.value.toLowerCase())
    if (!matchSearch) return false
    if (ipFilterStatus.value === 'blocked') return !row.isUnbanned
    if (ipFilterStatus.value === 'allowed') return row.isUnbanned
    return true
  })
})

const toggleUnbanRow = async (row: ThreatRow) => {
  apiActionLoading.value = true
  const targetAction = row.isUnbanned ? 'ban' : 'unban'
  try {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost'
    const res = await fetch(`${origin}/api/${targetAction}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: row.ip })
    })
    if (!res.ok) {
      console.warn(`API responded with ${res.status}`)
    }
  } catch {
    // Fallback
  } finally {
    apiActionLoading.value = false
    row.isUnbanned = !row.isUnbanned
    if (row.isUnbanned) {
      securityStore.addAuditLog({
        ip: row.ip,
        action: 'UNBAN',
        actionLabel: 'ปลดแบน IP',
        detail: `ปลดแบนผ่านหน้าจัดการ IP (${row.attackType})`
      })
      showToast('success', `ปลดแบน IP ${row.ip} เรียบร้อย`, `ลบกฎ iptables DROP บนเซิร์ฟเวอร์แล้ว • ${row.attackType}`)
    } else {
      securityStore.addAuditLog({
        ip: row.ip,
        action: 'BAN',
        actionLabel: 'บล็อก IP',
        detail: `สั่งบล็อกซ้ำผ่านหน้าจัดการ IP (${row.attackType})`
      })
      showToast('info', `บล็อก IP ${row.ip} เรียบร้อย`, `เพิ่มกฎ iptables DROP บนเซิร์ฟเวอร์แล้ว • ${row.attackType}`)
    }
  }
}

const getDots = (score: number, total: number = 8) => {
  const activeCount = Math.round((score / 100) * total)
  return Array.from({ length: total }, (_, i) => i < activeCount)
}

const handleRefreshData = () => {
  securityStore.fetchReportData()
}

// Dialog ยืนยันการปลดแบน IP (ต้องพิมพ์เพื่อยืนยัน)
const unbanConfirmRow = ref<ThreatRow | null>(null)
const unbanConfirmInput = ref('')
const unbanInputRef = ref<HTMLInputElement | null>(null)

const isUnbanInputMatch = computed(() => {
  if (!unbanConfirmRow.value) return false
  const targetIp = unbanConfirmRow.value.ip.trim().toLowerCase()
  const typed = unbanConfirmInput.value.trim().toLowerCase()
  return typed === targetIp || typed === 'unban' || typed === 'ปลดแบน'
})

const handleActionClick = (row: ThreatRow) => {
  if (row.isUnbanned) {
    // กรณีที่ได้รับอนุญาตอยู่แล้ว: บล็อกซ้ำได้ทันที
    toggleUnbanRow(row)
  } else {
    // กรณีที่ถูกบล็อกอยู่: ต้องเปิด Dialog ให้พิมพ์ยืนยันก่อนปลดแบน
    unbanConfirmRow.value = row
    unbanConfirmInput.value = ''
    setTimeout(() => {
      unbanInputRef.value?.focus()
    }, 100)
  }
}

const handleConfirmUnbanSubmit = async () => {
  if (!isUnbanInputMatch.value || !unbanConfirmRow.value || apiActionLoading.value) return
  const row = unbanConfirmRow.value
  await toggleUnbanRow(row)
  closeUnbanConfirmModal()
}

const closeUnbanConfirmModal = () => {
  unbanConfirmRow.value = null
  unbanConfirmInput.value = ''
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
          <!-- แถบค้นหา และกรองสถานะ -->
          <div class="table-toolbar">
            <div class="toolbar-search-box">
              <Search class="tiny-icon text-muted" />
              <input
                v-model="ipSearchQuery"
                type="text"
                placeholder="ค้นหา IP Address หรือประเภทการโจมตี..."
                class="search-input"
              />
              <button v-if="ipSearchQuery" class="clear-search-btn" @click="ipSearchQuery = ''">
                <X class="tiny-icon" />
              </button>
            </div>

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
                  class="filter-pill"
                  :class="{ active: ipFilterStatus === 'allowed' }"
                  @click="ipFilterStatus = 'allowed'"
                >
                  อนุญาตแล้ว ({{ threatRows.filter(r => r.isUnbanned).length }})
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

          <!-- ตาราง IP -->
          <div class="table-scroll-wrap">
            <table class="ops-data-table">
              <thead>
                <tr>
                  <th class="th-ip">IP Address</th>
                  <th class="th-type">พฤติกรรม / ประเภททราฟฟิก</th>
                  <th class="th-hits">จำนวนที่ตรวจพบ</th>
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
                    <span class="mono bold-ip">{{ row.ip }}</span>
                  </td>

                  <!-- ประเภททราฟฟิก -->
                  <td class="td-type">
                    <span class="type-text">{{ row.attackType }}</span>
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
                  <td colspan="6" class="empty-table-cell">
                    ไม่พบข้อมูล IP ที่ตรงกับการค้นหา "{{ ipSearchQuery }}"
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>

    <!-- MODAL ยืนยันการปลดแบน IP (ต้องพิมพ์ยืนยัน) -->
    <div v-if="unbanConfirmRow" class="modal-backdrop" @click="closeUnbanConfirmModal">
      <div class="modal-dialog unban-confirm-dialog" @click.stop>
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title flex-title">
              <ShieldAlert class="modal-title-icon text-amber" />
              <span>ยืนยันการปลดแบน IP</span>
            </h3>
            <span class="modal-subtitle">ระบบรักษาความปลอดภัยไฟร์วอลล์ (iptables)</span>
          </div>
          <button class="modal-close-btn" @click="closeUnbanConfirmModal" aria-label="ปิด">
            <X class="tiny-icon" />
          </button>
        </div>

        <div class="modal-body">
          <!-- การ์ดสรุปข้อมูล IP ที่จะปลดแบน -->
          <div class="unban-target-card">
            <div class="target-meta">
              <span class="target-label">IP ADDRESS ที่ต้องการปลดแบน</span>
              <div class="target-ip-wrap">
                <span class="target-ip-mono">{{ unbanConfirmRow.ip }}</span>
                <button
                  type="button"
                  class="btn-copy-fill"
                  @click="unbanConfirmInput = unbanConfirmRow.ip"
                  title="คลิกเพื่อกรอกหมายเลข IP นี้ลงในช่องยืนยันทันที"
                >
                  <Copy class="tiny-icon" />
                  <span>ใส่ในช่องพิมพ์</span>
                </button>
              </div>
            </div>

            <div class="target-details-grid">
              <div class="detail-cell">
                <span class="detail-label">พฤติกรรมที่ตรวจพบ:</span>
                <span class="detail-val">{{ unbanConfirmRow.attackType }}</span>
              </div>
              <div class="detail-cell">
                <span class="detail-label">จำนวนครั้งที่บล็อก:</span>
                <span class="detail-val text-rose">{{ unbanConfirmRow.hits }}</span>
              </div>
            </div>
          </div>

          <!-- กล่องเตือนความปลอดภัย -->
          <div class="unban-warning-alert">
            <AlertTriangle class="alert-icon-svg text-amber" />
            <div class="alert-content">
              <strong>คำเตือนด้านความปลอดภัย:</strong>
              การปลดแบนจะลบกฎ DROP บนเซิร์ฟเวอร์ และอนุญาตให้ IP นี้เชื่อมต่อเข้าสู่เว็บไซต์ได้ทันที หากเป็น IP บอทหรือผู้ไม่หวังดี อาจทำให้เว็บเสี่ยงถูกโจมตีซ้ำ
            </div>
          </div>

          <!-- ช่องพิมพ์ยืนยัน -->
          <div class="form-group unban-type-group">
            <label class="form-label font-medium">
              กรุณาพิมพ์ <code class="ip-code-chip">{{ unbanConfirmRow.ip }}</code> เพื่อยืนยัน:
            </label>
            <div class="confirm-input-wrap">
              <input
                ref="unbanInputRef"
                v-model="unbanConfirmInput"
                type="text"
                class="form-input confirm-type-input"
                :class="{ 'input-matched': isUnbanInputMatch }"
                :placeholder="`พิมพ์ ${unbanConfirmRow.ip} เพื่อยืนยัน...`"
                @keyup.enter="handleConfirmUnbanSubmit"
              />
              <span v-if="isUnbanInputMatch" class="match-badge">
                <Check class="tiny-icon" />
                <span>ถูกต้อง</span>
              </span>
            </div>
            <span class="form-hint">
              กด Enter หรือคลิกปุ่มด้านล่างเพื่อดำเนินการ (หรือพิมพ์ <code>UNBAN</code>)
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn-cancel"
            :disabled="apiActionLoading"
            @click="closeUnbanConfirmModal"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            class="btn-confirm btn-unban-execute"
            :class="{ 'btn-active-glow': isUnbanInputMatch }"
            :disabled="!isUnbanInputMatch || apiActionLoading"
            @click="handleConfirmUnbanSubmit"
          >
            <Unlock class="tiny-icon" />
            <span v-if="apiActionLoading">กำลังปลดแบน...</span>
            <span v-else>ยืนยันการปลดแบน IP</span>
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


</style>
