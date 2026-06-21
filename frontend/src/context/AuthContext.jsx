import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  getCurrentUser,
  logout as logoutRequest,
  updateProfile as updateProfileRequest,
  updateRole as updateRoleRequest,
} from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const data = await getCurrentUser()
      const nextUser = data?.user ?? null
      setUser(nextUser)
      return nextUser
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const data = await updateProfileRequest(payload)
    setUser(data.user)
    return data.user
  }, [])

  const setRole = useCallback(async (role) => {
    const data = await updateRoleRequest(role)
    setUser(data.user)
    return data.user
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      refreshUser,
      logout,
      updateProfile,
      setRole,
    }),
    [user, loading, refreshUser, logout, updateProfile, setRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
