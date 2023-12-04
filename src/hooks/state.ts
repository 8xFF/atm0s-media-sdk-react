import { useContext } from 'react';
import { SessionContext, SessionState } from '../components/provider';

export const useSessionState = (): SessionState => {
  const { data } = useContext(SessionContext);
  return data?.state || SessionState.New;
};
