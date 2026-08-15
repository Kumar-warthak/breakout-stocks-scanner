import requests
from bs4 import BeautifulSoup
import time
from decimal import Decimal, ROUND_HALF_UP


def money(value):
    return Decimal(str(value)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )


def get_stock_price(symbol: str, exchange: str = "NSE"):
    """Exact Google Finance price logic from the user's working code."""
    url = f"https://www.google.com/finance/quote/{symbol}:{exchange}"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/85.0.4183.102 Safari/537.36"
        )
    }

    resp = requests.get(url, headers=headers)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    price_element = soup.select_one(
        'div.N6SYTe span[jsname="Pdsbrc"]'
    )

    if not price_element:
        raise ValueError("Could not find price element")

    price_text = price_element.get_text(strip=True)

    price = float(
        price_text.replace("₹", "")
        .replace(",", "")
        .strip()
    )

    return price


def fetch_current_price(stock):
    symbol = str(stock.symbol).strip().upper()
    exchange = str(getattr(stock, "exchange", "NSE") or "NSE").strip().upper()

    if not symbol:
        return None

    try:
        print(f"Fetching price for {symbol}:{exchange}...")
        return money(get_stock_price(symbol, exchange))
    except Exception as e:
        print(f"Price error for {symbol}:{exchange}: {e}")
        return None


def fetch_price_with_retry(stock, retries=1, delay=2):
    # Keep retry count low because the user's original working logic
    # already performs one request per stock and the scanner has its own delay.
    for attempt in range(1, retries + 1):
        print(f"   Fetching {stock.symbol} ({attempt}/{retries})")
        price = fetch_current_price(stock)
        if price is not None:
            return price
        if attempt < retries:
            time.sleep(delay)
    return None


def scan_stock(stock):
    symbol = str(stock.symbol).strip().upper()
    exchange = str(getattr(stock, "exchange", "NSE") or "NSE").strip().upper()

    try:
        if stock.breakout_level is None:
            return {
                "id": stock.id,
                "date": stock.date.strftime("%d-%m-%Y") if stock.date else None,
                "symbol": symbol,
                "stock_name": stock.stock_name,
                "exchange": exchange,
                "breakout_level": float(stock.breakout_level) if stock.breakout_level is not None else None,
                "stoploss": float(stock.stoploss) if stock.stoploss is not None else None,
                "current_price": None,
                "percent_diff": None,
                "youtuber": stock.youtuber or "",
                "advisor": stock.advisor or "",
                "category": stock.category or "",
                "status": "INVALID LEVEL"
            }

        level = Decimal(str(stock.breakout_level))
        if level <= 0:
            return {
                "id": stock.id,
                "date": stock.date.strftime("%d-%m-%Y") if stock.date else None,
                "symbol": symbol,
                "stock_name": stock.stock_name,
                "exchange": exchange,
                "breakout_level": float(level),
                "stoploss": float(stock.stoploss) if stock.stoploss is not None else None,
                "current_price": None,
                "percent_diff": None,
                "youtuber": stock.youtuber or "",
                "advisor": stock.advisor or "",
                "category": stock.category or "",
                "status": "INVALID LEVEL"
            }

        current = fetch_price_with_retry(stock, retries=1)

        if current is None:
            return {
                "id": stock.id,
                "date": stock.date.strftime("%d-%m-%Y") if stock.date else None,
                "symbol": symbol,
                "stock_name": stock.stock_name,
                "exchange": exchange,
                "breakout_level": float(level),
                "stoploss": float(stock.stoploss) if stock.stoploss is not None else None,
                "current_price": None,
                "percent_diff": None,
                "youtuber": stock.youtuber or "",
                "advisor": stock.advisor or "",
                "category": stock.category or "",
                "status": "NOT FOUND"
            }

        diff = money(((current - level) / level) * Decimal("100"))

        # EXACT logic from the user's Excel scanner: current_price > breakout_level
        status = "YES" if current > level else "NO"

        # Save the fetched price to the master table.
        stock.current_price = current

        result = {
            "id": stock.id,
            "date": stock.date.strftime("%d-%m-%Y") if stock.date else None,
            "symbol": symbol,
            "stock_name": stock.stock_name,
            "exchange": exchange,
            "breakout_level": float(level),
            "stoploss": float(stock.stoploss) if stock.stoploss is not None else None,
            "current_price": float(current),
            "percent_diff": float(diff),
            "youtuber": stock.youtuber or "",
            "advisor": stock.advisor or "",
            "category": stock.category or "",
            "status": status
        }

        print(
            f"   {symbol}: price={current}, breakout={level}, "
            f"diff={diff}%, status={status}"
        )
        return result

    except Exception as e:
        print(f"Error processing {symbol}: {e}")
        return {
            "id": stock.id,
            "date": stock.date.strftime("%d-%m-%Y") if stock.date else None,
            "symbol": symbol,
            "stock_name": stock.stock_name,
            "exchange": exchange,
            "breakout_level": float(stock.breakout_level) if stock.breakout_level is not None else None,
            "stoploss": float(stock.stoploss) if stock.stoploss is not None else None,
            "current_price": None,
            "percent_diff": None,
            "youtuber": stock.youtuber or "",
            "advisor": stock.advisor or "",
            "category": stock.category or "",
            "status": "ERROR",
            "error": str(e)
        }


def run_scan(stocks):
    results = {}
    stocks_scanned = 0
    breakouts_found = 0
    not_found = 0
    errors = 0

    for stock in stocks:
        result = scan_stock(stock)
        results[stock.id] = result

        if result.get("current_price") is not None:
            stocks_scanned += 1

        if result.get("status") == "YES":
            breakouts_found += 1
        elif result.get("status") == "NOT FOUND":
            not_found += 1
        elif result.get("status") == "ERROR":
            errors += 1

        time.sleep(2)

    return {
        "results": results,
        "stocks_scanned": stocks_scanned,
        "breakouts_found": breakouts_found,
        "not_found": not_found,
        "errors": errors
    }
