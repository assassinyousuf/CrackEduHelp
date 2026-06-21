import dotenv from "dotenv";
import app from "./app.js";
import sequelize from "./config/database.js";
import { User } from "./models/models.js";
import { seedPricingRules } from "./services/pricing.js";
import unixcrypt from "@bonniernews/unixcrypt-js";

dotenv.config();

const PORT = process.env.PORT || 8000;

// Sync database and seed initial data
async function startServer() {
  try {
    await sequelize.sync();
    console.log("Database schema synchronized.");

    // Seed pricing rules
    await seedPricingRules();

    // Seed default testing accounts
    // Admin
    const adminEmail = "admin@creackeduhelp.com";
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    if (!existingAdmin) {
      await User.create({
        email: adminEmail,
        hashed_password: unixcrypt.encrypt("adminpass123"),
        full_name: "System Administrator",
        role: "admin",
        is_active: true,
      });
      console.log("Seeded default admin account.");
    }

    // Specialist
    const specEmail = "specialist@creackeduhelp.com";
    const existingSpec = await User.findOne({ where: { email: specEmail } });
    if (!existingSpec) {
      await User.create({
        email: specEmail,
        hashed_password: unixcrypt.encrypt("specpass123"),
        full_name: "Dr. Sarah Jenkins (PPT/Report Specialist)",
        role: "specialist",
        is_active: true,
      });
      console.log("Seeded default specialist account.");
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start the server:", error);
    process.exit(1);
  }
}

startServer();
