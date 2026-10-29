<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSecurityStore } from './stores/security'
import { useTheme } from './composables/useTheme'
import { useToast } from './composables/useToast'
import AddIpModal from './components/AddIpModal.vue'
import buuLogoSvg from './assets/buu_logo.svg'
import buuLogoWhiteSvg from './assets/buu_logo_white.svg'
import {
  Sun,
  Moon,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Key,
  Eye,
  EyeOff,
  LogOut,
  ShieldCheck,
  User
} from 'lucide-vue-next'

const route = useRoute()
const securityStore = useSecurityStore()
const { isAddModalOpen } = storeToRefs(securityStore)
const { isDarkMode, toggleTheme } = useTheme()
const { toast } = useToast()

// Gateway Authentication Lock Screen (กรอกรหัสผ่านเพื่อเข้าใช้งานแดชบอร์ด)
const lockPasswordInput = ref('')
const lockOperatorInput = ref(securityStore.currentOperator || '')
const lockPasswordError = ref('')
const lockPasswordLoading = ref(false)
const lockPasswordVisible = ref(false)
const lockInputRef = ref<HTMLInputElement | null>(null)

const handleLockLoginSubmit = async () => {
  const pwd = lockPasswordInput.value.trim()
  if (!pwd || lockPasswordLoading.value) return
  lockPasswordLoading.value = true
  lockPasswordError.value = ''
  try {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost'
    const res = await fetch(`${origin}/api/verify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(data.detail || 'รหัสผ่านไม่ถูกต้อง')
    }
    if (!data.token) {
      throw new Error('ไม่ได้รับโทเค็นยืนยันสิทธิ์จากเซิร์ฟเวอร์')
    }
    securityStore.setAdminToken(data.token)
    if (lockOperatorInput.value.trim()) {
      securityStore.setOperator(lockOperatorInput.value.trim())
    }
    lockPasswordInput.value = ''
    lockPasswordError.value = ''

    // เข้าสู่ระบบสำเร็จ: เริ่มต้นแสดง Loading Animation แล้วเปิดเข้าสู่แดชบอร์ด
    runLoadingAnimation(
      'กำลังโหลดข้อมูลระบบความปลอดภัย',
      'ยืนยันสิทธิ์สำเร็จ กำลังเปิดแดชบอร์ดศูนย์ปฏิบัติการ...',
      550
    )
    securityStore.fetchReportData()
    startAutoSync()
  } catch (err: any) {
    lockPasswordError.value = err.message || 'รหัสผ่านไม่ถูกต้อง กรุณากรอกใหม่อีกครั้ง'
  } finally {
    lockPasswordLoading.value = false
  }
}

// Seamless Loading Screen
const isPageLoading = ref(false)
const loadingProgress = ref(0)
const loadingTitle = ref('กำลังโหลดข้อมูลระบบความปลอดภัย')
const loadingSubtitle = ref('กำลังเชื่อมต่อเซิร์ฟเวอร์ความปลอดภัย ม.บูรพา')
const loadingStepMessage = ref('ตรวจสอบความถูกต้องของสถิติและกฎไฟร์วอลล์...')

const runLoadingAnimation = (
  title: string,
  subtitle: string,
  durationMs: number = 700,
  onFinish?: () => void
) => {
  isPageLoading.value = true
  loadingProgress.value = 5
  loadingTitle.value = title
  loadingSubtitle.value = subtitle
  loadingStepMessage.value = 'กำลังซิงค์ข้อมูลกับเซิร์ฟเวอร์...'

  const startTime = Date.now()
  const interval = setInterval(() => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(100, Math.floor((elapsed / durationMs) * 100))
    loadingProgress.value = Math.max(5, progress)

    if (progress >= 40 && progress < 80) {
      loadingStepMessage.value = 'ประมวลผลสถิติไฟร์วอลล์และรายงาน AI...'
    } else if (progress >= 80) {
      loadingStepMessage.value = 'เตรียมแสดงผลหน้าจอแดชบอร์ด...'
    }

    if (elapsed >= durationMs) {
      clearInterval(interval)
      loadingProgress.value = 100
      setTimeout(() => {
        isPageLoading.value = false
        if (onFinish) onFinish()
      }, 150)
    }
  }, 20)
}

let autoSyncTimer: any = null

const startAutoSync = () => {
  if (autoSyncTimer) clearInterval(autoSyncTimer)
  autoSyncTimer = setInterval(() => {
    if (securityStore.isAdminAuthenticated) {
      securityStore.fetchReportData(true)
    }
  }, 3500)
}

const handleLogout = () => {
  if (autoSyncTimer) clearInterval(autoSyncTimer)
  securityStore.clearAdminToken()
}

onMounted(() => {
  // หากได้รับการยืนยันตัวตนแล้วใน Session ให้โหลดข้อมูลและเปิด Auto-Sync
  if (securityStore.isAdminAuthenticated) {
    runLoadingAnimation(
      'กำลังโหลดข้อมูลความปลอดภัย',
      'กรุณารอสักครู่ ระบบกำลังดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์',
      500
    )
    securityStore.fetchReportData()
    startAutoSync()
  } else {
    // ยังไม่ได้เข้าสู่ระบบ: ให้แสดง Lock Screen ทันที ไม่ต้องโหลดแดชบอร์ด
    isPageLoading.value = false
  }
})

onUnmounted(() => {
  if (autoSyncTimer) {
    clearInterval(autoSyncTimer)
  }
})
</script>

<template>
  <div class="careops-app" :class="{ 'dark-mode': isDarkMode }">
    <!-- ========================================================== -->
    <!-- GATEWAY AUTHENTICATION LOCK SCREEN (เข้าเว็บต้องยืนยันตัวตน) -->
    <!-- แสดงทันทีโดยไม่เรนเดอร์แดชบอร์ดเลยแม้แต่น้อย ป้องกันการแวบเห็นหน้าเว็บ 100% -->
    <!-- ========================================================== -->
    <div v-if="!securityStore.isAdminAuthenticated" class="gateway-lock-backdrop">
      <div class="gateway-lock-card">
          <!-- โลโก้มหาวิทยาลัยบูรพา + CS BUU -->
          <div class="gateway-brand">
            <img
              :src="isDarkMode ? buuLogoWhiteSvg : buuLogoSvg"
              alt="ตราสัญลักษณ์ มหาวิทยาลัยบูรพา BUU"
              class="gateway-logo-img"
            />
            <div class="gateway-brand-divider"></div>
            <div class="gateway-brand-text">
              <span class="gateway-title-cs">CS BUU</span>
              <span class="gateway-sub-cs">COMPUTER SCIENCE</span>
            </div>
          </div>

          <!-- หัวข้อของ Gateway -->
          <div class="gateway-header-group">
            <div class="gateway-lock-icon-badge">
              <Lock class="gateway-shield-icon text-amber" />
            </div>
            <h2 class="gateway-main-title">SecDash Security Gateway</h2>
            <p class="gateway-main-desc">
              ระบบศูนย์ปฏิบัติการความปลอดภัยไซเบอร์และควบคุมไฟร์วอลล์ (VPS Control Plane)
            </p>
          </div>

          <!-- ฟอร์มใส่รหัสผ่านผู้ดูแลระบบ -->
          <form class="gateway-login-form" @submit.prevent="handleLockLoginSubmit">
            <!-- ระบุชื่อผู้ดูแลระบบ / รหัสนิสิต -->
            <div class="gateway-form-field" style="margin-bottom: 0.85rem;">
              <label class="gateway-field-label">ชื่อผู้ดูแลระบบ / รหัสนิสิต (Operator ID):</label>
              <div class="gateway-input-box">
                <User class="gateway-key-icon" />
                <input
                  v-model="lockOperatorInput"
                  type="text"
                  class="gateway-input-control"
                  placeholder="เช่น นิสิต 67160058 หรือ แอดมิน..."
                  autocomplete="username"
                />
              </div>
            </div>

            <div class="gateway-form-field">
              <label class="gateway-field-label">กรุณากรอกรหัสผ่านเพื่อเข้าใช้งานระบบ:</label>
              <div class="gateway-input-box">
                <Key class="gateway-key-icon" />
                <input
                  ref="lockInputRef"
                  v-model="lockPasswordInput"
                  :type="lockPasswordVisible ? 'text' : 'password'"
                  class="gateway-input-control"
                  :class="{ 'has-error': !!lockPasswordError }"
                  placeholder="กรอกรหัสผ่านเพื่อเข้าสู่ระบบ..."
                  autocomplete="current-password"
                  autofocus
                />
                <button
                  type="button"
                  class="gateway-eye-toggle"
                  @click="lockPasswordVisible = !lockPasswordVisible"
                  tabindex="-1"
                >
                  <EyeOff v-if="lockPasswordVisible" class="tiny-icon" />
                  <Eye v-else class="tiny-icon" />
                </button>
              </div>

              <!-- ข้อความ Error หากรหัสผิด -->
              <div v-if="lockPasswordError" class="gateway-alert-error">
                <AlertCircle class="tiny-icon text-rose" />
                <span>{{ lockPasswordError }}</span>
              </div>
            </div>

            <button
              type="submit"
              class="gateway-submit-btn"
              :disabled="!lockPasswordInput.trim() || lockPasswordLoading"
            >
              <Lock class="tiny-icon" />
              <span v-if="lockPasswordLoading">กำลังตรวจสอบรหัสผ่าน...</span>
              <span v-else>เข้าสู่ระบบแดชบอร์ด</span>
            </button>
          </form>

          <!-- Footer ข้อความความปลอดภัย -->
          <div class="gateway-card-footer">
            <ShieldCheck class="tiny-icon text-green" />
            <span>ระบบรักษาความปลอดภัยระดับองค์กร (Zero-Trust Gateway Control Plane)</span>
          </div>
        </div>
      </div>

    <!-- ========================================================== -->
    <!-- DASHBOARD VIEWPORT (เข้าถึงได้เฉพาะเมื่อยืนยันตัวตนสำเร็จแล้ว) -->
    <!-- ========================================================== -->
    <template v-else>
      <!-- SEAMLESS LOADING SCREEN (สไตล์ Google Workspace / Gmail เนียนไปกับพื้นหลัง) -->
      <Transition name="fade-loading">
        <div v-if="isPageLoading" class="page-loading-backdrop">
          <div class="seamless-loader-center">
            <!-- โลโก้เหมือนหน้าเว็บ (ตราสัญลักษณ์ มหาวิทยาลัยบูรพา + CS BUU) -->
            <div class="loader-brand-website-wrap">
              <div class="loader-site-brand">
                <img
                  :src="isDarkMode ? buuLogoWhiteSvg : buuLogoSvg"
                  alt="ตราสัญลักษณ์ มหาวิทยาลัยบูรพา BUU"
                  class="seamless-buu-brand-img"
                />
                <div class="seamless-brand-v-divider"></div>
                <div class="seamless-brand-text-col">
                  <span class="seamless-brand-cs-buu">CS BUU</span>
                  <span class="seamless-brand-cs-sub">COMPUTER SCIENCE</span>
                </div>
              </div>
            </div>

            <!-- หลอดโหลดแนวนอนแบบสลิม (Slim Linear Progress Tube สไตล์ Gmail) -->
            <div class="seamless-tube-track">
              <div class="seamless-tube-fill" :style="{ width: `${loadingProgress}%` }">
                <div class="seamless-tube-shimmer"></div>
              </div>
            </div>

            <!-- ชื่อระบบ Dashboard ด้านล่างหลอดโหลด (เหมือนตำแหน่ง Google Workspace) -->
            <div class="seamless-system-title">
              <span class="system-title-bold">Dashboard</span>
              <span class="system-title-badge">Security Ops</span>
            </div>

            <!-- ข้อความสถานะการโหลดและเปอร์เซ็นต์แบบนุ่มนวล -->
            <div class="seamless-meta-status">
              <span class="seamless-step-msg">{{ loadingStepMessage }}</span>
              <span class="seamless-percent">({{ loadingProgress }}%)</span>
            </div>
          </div>

          <!-- ข้อความช่วยเหลือมุมขวาล่าง เลียนแบบหน้า Gmail 1:1 -->
          <div class="seamless-footer-help">
            ระบบจัดการและมอนิเตอร์ความปลอดภัยเว็บ CS BUU
          </div>
        </div>
      </Transition>

      <!-- 1. HEADER NAVY BAR ด้านบนสุด (ตรงตามสไตล์เว็บหลัก CS BUU 1:1) -->
      <header class="header-navy-bar">
        <div class="navy-bar-inner">
          <!-- ซ้าย: โลโก้ตรามหาวิทยาลัยบูรพา + CS BUU -->
          <RouterLink to="/" class="navy-brand-group" title="CS BUU Computer Science">
            <img
              :src="buuLogoWhiteSvg"
              alt="ตราสัญลักษณ์ มหาวิทยาลัยบูรพา BUU"
              class="buu-brand-img"
            />
            <div class="brand-v-divider"></div>
            <div class="navy-brand-text">
              <span class="brand-cs-buu">CS BUU</span>
              <span class="brand-cs-sub">COMPUTER SCIENCE</span>
            </div>
          </RouterLink>

          <!-- กลาง: เมนูนำทางตรงกลางแบบเว็บหลัก -->
          <nav class="main-site-nav">
            <!-- เมนู 1: แดชบอร์ด -->
            <RouterLink
              to="/"
              class="main-nav-link pill-tab"
              :class="{ active: route.path === '/' }"
            >
              <span>แดชบอร์ด</span>
              <span v-if="route.path === '/'" class="gold-active-bar"></span>
            </RouterLink>

            <!-- เมนู 2: จัดการ IP -->
            <RouterLink
              to="/unban"
              class="main-nav-link pill-tab"
              :class="{ active: route.path === '/unban' }"
            >
              <span>จัดการ IP</span>
              <span v-if="route.path === '/unban'" class="gold-active-bar"></span>
            </RouterLink>

            <!-- เมนู 3: ประวัติการแก้ไข (Audit Log - Read-Only) -->
            <RouterLink
              to="/logs"
              class="main-nav-link pill-tab"
              :class="{ active: route.path === '/logs' }"
            >
              <span>ประวัติการแก้ไข</span>
              <span v-if="route.path === '/logs'" class="gold-active-bar"></span>
            </RouterLink>
          </nav>

          <!-- ขวา: ปุ่มสลับโหมดสี (Dark/Light) + ปุ่มเพิ่ม IP สีน้ำเงินตามเว็บหลัก -->
          <div class="navy-right-actions">
            <button
              class="navy-theme-btn"
              @click="toggleTheme"
              :aria-label="isDarkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'"
              :title="isDarkMode ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด'"
            >
              <Sun v-if="isDarkMode" class="theme-icon text-amber" />
              <Moon v-else class="theme-icon" />
            </button>

            <button class="navy-blue-btn" @click.stop="isAddModalOpen = true" title="เพิ่มกฎหรือปลดแบน IP ด่วน">
              <Plus class="tiny-icon" />
              <span>เพิ่ม IP / กฎ</span>
            </button>

            <!-- ปุ่มออกจากระบบ (Lock Screen) -->
            <button
              v-if="securityStore.isAdminAuthenticated"
              class="navy-logout-btn"
              @click="handleLogout"
              title="ออกจากระบบ / ล็อกหน้าจอ"
            >
              <LogOut class="tiny-icon" />
              <span>ล็อกหน้าจอ</span>
            </button>
          </div>
        </div>
      </header>

      <!-- MAIN CONTAINER -->
      <div class="careops-container">
        <RouterView />
      </div>

      <!-- MODAL POPUP เพิ่ม IP / ปลดแบนด่วน (เข้าถึงได้จากทุกหน้า) -->
      <AddIpModal />
    </template>
  </div>
</template>
