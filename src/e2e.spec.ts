import { useCookies, useRequest, useSetCookies } from './composables'
import { ProstoHttpServer } from './server'
import http, { IncomingMessage } from 'http'

const PORT = 3043

const cookie = [
    'test-cookie=test-value',
]

const get = (path: string): Promise<IncomingMessage> => {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:' + PORT.toString() + '/' + path, { headers: { cookie } }, (res) => {
            if ((res.statusCode || 0) > 299) {
                reject(res)
            } else {
                resolve(res)
            }
        })
    })
}

async function getBody(path: string): Promise<string> {
    const req = await get(path)
    let body = Buffer.from('')
    return await (new Promise((resolve, reject) => {
        req.on('data', function(chunk) {
            body = Buffer.concat([body, chunk])
        })
        req.on('error', function(err) {
            reject(err)
        })
        req.on('end', function() {
            resolve(body.toString())
        })
    }))
}

describe('prosto/http E2E', () => {
    const app = new ProstoHttpServer()

    beforeAll(async () => {
        await app.listen(PORT)
    })

    app.get('/json', () => {
        return { a: 'a', b: [1, 2, 3] }
    })
    
    app.get('/set-cookie', () => {
        const { setCookie } = useSetCookies()
        setCookie('my-cookie', 'test', { maxAge: '1d' })
        return 'ok'
    })
    
    app.get('/parse-cookie', () => {
        const { getCookie } = useCookies()
        return getCookie('test-cookie')
    })

    it('must reply in json', async () => {
        expect((await getBody('json'))).toEqual('{"a":"a","b":[1,2,3]}')
    })

    it('must set cookie in response', async () => {
        expect((await get('set-cookie')).headers?.['set-cookie']).toEqual(['my-cookie=test; Max-Age=86400'])
    })

    it('must parse cookie', async () => {
        expect((await getBody('parse-cookie'))).toEqual('test-value')
    })

    afterAll(async () => {
        await app.close()
    })
})
