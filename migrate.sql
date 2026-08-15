USE stock_breakout3;

-- Run ONLY the statements needed for your existing table.
-- If trade_date exists:
-- ALTER TABLE stock_master RENAME COLUMN trade_date TO date;

-- Add latest Google Finance price:
ALTER TABLE stock_master
    ADD COLUMN current_price DECIMAL(14,2) NULL AFTER stoploss;
