<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSecurityStore } from '../stores/security'
import {
  Search,
  Clock,
  X
} from 'lucide-vue-next'

const securityStore = useSecurityStore()
const { auditLogs } = storeToRefs(securityStore)

const searchQuery = ref('')
const filterAction = ref<'all' | 'unban' | 'ban'>('all')

const filteredLogs = computed(() => {
  return auditLogs.value.filter(log => {
    const q = searchQuery.value.trim().toLowerCase()
    const matchSearch =
      !q ||
      log.ip.toLowerCase().includes(q) ||
      log.timestamp.toLowerCase().includes(q) ||
      log.detail.toLowerCase().includes(q) ||
      log.actionLabel.toLowerCase().includes(q)

    if (!matchSearch) return false
    if (filterAction.value === 'unban') return log.action === 'UNBAN'
    if (filterAction.value === 'ban') return log.action === 'BAN'
    return true
  })
})

const unbanCount = computed(() => auditLogs.value.filter(l => l.action === 'UNBAN').length)
const banCount = computed(() => auditLogs.value.filter(l => l.action === 'BAN').length)
</script>

<template>
  <div class="audit-page-wrap">
    <main class="tab-content-fade">
      <!-- 1. หัวข้อหน้า Audit Log แบบเรียบง่าย -->
      <section class="section-title-bar">
        <div class="title-with-badge">
          <h1 class="page-title">ประวัติการแก้ไข IP (Audit Log)</h1>
        </div>
      </section>

      <!-- 2. ตารางบันทึกประวัติการแก้ไข (เฉพาะตารางตามที่ต้องการ) -->
      <section class="unban-table-container">
        <!-- แถบค้นหา และกรองสถานะ -->
        <div class="table-toolbar">
          <div class="toolbar-search-box">
            <Search class="tiny-icon text-muted" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหา IP Address, วันเวลา, หรือการแก้ไข..."
              class="search-input"
            />
            <button v-if="searchQuery" class="clear-search-btn" @click="searchQuery = ''">
              <X class="tiny-icon" />
            </button>
          </div>

          <div class="toolbar-filters">
            <div class="filter-pills">
              <button
                class="filter-pill"
                :class="{ active: filterAction === 'all' }"
                @click="filterAction = 'all'"
              >
                ทั้งหมด ({{ auditLogs.length }})
              </button>
              <button
                class="filter-pill"
                :class="{ active: filterAction === 'unban' }"
                @click="filterAction = 'unban'"
              >
                ปลดแบน IP ({{ unbanCount }})
              </button>
              <button
                class="filter-pill"
                :class="{ active: filterAction === 'ban' }"
                @click="filterAction = 'ban'"
              >
                บล็อก IP ({{ banCount }})
              </button>
            </div>
          </div>
        </div>

        <!-- ตารางข้อมูล Log (4 คอลัมน์ สะอาด คลีน อ่านง่าย) -->
        <div class="table-scroll-wrap">
          <table class="ops-data-table">
            <thead>
              <tr>
                <th class="th-time">วันเวลา (TIMESTAMP)</th>
                <th class="th-ip">IP ADDRESS</th>
                <th class="th-action-col">การดำเนินการ</th>
                <th class="th-detail">การแก้ไขในหน้าจัดการ IP</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="log in filteredLogs"
                :key="log.id"
                :class="{ 'row-unban': log.action === 'UNBAN' }"
              >
                <!-- วันเวลา -->
                <td class="td-time">
                  <div class="time-cell">
                    <Clock class="tiny-icon text-muted" />
                    <span class="mono-time">{{ log.timestamp }}</span>
                  </div>
                </td>

                <!-- IP Address (คลีน ตัวหนา ไม่มีไอคอนรกตา) -->
                <td class="td-ip">
                  <span class="mono bold-ip">{{ log.ip }}</span>
                </td>

                <!-- การดำเนินการ (Pill) -->
                <td class="td-action-col">
                  <span
                    class="status-pill"
                    :class="log.action === 'UNBAN' ? 'status-allowed' : 'status-blocked'"
                  >
                    <span class="pill-dot"></span>
                    {{ log.actionLabel }}
                  </span>
                </td>

                <!-- การแก้ไขในหน้าจัดการ IP -->
                <td class="td-detail">
                  <span class="detail-text">{{ log.detail }}</span>
                </td>
              </tr>

              <tr v-if="filteredLogs.length === 0">
                <td colspan="4" class="empty-table-cell">
                  ไม่พบข้อมูลประวัติการแก้ไขที่ตรงกับ "{{ searchQuery }}"
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
.audit-page-wrap {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* TABLE CONTAINER */
.unban-table-container {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--card-border, #e2e8f0);
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
  border-bottom: 1px solid var(--card-border, #f1f5f9);
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
  color: #0f172a;
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
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.ops-data-table td {
  padding: 0.95rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  color: #334155;
  vertical-align: middle;
}

.ops-data-table tbody tr:hover {
  background: #f8fafc;
}

/* CELLS */
.time-cell {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.mono-time {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: #475569;
  font-weight: 600;
  white-space: nowrap;
}

.bold-ip {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.9rem;
  white-space: nowrap;
}

.detail-text {
  font-size: 0.86rem;
  color: #334155;
  font-weight: 500;
}

/* STATUS PILL */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.22rem 0.6rem;
  border-radius: 9999px;
  white-space: nowrap;
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

.empty-table-cell {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #94a3b8;
  font-style: italic;
}

/* ==========================================================
   DARK MODE
   ========================================================== */
:global(.careops-app.dark-mode) .unban-table-container {
  background: #0f172a;
  border-color: #1e293b;
}

:global(.careops-app.dark-mode) .table-toolbar {
  border-bottom-color: #1e293b;
}

:global(.careops-app.dark-mode) .toolbar-search-box {
  background: #1e293b;
  border-color: #334155;
}

:global(.careops-app.dark-mode) .search-input {
  color: #f8fafc;
}

:global(.careops-app.dark-mode) .filter-pill {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

:global(.careops-app.dark-mode) .filter-pill.active {
  background: #2563eb;
  color: #ffffff;
}

:global(.careops-app.dark-mode) .ops-data-table th {
  background: #0f172a;
  border-bottom-color: #1e293b;
}

:global(.careops-app.dark-mode) .ops-data-table td {
  border-bottom-color: #1e293b;
  color: #cbd5e1;
}

:global(.careops-app.dark-mode) .ops-data-table tbody tr:hover {
  background: #131d31;
}

:global(.careops-app.dark-mode) .mono-time {
  color: #94a3b8;
}

:global(.careops-app.dark-mode) .bold-ip {
  color: #f8fafc;
}

:global(.careops-app.dark-mode) .detail-text {
  color: #e2e8f0;
}
</style>
