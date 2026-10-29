<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSecurityStore, type ThreatRow } from '../stores/security'
import { useToast } from '../composables/useToast'
import {
  Ban,
  Unlock
} from 'lucide-vue-next'

const securityStore = useSecurityStore()
const { isAddModalOpen, quickIp, quickActionType, quickNote, apiActionLoading, threatRows, clientIp } = storeToRefs(securityStore)
const { showToast } = useToast()

const handleAddSubmit = async () => {
  if (!quickIp.value.trim()) {
    showToast('error', 'กรุณาระบุ IP Address', 'ตัวอย่าง: 1.46.128.90 หรือ 34.182.207.28')
    return
  }
  const ip = quickIp.value.trim()
  const isUnban = quickActionType.value === 'unban'

  // ระบบป้องกัน Admin Self-Ban (ห้ามบล็อก IP ตัวเอง)
  if (!isUnban && clientIp.value && ip === clientIp.value) {
    showToast('error', 'ไม่อนุญาตให้บล็อก IP ของคุณเอง', `IP ${ip} คือ IP ของคุณที่กำลังใช้งานระบบอยู่ หากบล็อกจะทำให้ถูกตัดขาดจากเซิร์ฟเวอร์`)
    return
  }

  apiActionLoading.value = true
  try {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost'
    const res = await fetch(`${origin}/api/${quickActionType.value}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SecDash-Admin-Secret-Key-2026'
      },
      body: JSON.stringify({ ip, note: quickNote.value }),
      signal: AbortSignal.timeout(8000)
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || `เซิร์ฟเวอร์ตอบกลับสถานะ ${res.status}`)
    }

    isAddModalOpen.value = false
    securityStore.markIpUnbanned(ip, isUnban)

    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const nowFormatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    const nowMs = now.getTime()

    const newThreat: ThreatRow = {
      id: `threat-${Date.now()}`,
      ip,
      attackType: quickNote.value || (isUnban ? 'ผู้สมัคร TCAS 68 / อาจารย์ ม.บูรพา' : 'บล็อกด้วยตนเองผ่านแดชบอร์ด'),
      icon: isUnban ? 'check' : 'alert',
      color: isUnban ? '#059669' : '#dc2626',
      bg: isUnban ? '#d1fae5' : '#fee2e2',
      threatIntensity: isUnban ? 15 : 75,
      allocation: 30,
      hits: isUnban ? '0 ครั้ง (อนุญาต)' : '1 ครั้ง (บล็อก)',
      isUnbanned: isUnban,
      lastSeen: nowFormatted,
      lastSeenRaw: nowMs
    }

    const existing = threatRows.value.find(r => r.ip === ip)
    if (existing) {
      existing.isUnbanned = isUnban
      existing.lastSeen = nowFormatted
      existing.lastSeenRaw = nowMs
    } else {
      threatRows.value.unshift(newThreat)
    }
    securityStore.addCustomThreatRow(newThreat)

    securityStore.addAuditLog({
      ip,
      action: isUnban ? 'UNBAN' : 'BAN',
      actionLabel: isUnban ? 'ปลดแบน (โดยแอดมิน)' : 'บล็อก (โดยแอดมิน)',
      detail: quickNote.value
        ? `${isUnban ? 'ปลดแบน IP' : 'บล็อก IP'}: ${quickNote.value}`
        : (isUnban ? 'ปลดแบนผ่านหน้าจัดการ IP (คำสั่งสำเร็จจริง)' : 'บล็อกผ่านหน้าจัดการ IP (คำสั่งสำเร็จจริง)')
    })

    if (isUnban) {
      showToast('success', `ปลดแบน IP ${ip} สำเร็จ`, 'ระบบได้ลบกฎบล็อกออกจาก iptables DROP และ Fail2ban บนเซิร์ฟเวอร์จริงแล้ว')
    } else {
      showToast('info', `บล็อก IP ${ip} สำเร็จ`, 'ระบบได้เพิ่มกฎ iptables DROP บนเซิร์ฟเวอร์จริงแล้ว')
    }

    quickIp.value = ''
    quickNote.value = ''
  } catch (err: any) {
    console.error('API Error in AddIpModal:', err)
    if (err.name === 'TimeoutError' || err.message?.includes('aborted') || err.message?.includes('timeout')) {
      showToast('error', 'การเชื่อมต่อใช้เวลานานเกินไป (Timeout)', 'เซิร์ฟเวอร์ไม่ตอบสนองภายใน 8 วินาที')
    } else {
      showToast('error', `เกิดข้อผิดพลาดในการ${isUnban ? 'ปลดแบน' : 'บล็อก'}`, err?.message || 'ไม่สามารถส่งคำสั่งไปยังเซิร์ฟเวอร์ได้')
    }
  } finally {
    apiActionLoading.value = false
  }
}
</script>

<template>
    <!-- MODAL POPUP เพิ่ม IP / ปลดแบนด่วน -->
    <div v-if="isAddModalOpen" class="modal-backdrop" @click="isAddModalOpen = false">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title">จัดการกฎไฟร์วอลล์ IP (iptables)</h3>
            <span class="modal-subtitle">เพิ่ม IP เพื่อปลดแบน (Whitelist) หรือบล็อก (DROP) บนเซิร์ฟเวอร์ทันที</span>
          </div>
          <button class="modal-close-btn" @click="isAddModalOpen = false">
            <X class="tiny-icon" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">การดำเนินการที่ต้องการ</label>
            <div class="action-type-selector">
              <button
                type="button"
                class="selector-btn"
                :class="{ active: quickActionType === 'unban' }"
                @click="quickActionType = 'unban'"
              >
                <Unlock class="tiny-icon text-green" />
                <span>ปลดแบน (Whitelist IP)</span>
              </button>
              <button
                type="button"
                class="selector-btn"
                :class="{ active: quickActionType === 'ban' }"
                @click="quickActionType = 'ban'"
              >
                <Ban class="tiny-icon text-rose" />
                <span>บล็อก (iptables DROP)</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="ip-input">IP Address ที่ต้องการจัดการ <span class="required">*</span></label>
            <input
              id="ip-input"
              v-model="quickIp"
              type="text"
              placeholder="ตัวอย่าง: 1.46.128.90 หรือ 203.154.83.12"
              class="form-input mono"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="note-input">หมายเหตุ / เหตุผลการดำเนินการ</label>
            <input
              id="note-input"
              v-model="quickNote"
              type="text"
              placeholder="เช่น: IP อาจารย์ประจำสาขาวิชา, นิสิตลงทะเบียน TCAS"
              class="form-input"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="isAddModalOpen = false">
            ยกเลิก
          </button>
          <button
            class="btn-confirm"
            :class="quickActionType === 'unban' ? 'btn-green' : 'btn-red'"
            :disabled="apiActionLoading"
            @click="handleAddSubmit"
          >
            {{ quickActionType === 'unban' ? 'ยืนยันปลดแบน IP' : 'ยืนยันบล็อก IP' }}
          </button>
        </div>
      </div>
    </div>

</template>
