import { useResponse } from '..'
import { HttpErrorRenderer } from '../errors/error-renderer'
import { ProstoHttpError } from '../errors/http-error'
import { TProstoHttpErrorBodyExt } from '../errors/http-error'
import { BaseHttpResponse } from './core'

export function createResponseFrom<T = unknown>(data: T): BaseHttpResponse<T | TProstoHttpErrorBodyExt> | null {
    const { hasResponded } = useResponse()
    if (hasResponded()) return null
    if (data instanceof Error) {
        const r = new BaseHttpResponse<TProstoHttpErrorBodyExt>(new HttpErrorRenderer())
        let httpError: ProstoHttpError
        if (data instanceof ProstoHttpError) {
            httpError = data
        } else {
            httpError = new ProstoHttpError(500, data.message)
        }
        r.setBody(httpError.body)
        return r
    } else if (data instanceof BaseHttpResponse) {
        return data as BaseHttpResponse<T>
    } else {
        return new BaseHttpResponse<T>().setBody(data)
    }
}
