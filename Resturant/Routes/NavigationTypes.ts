import { ChatProps } from '@/Types/ChatProps';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
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
    "Menu": undefined | {
        isOccupied: boolean
        setter: React.Dispatch<React.SetStateAction<boolean>>
        waiterid: string
        userid: string
    };
    "Chat": undefined | ChatProps;
    "Signup": undefined;
}
// Define type for navigation prop
export type NavigationProp = StackNavigationProp<RootStackParamList>;