import { setCurrentHttpContext } from '../../composables/core'
import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'
import { toGuard } from '../to-guard'
import { TProstoHttpHandler } from '../../types'
import { useAuthorization, useHeaders } from '../../composables'
import { ProstoHttpError } from '../../errors'

describe('decorators/to-guard', () => {
    const req = new IncomingMessage(new Socket({}))
    const res = new ServerResponse(req)

    beforeEach(() => {
        setCurrentHttpContext(req, res, {}, {})
    })

    const handler: TProstoHttpHandler = () => {
        return 'handled'
    }

    const guard = toGuard(() => {
        const { authRawCredentials } = useAuthorization()
        return authRawCredentials() === 'secret'
    }, () => {
        const headers = useHeaders()
        return headers['client-id'] === 'id1'
    })

    const guardedFn = guard(handler)

    it('must pass with secret', async () => {
        req.headers.authorization = 'Bearer secret'
        req.headers['client-id'] = 'id1'
        const result = await guardedFn()
        expect(result).toEqual('handled')
    })

    it('must reject with no secret', async () => {
        req.headers.authorization = 'Bearer secret2'
        req.headers['client-id'] = 'id1'
        const result = (await guardedFn()) as ProstoHttpError
        expect(result.body).toEqual({error: 'Unauthorized', message: '', 'statusCode': 401})
    })

    it('must reject with improper client-id', async () => {
        req.headers.authorization = 'Bearer secret'
        req.headers['client-id'] = 'id2'
        const result = (await guardedFn()) as ProstoHttpError
        expect(result.body).toEqual({error: 'Unauthorized', message: '', 'statusCode': 401})
    })
})
