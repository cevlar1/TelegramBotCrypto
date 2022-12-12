namespace NodeJS {
  interface ProcessEnv {
    token: string;
    api_url: string;

    dbhost: string;
    dbport: number;
    dbuser: string;
    dbpassword: string;
    dbdatabase: string;
    // PORT: string;
    // MONGO_URI: string;
  }
}
