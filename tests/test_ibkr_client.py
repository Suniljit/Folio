import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from ib_async import Contract

from backend import ibkr_client


def _ticker(bid=None, ask=None, last=None, close=None):
    return SimpleNamespace(bid=bid, ask=ask, last=last, close=close)


def test_resolve_price_prefers_bid_ask_midpoint():
    assert ibkr_client._resolve_price(_ticker(bid=1.0, ask=1.2)) == 1.1


def test_resolve_price_falls_back_to_last_when_no_bid_ask():
    assert ibkr_client._resolve_price(_ticker(last=2.5)) == 2.5


def test_resolve_price_falls_back_to_close_when_no_bid_ask_or_last():
    assert ibkr_client._resolve_price(_ticker(close=3.0)) == 3.0


def test_resolve_price_returns_none_when_nothing_valid():
    assert ibkr_client._resolve_price(_ticker()) is None


def test_fetch_option_mark_returns_none_when_not_connected():
    with patch.object(ibkr_client, "ensure_connected", new=AsyncMock(return_value=False)):
        result = asyncio.run(ibkr_client.fetch_option_mark("AAPL", "2026-01-16", 100.0, "call"))
    assert result is None


def test_fetch_option_mark_returns_none_when_contract_not_qualified():
    with (
        patch.object(ibkr_client, "ensure_connected", new=AsyncMock(return_value=True)),
        patch.object(ibkr_client._ib, "qualifyContractsAsync", new=AsyncMock(return_value=[])),
    ):
        result = asyncio.run(ibkr_client.fetch_option_mark("AAPL", "2026-01-16", 100.0, "call"))
    assert result is None


def test_fetch_option_mark_returns_midpoint_for_qualified_contract():
    with (
        patch.object(ibkr_client, "ensure_connected", new=AsyncMock(return_value=True)),
        patch.object(
            ibkr_client._ib, "qualifyContractsAsync", new=AsyncMock(return_value=[Contract()])
        ),
        patch.object(
            ibkr_client._ib,
            "reqTickersAsync",
            new=AsyncMock(return_value=[_ticker(bid=1.0, ask=1.5)]),
        ),
    ):
        result = asyncio.run(ibkr_client.fetch_option_mark("AAPL", "2026-01-16", 100.0, "call"))
    assert result == 1.25
