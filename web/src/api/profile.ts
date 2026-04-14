import { http, unwrap } from './http'
import type { Profile, ProfileMeResponse } from '@/types/profile'

export function getProfileMe() {
  return unwrap(http.get<ProfileMeResponse>('/profiles/me'))
}

export function putProfileMe(profile: Partial<Profile>) {
  return unwrap(http.put<ProfileMeResponse>('/profiles/me', profile))
}

export function createProfile(profile: Partial<Profile>) {
  return unwrap(http.post<ProfileMeResponse>('/profiles', profile))
}
