import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'
import { setCurrentHttpContext } from '../composables/core'
import { serveFile } from './serve-file'

describe('serve-file', () => {
    const req = new IncomingMessage(new Socket({}))
    const res = new ServerResponse(req)

    beforeEach(() => {
        setCurrentHttpContext(req, res, {}, {})
    })
    it('', () => {
        const r = serveFile('package.json')
        // expect(await r.respond()).toBeUndefined()
    })
})
