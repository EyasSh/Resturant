import { Meal } from "@/app/(Menu)/Menu"

export type ProtoOrder ={
    meal: Meal,
    quantity: number
}

export type Order =  {
    id?: string,
    tableNumber: number,
    orders: ProtoOrder[],
    total: number,
    isReady: boolean
}