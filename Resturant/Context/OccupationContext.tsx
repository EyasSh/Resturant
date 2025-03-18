import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the context type
interface OccupationContextType {
  occupationStates: { [tableNumber: number]: boolean };
  setOccupationState: (tableNumber: number, value: boolean) => void;
  setInitialOccupationStates: (tables: number[]) => void; // Function to initialize state
}

// Create the context
const OccupationContext = createContext<OccupationContextType | undefined>(undefined);

// Provider component
export const OccupationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [occupationStates, setOccupationStates] = useState<{ [tableNumber: number]: boolean }>({});

  // Function to update a specific table's occupation state
  const setOccupationState = (tableNumber: number, value: boolean) => {
    setOccupationStates((prev) => ({
      ...prev,
      [tableNumber]: value,
    }));
  };

  // Function to initialize occupation states when fetching tables
  const setInitialOccupationStates = (tables: number[]) => {
    const initialStates = tables.reduce((acc, tableNumber) => {
      acc[tableNumber] = false; // Default all tables to not occupied
      return acc;
    }, {} as { [tableNumber: number]: boolean });

    setOccupationStates(initialStates);
  };

  return (
    <OccupationContext.Provider value={{ occupationStates, setOccupationState, setInitialOccupationStates }}>
      {children}
    </OccupationContext.Provider>
  );
};

// Custom hook to use the context
export const useOccupation = (): OccupationContextType => {
  const context = useContext(OccupationContext);
  if (!context) {
    throw new Error('useOccupation must be used within an OccupationProvider');
  }
  return context;
};
