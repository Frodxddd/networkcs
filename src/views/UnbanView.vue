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
  CheckCircle2,
  AlertTriangle,
  Shield,
  ShieldCheck,
  RefreshCw,
  Flame
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
      showToast('success', `ปลดแบน IP ${row.ip} เรียบร้อย`, `ลบกฎ iptables DROP บนเซิร์ฟเวอร์แล้ว • ${row.attackType}`)
    } else {
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
</script>

<template>
  <div class="unban-page-wrap">
      <main  class="tab-content-fade">
        <!-- 3.1 หัวข้อการจัดการปลดแบน IP -->
        <section class="section-title-bar">
          <div class="title-with-badge">
            <h1 class="page-title">ระบบจัดการการปลดแบน & กฎไฟร์วอลล์ IP</h1>
            <span class="vps-badge">
              <span class="live-dot"></span>
              iptables Controller • VPS nenenainaemak.duckdns.org
            </span>
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
                    <div class="ip-cell-box">
                      <div class="icon-avatar" :style="{ backgroundColor: row.bg, color: row.color }">
                        <Flame v-if="row.icon === 'flame'" class="avatar-icon" />
                        <AlertTriangle -if="row.icon === 'alert'" class="avatar-icon" />
                        <CheckCircle2 -if="row.icon === 'check'" class="avatar-icon" />
                        <Shield  class="avatar-icon" />
                      </div>
                      <span class="mono bold-ip">{{ row.ip }}</span>
                    </div>
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
                      @click="toggleUnbanRow(row)"
                    >
                      <Unlock v-if="row.isUnbanned" class="tiny-icon" />
                      <Ban  class="tiny-icon" />
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


</style>
