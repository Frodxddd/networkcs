<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  X
} from 'lucide-vue-next'

const route = useRoute()
const securityStore = useSecurityStore()
const { threatRows, isAddModalOpen } = storeToRefs(securityStore)
const { isDarkMode, toggleTheme } = useTheme()
const { toast } = useToast()

// Seamless Loading Screen
const isPageLoading = ref(true)
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

onMounted(() => {
  runLoadingAnimation(
    'กำลังโหลดข้อมูลความปลอดภัย',
    'กรุณารอสักครู่ ระบบกำลังดึงข้อมูลล่าสุดจากเซิร์ฟเวอร์',
    650
  )
})
</script>

<template>
  <div class="careops-app" :class="{ 'dark-mode': isDarkMode }">
    <!-- ========================================================== -->
    <!-- SEAMLESS LOADING SCREEN (สไตล์ Google Workspace / Gmail เนียนไปกับพื้นหลัง) -->
    <!-- ========================================================== -->
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

    <!-- FLOATING TOAST แจ้งเตือนสถานะ -->
    <div v-if="toast" class="toast-card" :class="toast.type">
      <CheckCircle2 v-if="toast.type === 'success'" class="toast-icon text-green" />
      <AlertCircle v-else class="toast-icon text-rose" />
      <div class="toast-body">
        <div class="toast-title">{{ toast.title }}</div>
        <div v-if="toast.detail" class="toast-detail">{{ toast.detail }}</div>
      </div>
      <button class="toast-close" @click="toast = null" aria-label="ปิดการแจ้งเตือน">
        <X class="tiny-icon" />
      </button>
    </div>

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
            <span class="nav-count-badge">{{ threatRows.filter(r => !r.isUnbanned).length }}</span>
            <span v-if="route.path === '/unban'" class="gold-active-bar"></span>
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
        </div>
      </div>
    </header>

    <!-- MAIN CONTAINER -->
    <div class="careops-container">
      <RouterView />
    </div>

    <!-- MODAL POPUP เพิ่ม IP / ปลดแบนด่วน (เข้าถึงได้จากทุกหน้า) -->
    <AddIpModal />
  </div>
</template>
