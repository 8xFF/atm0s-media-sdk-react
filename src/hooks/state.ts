import { useContext } from 'react';
import { SessionContext, SessionState } from '../components/provider';
import { useReactionData } from './reaction';

export const useSessionState = (): SessionState => {
  const { data } = useContext(SessionContext);
  return useReactionData(data.state);
};
