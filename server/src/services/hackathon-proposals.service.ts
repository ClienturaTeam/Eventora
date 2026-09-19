import { HackathonProposalRepository } from "../repositories/hackathon-proposals.repository";
import { ProposalStatus, Prisma } from "@prisma/client";
import { NotificationService } from "./notifications.service";
import { prisma } from "../utils/prisma";

export class HackathonProposalService {
  static async getAllProposals(tenantId: string) {
    return HackathonProposalRepository.findAll(tenantId);
  }

  static async createProposal(tenantId: string, submittedById: string, data: any) {
    return HackathonProposalRepository.create(tenantId, submittedById, data);
  }

  static async getProposals(tenantId: string) {
    return HackathonProposalRepository.findAll(tenantId);
  }

  static async getMyProposals(tenantId: string, userId: string) {
    return HackathonProposalRepository.findBySubmitter(tenantId, userId);
  }

  static async getManagerProposals(tenantId: string, managerId: string) {
    return HackathonProposalRepository.findManagerProposals(tenantId, managerId);
  }

  static async getPendingPrincipalReviews(tenantId: string) {
    return HackathonProposalRepository.findPendingPrincipalReviews(tenantId);
  }

  static async getApprovedProposals(tenantId: string) {
    return HackathonProposalRepository.findApprovedProposals(tenantId);
  }

  static async getProposal(tenantId: string, id: string) {

    const proposal = await HackathonProposalRepository.findById(tenantId, id);
    if (!proposal) {
      throw { status: 404, code: "NOT_FOUND", message: "Hackathon proposal not found." };
    }
    return proposal;
  }

  static async updateProposal(tenantId: string, id: string, userId: string, data: any, hasGlobalUpdate: boolean = false) {
    const proposal = await this.getProposal(tenantId, id);
    
    // Only creator can update unless they have global update permission
    if (!hasGlobalUpdate && proposal.submittedById !== userId) {
      throw { status: 403, code: "FORBIDDEN", message: "Only the creator can edit this proposal." };
    }

    // Check status
    if (proposal.status !== ProposalStatus.DRAFT && proposal.status !== ProposalStatus.CHANGES_REQUESTED) {
      throw { status: 400, code: "BAD_REQUEST", message: "Only DRAFT or CHANGES_REQUESTED proposals can be edited." };
    }

    return HackathonProposalRepository.update(tenantId, id, data);
  }

  static async submitProposal(tenantId: string, id: string, userId: string) {
    const proposal = await this.getProposal(tenantId, id);

    // Only creator can submit
    if (proposal.submittedById !== userId) {
      throw { status: 403, code: "FORBIDDEN", message: "Only the creator can submit this proposal." };
    }

    if (proposal.status !== ProposalStatus.DRAFT && proposal.status !== ProposalStatus.CHANGES_REQUESTED) {
      throw { status: 400, code: "BAD_REQUEST", message: "Proposal is not in a valid state for submission." };
    }

    const updated = await HackathonProposalRepository.update(tenantId, id, {
      status: ProposalStatus.SUBMITTED_TO_MANAGER
    });

    // Notify managers (in a real system we might query for users with Manager role, here we just broadcast to org admins for simplicity, or we can use a specific manager)
    // For Phase 1, we assume NotificationService handles finding the right recipients or we can just emit a general event.
    // Assuming the frontend will assign a manager or we notify the organization admins.
    
    return updated;
  }

  static async managerReview(tenantId: string, id: string, managerId: string, action: "APPROVE" | "REJECT" | "REQUEST_CHANGES", comment?: string) {
    const proposal = await this.getProposal(tenantId, id);

    if (proposal.status !== ProposalStatus.SUBMITTED_TO_MANAGER) {
      throw { status: 400, code: "BAD_REQUEST", message: "Proposal is not awaiting manager review." };
    }

    let newStatus: ProposalStatus;
    if (action === "APPROVE") newStatus = ProposalStatus.SUBMITTED_TO_PRINCIPAL;
    else if (action === "REJECT") newStatus = ProposalStatus.MANAGER_REJECTED;
    else newStatus = ProposalStatus.CHANGES_REQUESTED;

    const updated = await HackathonProposalRepository.update(tenantId, id, {
      status: newStatus,
      managerId,
      managerComment: comment,
      managerReviewedAt: new Date()
    });

    // Notify submitter
    await NotificationService.create({
      organizationId: tenantId,
      recipientUserId: proposal.submittedById,
      title: `Proposal ${action === 'APPROVE' ? 'Approved' : action === 'REJECT' ? 'Rejected' : 'Changes Requested'} by Manager`,
      message: comment ? `Comment: ${comment}` : "Your hackathon proposal has been reviewed.",
      type: "SYSTEM"
    });

    return updated;
  }

