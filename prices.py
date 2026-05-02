import yfinance as yf
from loguru import logger


def fetch_prices(tickers: list[str]) -> dict[str, float]:
    prices: dict[str, float] = {}
    for ticker in tickers:
        try:
            price = yf.Ticker(ticker).fast_info.last_price
            prices[ticker] = float(price) if price is not None else 0.0
        except Exception as exc:
            logger.warning("Price fetch failed for {}: {}", ticker, exc)
            prices[ticker] = 0.0
    return prices
