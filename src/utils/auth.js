import { SYSTEM_AUTH_EMAIL_DOMAIN } from '@/constants/auth'

export function normalizeUsername(username) {
  return username.trim().toLowerCase()
}

export function usernameToEmail(username) {
  return `${normalizeUsername(username)}@${SYSTEM_AUTH_EMAIL_DOMAIN}`
}