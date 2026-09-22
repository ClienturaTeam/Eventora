import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/platform-admin/approved-proposals')({
  component: RedirectToApprovedComponent,
});

function RedirectToApprovedComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: '/manager/all-proposals', search: { status: 'APPROVED' }, replace: true });
  }, [navigate]);

  return (
    <div className="p-6 text-sm text-muted-foreground">
      Redirecting to Approved Proposals...
    </div>
  );
}
