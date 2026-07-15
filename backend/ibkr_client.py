import asyncio
import math
import os

from ib_async import IB, Contract, Option, Ticker
from loguru import logger

_HOST = os.environ.get("FOLIO_IBKR_HOST", "127.0.0.1")
_PORT = int(os.environ.get("FOLIO_IBKR_PORT", "7496"))
_CLIENT_ID = int(os.environ.get("FOLIO_IBKR_CLIENT_ID", "17"))
_CONNECT_TIMEOUT = 4.0

_ib = IB()
_connect_lock = asyncio.Lock()


async def ensure_connected() -> bool:
    if _ib.isConnected():
        return True
    async with _connect_lock:
        if _ib.isConnected():
            return True
        try:
            await _ib.connectAsync(
                _HOST, _PORT, clientId=_CLIENT_ID, timeout=_CONNECT_TIMEOUT, readonly=True
            )
            logger.info("Connected to IBKR TWS at {}:{}", _HOST, _PORT)
            return True
        except Exception as exc:
            logger.warning("IBKR connection failed ({}:{}): {}", _HOST, _PORT, exc)
            return False


def _valid(price: float | None) -> bool:
    return price is not None and not math.isnan(price) and price > 0


def _resolve_price(t: Ticker) -> float | None:
    if _valid(t.bid) and _valid(t.ask):
        return round((t.bid + t.ask) / 2, 4)
    if _valid(t.last):
        return t.last
    if _valid(t.close):
        return t.close
    return None


async def fetch_option_mark(
    ticker: str, expiration_date: str, strike: float, option_type: str
) -> float | None:
    if not await ensure_connected():
        return None
    try:
        right = "C" if option_type.lower() == "call" else "P"
        expiry = expiration_date.replace("-", "")
        contract = Option(ticker, expiry, strike, right, exchange="SMART", currency="USD")
        qualified = await _ib.qualifyContractsAsync(contract)
        if not qualified or not isinstance(qualified[0], Contract):
            logger.warning(
                "IBKR could not qualify contract {} {} {} {}",
                ticker,
                expiration_date,
                strike,
                option_type,
            )
            return None
        [ticker_data] = await _ib.reqTickersAsync(qualified[0])
        return _resolve_price(ticker_data)
    except Exception as exc:
        logger.warning(
            "IBKR price fetch failed for {} {} {} {}: {}",
            ticker,
            expiration_date,
            strike,
            option_type,
            exc,
        )
        return None
