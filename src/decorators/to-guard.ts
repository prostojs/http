import { restoreCurrentHttpContex, useCurrentHttpContext } from '../composables/core'
import { ProstoHttpError } from '../errors'
import { createResponseFrom } from '../response'
import { TProstoHttpHandler } from '../types'

export type TGuardFunction = () => boolean | Promise<boolean>
export type TGuardDecoratedFunction = (handler: TProstoHttpHandler) => TProstoHttpHandler

export function toGuard(...guardFns: TGuardFunction[]): TGuardDecoratedFunction {
    const guardDecorator = (handler: TProstoHttpHandler) => {
        const newHandler = async () => {
            const currentContext = useCurrentHttpContext()
            try {
                for (const guardFn of guardFns) {
                    const authorized = await guardFn()
                    restoreCurrentHttpContex(currentContext)
                    if (!authorized) {
                        return createResponseFrom(new ProstoHttpError(401))
                    }
                }
            } catch(e) {
                return createResponseFrom(e)
            }
            restoreCurrentHttpContex(currentContext)
            return await handler()
        }
        return newHandler
    }
    return guardDecorator
}
