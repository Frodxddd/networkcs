<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSecurityStore, type ThreatRow } from '../stores/security'
import { useToast } from '../composables/useToast'
import {
  Ban,
  Unlock,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
  User
} from 'lucide-vue-next'

const securityStore = useSecurityStore()
const { isAddModalOpen, quickIp, quickActionType, quickNote, apiActionLoading, threatRows, clientIp } = storeToRefs(securityStore)
const { showToast } = useToast()

const banPassword = ref('')
const banPasswordVisible = ref(false)
const banPasswordError = ref('')
const addOperatorInput = ref(securityStore.currentOperator || 'แอดมิน')

const handleCloseModal = () => {
  isAddModalOpen.value = false
  banPassword.value = ''
  banPasswordError.value = ''
}

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

  // บังคับกรอกรหัสผ่าน Admin ยืนยันเสมอเพื่อความปลอดภัย (ทั้งปลดแบนและบล็อก IP)
  if (!banPassword.value.trim()) {
    banPasswordError.value = `กรุณากรอกรหัสผ่านผู้ดูแลระบบเพื่อยืนยันการ${isUnban ? 'ปลดแบน' : 'บล็อก'} IP`
    return
  }
  // ตรวจสอบรหัสผ่านกับเซิร์ฟเวอร์
  try {
    const vOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost'
    const vRes = await fetch(`${vOrigin}/api/verify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: banPassword.value.trim() })
    })
    const vData = await vRes.json().catch(() => ({}))
    if (!vRes.ok || !vData.token) {
      banPasswordError.value = vData.detail || 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง'
      return
    }
    securityStore.setAdminToken(vData.token)
    if (addOperatorInput.value.trim()) {
      securityStore.setOperator(addOperatorInput.value.trim())
    }
    banPasswordError.value = ''
  } catch (e: any) {
    banPasswordError.value = 'เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน'
    return
  }

  apiActionLoading.value = true
  try {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost'
    const op = addOperatorInput.value.trim() || securityStore.currentOperator
    const res = await fetch(`${origin}/api/${quickActionType.value}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: securityStore.getAuthHeaders(),
      body: JSON.stringify({ ip, note: quickNote.value, operator: op }),
      signal: AbortSignal.timeout(8000)
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.detail || `เซิร์ฟเวอร์ตอบกลับสถานะ ${res.status}`)
    }

    isAddModalOpen.value = false
    banPassword.value = ''
    banPasswordError.value = ''
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
        : (isUnban ? 'ปลดแบนผ่านหน้าจัดการ IP (คำสั่งสำเร็จจริง)' : 'บล็อกผ่านหน้าจัดการ IP (คำสั่งสำเร็จจริง)'),
      operator: op
    })

    if (isUnban) {
      showToast('success', `ปลดแบน IP ${ip} สำเร็จ`, `ระบบได้ลบกฎบล็อกออกจาก iptables DROP และ Fail2ban บนเซิร์ฟเวอร์จริงแล้ว (ผู้ดำเนินการ: ${op})`)
    } else {
      showToast('info', `บล็อก IP ${ip} สำเร็จ`, `ระบบได้เพิ่มกฎ iptables DROP บนเซิร์ฟเวอร์จริงแล้ว (ผู้ดำเนินการ: ${op})`)
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
    <div v-if="isAddModalOpen" class="modal-backdrop" @click="handleCloseModal">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <div class="modal-title-group">
            <h3 class="modal-title">จัดการกฎไฟร์วอลล์ IP (iptables)</h3>
            <span class="modal-subtitle">เพิ่ม IP เพื่อปลดแบน (Whitelist) หรือบล็อก (DROP) บนเซิร์ฟเวอร์ทันที</span>
          </div>
          <button class="modal-close-btn" @click="handleCloseModal">
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

          <!-- ระบุชื่อผู้ดำเนินการ / รหัสนิสิต -->
          <div class="form-group">
            <label class="form-label" for="operator-input">
              ชื่อผู้ดำเนินการ / รหัสนิสิต (Operator ID)
            </label>
            <div class="password-input-wrap">
              <User class="password-input-icon text-muted" />
              <input
                id="operator-input"
                v-model="addOperatorInput"
                type="text"
                placeholder="เช่น นิสิต 67160058 หรือ แอดมิน..."
                class="form-input"
                @keyup.enter="handleAddSubmit"
              />
            </div>
            <span class="form-hint">
              ระบุตัวตนผู้สั่งการเพื่อบันทึกลงในตารางประวัติการแก้ไข (Audit Log)
            </span>
          </div>

          <!-- ฟิลด์รหัสผ่าน Admin สำหรับการจัดการกฎ IP -->
          <div class="form-group">
            <label class="form-label" for="ban-pwd-input">
              รหัสผ่านผู้ดูแลระบบ (Admin Password) <span class="required">*</span>
            </label>
            <div class="password-input-wrap">
              <Key class="password-input-icon text-muted" />
              <input
                id="ban-pwd-input"
                v-model="banPassword"
                :type="banPasswordVisible ? 'text' : 'password'"
                placeholder="กรอกรหัสผ่านเพื่อยืนยันคำสั่ง..."
                class="form-input"
                :class="{ 'input-error': !!banPasswordError }"
                autocomplete="current-password"
                @keyup.enter="handleAddSubmit"
              />
              <button
                type="button"
                class="btn-toggle-eye"
                @click="banPasswordVisible = !banPasswordVisible"
                tabindex="-1"
              >
                <EyeOff v-if="banPasswordVisible" class="tiny-icon" />
                <Eye v-else class="tiny-icon" />
              </button>
            </div>
            <div v-if="banPasswordError" class="auth-error-msg">
              <AlertTriangle class="tiny-icon text-rose" />
              <span>{{ banPasswordError }}</span>
            </div>
            <span class="form-hint">
              🔒 นโยบายความปลอดภัย: คำสั่งจัดการไฟร์วอลล์ IP ต้องยืนยันรหัสผ่านผู้ดูแลระบบเสมอ
            </span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="handleCloseModal">
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

<style scoped>
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
.password-input-wrap .form-input {
  width: 100%;
  padding-left: 2.25rem;
  padding-right: 2.5rem;
}
.btn-toggle-eye {
  position: absolute;
  right: 0.65rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-toggle-eye:hover {
  color: #475569;
}
.auth-error-msg {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #e11d48;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 0.35rem;
}
.form-hint {
  display: block;
  font-size: 0.76rem;
  color: #64748b;
  margin-top: 0.35rem;
}
.input-error {
  border-color: #f43f5e !important;
}
</style>
