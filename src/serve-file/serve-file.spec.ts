import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'
import { setCurrentHttpContext } from '../composables/core'
import { ServeFile } from './serve-file'

describe('serve-file', () => {
    const req = new IncomingMessage(new Socket({}))
    const res = new ServerResponse(req)

    beforeEach(() => {
        setCurrentHttpContext(req, res, {}, {})
    })
    it('', async () => {
        const r = new ServeFile('package.json')
        expect(await r.respond()).toBeUndefined()
    })
})
