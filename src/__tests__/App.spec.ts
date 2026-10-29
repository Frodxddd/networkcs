import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../App.vue'
import router from '../router'
import { useSecurityStore } from '../stores/security'

describe('SecDash Thai Security Operations Dashboard', () => {
  beforeEach(async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    useSecurityStore().setAdminToken('mock-admin-token')
    router.push('/')
    await router.isReady()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        total_requests: 30331,
        attack_events: 13018,
        status_counts: { '2xx': 24167, '3xx': 3012, '4xx': 2755, '429': 24, '5xx': 373 },
        by_category: { xmlrpc_abuse: 10836, vuln_scan: 1321, login_failed: 835 }
      })
    }))
  })

  const mountApp = () => mount(App, {
    global: {
      plugins: [router]
    }
  })

  it('renders Thai language, server status and only 2 main menus', async () => {
    const wrapper = mountApp()
    await flushPromises()
    expect(wrapper.text()).toContain('SecDash')
    expect(wrapper.text()).toContain('nenenainaemak.duckdns.org')
    expect(wrapper.text()).toContain('แดชบอร์ด')
    expect(wrapper.text()).toContain('จัดการ IP')
    expect(wrapper.text()).toContain('ปกป้องเว็บ CS BUU')

    // Profile must be removed
    expect(wrapper.find('.user-profile-pill').exists()).toBe(false)

    // Check menu count (3 main tabs: แดชบอร์ด, จัดการ IP, บันทึกประวัติ)
    const pillTabs = wrapper.findAll('.pill-tab')
    expect(pillTabs.length).toBe(3)
  })

  it('switches cleanly between dashboard and unban views', async () => {
    const wrapper = mountApp()
    await flushPromises()
    const pillTabs = wrapper.findAll('.pill-tab')

    // Switch to Unban tab
    await pillTabs[1]!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('ระบบจัดการการปลดแบน & กฎไฟร์วอลล์ IP')
    expect(wrapper.text()).toContain('IP ที่ถูกบล็อก (iptables DROP)')
    expect(wrapper.text()).toContain('IP ที่ได้รับอนุญาต (Whitelist)')

    // Switch back to Dashboard tab
    await pillTabs[0]!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('แดชบอร์ดความปลอดภัยเว็บ CS BUU')
  })

  it('allows selecting daily, monthly, and yearly periods with real data', async () => {
    const wrapper = mountApp()
    await flushPromises()
    const periodBtn = wrapper.find('.period-select-btn')
    expect(periodBtn.exists()).toBe(true)

    // Open dropdown
    await periodBtn.trigger('click')
    const items = wrapper.findAll('.dropdown-item')
    expect(items.length).toBe(3)

    // Select 'รายวัน' (daily)
    await items[0]!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('รายวัน')

    // Select 'รายเดือน' (monthly)
    await periodBtn.trigger('click')
    const itemsMonthly = wrapper.findAll('.dropdown-item')
    await itemsMonthly[1]!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('รายเดือน')
    expect(wrapper.text()).toContain('30,331')

    // Select 'รายปี' (yearly)
    await periodBtn.trigger('click')
    const itemsYearly = wrapper.findAll('.dropdown-item')
    await itemsYearly[2]!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('รายปี')
    expect(wrapper.text()).toContain('30,331')
  })

  it('supports interactive chart pointer hover and day selection', async () => {
    const wrapper = mountApp()
    await flushPromises()
    const dayLabels = wrapper.findAll('.day-lbl')
    expect(dayLabels.length).toBe(7)

    // Hover or click last point
    await dayLabels[6]!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('ป้องกันสำเร็จ')
  })

  it('toggles unban state when unban button is clicked', async () => {
    router.push('/unban')
    await router.isReady()
    const wrapper = mountApp()
    await flushPromises()
    const unbanButton = wrapper.find('.action-pill-btn.unban-btn')
    expect(unbanButton.exists()).toBe(true)
    await unbanButton.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('ปลดแบน IP')
  })

  it('sorts IP list from newest to oldest by default and supports sorting options', async () => {
    router.push('/unban')
    await router.isReady()
    const wrapper = mountApp()
    await flushPromises()

    // Header has 'วันเวลาล่าสุด' and default sort 'ใหม่ไปเก่า'
    expect(wrapper.text()).toContain('วันเวลาล่าสุด')
    expect(wrapper.text()).toContain('ใหม่ไปเก่า (ล่าสุด)')

    // First row in default sort (newest to oldest)
    const rows = wrapper.findAll('.ops-data-table tbody tr')
    expect(rows.length).toBeGreaterThan(0)
    const initialFirstRowIp = rows[0]!.find('.td-ip').text()

    // Click 'เก่าไปใหม่' sort button
    const sortPills = wrapper.findAll('.sort-pill')
    const oldestPill = sortPills.find(p => p.text().includes('เก่าไปใหม่'))
    expect(oldestPill).toBeDefined()
    await oldestPill!.trigger('click')
    await flushPromises()

    const reorderedRows = wrapper.findAll('.ops-data-table tbody tr')
    const reorderedFirstRowIp = reorderedRows[0]!.find('.td-ip').text()
    expect(reorderedFirstRowIp).not.toBe(initialFirstRowIp)
  })

  it('renders prominent enlarged donut chart and allows in-graph interactive inspection', async () => {
    router.push('/')
    await router.isReady()
    const wrapper = mountApp()
    await flushPromises()
    // Donut SVG exists with prominent size (230px)
    const donutSvg = wrapper.find('.prominent-donut-svg')
    expect(donutSvg.exists()).toBe(true)
    expect(donutSvg.attributes('width')).toBe('230')

    // Initial state: shows total requests in the center hub
    const centerHub = wrapper.find('.prominent-center-hub')
    expect(centerHub.exists()).toBe(true)
    expect(centerHub.text()).toContain('คำขอทั้งหมด')
    expect(centerHub.text()).toContain('30,331')

    // 2-column cards grid has 5 categories (2xx, 3xx, 4xx, 429, 5xx)
    const cards = wrapper.findAll('.http-card-tile')
    expect(cards.length).toBe(5)

    // Tap on the 4xx card or segment
    await cards[2]!.trigger('click')
    await flushPromises()
    expect(wrapper.find('.hub-status-badge').text()).toContain('4xx')
    expect(centerHub.text()).toContain('2,755')

    // Reset button returns back to total
    const resetBtn = wrapper.find('.hub-reset-btn')
    expect(resetBtn.exists()).toBe(true)
    await resetBtn.trigger('click')
    await flushPromises()
    expect(centerHub.text()).toContain('คำขอทั้งหมด')
    expect(centerHub.text()).toContain('30,331')
  })
})
