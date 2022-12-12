import TelegramAPI, {
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  SendMessageOptions,
} from "node-telegram-bot-api";
import * as dotenv from "dotenv";
dotenv.config();
import config from "../config";

import { getCoinPrice } from "../market-api/APIcommunication";
import * as db from "../db/db-control";

export class TelegramBot {
  bot: TelegramAPI;

  constructor() {
    this.bot = new TelegramAPI(config.token, { polling: true });

    this.bot.setMyCommands([
      //{ command: "/start", description: "get hello message from bot" },
      { command: "/help", description: "get avaliable options" },
      //{ command: "/listFavourite", description: "get favourite coins" },
    ]);
  }

  priceToString(par: number): string {
    return par ? "$" + par.toString() : "no data";
  }
  async startResponse(chatID: number) {
    return await this.bot.sendMessage(chatID, "Hello, shakal!");
  }
  async helpResponse(chatID: number) {
    const respString = `
    /start - get "hello" message from bot,
    /help - get avaliable options,  
    /{coin name} - get price of given coin,
        for example /eth, /btc
    /listFavourite - get favourite coins
    /addToFavourite {coin name} - add coin to favourites
    /deleteFavourite {coin name} - removes coin from favourites
        `;
    return await this.bot.sendMessage(chatID, respString);
  }

  async listFavouriteResponse(chatID: number) {
    const res: string[] = await db.showFavouriteCoins(chatID);
    if (res.length == 0) {
      return await this.bot.sendMessage(chatID, "You have no favourite coins");
    }
    const coinPrice = await Promise.all(
      res.map(async (elem) => {
        const price = await getCoinPrice(elem, "KuCoin");
        if (price.responseId == 1) {
          return { coin: elem, price: price.data.price.priceNow }; //
        } else return { coin: elem, price: 0 }; //
      })
    );
    console.log(await coinPrice);

    const string = `Favourite coins:

${coinPrice
  .map((elem) => "/" + elem.coin.toLocaleUpperCase() + " " + elem.price)
  .join("\n")}
`;
    return await this.bot.sendMessage(chatID, await string);
  }

  async addToFavouriteResponse(chatID: number, text: string) {
    const coinName = text.split(" ")[1];
    console.log(coinName);

    if (typeof coinName !== "undefined") {
      const res = await getCoinPrice(coinName, "KuCoin");
      if (res.responseId == 1) {
        if (!(await db.checkIfCoinInFavourites(chatID, coinName))) {
          await db.addCoinToFavorites(chatID, coinName);
          return await this.bot.sendMessage(chatID, "Coin is added!");
        } else
          return await this.bot.sendMessage(
            chatID,
            "Coin is already in favourites!"
          );
      } else return await this.bot.sendMessage(chatID, "Coin does not exist!");
    }
    return await this.bot.sendMessage(
      chatID,
      "You have to print coin name after /addToFavourite"
    );
  }

  async deleteFavouriteResponse(chatID: number, text: string) {
    const coinName = text.split(" ")[1];
    console.log(coinName);
    if (typeof coinName !== "undefined") {
      if (await db.checkIfCoinInFavourites(chatID, coinName)) {
        await db.deleteCoinFromFavorites(chatID, coinName);
        return await this.bot.sendMessage(chatID, "Coin is deleted!");
      } else
        return await this.bot.sendMessage(chatID, "Coin is not in favourites!");
    }
    return await this.bot.sendMessage(chatID, "Coin is not deleted!");
  }

  async coinNameResponse(chatID: number, text: string) {
    const coinName = text.toLocaleLowerCase().slice(1);
    console.log(coinName);

    const result = await getCoinPrice(coinName, "KuCoin");
    console.log(result);
    if (result.responseId == 1) {
      const respString = `Coin name: ${coinName.toLocaleUpperCase()}
        
  Price:     
        now: $${result.data.price.priceNow},
        30 minutes ago: ${this.priceToString(result.data.price.price30min)} ,
        1 hour ago: ${this.priceToString(result.data.price.price1h)},
        3 hours ago: ${this.priceToString(result.data.price.price3h)},
        6 hours ago: ${this.priceToString(result.data.price.price6h)},
        12 hours ago: ${this.priceToString(result.data.price.price12h)},
        24 hours ago: ${this.priceToString(result.data.price.price24h)},
        `;

      const favouriteButton = {
        //reply_to_message_id: chatID,
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [
              {
                text: (await db.checkIfCoinInFavourites(
                  chatID,
                  coinName.toLocaleLowerCase()
                ))
                  ? "Delete from favourites"
                  : "Add to favourites",
                callback_data: coinName.toLocaleLowerCase(),
              },
            ],
          ],
        }),
      };

      return await this.bot.sendMessage(
        chatID,
        respString,
        (<unknown>favouriteButton) as SendMessageOptions
      );
    } else return await this.bot.sendMessage(chatID, "I don't understand you");
  }

  async listenToMessages() {
    this.bot.on("message", async (msg) => {
      const text = msg.text;
      const chatID = msg.chat.id;

      if (text === "/start") {
        return await this.startResponse(chatID);
      }
      if (text === "/help") {
        return await this.helpResponse(chatID);
      }
      if (text === "/listFavourite") {
        return await this.listFavouriteResponse(chatID);
      }
      if (typeof text !== "undefined" && text.includes("/addToFavourite")) {
        return await this.addToFavouriteResponse(chatID, text);
      }
      if (typeof text !== "undefined" && text.includes("/deleteFavourite")) {
        return await this.deleteFavouriteResponse(chatID, text);
      }
      if (typeof text !== "undefined" && text[0] == "/") {
        return await this.coinNameResponse(chatID, text);
      }

      return await this.bot.sendMessage(chatID, "I don't understand you");
    });
  }
  async listenCallbacks() {
    this.bot.on("callback_query", async (msg) => {
      const data = msg.data as string;
      const chatID = msg.message?.chat.id as number;

      if (await db.checkIfCoinInFavourites(chatID, data)) {
        await db.deleteCoinFromFavorites(chatID, data);
        return await this.bot.sendMessage(chatID, "Coin deleted!");
      } else {
        await db.addCoinToFavorites(chatID, data);
        return await this.bot.sendMessage(chatID, "Coin added!");
      }
    });
  }
  async start() {
    await this.listenToMessages();
    await this.listenCallbacks();
  }
}

// const tgbot = new TelegramBot();
// tgbot.start();

// await this.bot.setMyCommands([
//     { command: "/start", description: "get hello message from bot" },
//     { command: "/help", description: "get avaliable options" },
//     { command: "/listFavourite", description: "get favourite coins" },
//   ]);
