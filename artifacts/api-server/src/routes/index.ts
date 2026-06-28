import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rentalsRouter from "./rentals";
import bookingsRouter from "./bookings";
import blockedDatesRouter from "./blocked-dates";
import foodRouter from "./food";
import faqRouter from "./faq";
import giftCertificatesRouter from "./gift-certificates";
import blogRouter from "./blog";
import contactRouter from "./contact";
import adminRouter from "./admin";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(rentalsRouter);
router.use(bookingsRouter);
router.use(blockedDatesRouter);
router.use(foodRouter);
router.use(faqRouter);
router.use(giftCertificatesRouter);
router.use(blogRouter);
router.use(contactRouter);
router.use(adminRouter);
router.use(stripeRouter);

export default router;
