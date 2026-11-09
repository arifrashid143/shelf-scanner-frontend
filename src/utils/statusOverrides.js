/**
 * Utility to manage and persist is_active status overrides in localStorage.
 * Used to keep state consistent across refreshes for mock or transient backends.
 */
export function createStatusOverrideHelper(storageKey) {
  const getOverrides = () => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  const setOverride = (id, isActive) => {
    try {
      const overrides = getOverrides()
      overrides[String(id)] = Boolean(isActive)
      localStorage.setItem(storageKey, JSON.stringify(overrides))
    } catch (e) {
      console.warn(`Could not save status override for ${storageKey}:`, e)
    }
  }

  const applyStatus = (item) => {
    if (!item) return item
    const overrides = getOverrides()
    const overrideVal = overrides[String(item.id)]
    if (overrideVal !== undefined) {
      return { ...item, is_active: overrideVal }
    }

    let active = true
    if (
      item.is_active === false ||
      item.is_active === 'false' ||
      item.is_active === 0 ||
      item.is_active === '0'
    ) {
      active = false
    } else if (
      item.status &&
      ['inactive', 'suspended', 'deactivated', 'disabled'].includes(
        String(item.status).toLowerCase()
      )
    ) {
      active = false
    }
    return { ...item, is_active: active }
  }

  return { getOverrides, setOverride, applyStatus }
}
