'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useSSE() {
  const queryClient = useQueryClient();
  const ref = useRef<EventSource | null>(null);

  useEffect(() => {
    const source = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/events`);
    ref.current = source;

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['checks'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
    };

    source.addEventListener('check', invalidate);
    source.addEventListener('alert', invalidate);

    return () => source.close();
  }, [queryClient]);

  return ref;
}
