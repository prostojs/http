import { banner } from './banner'

export function panic(error: string) {
    console.error(__DYE_RED_BRIGHT__ + __DYE_BOLD__ + banner() + error + __DYE_RESET__)
    return new Error(error)
}
