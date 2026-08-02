export function needsProfile(user) {
  return !user?.name?.trim()
}

export function needsRole(user) {
  return !user?.role
}

export function getPostAuthPath(user) {
  if (needsProfile(user)) return '/onboarding/profile'
  if (needsRole(user)) return '/onboarding/role'
  if (user.role === 'buyer') return '/buyer'
  if (user.role === 'seller') return '/seller'
  return '/onboarding/role'
}

export function getSuperadminPath() {
  return '/superadmin'
}
