import type { RoomStats } from '@8xff/atm0s-media-js';
import { SessionContext } from '../components';
import { useReactionData } from './reaction';
import { useContext } from 'react';

export const useRoomStats = (): RoomStats => {
  const { data } = useContext(SessionContext);
  return useReactionData(data.roomStats);
};
