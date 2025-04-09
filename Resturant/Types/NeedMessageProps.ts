
export type NeedMessageProps = {
    message: string,
    handleClick? : () => void,
}
export type SelectedNeedMessages = {
    messages?:string[],
    tableNumber?: number | undefined,
}