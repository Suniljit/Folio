import yfinance as yf
from loguru import logger


def fetch_option_price(ticker: str, expiration_date: str, strike: float, option_type: str) -> float:
    try:
        chain = yf.Ticker(ticker).option_chain(expiration_date)
        df = chain.calls if option_type.lower() == "call" else chain.puts
        row = df[df["strike"] == strike]
        return float(row.iloc[0]["lastPrice"]) if not row.empty else 0.0
    except Exception as exc:
        logger.warning(
            "Option price fetch failed for {} {} {} {}: {}",
            ticker,
            expiration_date,
            strike,
            option_type,
            exc,
        )
        return 0.0
