// 数据库连接配置
export const dbConfig = {
  host: 'vrdakongjian2-db-mysql.ns-p1o2ywgc.svc',
  port: 3306,
  user: 'root',
  password: '72hxlcr7',
  database: 'vr_management'
}

// 数据库表结构SQL
export const createTablesSQL = `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'shop') NOT NULL,
  shop_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 店铺表
CREATE TABLE IF NOT EXISTS shops (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  contact VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  admin_account VARCHAR(50) NOT NULL,
  admin_password VARCHAR(255) NOT NULL,
  auth_start_time TIMESTAMP NOT NULL,
  auth_end_time TIMESTAMP NOT NULL,
  share_amount DECIMAL(10,2) NULL,
  share_ratio DECIMAL(5,2) NULL,
  suggested_price DECIMAL(10,2) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- VR内容表
CREATE TABLE IF NOT EXISTS vr_contents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  total_levels INT NOT NULL,
  total_duration INT NOT NULL COMMENT '总时长(分钟)',
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- VR设备表
CREATE TABLE IF NOT EXISTS vr_devices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_code VARCHAR(20) UNIQUE NOT NULL,
  shop_id INT NOT NULL,
  status ENUM('online', 'offline', 'playing', 'paused') DEFAULT 'offline',
  current_content_id INT NULL,
  current_level INT DEFAULT 0,
  last_active_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (current_content_id) REFERENCES vr_contents(id) ON DELETE SET NULL
);

-- 店铺内容分配表
CREATE TABLE IF NOT EXISTS shop_content_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shop_id INT NOT NULL,
  content_id INT NOT NULL,
  auth_start_time TIMESTAMP NOT NULL,
  auth_end_time TIMESTAMP NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_shop_content (shop_id, content_id),
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES vr_contents(id) ON DELETE CASCADE
);

-- 播放记录表
CREATE TABLE IF NOT EXISTS play_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  device_id INT NOT NULL,
  content_id INT NOT NULL,
  shop_id INT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NULL,
  current_level INT DEFAULT 1,
  total_levels INT NOT NULL,
  is_valid BOOLEAN DEFAULT FALSE COMMENT '是否有效播放(>=2分钟)',
  amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES vr_devices(id) ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES vr_contents(id) ON DELETE CASCADE,
  FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
);

-- 初始化管理员账户
INSERT IGNORE INTO users (username, password, role) VALUES 
('admin', '$2b$10$rQJ.K1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K1K1', 'admin');

-- 初始化示例VR内容
INSERT IGNORE INTO vr_contents (title, description, total_levels, total_duration, price) VALUES 
('VR冒险游戏', '刺激的冒险体验，包含多个精彩关卡', 10, 120, 20.00),
('太空探索', '探索神秘的宇宙空间', 8, 90, 18.00),
('海底世界', '深入海底探索海洋生物', 12, 150, 25.00),
('恐龙时代', '回到侏罗纪时代与恐龙互动', 15, 180, 30.00),
('未来城市', '体验未来科技城市生活', 6, 75, 15.00);
`