import { createFileRoute } from '@tanstack/react-router';
import { AllProposalsComponent } from './manager.all-proposals';

export const Route = createFileRoute('/platform-admin/all-proposals')({
  component: AllProposalsComponent,
});
