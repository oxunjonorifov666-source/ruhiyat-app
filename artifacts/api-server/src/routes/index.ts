import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import rolesRouter from "./roles";
import psychologistsRouter from "./psychologists";
import educationCentersRouter from "./education-centers";
import coursesRouter from "./courses";
import assessmentsRouter from "./assessments";
import communicationRouter from "./communication";
import communityRouter from "./community";
import contentRouter from "./content";
import meetingsRouter from "./meetings";
import financeRouter from "./finance";
import systemRouter from "./system";
import wellnessRouter from "./wellness";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(rolesRouter);
router.use(psychologistsRouter);
router.use(educationCentersRouter);
router.use(coursesRouter);
router.use(assessmentsRouter);
router.use(communicationRouter);
router.use(communityRouter);
router.use(contentRouter);
router.use(meetingsRouter);
router.use(financeRouter);
router.use(systemRouter);
router.use(wellnessRouter);

export default router;
