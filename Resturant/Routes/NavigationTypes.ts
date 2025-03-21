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
    "Menu": undefined
    "Signup": undefined;
}
// Define type for navigation prop
export type NavigationProp = StackNavigationProp<RootStackParamList>;