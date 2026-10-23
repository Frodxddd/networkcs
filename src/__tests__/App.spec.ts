import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../App.vue'

describe('SecDash Thai Security Operations Dashboard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        total_requests: 27902,
        attack_events: 12996,
        by_category: { xmlrpc_abuse: 10833, vuln_scan: 1317, login_failed: 822 }
      })
    }))
  })

  it('renders Thai language, server status and only 2 main menus', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('SecDash')
    expect(wrapper.text()).toContain('nenenainaemak.duckdns.org')
    expect(wrapper.text()).toContain('แดชบอร์ด')
    expect(wrapper.text()).toContain('จัดการ IP')
    expect(wrapper.text()).toContain('ปกป้องเว็บ CS BUU')

    // Profile must be removed
    expect(wrapper.find('.user-profile-pill').exists()).toBe(false)

    // Check menu count (only 2 main tabs)
    const pillTabs = wrapper.findAll('.pill-tab')
    expect(pillTabs.length).toBe(2)
  })

  it('switches cleanly between dashboard and unban views', async () => {
    const wrapper = mount(App)
    const pillTabs = wrapper.findAll('.pill-tab')

    // Switch to Unban tab
    await pillTabs[1]!.trigger('click')
    expect(wrapper.text()).toContain('ระบบจัดการการปลดแบน & กฎไฟร์วอลล์ IP')
    expect(wrapper.text()).toContain('IP ที่ถูกบล็อก (iptables DROP)')
    expect(wrapper.text()).toContain('IP ที่ได้รับอนุญาต (Whitelist)')

    // Switch back to Dashboard tab
    await pillTabs[0]!.trigger('click')
    expect(wrapper.text()).toContain('แดชบอร์ดความปลอดภัยเว็บ CS BUU')
  })

  it('allows selecting daily, monthly, and yearly periods', async () => {
    const wrapper = mount(App)
    const periodBtn = wrapper.find('.period-select-btn')
    expect(periodBtn.exists()).toBe(true)

    // Open dropdown
    await periodBtn.trigger('click')
    const items = wrapper.findAll('.dropdown-item')
    expect(items.length).toBe(3)

    // Select 'รายวัน' (daily)
    await items[0]!.trigger('click')
    expect(wrapper.text()).toContain('รายวัน')
    expect(wrapper.text()).toContain('2,319')

    // Select 'รายปี' (yearly)
    await periodBtn.trigger('click')
    const itemsYearly = wrapper.findAll('.dropdown-item')
    await itemsYearly[2]!.trigger('click')
    expect(wrapper.text()).toContain('รายปี')
    expect(wrapper.text()).toContain('142')
  })

  it('supports interactive chart pointer hover and day selection', async () => {
    const wrapper = mount(App)
    const dayLabels = wrapper.findAll('.day-lbl')
    expect(dayLabels.length).toBe(7)

    // Hover or click Sunday point
    await dayLabels[6]!.trigger('click')
    expect(wrapper.text()).toContain('ป้องกันสำเร็จ')
  })

  it('toggles unban state when unban button is clicked', async () => {
    const wrapper = mount(App)
    const pillTabs = wrapper.findAll('.pill-tab')
    await pillTabs[1]!.trigger('click')
    const unbanButton = wrapper.find('.action-pill-btn.unban-btn')
    expect(unbanButton.exists()).toBe(true)
    await unbanButton.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('ปลดแบน IP')
  })

  it('renders prominent enlarged donut chart and allows in-graph interactive inspection', async () => {
    const wrapper = mount(App)
    // Donut SVG exists with prominent size (230px)
    const donutSvg = wrapper.find('.prominent-donut-svg')
    expect(donutSvg.exists()).toBe(true)
    expect(donutSvg.attributes('width')).toBe('230')

    // Initial state: shows total requests in the center hub
    const centerHub = wrapper.find('.prominent-center-hub')
    expect(centerHub.exists()).toBe(true)
    expect(centerHub.text()).toContain('คำขอทั้งหมด')
    expect(centerHub.text()).toContain('27,902')

    // 2-column cards grid has 5 categories (2xx, 3xx, 4xx, 429, 5xx)
    const cards = wrapper.findAll('.http-card-tile')
    expect(cards.length).toBe(5)

    // Tap on the 4xx card or segment
    await cards[2]!.trigger('click')
    expect(wrapper.find('.hub-status-badge').text()).toContain('4xx')
    expect(centerHub.text()).toContain('2,120')
    expect(centerHub.text()).toContain('7.6% ของทราฟฟิก')

    // Reset button returns back to total
    const resetBtn = wrapper.find('.hub-reset-btn')
    expect(resetBtn.exists()).toBe(true)
    await resetBtn.trigger('click')
    expect(centerHub.text()).toContain('คำขอทั้งหมด')
    expect(centerHub.text()).toContain('27,902')
  })
})
