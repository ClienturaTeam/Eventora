import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/manager/proposals')({
  component: RedirectToAllProposalsComponent,
});

function RedirectToAllProposalsComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: '/manager/all-proposals', replace: true });
  }, [navigate]);

  return (
    <div className="p-6 text-sm text-muted-foreground">
      Redirecting to All Proposals...
    </div>
  );
}
