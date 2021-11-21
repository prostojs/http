import { TProstoParamsType } from '@prostojs/router'
import { BaseHttpResponse } from './response'

export interface TProstoServerOptions {

}

export type TProstoHttpHandler<ResType = unknown, ParamsType = TProstoParamsType> = (params: ParamsType) 
    => Promise<ResType> | ResType | Error | Promise<Error> | BaseHttpResponse<ResType> | Promise<BaseHttpResponse<ResType>>
