const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://judimensucat.runasp.net'
const NORMALIZED_API_BASE_URL = API_BASE_URL.startsWith('http://judimensucat.runasp.net')
  ? API_BASE_URL.replace('http://', 'https://')
  : API_BASE_URL

const buildApiUrl = (url) =>
  url.startsWith('http://') || url.startsWith('https://') ? url : `${NORMALIZED_API_BASE_URL}${url}`

export const requestApi = async ({ url, options = {}, token, withLoading }) => {
  return withLoading(async () => {
    const headers = {
      ...(options.headers || {}),
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(buildApiUrl(url), {
      ...options,
      headers,
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.isSuccess) {
      throw new Error(payload?.message || 'فشل تنفيذ الطلب.')
    }

    return payload
  })
}

export const loginRequest = async ({ userName, password, withLoading }) => {
  return withLoading(async () => {
    const response = await fetch(buildApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userName,
        password,
      }),
    })

    const result = await response.json()

    if (!response.ok || !result?.isSuccess || !result?.data?.token) {
      throw new Error(result?.message || 'فشل تسجيل الدخول، تحقق من البيانات.')
    }

    return result
  })
}
