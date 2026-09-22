import { Router } from "express";
import { RegistrationController } from "../controllers/registrations.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireTenant } from "../middleware/tenant.middleware";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateRequest } from "../middleware/validate.middleware";
import { createRegistrationSchema, updateRegistrationSchema } from "../validators/registrations.validator";

const router = Router();

// Public Student / Team Registration
router.post("/team", RegistrationController.registerTeam);

router.use(requireAuth);
router.use(requireTenant);

router.get("/", requirePermission("registrations.read"), RegistrationController.findAll);
router.get("/:id", requirePermission("registrations.read"), RegistrationController.findById);
router.post("/", requirePermission("registrations.manage"), validateRequest(createRegistrationSchema), RegistrationController.create);
router.patch("/:id", requirePermission("registrations.manage"), validateRequest(updateRegistrationSchema), RegistrationController.update);
router.delete("/:id", requirePermission("registrations.manage"), RegistrationController.delete);

export { router as registrationRoutes };
