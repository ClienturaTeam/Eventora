import { Router } from "express";
import { CertificateController } from "../controllers/certificates.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { createCertificateSchema, updateCertificateSchema, bulkIssueSchema } from "../validators/certificates.validator";

const router = Router();

// Public verify route
router.get("/verify/:code", CertificateController.verify);

// Protected routes
router.use(requireAuth);
router.use(requireTenant);

router.get("/team/download", CertificateController.downloadTeam);
router.get("/:id/download", CertificateController.download);

router.get("/", requirePermission("certificates.read"), CertificateController.getAll);
router.get("/:id", requirePermission("certificates.read"), CertificateController.getById);

router.post("/", requirePermission("certificates.create"), validateRequest(createCertificateSchema), CertificateController.create);
router.patch("/:id", requirePermission("certificates.update"), validateRequest(updateCertificateSchema), CertificateController.update);
router.delete("/:id", requirePermission("certificates.delete"), CertificateController.delete);

router.post("/bulk-issue", requirePermission("certificates.issue"), validateRequest(bulkIssueSchema), CertificateController.bulkIssue);
router.post("/:id/revoke", requirePermission("certificates.revoke"), CertificateController.revoke);

export const certificatesRouter = router;
