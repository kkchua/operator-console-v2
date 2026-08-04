import { createContext, useContext, useState, type ReactNode } from 'react';

interface WorkerContextValue {
  selectedWorkerId: string | null;
  setSelectedWorkerId: (id: string | null) => void;
}

const WorkerContext = createContext<WorkerContextValue>({
  selectedWorkerId: null,
  setSelectedWorkerId: () => {},
});

export function WorkerProvider({ children }: { children: ReactNode }) {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  return (
    <WorkerContext.Provider value={{ selectedWorkerId, setSelectedWorkerId }}>
      {children}
    </WorkerContext.Provider>
  );
}

export function useSelectedWorker() {
  return useContext(WorkerContext);
}
