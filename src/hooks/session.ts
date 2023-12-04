import { useContext } from 'react';
import { SessionContext } from '../components/provider';
import Atm0s from '@8xff/atm0s-media-js';

export const useSession = (): Atm0s.Session | undefined => {
  const { data } = useContext(SessionContext);
  return data?.session;
};
