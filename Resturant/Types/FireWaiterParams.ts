/**
 * The parameters required to fire a waiter.
 * The waiter is fired by their Id. However, if the waiter is working the firing fails
 * The name is only used to display waiter's names in the remove box and the alert
 */
export type FireWaiterParams = {
    id: string, 
    name: string,
}