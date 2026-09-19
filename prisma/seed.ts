import {
  PrismaClient,
  UserStatus,
  OrganizationStatus,
  EventStatus,
  SubmissionStatus,
  EvaluationStatus,
  AttendanceMethod,
  AttendanceStatus,
  SessionStatus,
  PaymentStatus,
  PaymentProvider,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Phase 4D cleanup
  await prisma.sponsorship.deleteMany();
  await prisma.sponsorContact.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.surveyResponse.deleteMany();
  await prisma.surveyQuestion.deleteMany();
  await prisma.survey.deleteMany();
  await prisma.discussionReply.deleteMany();
  await prisma.discussion.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.communityGroup.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.learningResource.deleteMany();
  await prisma.courseEnrollment.deleteMany();
  await prisma.course.deleteMany();

  // Phase 4C cleanup
  await prisma.badgeAward.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.winner.deleteMany();
  await prisma.prize.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.volunteerEvent.deleteMany();
  await prisma.volunteer.deleteMany();
  await prisma.teamMentor.deleteMany();
  await prisma.mentor.deleteMany();
  await prisma.judgeCompetition.deleteMany();
  await prisma.judge.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.event.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.aIRequest.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.role.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // 2. Permissions
  const permissionsData = [
    'platform.read', 'platform.manage',
    'organization.read', 'organization.manage',
    'users.read', 'users.manage',
    'events.read', 'events.create', 'events.update', 'events.delete', 'events.complete',
    'competitions.read', 'competitions.manage',
    'registrations.read', 'registrations.manage',
    'teams.read', 'teams.manage',
    'submissions.read', 'submissions.manage',
    'evaluations.read', 'evaluations.manage',
    'certificates.read', 'certificates.manage', 'certificates.create', 'certificates.update', 'certificates.delete', 'certificates.issue', 'certificates.revoke',
    'settings.read', 'settings.manage',
    'communications.read', 'communications.create', 'communications.update', 'communications.publish', 'communications.delete',
    'notifications.read', 'notifications.manage',
    'winners.read', 'winners.manage', 'winners.finalize',
    'badges.read', 'badges.manage', 'badges.award',
    'learning.read', 'learning.manage',
    'community.read', 'community.manage',
    'feedback.read', 'feedback.manage',
    'recruitment.read', 'recruitment.manage',
    'sponsors.read', 'sponsors.manage',
    
    // Payments
    'payments.read', 'payments.manage', 'payments.refund', 'payments.export',
    'security.read', 'security.manage',
    'hackathon_proposals.create', 'hackathon_proposals.read', 'hackathon_proposals.update',
    'hackathon_proposals.read_own', 'hackathon_proposals.update_own',
    'hackathon_proposals.submit', 'hackathon_proposals.review', 'hackathon_proposals.principal_review',
    'hackathon_proposals.create_event', 'events.read_assigned',
  ];

  const permissions: Record<string, { id: string; action: string }> = {};
  for (const p of permissionsData) {
    permissions[p] = await prisma.permission.create({
      data: { action: p, description: `Allows ${p}` },
    });
  }

  // 3. Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const platformAdmin = await prisma.user.create({
    data: { email: 'admin@ascent.dev', firstName: 'Admin', lastName: 'User', passwordHash, status: UserStatus.ACTIVE },
  });

  const orgManager = await prisma.user.create({
    data: { email: 'manager@contoso.com', firstName: 'Alice', lastName: 'Manager', passwordHash, status: UserStatus.ACTIVE },
  });

  const participant1 = await prisma.user.create({
    data: { email: 'participant@gmail.com', firstName: 'Bob', lastName: 'Participant', passwordHash, status: UserStatus.ACTIVE },
  });

  const judgeUser1 = await prisma.user.create({
    data: { email: 'elena@ascent.dev', firstName: 'Elena', lastName: 'Markovic', passwordHash, status: UserStatus.ACTIVE },
  });

  const judgeUser2 = await prisma.user.create({
    data: { email: 'rajat@ascent.dev', firstName: 'Rajat', lastName: 'Menon', passwordHash, status: UserStatus.ACTIVE },
  });

  const mentorUser1 = await prisma.user.create({
    data: { email: 'arjun@ascent.dev', firstName: 'Arjun', lastName: 'Deshpande', passwordHash, status: UserStatus.ACTIVE },
  });

  const mentorUser2 = await prisma.user.create({
    data: { email: 'lena@ascent.dev', firstName: 'Lena', lastName: 'Fischer', passwordHash, status: UserStatus.ACTIVE },
  });

  const volunteerUser1 = await prisma.user.create({
    data: { email: 'tomas@ascent.dev', firstName: 'Tomas', lastName: 'Duarte', passwordHash, status: UserStatus.ACTIVE },
  });

  const volunteerUser2 = await prisma.user.create({
    data: { email: 'ishita@ascent.dev', firstName: 'Ishita', lastName: 'Bose', passwordHash, status: UserStatus.ACTIVE },
  });

  const participant2 = await prisma.user.create({
    data: { email: 'participant2@gmail.com', firstName: 'Carol', lastName: 'Dev', passwordHash, status: UserStatus.ACTIVE },
  });

  const studentCoordinatorUser = await prisma.user.create({
    data: { email: 'coordinator@contoso.com', firstName: 'Sam', lastName: 'Coordinator', passwordHash, status: UserStatus.ACTIVE },
  });

  // 4. Organizations
  const org1 = await prisma.organization.create({
    data: { name: 'Contoso Innovation Labs', slug: 'contoso-labs', status: OrganizationStatus.ACTIVE },
  });

  const org2 = await prisma.organization.create({
    data: { name: 'Northwind Institute', slug: 'northwind-institute', status: OrganizationStatus.ACTIVE },
  });

  // 5. Roles
  const globalAdminRole = await prisma.role.create({
    data: { name: 'Sudo Admin', description: 'Sudo Administrator with full system access across all organizations' },
  });

  const orgAdminRole = await prisma.role.create({
    data: { name: 'Admin', organizationId: org1.id, description: 'Organization Administrator' },
  });

  // Assign permissions
  for (const p of permissionsData) {
    await prisma.rolePermission.create({ data: { roleId: globalAdminRole.id, permissionId: permissions[p].id } });
  }
  const orgAdminPerms = [
    'events.read', 'events.create', 'events.update', 'events.delete', 'events.complete',
    'competitions.read', 'competitions.manage',
    'registrations.read', 'registrations.manage',
    'teams.read', 'teams.manage',
    'submissions.read', 'submissions.manage',
    'evaluations.read', 'evaluations.manage',
    'certificates.read', 'certificates.create', 'certificates.update', 'certificates.delete', 'certificates.issue', 'certificates.revoke',
    'communications.read', 'communications.create', 'communications.update', 'communications.publish', 'communications.delete',
    'notifications.read', 'notifications.manage',
    'winners.read', 'winners.manage', 'winners.finalize',
    'badges.read', 'badges.manage', 'badges.award',
    'hackathon_proposals.create', 'hackathon_proposals.read', 'hackathon_proposals.update',
    'hackathon_proposals.submit', 'hackathon_proposals.review', 'hackathon_proposals.principal_review', 'hackathon_proposals.create_event',
    'users.read', 'users.manage',
  ];
  for (const p of orgAdminPerms) {
    await prisma.rolePermission.create({ data: { roleId: orgAdminRole.id, permissionId: permissions[p].id } });
  }

  // 6. Organization Memberships
  const allUsersForOrg = [
    { userId: platformAdmin.id, roleId: globalAdminRole.id },
    { userId: orgManager.id, roleId: orgAdminRole.id },
    { userId: participant1.id, roleId: orgAdminRole.id },
    { userId: judgeUser1.id, roleId: orgAdminRole.id },
    { userId: judgeUser2.id, roleId: orgAdminRole.id },
    { userId: mentorUser1.id, roleId: orgAdminRole.id },
    { userId: mentorUser2.id, roleId: orgAdminRole.id },
    { userId: volunteerUser1.id, roleId: orgAdminRole.id },
    { userId: volunteerUser2.id, roleId: orgAdminRole.id },
    { userId: participant2.id, roleId: orgAdminRole.id },
    { userId: studentCoordinatorUser.id, roleId: orgAdminRole.id },
  ];

  for (const m of allUsersForOrg) {
    await prisma.organizationMember.create({
      data: { userId: m.userId, organizationId: org1.id, roleId: m.roleId, status: 'ACTIVE' },
    });
  }

  // 7. Events
  const event1 = await prisma.event.create({
    data: {
      name: 'Global AI Hackathon 2026',
      description: 'The biggest AI hackathon of the year.',
      organizationId: org1.id,
      status: EventStatus.PUBLISHED,
      startTime: new Date('2026-10-01T09:00:00Z'),
      endTime: new Date('2026-10-03T18:00:00Z'),
    },
  });

  const event2 = await prisma.event.create({
    data: {
      name: 'Northwind Design Challenge',
      description: 'Annual product design competition for students.',
      organizationId: org1.id,
      status: EventStatus.DRAFT,
      startTime: new Date('2026-11-15T09:00:00Z'),
      endTime: new Date('2026-11-17T18:00:00Z'),
    },
  });

  // 8. Competitions
  const comp1 = await prisma.competition.create({
    data: {
      name: 'AI for Accessibility Track',
      description: 'Build AI solutions that improve accessibility for people with disabilities.',
      eventId: event1.id,
    },
  });

  const comp2 = await prisma.competition.create({
    data: {
      name: 'Climate Tech Innovation',
      description: 'Develop technology solutions to combat climate change.',
      eventId: event1.id,
    },
  });

  // 9. Registrations
  await prisma.registration.create({ data: { eventId: event1.id, userId: participant1.id, status: 'APPROVED' } });
  await prisma.registration.create({ data: { eventId: event1.id, userId: participant2.id, status: 'APPROVED' } });
  await prisma.registration.create({ data: { eventId: event1.id, userId: orgManager.id, status: 'APPROVED' } });
  await prisma.registration.create({ data: { eventId: event1.id, userId: judgeUser1.id, status: 'APPROVED' } });
  await prisma.registration.create({ data: { eventId: event1.id, userId: judgeUser2.id, status: 'APPROVED' } });

  // 10. Teams
  const team1 = await prisma.team.create({
    data: {
      name: 'Team Quantum',
      competitionId: comp1.id,
      members: { create: [{ userId: participant1.id, isLead: true }] },
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'Team Nova',
      competitionId: comp1.id,
      members: { create: [{ userId: participant2.id, isLead: true }] },
    },
  });

  // 11. Submissions
  const sub1 = await prisma.submission.create({
    data: {
      title: 'AccessiSight — AI screen reader for the visually impaired',
      payload: { description: 'A real-time AI-powered screen reader using computer vision.', url: 'https://github.com/example/accessisight' },
      teamId: team1.id,
      competitionId: comp1.id,
      status: SubmissionStatus.SUBMITTED,
    },
  });

  const sub2 = await prisma.submission.create({
    data: {
      title: 'SignBridge — Real-time sign language translator',
      payload: { description: 'Uses MediaPipe to translate sign language in real-time.', url: 'https://github.com/example/signbridge' },
      teamId: team2.id,
      competitionId: comp1.id,
      status: SubmissionStatus.IN_REVIEW,
    },
  });

  // 12. Judges
  const judge1 = await prisma.judge.create({
    data: {
      userId: judgeUser1.id,
      organizationId: org1.id,
      expertise: 'Machine Learning',
      bio: 'PhD in ML from MIT, 10 years industry experience.',
    },
  });

  const judge2 = await prisma.judge.create({
    data: {
      userId: judgeUser2.id,
      organizationId: org1.id,
      expertise: 'Accessibility Tech',
      bio: 'Expert in assistive technologies and inclusive design.',
    },
  });

  // Assign judges to competition
  await prisma.judgeCompetition.create({ data: { judgeId: judge1.id, competitionId: comp1.id } });
  await prisma.judgeCompetition.create({ data: { judgeId: judge2.id, competitionId: comp1.id } });

  // 13. Evaluations
  await prisma.evaluation.create({
    data: {
      submissionId: sub1.id,
      judgeId: judgeUser1.id,
      score: 87.5,
      feedback: 'Strong technical depth. Excellent use of on-device inference.',
      status: EvaluationStatus.COMPLETED,
    },
  });

  await prisma.evaluation.create({
    data: {
      submissionId: sub2.id,
      judgeId: judgeUser1.id,
      score: 79,
      feedback: 'Good concept, needs more robust error handling.',
      status: EvaluationStatus.IN_PROGRESS,
    },
  });

  await prisma.evaluation.create({
    data: {
      submissionId: sub1.id,
      judgeId: judgeUser2.id,
      score: null,
      feedback: null,
      status: EvaluationStatus.PENDING,
    },
  });

  await prisma.evaluation.create({
    data: {
      submissionId: sub2.id,
      judgeId: judgeUser2.id,
      score: 82,
      feedback: 'Creative solution with real-world impact potential.',
      status: EvaluationStatus.COMPLETED,
    },
  });

  // 14. Mentors
  const mentor1 = await prisma.mentor.create({
    data: {
      userId: mentorUser1.id,
      organizationId: org1.id,
      expertise: 'Product Strategy',
      bio: 'Former PM at Google, passionate about helping hackathon teams.',
    },
  });

  const mentor2 = await prisma.mentor.create({
    data: {
      userId: mentorUser2.id,
      organizationId: org1.id,
      expertise: 'Cloud Architecture',
      bio: 'AWS Solutions Architect with 8 years of experience.',
    },
  });

  // Assign mentors to teams
  await prisma.teamMentor.create({ data: { mentorId: mentor1.id, teamId: team1.id } });
  await prisma.teamMentor.create({ data: { mentorId: mentor2.id, teamId: team2.id } });
  await prisma.teamMentor.create({ data: { mentorId: mentor1.id, teamId: team2.id } });

  // 15. Volunteers
  const volunteer1 = await prisma.volunteer.create({
    data: {
      userId: volunteerUser1.id,
      organizationId: org1.id,
      role: 'Registration Desk',
      bio: 'Experienced event organizer.',
    },
  });

  const volunteer2 = await prisma.volunteer.create({
    data: {
      userId: volunteerUser2.id,
      organizationId: org1.id,
      role: 'Logistics',
      bio: 'Logistics expert with event management background.',
    },
  });

  // Assign volunteers to events
  await prisma.volunteerEvent.create({
    data: { volunteerId: volunteer1.id, eventId: event1.id, shiftsCount: 5, hoursCount: 20 },
  });
  await prisma.volunteerEvent.create({
    data: { volunteerId: volunteer2.id, eventId: event1.id, shiftsCount: 7, hoursCount: 28 },
  });
  await prisma.volunteerEvent.create({
    data: { volunteerId: volunteer1.id, eventId: event2.id, shiftsCount: 3, hoursCount: 12 },
  });

  // 16. Attendance Sessions
  const session1 = await prisma.attendanceSession.create({
    data: {
      eventId: event1.id,
      name: 'Opening Keynote',
      description: 'Kick-off session for all participants.',
      startTime: new Date('2026-10-01T09:00:00Z'),
      endTime: new Date('2026-10-01T10:30:00Z'),
      status: SessionStatus.UPCOMING,
    },
  });

  const session2 = await prisma.attendanceSession.create({
    data: {
      eventId: event1.id,
      name: 'Round 1 Judging',
      description: 'First round evaluation by the judge panel.',
      startTime: new Date('2026-10-02T14:00:00Z'),
      endTime: new Date('2026-10-02T18:00:00Z'),
      status: SessionStatus.UPCOMING,
    },
  });

  const session3 = await prisma.attendanceSession.create({
    data: {
      eventId: event1.id,
      name: 'Awards Ceremony',
      description: 'Final ceremony and prize distribution.',
      startTime: new Date('2026-10-03T16:00:00Z'),
      endTime: new Date('2026-10-03T18:00:00Z'),
      status: SessionStatus.UPCOMING,
    },
  });

  // 17. Certificates & Communications
  await prisma.certificate.create({
    data: {
      userId: participant1.id,
      organizationId: org1.id,
      eventId: event1.id,
      competitionId: comp1.id,
      certificateNumber: 'CERT-2026-WIN-001',
      type: 'WINNER',
      title: 'First Place Winner',
      description: 'Awarded for exceptional performance in Global AI Hackathon 2026.',
      status: 'ISSUED',
      verificationCode: 'VERIFY-ABC-1234',
    }
  });

  await prisma.communication.create({
    data: {
      organizationId: org1.id,
      title: "Hackathon Registration Reminder",
      content: "Don't forget to submit your final projects by midnight!",
      type: "REMINDER",
      status: "PUBLISHED",
      audience: "ALL",
      createdBy: platformAdmin.id,
      publishedAt: new Date()
    }
  });

  await prisma.notification.create({
    data: {
      organizationId: org1.id,
      recipientUserId: participant1.id,
      title: "Registration Approved",
      message: "Your registration was approved.",
      type: "REGISTRATION",
      isRead: false
    }
  });

  // 17. Seed Prizes and Winners
  const prize1 = await prisma.prize.create({
    data: {
      organizationId: org1.id,
      competitionId: comp1.id,
      name: 'First Place',
      position: '1',
      value: 50000,
      currency: 'INR',
      description: 'Cash prize for the best overall solution.',
      status: 'PENDING',
    }
  });

  await prisma.winner.create({
    data: {
      organizationId: org1.id,
      competitionId: comp1.id,
      submissionId: sub1.id,
      teamId: team1.id,
      position: '1',
      status: 'PENDING',
      prizeId: prize1.id,
      selectedBy: orgManager.id,
    }
  });

  // 18. Seed Badges and Achievements
  const badge1 = await prisma.badge.create({
    data: {
      organizationId: org1.id,
      name: 'Hackathon Winner',
      description: 'Awarded to winners of official hackathons.',
      type: 'WINNER',
      status: 'ACTIVE',
    }
  });

  await prisma.badgeAward.create({
    data: {
      organizationId: org1.id,
      badgeId: badge1.id,
      recipientUserId: participant1.id,
      reason: 'Won AI for Accessibility Track',
      awardedBy: orgManager.id,
    }
  });

  await prisma.achievement.create({
    data: {
      organizationId: org1.id,
      name: 'First Hackathon',
      description: 'Completed your first hackathon',
      criteria: 'COMPLETED_1_EVENT',
      status: 'ACTIVE',
    }
  });

  // ---------------------------------------------------------
  // Phase 4D: Seed Data
  // ---------------------------------------------------------
  
  // 19. Learning
  const course1 = await prisma.course.create({
    data: {
      organizationId: org1.id,
      title: 'Introduction to React 19',
      category: 'Web Development',
      instructorId: orgManager.id,
      level: 'Beginner',
      status: 'PUBLISHED',
    }
  });
  await prisma.courseEnrollment.create({
    data: {
      courseId: course1.id,
      userId: participant1.id,
      status: 'ENROLLED',
      progress: 45,
    }
  });
  await prisma.learningResource.create({
    data: {
      organizationId: org1.id,
      title: 'React 19 Cheat Sheet',
      type: 'Guide',
      category: 'Web Development',
      uploadedById: orgManager.id,
      status: 'ACTIVE',
    }
  });
  await prisma.workshop.create({
    data: {
      organizationId: org1.id,
      title: 'Live Q&A: Frontend Architecture',
      instructorId: orgManager.id,
      date: new Date(Date.now() + 86400000 * 7),
      duration: '1.5 hours',
      status: 'UPCOMING',
    }
  });

  // 20. Community
  const group1 = await prisma.communityGroup.create({
    data: {
      organizationId: org1.id,
      name: 'Frontend Developers',
      category: 'Web Development',
      status: 'ACTIVE',
    }
  });
  await prisma.groupMembership.create({
    data: {
      groupId: group1.id,
      userId: participant1.id,
    }
  });
  const discussion1 = await prisma.discussion.create({
    data: {
      organizationId: org1.id,
      title: 'Best practices for React Query?',
      category: 'Web Development',
      authorId: participant1.id,
      status: 'OPEN',
    }
  });
  await prisma.discussionReply.create({
    data: {
      discussionId: discussion1.id,
      authorId: orgManager.id,
      content: 'I highly recommend reading the official TkDodo blog.',
    }
  });

  // 21. Feedback
  const survey1 = await prisma.survey.create({
    data: {
      organizationId: org1.id,
      name: 'Hackathon Post-Event Survey',
      eventId: event1.id,
      audience: 'ALL',
      status: 'PUBLISHED',
    }
  });
  await prisma.surveyQuestion.create({
    data: {
      surveyId: survey1.id,
      text: 'How satisfied were you with the event?',
      type: 'RATING',
      order: 1,
    }
  });
  await prisma.surveyResponse.create({
    data: {
      surveyId: survey1.id,
      participantId: participant1.id,
      sentiment: 'Positive',
      rating: 5,
      comments: 'Great event!',
    }
  });
  await prisma.surveyResponse.create({
    data: {
      surveyId: survey1.id,
      participantId: participant2.id,
      sentiment: 'Positive',
      rating: 4,
      comments: 'Good organization.',
    }
  });

  // 22. Recruitment
  const job1 = await prisma.jobPosting.create({
    data: {
      organizationId: org1.id,
      title: 'Junior Frontend Developer',
      company: 'Contoso Labs',
      roleType: 'Full-time',
      status: 'OPEN',
    }
  });
  await prisma.jobApplication.create({
    data: {
      jobId: job1.id,
      candidateId: participant1.id,
      stage: 'INTERVIEW',
      score: 85.5,
      source: 'Hackathon Event',
    }
  });
  await prisma.jobApplication.create({
    data: {
      jobId: job1.id,
      candidateId: participant2.id,
      stage: 'OFFER',
      score: 92.0,
      source: 'Referral',
    }
  });
  await prisma.jobApplication.create({
    data: {
      jobId: job1.id,
      candidateId: orgManager.id,
      stage: 'OFFER_ACCEPTED',
      score: 95.0,
      source: 'Direct',
    }
  });

  // 23. Sponsors
  const sponsor1 = await prisma.sponsor.create({
    data: {
      organizationId: org1.id,
      name: 'TechCorp',
      tier: 'Platinum',
      committedValue: 2000000,
      status: 'ACTIVE',
      renewalDate: new Date(Date.now() + 86400000 * 15),
    }
  });
  await prisma.sponsorContact.create({
    data: {
      sponsorId: sponsor1.id,
      name: 'Jane Doe',
      email: 'jane@techcorp.com',
      role: 'Marketing Director',
    }
  });
  await prisma.sponsorship.create({
    data: {
      sponsorId: sponsor1.id,
      eventId: event1.id,
      deliverablesMet: 9,
      deliverablesTarget: 10,
    }
  });

  const sponsor2 = await prisma.sponsor.create({
    data: {
      organizationId: org1.id,
      name: 'CloudScale',
      tier: 'Gold',
      committedValue: 2100000,
      status: 'ACTIVE',
      renewalDate: new Date(Date.now() + 86400000 * 45),
    }
  });
  await prisma.sponsorship.create({
    data: {
      sponsorId: sponsor2.id,
      eventId: event1.id,
      deliverablesMet: 4,
      deliverablesTarget: 5,
    }
  });

  // 24. Payments & Revenue
  await prisma.payment.create({
    data: {
      organizationId: org1.id,
      amount: 15000,
      currency: 'USD',
      status: PaymentStatus.SUCCEEDED,
      provider: PaymentProvider.STRIPE,
      providerPaymentId: 'pi_3M2X1XYZ1',
      description: 'Enterprise Plan Subscription',
    }
  });
  await prisma.payment.create({
    data: {
      organizationId: org1.id,
      amount: 2500,
      currency: 'USD',
      status: PaymentStatus.SUCCEEDED,
      provider: PaymentProvider.STRIPE,
      providerPaymentId: 'pi_3M2X2XYZ2',
      description: 'Event Add-on',
      createdAt: new Date(Date.now() - 86400000 * 5)
    }
  });

  // 25. AI Copilot Requests
  await prisma.aIRequest.create({
    data: {
      organizationId: org1.id,
      feature: 'Event Description',
      tokens: 450,
      durationMs: 1200,
      status: 'Success',
      requestedById: orgManager.id,
      createdAt: new Date(Date.now() - 3600000)
    }
  });
  await prisma.aIRequest.create({
    data: {
      organizationId: org1.id,
      feature: 'Rubric Generation',
      tokens: 850,
      durationMs: 2100,
      status: 'Success',
      requestedById: orgManager.id,
      createdAt: new Date(Date.now() - 86400000)
    }
  });

  console.log("\n✅ Seeding complete!");
  console.log("─────────────────────────────────────────────");
  console.log("TEST CREDENTIALS (DEVELOPMENT ONLY):");
  console.log("  Sudo Admin:      admin@ascent.dev       / password123");
  console.log("  Admin:           manager@contoso.com    / password123");
  console.log("─────────────────────────────────────────────");
  console.log(`Organizations: ${org1.name}, ${org2.name}`);
  console.log(`Events: ${event1.name}, ${event2.name}`);
  console.log(`Competitions: ${comp1.name}, ${comp2.name}`);
  console.log(`Teams: ${team1.name}, ${team2.name}`);
  console.log(`Submissions: ${sub1.title}, ${sub2.title}`);
  console.log(`Judges: ${judgeUser1.firstName} ${judgeUser1.lastName}, ${judgeUser2.firstName} ${judgeUser2.lastName}`);
  console.log(`Mentors: ${mentorUser1.firstName} ${mentorUser1.lastName}, ${mentorUser2.firstName} ${mentorUser2.lastName}`);
  console.log(`Volunteers: ${volunteerUser1.firstName} ${volunteerUser1.lastName}, ${volunteerUser2.firstName} ${volunteerUser2.lastName}`);
  console.log(`Attendance Sessions: ${session1.name}, ${session2.name}, ${session3.name}`);
  console.log("Database seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
