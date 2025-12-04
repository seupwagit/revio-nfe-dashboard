import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "sqlserver://10.0.0.4:1433;database=C67624577000145;user=sa;password=zaqwsx2001;encrypt=false;trustServerCertificate=true"
    }
  }
});
