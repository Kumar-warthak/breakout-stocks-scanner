CREATE DATABASE IF NOT EXISTS stock_breakout3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stock_breakout3;
CREATE TABLE IF NOT EXISTS stock_master (
 id INT AUTO_INCREMENT PRIMARY KEY,
 date DATE NOT NULL,
 symbol VARCHAR(50) NOT NULL,
 stock_name VARCHAR(255) NOT NULL,
 exchange VARCHAR(10) NOT NULL DEFAULT 'NSE',
 breakout_level DECIMAL(14,2) NOT NULL,
 stoploss DECIMAL(14,2) NOT NULL,
 current_price DECIMAL(14,2) NULL,
 youtuber VARCHAR(100),
 advisor VARCHAR(100),
 category VARCHAR(100) NOT NULL DEFAULT 'Breakouts',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 UNIQUE KEY uq_symbol_exchange(symbol,exchange),
 INDEX idx_date(date),
 INDEX idx_category(category)
);
