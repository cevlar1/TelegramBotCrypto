import axios from "axios";

const getConfig = {
  method: "get",
  url: process.env.api_url,
};

interface getCoinPriceReturn {
  responseId: number;
  data: returnData;
}

export const getCoinPrice = async (
  coin: string,
  market: string
): Promise<getCoinPriceReturn> => {
  try {
    const result = await axios.get(process.env.api_url, {
      params: { coin, period: "24h", market },
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "identity",
      },
    });
    //console.log(result);
    if (result.data.price === null) {
      return {
        responseId: 0,
        data: <returnData>{},
      };
    }
    const priceInPeriods = coinPricePerDay(result.data.price);

    return {
      responseId: 1,
      data: {
        coinName: coin,
        market,
        price: priceInPeriods,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      responseId: -1,
      data: <returnData>{},
    };
  }
};
interface returnData {
  coinName: string;
  market: string;
  price: PricePerDay;
}
interface PricePerDay {
  priceNow: number;
  price30min: number;
  price1h: number;
  price3h: number;
  price6h: number;
  price12h: number;
  price24h: number;
}

interface coinPrice {
  date: string;
  price: number;
}

const coinPricePerDay = (price: coinPrice[]) => {
  const timePeriods = [30, 60, 3 * 60, 6 * 60, 12 * 60];
  const priceAtTimePeriods: number[] = [];
  timePeriods.forEach((timePeriod) => {
    let timeFromNow = new Date(Date.now() - 1000 * 60 * timePeriod);
    const priceObjAtTimePeriod = price.find(
      (elem) =>
        +elem["date"] - timeFromNow.getTime() > 0 &&
        +elem["date"] - timeFromNow.getTime() < 1000 * 60 * 10
      //(elem) => new Date(+elem["date"]).getTime() - timeFromNow.getTime() > 0
    );
    if (typeof priceObjAtTimePeriod !== "undefined") {
      priceAtTimePeriods.push(priceObjAtTimePeriod.price);
    } else priceAtTimePeriods.push(0);
  });
  const pricePerDay: PricePerDay = {
    priceNow: price[price.length - 1].price,
    price30min: priceAtTimePeriods[0],
    price1h: priceAtTimePeriods[1],
    price3h: priceAtTimePeriods[2],
    price6h: priceAtTimePeriods[3],
    price12h: priceAtTimePeriods[4],
    price24h: priceAtTimePeriods[4] == 0 ? 0 : price[0].price,
  };
  return pricePerDay;
};
