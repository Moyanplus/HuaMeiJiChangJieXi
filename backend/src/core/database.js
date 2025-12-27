const sqlite3 = require("sqlite3").verbose();
const path = require("path");

/**
 * 贵宾厅数据存储与查询封装。
 */
class VipRoomDatabase {
  /**
   * 创建数据库实例。
   */
  constructor() {
    this.db = null;
  }

  /**
   * 初始化数据库连接并创建表结构。
   * @returns {Promise<void>}
   */
  init() {
    return new Promise((resolve, reject) => {
      try {
        const dbPath = path.join(__dirname, "..", "..", "data", "vip_room.db");
        this.db = new sqlite3.Database(dbPath, (err) => {
          if (err) {
            console.error("数据库连接失败:", err.message);
            reject(err);
          } else {
            console.log("✅ 数据库连接成功");
            this.createTables()
              .then(() => this.ensureUserDataColumns())
              .then(resolve)
              .catch(reject);
          }
        });
      } catch (err) {
        console.error("数据库连接失败:", err.message);
        reject(err);
      }
    });
  }

  /**
   * 创建业务所需的数据表。
   * @returns {Promise<void>}
   */
  createTables() {
    return new Promise((resolve, reject) => {
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS user_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userName TEXT NOT NULL,
          bespeakCardType TEXT,
          orderNo TEXT NOT NULL,
          serverName TEXT,
          telephone TEXT,
          h5OrderId TEXT,
          activityId TEXT,
          h5OrderNo TEXT,
          orderTime TEXT,
          couponSync INTEGER,
          loungeCode TEXT,
          rightsRemainPoint TEXT,
          endTime TEXT,
          status INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS cities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          siteCode TEXT UNIQUE NOT NULL,
          cityName TEXT NOT NULL,
          cityCode TEXT,
          cityEnName TEXT,
          siteName TEXT NOT NULL,
          siteEnName TEXT,
          countryCode TEXT NOT NULL,
          countryName TEXT NOT NULL,
          countryEnName TEXT,
          siteType INTEGER,
          isActive INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS city_sync_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sync_date DATE UNIQUE NOT NULL,
          total_cities INTEGER NOT NULL,
          domestic_count INTEGER NOT NULL,
          international_count INTEGER NOT NULL,
          sync_status TEXT NOT NULL,
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS lounges (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          loungeCode TEXT UNIQUE NOT NULL,
          loungeName TEXT NOT NULL,
          cityName TEXT NOT NULL,
          cityCode TEXT,
          cityEnName TEXT,
          countryCode TEXT NOT NULL,
          countryName TEXT NOT NULL,
          countryEnName TEXT,
          siteName TEXT NOT NULL,
          siteCode TEXT,
          siteType TEXT,
          terminalName TEXT,
          terminalCode TEXT,
          terminalEnName TEXT,
          businessHours TEXT,
          deductPoints INTEGER,
          loungeType TEXT,
          domesticForeign TEXT,
          address TEXT,
          latitude TEXT,
          longitude TEXT,
          serviceName TEXT,
          continentName TEXT,
          continentEnName TEXT,
          isActive INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS lounge_sync_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sync_date DATE UNIQUE NOT NULL,
          total_lounges INTEGER NOT NULL,
          domestic_count INTEGER NOT NULL,
          international_count INTEGER NOT NULL,
          sync_status TEXT NOT NULL,
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      this.db.exec(createTableSQL, (err) => {
        if (err) {
          console.error("创建表失败:", err.message);
          reject(err);
        } else {
          console.log("✅ 数据表创建成功");
          resolve();
        }
      });
    });
  }

  /**
   * 确保 user_data 表包含短信相关字段。
   * @returns {Promise<void>}
   */
  ensureUserDataColumns() {
    return new Promise((resolve, reject) => {
      this.db.all("PRAGMA table_info(user_data)", (err, rows) => {
        if (err) {
          console.error("读取表结构失败:", err.message);
          reject(err);
          return;
        }

        const existing = new Set(rows.map((row) => row.name));
        const alterStatements = [];

        if (!existing.has("smsToken")) {
          alterStatements.push(
            "ALTER TABLE user_data ADD COLUMN smsToken TEXT"
          );
        }
        if (!existing.has("smsTokenUpdatedAt")) {
          alterStatements.push(
            "ALTER TABLE user_data ADD COLUMN smsTokenUpdatedAt DATETIME"
          );
        }
        if (!existing.has("smsTokenExpiresAt")) {
          alterStatements.push(
            "ALTER TABLE user_data ADD COLUMN smsTokenExpiresAt DATETIME"
          );
        }

        if (alterStatements.length === 0) {
          resolve();
          return;
        }

        let remaining = alterStatements.length;
        this.db.serialize(() => {
          alterStatements.forEach((statement) => {
            this.db.run(statement, (alterErr) => {
              if (alterErr) {
                console.error("更新表结构失败:", alterErr.message);
              }
              remaining -= 1;
              if (remaining <= 0) {
                resolve();
              }
            });
          });
        });
      });
    });
  }

  /**
   * 保存用户数据。
   * @param {Object} userData - 用户数据
   * @returns {Promise<{id: number, changes: number}>}
   */
  saveUserData(userData) {
    return new Promise((resolve, reject) => {
      const {
        userName,
        bespeakCardType,
        orderNo,
        serverName,
        telephone,
        h5OrderId,
        activityId,
        h5OrderNo,
        orderTime,
        couponSync,
        loungeCode,
        rightsRemainPoint,
        endTime,
        status,
      } = userData;

      const sql = `
        INSERT OR REPLACE INTO user_data (
          userName, bespeakCardType, orderNo, serverName, 
          telephone, h5OrderId, activityId, h5OrderNo, orderTime, 
          couponSync, loungeCode, rightsRemainPoint, endTime, status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const params = [
        userName,
        bespeakCardType,
        orderNo,
        serverName,
        telephone,
        h5OrderId,
        activityId,
        h5OrderNo,
        orderTime,
        couponSync,
        loungeCode,
        rightsRemainPoint,
        endTime,
        status,
      ];

      this.db.run(sql, params, function (err) {
        if (err) {
          console.error("保存用户数据失败:", err.message);
          reject(err);
        } else {
          console.log(`✅ 用户数据保存成功: ${userName} (ID: ${this.lastID})`);
          resolve({
            id: this.lastID,
            changes: this.changes,
          });
        }
      });
    });
  }

  /**
   * 根据姓名查询最新用户数据。
   * @param {string} userName - 用户姓名
   * @returns {Promise<Object|null>}
   */
  getUserDataByName(userName) {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT * FROM user_data WHERE userName = ? ORDER BY updated_at DESC LIMIT 1";

      this.db.get(sql, [userName], (err, row) => {
        if (err) {
          console.error("查询用户数据失败:", err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * 根据订单号查询最新用户数据。
   * @param {string} orderNo - 订单号
   * @returns {Promise<Object|null>}
   */
  getUserDataByOrderNo(orderNo) {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT * FROM user_data WHERE orderNo = ? ORDER BY updated_at DESC LIMIT 1";

      this.db.get(sql, [orderNo], (err, row) => {
        if (err) {
          console.error("查询用户数据失败:", err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * 获取所有用户数据。
   * @returns {Promise<Object[]>}
   */
  getAllUserData() {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM user_data ORDER BY updated_at DESC";

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error("查询所有用户数据失败:", err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 根据订单号写入短信 token。
   * @param {Object} payload - smsToken 数据
   * @param {string} payload.orderId - 订单号（通常为 h5OrderNo）
   * @param {string} payload.smsToken - 短信 token
   * @param {string|null} payload.expiresAt - 过期时间（ISO）
   * @returns {Promise<{changes: number}>}
   */
  updateSmsTokenByOrderId({ orderId, smsToken, expiresAt }) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE user_data
        SET smsToken = ?,
            smsTokenUpdatedAt = CURRENT_TIMESTAMP,
            smsTokenExpiresAt = ?
        WHERE h5OrderNo = ? OR orderNo = ? OR h5OrderId = ?
      `;

      const params = [smsToken, expiresAt, orderId, orderId, orderId];
      this.db.run(sql, params, function (err) {
        if (err) {
          console.error("更新短信token失败:", err.message);
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  /**
   * 短信验证码流程补充写入用户数据（缺失时）。
   * @param {Object} payload - 用户数据
   * @param {string} payload.userName - 用户姓名（用于查询）
   * @param {string} payload.orderId - 订单号（h5OrderNo）
   * @param {string} payload.telephone - 手机号
   * @returns {Promise<{id: number, changes: number}>}
   */
  insertSmsUserData({ userName, orderId, telephone }) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO user_data (
          userName, orderNo, serverName, telephone,
          h5OrderNo, status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      const params = [
        userName,
        orderId,
        "机场贵宾厅",
        telephone || null,
        orderId,
        2,
      ];

      this.db.run(sql, params, function (err) {
        if (err) {
          console.error("写入短信用户数据失败:", err.message);
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            changes: this.changes,
          });
        }
      });
    });
  }

  /**
   * 批量保存城市数据。
   * @param {Object[]} citiesData - 城市数据列表
   * @returns {Promise<{successCount: number, errorCount: number, total: number}>}
   */
  saveCitiesData(citiesData) {
    return new Promise((resolve, reject) => {
      if (
        !citiesData ||
        !Array.isArray(citiesData) ||
        citiesData.length === 0
      ) {
        reject(new Error("城市数据为空或格式不正确"));
        return;
      }

      // 开始事务
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");

        // 先清空现有数据
        this.db.run("DELETE FROM cities", (err) => {
          if (err) {
            console.error("清空城市数据失败:", err.message);
            this.db.run("ROLLBACK");
            reject(err);
            return;
          }
        });

        // 批量插入新数据
        const stmt = this.db.prepare(`
          INSERT INTO cities (
            siteCode, cityName, cityCode, cityEnName, siteName, 
            siteEnName, countryCode, countryName, countryEnName, siteType
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let successCount = 0;
        let errorCount = 0;

        citiesData.forEach((city, index) => {
          stmt.run(
            [
              city.siteCode,
              city.cityName,
              city.cityCode,
              city.cityEnName,
              city.siteName,
              city.siteEnName,
              city.countryCode,
              city.countryName,
              city.countryEnName,
              city.siteType,
            ],
            (err) => {
              if (err) {
                console.error(`保存城市数据失败 (${index + 1}):`, err.message);
                errorCount++;
              } else {
                successCount++;
              }

              // 如果是最后一条记录，提交事务
              if (index === citiesData.length - 1) {
                stmt.finalize((err) => {
                  if (err) {
                    console.error("准备语句关闭失败:", err.message);
                    this.db.run("ROLLBACK");
                    reject(err);
                  } else {
                    this.db.run("COMMIT", (err) => {
                      if (err) {
                        console.error("提交事务失败:", err.message);
                        reject(err);
                      } else {
                        console.log(
                          `✅ 城市数据保存完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`
                        );
                        resolve({
                          successCount,
                          errorCount,
                          total: citiesData.length,
                        });
                      }
                    });
                  }
                });
              }
            }
          );
        });
      });
    });
  }

  /**
   * 获取所有城市数据。
   * @returns {Promise<Object[]>}
   */
  getAllCities() {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT * FROM cities WHERE isActive = 1 ORDER BY countryCode, cityName";

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error("查询城市数据失败:", err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 根据国家代码获取城市数据。
   * @param {string} countryCode - 国家代码
   * @returns {Promise<Object[]>}
   */
  getCitiesByCountry(countryCode) {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT * FROM cities WHERE countryCode = ? AND isActive = 1 ORDER BY cityName";

      this.db.all(sql, [countryCode], (err, rows) => {
        if (err) {
          console.error("根据国家查询城市数据失败:", err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 按关键字搜索城市数据。
   * @param {string} keyword - 搜索关键字
   * @returns {Promise<Object[]>}
   */
  searchCities(keyword) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM cities 
        WHERE isActive = 1 AND (
          cityName LIKE ? OR 
          cityEnName LIKE ? OR 
          siteName LIKE ? OR 
          siteEnName LIKE ? OR
          countryName LIKE ? OR
          countryEnName LIKE ?
        ) 
        ORDER BY countryCode, cityName
        LIMIT 50
      `;

      const searchTerm = `%${keyword}%`;

      this.db.all(
        sql,
        [
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
          searchTerm,
        ],
        (err, rows) => {
          if (err) {
            console.error("搜索城市数据失败:", err.message);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  /**
   * 保存城市同步日志。
   * @param {Object} syncData - 同步日志数据
   * @returns {Promise<{id: number, changes: number}>}
   */
  saveSyncLog(syncData) {
    return new Promise((resolve, reject) => {
      const {
        syncDate,
        totalCities,
        domesticCount,
        internationalCount,
        syncStatus,
        errorMessage,
      } = syncData;

      const sql = `
        INSERT OR REPLACE INTO city_sync_log (
          sync_date, total_cities, domestic_count, international_count, 
          sync_status, error_message
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          syncDate,
          totalCities,
          domesticCount,
          internationalCount,
          syncStatus,
          errorMessage,
        ],
        function (err) {
          if (err) {
            console.error("保存同步日志失败:", err.message);
            reject(err);
          } else {
            console.log(
              `✅ 同步日志保存成功: ${syncDate} (ID: ${this.lastID})`
            );
            resolve({ id: this.lastID, changes: this.changes });
          }
        }
      );
    });
  }

  /**
   * 获取城市同步日志。
   * @param {number} limit - 返回数量
   * @returns {Promise<Object[]>}
   */
  getSyncLogs(limit = 30) {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM city_sync_log ORDER BY sync_date DESC LIMIT ?";

      this.db.all(sql, [limit], (err, rows) => {
        if (err) {
          console.error("查询同步日志失败:", err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 批量保存贵宾厅数据。
   * @param {Object[]} lounges - 贵宾厅数据列表
   * @returns {Promise<{successCount: number, errorCount: number, total: number}>}
   */
  saveLounges(lounges) {
    return new Promise((resolve, reject) => {
      if (!lounges || !Array.isArray(lounges) || lounges.length === 0) {
        reject(new Error("贵宾厅数据为空或格式不正确"));
        return;
      }

      // 开始事务
      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");

        // 先清空现有数据
        this.db.run("DELETE FROM lounges", (err) => {
          if (err) {
            console.error("清空贵宾厅数据失败:", err.message);
            this.db.run("ROLLBACK");
            reject(err);
            return;
          }
        });

        // 批量插入新数据
        const stmt = this.db.prepare(`
          INSERT INTO lounges (
            loungeCode, loungeName, cityName, cityCode, cityEnName,
            countryCode, countryName, countryEnName, siteName, siteCode,
            siteType, terminalName, terminalCode, terminalEnName,
            businessHours, deductPoints, loungeType, domesticForeign,
            address, latitude, longitude, serviceName, continentName,
            continentEnName
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let successCount = 0;
        let errorCount = 0;

        lounges.forEach((lounge, index) => {
          stmt.run(
            [
              lounge.loungeCode,
              lounge.loungeName,
              lounge.cityName,
              lounge.cityCode,
              lounge.cityEnName,
              lounge.countryCode,
              lounge.countryName,
              lounge.countryEnName,
              lounge.siteName,
              lounge.siteCode,
              lounge.siteType,
              lounge.terminalName,
              lounge.terminalCode,
              lounge.terminalEnName,
              lounge.businessHours,
              lounge.deductPoints,
              lounge.loungeType,
              lounge.domesticForeign,
              lounge.address,
              lounge.latitude,
              lounge.longitude,
              lounge.serviceName,
              lounge.continentName,
              lounge.continentEnName,
            ],
            (err) => {
              if (err) {
                console.error(
                  `保存贵宾厅数据失败 (${index + 1}):`,
                  err.message
                );
                errorCount++;
              } else {
                successCount++;
              }

              // 如果是最后一条记录，提交事务
              if (index === lounges.length - 1) {
                stmt.finalize((err) => {
                  if (err) {
                    console.error("准备语句关闭失败:", err.message);
                    this.db.run("ROLLBACK");
                    reject(err);
                  } else {
                    this.db.run("COMMIT", (err) => {
                      if (err) {
                        console.error("提交事务失败:", err.message);
                        reject(err);
                      } else {
                        console.log(
                          `✅ 贵宾厅数据保存完成: 成功 ${successCount} 条, 失败 ${errorCount} 条`
                        );
                        resolve({
                          successCount,
                          errorCount,
                          total: lounges.length,
                        });
                      }
                    });
                  }
                });
              }
            }
          );
        });
      });
    });
  }

  /**
   * 获取贵宾厅数据列表。
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Object[]>}
   */
  getLounges(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT * FROM lounges 
        WHERE isActive = 1
      `;
      const params = [];

      // 添加过滤条件
      if (filters.countryCode) {
        sql += ` AND countryCode = ?`;
        params.push(filters.countryCode);
      }

      if (filters.cityCode) {
        sql += ` AND cityCode = ?`;
        params.push(filters.cityCode);
      }

      if (filters.search) {
        sql += ` AND (
          loungeName LIKE ? OR 
          loungeCode LIKE ? OR 
          cityName LIKE ? OR 
          siteName LIKE ? OR 
          terminalName LIKE ?
        )`;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      sql += ` ORDER BY countryName, cityName, siteName, loungeName`;

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error("获取贵宾厅数据失败:", err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 搜索贵宾厅数据。
   * @param {string} query - 搜索关键字
   * @param {number} limit - 返回数量
   * @returns {Promise<Object[]>}
   */
  searchLounges(query, limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM lounges 
        WHERE isActive = 1 AND (
          loungeName LIKE ? OR 
          loungeCode LIKE ? OR 
          cityName LIKE ? OR 
          siteName LIKE ? OR 
          terminalName LIKE ?
        )
        ORDER BY 
          CASE 
            WHEN loungeCode LIKE ? THEN 1
            WHEN loungeName LIKE ? THEN 2
            WHEN cityName LIKE ? THEN 3
            ELSE 4
          END,
          countryName, cityName, siteName, loungeName
        LIMIT ?
      `;

      const searchTerm = `%${query}%`;
      const params = [
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        limit,
      ];

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error("搜索贵宾厅失败:", err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 保存贵宾厅同步日志。
   * @param {Object} syncData - 同步日志数据
   * @returns {Promise<void>}
   */
  saveLoungeSyncLog(syncData) {
    return new Promise((resolve, reject) => {
      const {
        syncDate,
        totalLounges,
        domesticCount,
        internationalCount,
        syncStatus,
        errorMessage,
      } = syncData;

      const sql = `
        INSERT OR REPLACE INTO lounge_sync_log (
          sync_date, total_lounges, domestic_count, international_count, 
          sync_status, error_message
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          syncDate,
          totalLounges,
          domesticCount,
          internationalCount,
          syncStatus,
          errorMessage,
        ],
        (err) => {
          if (err) {
            console.error("保存贵宾厅同步日志失败:", err.message);
            reject(err);
          } else {
            console.log(`✅ 贵宾厅同步日志保存成功: ${syncDate}`);
            resolve();
          }
        }
      );
    });
  }

  /**
   * 关闭数据库连接。
   * @returns {void}
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error("关闭数据库失败:", err.message);
        } else {
          console.log("✅ 数据库连接已关闭");
        }
      });
    }
  }
}

module.exports = VipRoomDatabase;
