import { type AuthResult, getMyAccount, refreshToken } from './api/auth'
import { applyAuth } from './applyAuth'
import { setClientCookie, withCookie } from './client'
import { extractError } from './error'

async function getMyAccountWithRefresh() {
  try {
    const me = await getMyAccount()
    return {
      me,
      headers: null,
    }
  } catch (e) {
    const error = extractError(e)
    if (error.name === 'Unauthorized' && error.payload?.isExpiredToken) {
      try {
        const { tokens, headers } = await refreshToken()
        setClientCookie(`access_token=${tokens.accessToken}`)
        const me = await getMyAccount()
        return {
          me,
          headers,
          accessToken: tokens.accessToken,
        }
      } catch (innerError) {
        throw e
      }
    }
    throw e
  }
}

const promiseMap = new Map<
  Request,
  Promise<{
    me: AuthResult
    headers: Headers | null
    accessToken?: string
  }>
>()

export async function getMemoMyAccount(request: Request) {
  let promise = promiseMap.get(request)
  if (!promise) {
    promise = getMyAccountWithRefresh()
    promiseMap.set(request, promise)
  }
  return promise.finally(() => promiseMap.delete(request))
}

export const checkIsLoggedIn = async (request: Request) => {
  const applied = applyAuth(request)
  if (!applied) return false
  try {
    await withCookie(() => getMemoMyAccount(request), request, true)
  } catch (e) {
    return false
  }

  return true
}
