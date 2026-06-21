import express from "express";
import cors from "cors";

// Import routes
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";
import ordersRouter from "./routes/orders.js";
import paymentsRouter from "./routes/payments.js";
import chatRouter from "./routes/chat.js";
import referralsRouter from "./routes/referrals.js";
import blogRouter from "./routes/blog.js";
import adminRouter from "./routes/admin.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes mounting
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/payments", paymentsRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/referrals", referralsRouter);
app.use("/api/v1/blog", blogRouter);
app.use("/api/v1/admin", adminRouter);

app.get("/", (req, res) => {
  return res.json({
    message: "Welcome to CreackEduHelp API. Visit /docs for Swagger interactive endpoints."
  });
});

export default app;
export { app };
