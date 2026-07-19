import { useQuery } from '@tanstack/react-query';
import { FirestoreService } from '../services/firestore';

export function usePlatformSettings() {
  return useQuery({
    queryKey: ['platformSettings'],
    queryFn: () => FirestoreService.getPlatformSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });
}
