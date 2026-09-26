
import router from "./router.js"

/**
 * Utility to send fetch requests with Bearer authentication.
 * 
 * @param {string} url — the resource or API path (relative to window.location.origin)
 * @param {object} options — optional fetch options; by default GET & auth:true
 * @returns {Promise<Response>|undefined}
 */
export const fetchWithAuth = async (url = '/', options = { auth: true }) => {
    const origin = window.location.origin

    const user = JSON.parse(localStorage.getItem('user'))
    const authToken = user?.token

    if (options.auth && !authToken) {
        console.error('Authentication token is missing.')
        router.push('/login')
        return
    }

    const fetchOptions = {
        method: options.method ?? 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { 'Authorization': 'Bearer ' + authToken } : {}),
            ...options.headers, 
        },
        ...(options.body ? { body: JSON.stringify(options.body) } : {}),
        ...options,
    }

    delete fetchOptions.auth

    try {
        const res = await fetch(`${origin}${url}`, fetchOptions)

        if (res.status === 401) {
            router.push('/login')
            return
        }

        if (res.status === 403 || res.status === 405) {
            router.push('/login')
            return
        }

        return res
    } catch (error) {
        console.error('Fetch error:', error)
        throw error
    }
}
