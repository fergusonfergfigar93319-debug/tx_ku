import type { Profile } from '@/types/profile'

/** 与 Android `parseAnswersToProfile` 所需字段一致，用于路由守卫 */
export function isProfileComplete(p: Profile | null | undefined): boolean {
  if (!p) return false
  return Boolean(
    p.nickname &&
      p.rank &&
      Array.isArray(p.activeTime) &&
      p.activeTime.length > 0 &&
      Array.isArray(p.mainRoles) &&
      p.mainRoles.length > 0 &&
      Array.isArray(p.preferredGames) &&
      p.preferredGames.length > 0 &&
      p.playStyle &&
      p.target &&
      p.voicePref
  )
}
