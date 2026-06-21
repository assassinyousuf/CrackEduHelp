import { Sequelize } from "sequelize";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const dbUrl = process.env.DATABASE_URL || "postgresql://eduhelp_user:eduhelp_password@localhost:5432/eduhelp_db";

export let sequelize: Sequelize;

if (dbUrl.startsWith("sqlite:")) {
  // Extract the path for SQLite storage
  // e.g. sqlite:///d:/path/to/db -> d:/path/to/db
  const storagePath = dbUrl.replace(/^sqlite:\/\/\/?/, "");
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: storagePath || "./eduhelp_dev.db",
    logging: false,
    define: {
      timestamps: false, // we will define custom timestamps on models manually if needed, or handle them in definitions
    }
  });
} else {
  sequelize = new Sequelize(dbUrl, {
    dialect: "postgres",
    logging: false,
    define: {
      timestamps: false,
    }
  });
}

export default sequelize;
