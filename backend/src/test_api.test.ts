// Use in-memory SQLite for testing
process.env.DATABASE_URL = "sqlite::memory:";

import request from "supertest";
import app from "./app.js";
import sequelize from "./config/database.js";
import { seedPricingRules } from "./services/pricing.js";

beforeAll(async () => {
  // Synchronize in-memory database
  await sequelize.sync({ force: true });
  await seedPricingRules();
});

afterAll(async () => {
  await sequelize.close();
});

describe("CreackEduHelp API Integration Tests", () => {
  it("GET / - Should return welcome message", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.message).toContain("CreackEduHelp API");
  });

  it("POST /api/v1/orders/estimate - Should return mathematically correct quote values", async () => {
    const payload = {
      service_type: "Report Formatting",
      word_count: 2000,
      slide_count: 0,
      priority_level: "standard"
    };

    const res = await request(app)
      .post("/api/v1/orders/estimate")
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.estimated_total).toBe(105.00); // 25 + 2000 * 0.04 = 105
    expect(res.body.deposit_required).toBe(31.50); // 30% of 105
    expect(res.body.final_balance).toBe(73.50);
  });

  it("POST /api/v1/auth/register & login - Should register and authenticate user successfully", async () => {
    const regPayload = {
      email: "teststudent@creackeduhelp.com",
      password: "securepassword123",
      full_name: "Test Student Persona",
      role: "student",
      phone: "+4479460958"
    };

    // 1. Register student
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .field("email", regPayload.email)
      .field("password", regPayload.password)
      .field("full_name", regPayload.full_name)
      .field("role", regPayload.role)
      .field("phone", regPayload.phone);

    expect(regRes.status).toBe(201);
    expect(regRes.body.email).toBe(regPayload.email);

    // 2. Duplicate registration check (should fail)
    const dupRes = await request(app)
      .post("/api/v1/auth/register")
      .field("email", regPayload.email)
      .field("password", regPayload.password)
      .field("full_name", regPayload.full_name)
      .field("role", regPayload.role)
      .field("phone", regPayload.phone);

    expect(dupRes.status).toBe(400);

    // 3. Login check
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: regPayload.email,
        password: regPayload.password
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty("access_token");
    expect(loginRes.body.token_type).toBe("bearer");
    expect(loginRes.body.user.email).toBe(regPayload.email);
  });

  it("POST /api/v1/orders - Compliance guard should block requests containing academic cheating keywords", async () => {
    // Register another student
    const regRes = await request(app)
      .post("/api/v1/auth/register")
      .field("email", "student2@creackeduhelp.com")
      .field("password", "securepassword123")
      .field("full_name", "Ethical Student")
      .field("role", "student")
      .field("phone", "+4479460959");

    expect(regRes.status).toBe(201);

    // Login to get access token
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "student2@creackeduhelp.com",
        password: "securepassword123"
      });

    const token = loginRes.body.access_token;

    // Send cheating request
    const orderPayload = {
      title: "Exam Assistance",
      university: "Oxford",
      course_name: "Maths",
      service_type: "Report Formatting",
      task_description: "Can you do my exam for me please?",
      word_count: 500,
      deadline: "2026-07-20T12:00:00Z",
      priority_level: "standard"
    };

    const cheatRes = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${token}`)
      .send(orderPayload);

    expect(cheatRes.status).toBe(422);
    expect(cheatRes.body.detail).toContain("Warning: Task description contains references to prohibited academic services");
  });
});
