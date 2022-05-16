import { setCurrentHttpContext } from '../core'
import { useSearchParams } from '../search-params'
import { IncomingMessage, ServerResponse } from 'http'
import { Socket } from 'net'

describe('compasble/search-params', () => {
    const req = new IncomingMessage(new Socket({}))
    req.url='test.com/path?a[]=1&a[]=2&b=3&c=4&encoded=%7e%20%25'
    const res = new ServerResponse(req)

    beforeEach(() => {
        setCurrentHttpContext(req, res, {}, {})
    })

    it('must parse search params', () => {
        const { jsonSearchParams } = useSearchParams()
        expect(jsonSearchParams()).toEqual({
            'a[]': ['1', '2'],
            b: '3',
            c: '4',
            encoded: '~ %',
        })
    })
})
