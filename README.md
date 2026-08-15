# Stock Breakout 3 - Final CRUD Version

## What this version does

- Automatically creates the MySQL database `stock_breakout3` if the MySQL server is reachable.
- Automatically creates `stock_master` on Flask startup.
- No `scan_runs` table.
- No scan-history table.
- Master columns:
  Date, Symbol, Stocks, Exchange, BreakOut Level, StopLoss, Current Price, YouTuber, Advisor, Category.
- Add records from the web UI.
- Edit existing records.
- Delete records.
- Upload CSV or XLSX.
- Existing symbol + exchange is updated during upload instead of duplicated.
- Category dropdown is populated from the database.
- Run Scan fetches prices only for the selected category.
- Successfully fetched current prices are saved in `stock_master.current_price`.
- Download the filtered master data as Excel.

## Start

1. Copy `.env.example` to `.env`.
2. Set MySQL credentials.
3. Make sure MySQL Server is running.
4. Install:
   `pip install -r requirements.txt`
5. Run:
   `python app.py`

You do NOT need to manually create the database or table. The application calls `CREATE DATABASE IF NOT EXISTS` and then `db.create_all()`.

## Upload format

CSV/XLSX headers should be:

Date, Symbol, Stocks, Exchange, BreakOut Level, StopLoss, Current Price, You Tuber, Advisor, Category

The importer also accepts:
- Stock Name instead of Stocks
- breakout_level / breakout
- stop loss
- youtuber / youtube
- current price

## Google Finance

Put your existing Google Finance price-fetching implementation into:
`services/scanner.py -> fetch_current_price(stock)`

The scanner receives only the stocks in the selected category. Current prices are saved into `stock_master.current_price`.
