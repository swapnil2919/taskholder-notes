// Single rule: strip X-Frame-Options and CSP from every iframe response
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
  condition: {
    resourceTypes: ['sub_frame'],
  },
}

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE.id],
      addRules: [RULE],
    })
    console.log('[TaskHolder] iframe unblock rule registered ✓')
  } catch (e) {
    console.error('[TaskHolder] failed to register rule:', e)
  }
  chrome.storage.sync.set({ enabled: true })
})

// Re-register (or remove) the rule whenever the popup toggles it
chrome.storage.onChanged.addListener(async (changes) => {
  if (!('enabled' in changes)) return
  const enabled = changes.enabled.newValue
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [RULE.id],
      addRules: enabled ? [RULE] : [],
    })
  } catch (e) {
    console.error('[TaskHolder] toggle rule update failed:', e)
  }
})
