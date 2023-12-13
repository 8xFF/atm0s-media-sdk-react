import { useContext } from 'react';
import { SessionContext } from '../components/provider';
import type { Session } from '@8xff/atm0s-media-js';

export const useSession = (): Session | undefined => {
  const { data } = useContext(SessionContext);
  return data?.session;
};
