import { ref } from 'vue'

export interface Toast {
  type: 'success' | 'error' | 'info'
  title: string
  detail?: string
}

const toast = ref<Toast | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  const showToast = (type: 'success' | 'error' | 'info', title: string, detail?: string) => {
    if (toastTimer) clearTimeout(toastTimer)
    toast.value = { type, title, detail }
    toastTimer = setTimeout(() => {
      toast.value = null
    }, 4000)
  }

  const clearToast = () => {
    if (toastTimer) clearTimeout(toastTimer)
    toast.value = null
  }

  return {
    toast,
    showToast,
    clearToast
  }
}
