export function panic(error: string) {
    console.error(__DYE_RED_BRIGHT__ + __DYE_BOLD__ + error + __DYE_RESET__)
    return new Error(error)
}
