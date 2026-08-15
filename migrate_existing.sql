USE stock_breakout3;

-- If your current column is trade_date:
ALTER TABLE stock_master RENAME COLUMN trade_date TO date;

-- Add current price:
ALTER TABLE stock_master
    ADD COLUMN current_price DECIMAL(14,2) NULL AFTER stoploss;

-- Verify:
DESCRIBE stock_master;
