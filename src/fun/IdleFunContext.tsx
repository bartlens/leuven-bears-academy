import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type IdleFunContextValue = {
  /** Roster cards should show laugh face / fun */
  rosterLaughing: boolean
  setRosterLaughing: (v: boolean) => void
}

const IdleFunContext = createContext<IdleFunContextValue | null>(null)

export function IdleFunProvider({ children }: { children: ReactNode }) {
  const [rosterLaughing, setRosterLaughing] = useState(false)
  const value = useMemo(
    () => ({ rosterLaughing, setRosterLaughing }),
    [rosterLaughing],
  )
  return (
    <IdleFunContext.Provider value={value}>{children}</IdleFunContext.Provider>
  )
}

export function useIdleFun() {
  const ctx = useContext(IdleFunContext)
  if (!ctx) {
    return {
      rosterLaughing: false,
      setRosterLaughing: (_v: boolean) => {},
    }
  }
  return ctx
}

export function useRosterLaughing() {
  return useIdleFun().rosterLaughing
}
