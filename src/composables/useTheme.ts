import { ref } from 'vue'
import { useToast } from './useToast'

const isDarkMode = ref(false)

export function useTheme() {
  const { showToast } = useToast()

  const toggleTheme = () => {
    isDarkMode.value = !isDarkMode.value
    if (typeof document !== 'undefined') {
      if (isDarkMode.value) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    showToast(
      'info',
      isDarkMode.value ? 'เปิดใช้งานโหมดมืด (Dark Mode)' : 'เปิดใช้งานโหมดสว่าง (Light Mode)',
      isDarkMode.value ? 'เปลี่ยนเป็นธีมมืด สบายตาสำหรับการใช้งานกลางคืน' : 'เปลี่ยนเป็นธีมสว่าง คมชัด มองเห็นสัดส่วนชัดเจน'
    )
  }

  return {
    isDarkMode,
    toggleTheme
  }
}
