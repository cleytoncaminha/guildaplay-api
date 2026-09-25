import "dotenv/config";
import { DataSource } from "typeorm";

import { validateEnvironment } from "../config/env.validation";
import { createTypeOrmOptions } from "./typeorm.config";

const environment = validateEnvironment(process.env);

export default new DataSource(createTypeOrmOptions(environment.DATABASE_URL));
