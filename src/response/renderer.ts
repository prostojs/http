import { BaseHttpResponse } from './core'
import { contentTypes } from '../content-types'
import { panic } from '../utils/panic'

export class BaseHttpResponseRenderer<T = unknown> implements THttpResponseRenderer<T> {
    render(response: BaseHttpResponse<T>): string {
        if (typeof response.body === 'string' || typeof response.body === 'boolean' || typeof response.body === 'number') {
            if (!response.getContentType()) response.setContentType(contentTypes.text.plain)
            return response.body.toString()
        }
        if (typeof response.body === 'undefined') {
            return ''
        }
        if (typeof response.body === 'object') {
            if (!response.getContentType()) response.setContentType(contentTypes.application.json)
            return JSON.stringify(response.body)
        }
        throw panic('Unsupported body format ' + typeof response.body)
    }    
}

export interface THttpResponseRenderer<T = unknown> {
    render: (response: BaseHttpResponse<T>) => string
}