  static async principalReview(tenantId: string, id: string, principalId: string, action: "APPROVE" | "REJECT", comment?: string) {
    const proposal = await this.getProposal(tenantId, id);

    if (proposal.status !== ProposalStatus.SUBMITTED_TO_PRINCIPAL) {
      throw { status: 400, code: "BAD_REQUEST", message: "Proposal is not awaiting principal review." };
    }

    let newStatus: ProposalStatus;
    if (action === "APPROVE") newStatus = ProposalStatus.PRINCIPAL_APPROVED;
    else newStatus = ProposalStatus.PRINCIPAL_REJECTED;

    const updated = await HackathonProposalRepository.update(tenantId, id, {
      status: newStatus,
      principalId,
      principalComment: comment,
      principalReviewedAt: new Date()
    });

    // Notify submitter
    await NotificationService.create({
      organizationId: tenantId,
      recipientUserId: proposal.submittedById,
      title: `Proposal ${action === 'APPROVE' ? 'Approved' : 'Rejected'} by Principal`,
      message: comment ? `Comment: ${comment}` : "Your hackathon proposal has been reviewed by the Principal.",
      type: "SYSTEM"
    });

    // Notify manager if exists
    if (proposal.managerId) {
       await NotificationService.create({
        organizationId: tenantId,
        recipientUserId: proposal.managerId,
        title: `Proposal ${action === 'APPROVE' ? 'Approved' : 'Rejected'} by Principal`,
        message: `The proposal you approved was reviewed by the Principal.`,
        type: "SYSTEM"
      });
    }

    return updated;
  }

  static async createEventFromProposal(tenantId: string, proposalId: string, userId: string, eventData: any, hasGlobalCreate: boolean = false) {
    const proposal: any = await this.getProposal(tenantId, proposalId);

    if (!hasGlobalCreate && proposal.submittedById !== userId) {
      throw { status: 403, code: "FORBIDDEN", message: "You can only create events for your own proposals." };
    }

    if (proposal.status !== ProposalStatus.PRINCIPAL_APPROVED) {
      throw { status: 400, code: "BAD_REQUEST", message: "Only PRINCIPAL_APPROVED proposals can be converted to an event." };
    }

    if (proposal.event) {
      throw { status: 409, code: "CONFLICT", message: "An event has already been created for this proposal." };
    }

    // Using transaction to ensure both event creation and status update succeed
    const { event, updatedProposal } = await prisma.$transaction(async (tx) => {
      const { facultyCoordinatorId, studentCoordinatorId, ...cleanEventData } = eventData;
      const teamMembersToCreate = [];

      // 1. Add Event Manager
      if (proposal.managerId && proposal.managerId !== proposal.submittedById) {
        teamMembersToCreate.push({ userId: proposal.managerId, responsibility: "Event Manager" });
      }

      // 2. Add Primary Student Coordinator (chosen or proposal submitter)
      const scUserId = studentCoordinatorId || proposal.submittedById;
      if (scUserId) {
        teamMembersToCreate.push({ userId: scUserId, responsibility: "Primary Student Coordinator" });
      }

      // 3. Add Faculty Coordinator (chosen or default in organization)
      let fcUserId = facultyCoordinatorId;
      if (!fcUserId) {
        const defaultFc = await tx.organizationMember.findFirst({
          where: { organizationId: tenantId, role: { name: "Faculty Coordinator" }, status: "ACTIVE" }
        });
        if (defaultFc) {
          fcUserId = defaultFc.userId;
        }
      }
      if (fcUserId) {
        teamMembersToCreate.push({ userId: fcUserId, responsibility: "Faculty Coordinator" });
      }

      const createdEvent = await tx.event.create({
        data: {
          ...cleanEventData,
          organizationId: tenantId,
          proposalId: proposal.id,
          teamMembers: {
            create: teamMembersToCreate
          }
        }
      });

      const updated = await tx.hackathonProposal.update({
        where: { id: proposal.id },
        data: { status: ProposalStatus.EVENT_CREATED }
      });

      return { event: createdEvent, updatedProposal: updated };
    });

    // Notify submitter, manager, principal
    const recipients = [
      ...new Set([
        proposal.submittedById,
        proposal.managerId,
        proposal.principalId
      ].filter(Boolean))
    ] as string[];

    for (const recipientId of recipients) {
      await NotificationService.create({
        organizationId: tenantId,
        recipientUserId: recipientId,
        title: "Hackathon Event Created!",
        message: `The proposal "${proposal.title}" has been successfully converted into the event "${event.name}".`,
        type: "SYSTEM"
      });
    }

    return { event, proposal: updatedProposal };
  }

  static async deleteProposal(tenantId: string, id: string, userId: string) {
    const proposal = await HackathonProposalRepository.findById(tenantId, id);
    if (!proposal) throw { status: 404, code: 'NOT_FOUND', message: 'Proposal not found' };
    if (proposal.submittedById !== userId) throw { status: 403, code: 'FORBIDDEN', message: 'Not authorized to delete this proposal' };
    if (proposal.status !== 'DRAFT' && proposal.status !== 'CHANGES_REQUESTED') {
      throw { status: 400, code: 'BAD_REQUEST', message: 'Can only delete proposals in DRAFT or CHANGES_REQUESTED state' };
    }
    return HackathonProposalRepository.delete(tenantId, id);
  }
}
