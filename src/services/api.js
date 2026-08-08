export const requestApi = async ({ url, options = {}, token, withLoading }) => {
  return withLoading(async () => {
    const headers = {
      ...(options.headers || {}),
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(url, {
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
    const response = await fetch('/api/auth/login', {
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
