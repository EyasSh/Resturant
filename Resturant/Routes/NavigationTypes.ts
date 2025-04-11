import { ChatProps } from '@/Types/ChatProps';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Order } from '@/Types/Order';
/**
 * This is the type definition for the navigation prop used in the app.
 * It defines the screens that can be navigated to.
 * It also defines the parameters (props) that can be passed to each screen.
 */
export type RootStackParamList = {
    "Login": undefined;
    "Tabs": undefined;
    "Terminals": undefined;
    "Waiter": undefined;
    "Owner": undefined;
    "WaiterLogin": undefined;
    "OwnerLogin": undefined;
    "WaiterSignup": undefined;
    "OwnerSignup": undefined;
    "AddMealForm": undefined;
    "AddTableForm": undefined;
    "RemoveTable": undefined;
    "RemoveMeal": undefined;
    "FireStaff": undefined;
    "Menu": undefined
    "Signup": undefined;
    "UserNeeds": {tableNumber: number, hub:signalR.HubConnection|null} | undefined;
    "OrderPeak": undefined;
    "AddQuickMessage": undefined;
}
/**
 * This is the type definition for the navigation prop used in the app.
 * It defines the screens that can be navigated to using the `useNavigation` hook in `react-navigation/native`.
 */
export type NavigationProp = StackNavigationProp<RootStackParamList>;