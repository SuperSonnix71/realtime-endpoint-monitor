'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Endpoint } from '@/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EndpointForm, type EndpointInput } from './endpoint-form';

export function EndpointDialog({
  endpoint,
  triggerLabel,
  triggerIcon,
  triggerVariant,
  triggerSize,
}: {
  endpoint?: Endpoint;
  triggerLabel?: string;
  triggerIcon?: React.ReactNode;
  triggerVariant?: 'default' | 'outline' | 'ghost' | 'danger';
  triggerSize?: 'default' | 'sm' | 'icon';
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(() => (endpoint ? 'Edit Endpoint' : 'Create Endpoint'), [endpoint]);

  const submit = async (input: EndpointInput) => {
    setSubmitting(true);
    setError(null);
    try {
      if (endpoint) await api.endpoints.update(endpoint.id, input);
      else await api.endpoints.create(input);
      await queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant ?? (endpoint ? 'outline' : 'default')}
          size={triggerSize}
          aria-label={triggerIcon ? (triggerLabel ?? title) : undefined}
          title={triggerIcon ? (triggerLabel ?? title) : undefined}
        >
          {triggerIcon ?? triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <EndpointForm
          endpoint={endpoint}
          submitting={submitting}
          onCancel={() => setOpen(false)}
          onSubmit={submit}
        />
      </DialogContent>
    </Dialog>
  );
}
