import { useHeaders } from './headers'
import { useCacheObject } from './core'

type TAuthCache = {
    type: string | null
    credentials: string | null
    basicCredentials: { username: string, password: string } | null
}

export function useAuthorization() {
    const { authorization } = useHeaders()
    const cache = useCacheObject<TAuthCache>('authorization')
    const authType = () => {
        if (authorization) {
            if (typeof cache.type === 'undefined') {
                const space = authorization.indexOf(' ')
                cache.type = authorization.slice(0, space)
            }
            return cache.type
        }
        return null
    }
    const authRawCredentials = () => {
        if (authorization) {
            if (typeof cache.credentials === 'undefined') {
                const space = authorization.indexOf(' ')
                cache.credentials = authorization.slice(space + 1)
            }
            return cache.credentials
        }
        return null
    }
    return {
        authorization,
        authType,
        authRawCredentials,
        isBasic: () => authType()?.toLocaleLowerCase() === 'basic',
        isBearer: () => authType()?.toLocaleLowerCase() === 'bearer',
        basicCredentials: () => {
            if (authorization) {
                if (typeof cache.basicCredentials === 'undefined') {
                    const type = authType()
                    if (type?.toLocaleLowerCase() === 'basic') {
                        const creds =Buffer.from(authRawCredentials() || '', 'base64').toString('ascii')
                        const [username, password] = creds.split(':')
                        cache.basicCredentials = { username, password }
                    }
                }
                return cache.basicCredentials
            }
            return null
        },
    }
}
