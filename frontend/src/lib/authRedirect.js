export function getPostAuthPath(user) {
  if (!user?.role) return '/onboarding/role'
  if (user.role === 'buyer') return '/buyer'
  if (user.role === 'seller') return '/seller'
  return '/onboarding/role'
}

export function getSuperadminPath() {
  return '/superadmin'
}
