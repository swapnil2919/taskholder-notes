const toggle      = document.getElementById('toggle')
const dot         = document.getElementById('dot')
const card        = document.getElementById('card')
const statusLabel = document.getElementById('statusLabel')
const statusDesc  = document.getElementById('statusDesc')
const ruleInfo    = document.getElementById('ruleInfo')

const RULE = {
  id: 1,
  priority: 1,
  action: {
    type: 'modifyHeaders',
    responseHeaders: [
      { header: 'x-frame-options',    operation: 'remove' },
      { header: 'content-security-policy', operation: 'remove' },
    ],
  },
  condition: { resourceTypes: ['sub_frame'] },
}

function applyUI(enabled) {
  toggle.checked = enabled
  if (enabled) {
    dot.className        = 'dot'
    card.className       = 'status-card on'
    statusLabel.textContent = 'Active'
    statusDesc.textContent  = 'All sites can load in iframe'
  } else {
    dot.className        = 'dot off'
    card.className       = 'status-card off'
    statusLabel.textContent = 'Disabled'
    statusDesc.textContent  = 'Iframe blocking is restored'
  }
}

// Show how many dynamic rules are registered (diagnostic)
async function updateRuleCount() {
  try {
    const rules = await chrome.declarativeNetRequest.getDynamicRules()
    if (ruleInfo) ruleInfo.textContent = `${rules.length} rule${rules.length !== 1 ? 's' : ''} active`
  } catch {}
}

// Load saved state and show rule count
chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  applyUI(enabled)
  updateRuleCount()
})

// Toggle handler — uses updateDynamicRules (NOT updateEnabledRulesets)
toggle.addEventListener('change', async () => {
  const enabled = toggle.checked
  chrome.storage.sync.set({ enabled })
  applyUI(enabled)

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE.id],
      addRules: enabled ? [RULE] : [],
    })
    updateRuleCount()
  } catch (e) {
    console.error('[TaskHolder] toggle failed:', e)
  }
})
