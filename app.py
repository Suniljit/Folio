import pandas as pd
import streamlit as st
from streamlit_autorefresh import st_autorefresh

from db import get_holdings, init_db, save_holdings
from models import Holding
from prices import fetch_prices

st.set_page_config(page_title="Folio", layout="wide")
st.title("Folio")

st_autorefresh(interval=30_000, key="price_refresh")

init_db()

holdings = get_holdings()
tickers = list({h.ticker.upper() for h in holdings if h.ticker.strip()})


@st.cache_data(ttl=30)
def _fetch_prices(tickers_key: tuple[str, ...]) -> dict[str, float]:
    return fetch_prices(list(tickers_key))


prices = _fetch_prices(tuple(sorted(tickers)))

# Build dataframe
if holdings:
    df = pd.DataFrame([h.model_dump() for h in holdings])
else:
    df = pd.DataFrame(
        columns=["id", "company_name", "ticker", "shares_owned", "avg_price", "fees"]
    ).astype({"shares_owned": float, "avg_price": float, "fees": float})

df["current_price"] = df["ticker"].str.upper().map(prices).fillna(0.0)
df["total_cost"] = (df["avg_price"] * df["shares_owned"]) + df["fees"]
df["market_value"] = df["shares_owned"] * df["current_price"]
df["unrealized_pl"] = df["market_value"] - df["total_cost"]

# Summary metrics
total_mv = df["market_value"].sum()
total_cost_sum = df["total_cost"].sum()
total_pl = df["unrealized_pl"].sum()

col1, col2, col3 = st.columns(3)
col1.metric("Market Value", f"${total_mv:,.2f}")
col2.metric("Total Cost", f"${total_cost_sum:,.2f}")
col3.metric("Unrealized P/L", f"${total_pl:+,.2f}", delta=f"{total_pl:+,.2f}")

st.divider()
st.caption("Prices refresh every 30s. Unsaved edits are cleared on refresh — save first.")

display_cols = [
    "company_name",
    "ticker",
    "shares_owned",
    "avg_price",
    "fees",
    "current_price",
    "total_cost",
    "market_value",
    "unrealized_pl",
]

edited_df = st.data_editor(
    df[display_cols],
    column_config={
        "company_name": st.column_config.TextColumn("Company"),
        "ticker": st.column_config.TextColumn("Ticker"),
        "shares_owned": st.column_config.NumberColumn("Shares", min_value=0, format="%.2f"),
        "avg_price": st.column_config.NumberColumn("Avg Price", min_value=0, format="$%.2f"),
        "fees": st.column_config.NumberColumn("Fees", min_value=0, format="$%.2f"),
        "current_price": st.column_config.NumberColumn(
            "Current Price", disabled=True, format="$%.2f"
        ),
        "total_cost": st.column_config.NumberColumn("Total Cost", disabled=True, format="$%.2f"),
        "market_value": st.column_config.NumberColumn(
            "Market Value", disabled=True, format="$%.2f"
        ),
        "unrealized_pl": st.column_config.NumberColumn(
            "Unrealized P/L", disabled=True, format="$%.2f"
        ),
    },
    num_rows="dynamic",
    use_container_width=True,
    hide_index=True,
)

if st.button("Save Changes", type="primary"):
    save_rows = []
    for _, row in edited_df.iterrows():
        ticker = str(row.get("ticker") or "").strip().upper()
        if not ticker:
            continue
        save_rows.append(
            Holding(
                company_name=str(row.get("company_name") or ""),
                ticker=ticker,
                shares_owned=float(row.get("shares_owned") or 0),
                avg_price=float(row.get("avg_price") or 0),
                fees=float(row.get("fees") or 0),
            )
        )
    save_holdings(save_rows)
    _fetch_prices.clear()
    st.success("Saved!")
    st.rerun()
