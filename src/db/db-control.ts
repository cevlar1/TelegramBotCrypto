import { PgConnector, pgTable, serial, integer, json } from "drizzle-orm-pg";
import { and, asc, desc, eq, or } from "drizzle-orm/expressions";
import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();
import config from "../config";

const tb_users = pgTable("usersteg", {
  id: serial("id").primaryKey(),
  chatID: integer("chat_id"),
  data: json<string[]>("data"),
});

const pool = new Pool({
  host: config.dbhost,
  port: config.dbport,
  user: config.dbuser,
  password: config.dbpassword,
  database: config.dbdatabase,
});

const connector = new PgConnector(pool);

export const addRow = async (chatID: number) => {
  const db = await connector.connect();

  await db.insert(tb_users).values({
    chatID: chatID,
    data: [],
  });
  const users = await db.select(tb_users);
  // await connector.migrate({ migrationsFolder: "./drizzle" });
  console.log(users);
};

export const addCoinToFavorites = async (
  chat_ID: number,
  coin_Name: string
) => {
  const db = await connector.connect();

  let dataFromRow = await db
    .select(tb_users)
    .where(eq(tb_users.chatID, chat_ID));
  if (dataFromRow.length == 0) {
    await addRow(chat_ID);
    dataFromRow = await db.select(tb_users).where(eq(tb_users.chatID, chat_ID));
  }
  if (!dataFromRow[0].data?.includes(coin_Name)) {
    await db
      .update(tb_users)
      .set({
        data: dataFromRow[0].data?.concat(coin_Name),
      })
      .where(eq(tb_users.chatID, chat_ID));
  }

  const users = await db.select(tb_users);
  // await connector.migrate({ migrationsFolder: "./drizzle" });
  console.log(users);
};

export const deleteCoinFromFavorites = async (
  chat_ID: number,
  coin_Name: string
) => {
  const db = await connector.connect();

  let dataFromRow = await db
    .select(tb_users)
    .where(eq(tb_users.chatID, chat_ID));
  if (dataFromRow.length != 0 && dataFromRow[0].data?.includes(coin_Name)) {
    await db
      .update(tb_users)
      .set({
        data: dataFromRow[0].data?.filter((elem) => elem != coin_Name),
      })
      .where(eq(tb_users.chatID, chat_ID));
  }

  const users = await db.select(tb_users);
  // await connector.migrate({ migrationsFolder: "./drizzle" });
  console.log(users);
};

export const showFavouriteCoins = async (chat_ID: number) => {
  const db = await connector.connect();

  let dataFromRow = await db
    .select(tb_users)
    .where(eq(tb_users.chatID, chat_ID));
  if (dataFromRow.length == 0) {
    return [];
  }
  const res = dataFromRow[0].data;
  if (res === null) {
    return [];
  } else return res;
};

export const checkIfCoinInFavourites = async (
  chat_ID: number,
  coin: string
) => {
  const db = await connector.connect();

  let dataFromRow = await db
    .select(tb_users)
    .where(eq(tb_users.chatID, chat_ID));
  if (dataFromRow.length !== 0) {
    return dataFromRow[0].data?.includes(coin);
  } else return false;
};

const deleteAllRows = async () => {
  const db = await connector.connect();

  let dataFromRow = await db.delete(tb_users);
};

//addCoinToFavorites(125, "eth2");
//deleteCoinFromFavorites(125, "eth2");
//connectToTable();
//deleteAllRows();
