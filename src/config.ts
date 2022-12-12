import path from "path";
import dotenv from "dotenv";

// Parsing the env file.
dotenv.config({ path: path.resolve(__dirname, "../config/config.env") });

// Interface to load env variables
// Note these variables can possibly be undefined
// as someone could skip these varibales or not setup a .env file at all

interface ENV {
  token: string | undefined;
  api_url: string | undefined;

  dbhost: string | undefined;
  dbport: number | undefined;
  dbuser: string | undefined;
  dbpassword: string | undefined;
  dbdatabase: string | undefined;
}

interface Config {
  token: string;
  api_url: string;

  dbhost: string;
  dbport: number;
  dbuser: string;
  dbpassword: string;
  dbdatabase: string;
}

// Loading process.env as ENV interface

const getConfig = (): ENV => {
  return {
    token: process.env.token,
    api_url: process.env.api_url,

    dbhost: process.env.dbhost,
    dbport: process.env.dbport,
    dbuser: process.env.dbuser,
    dbpassword: process.env.dbpassword,
    dbdatabase: process.env.dbdatabase,
    // PORT: process.env.PORT ? Number(process.env.PORT) : undefined,
    // MONGO_URI: process.env.MONGO_URI,
  };
};

// Throwing an Error if any field was undefined we don't
// want our app to run if it can't connect to DB and ensure
// that these fields are accessible. If all is good return
// it as Config which just removes the undefined from our type
// definition.

const getSanitizedConfig = (config: ENV): Config => {
  for (const [key, value] of Object.entries(config)) {
    if (value === undefined) {
      throw new Error(`Missing key ${key} in config.env`);
    }
  }
  return config as Config;
};

const config = getConfig();

const sanitizedConfig = getSanitizedConfig(config);

export default sanitizedConfig;
