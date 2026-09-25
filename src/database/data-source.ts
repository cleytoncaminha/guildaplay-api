import "dotenv/config";
import { DataSource } from "typeorm";

import { validateEnvironment } from "../config/env.validation.js";
import { createTypeOrmOptions } from "./typeorm.config.js";

const environment = validateEnvironment(process.env);

export default new DataSource(createTypeOrmOptions(environment.DATABASE_URL));
