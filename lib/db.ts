/* eslint-disable @typescript-eslint/no-explicit-any */
import sqlite3 from "sqlite3"

// 创建数据库连接的类型
interface MediaContent {
  Ssd: string
  raw_data?: string
}

// 创建一个全局的数据库连接
const db = new sqlite3.Database("./db/media_contents.db", (err) => {
  if (err) {
    console.error("数据库连接失败:", err.message)
  } else {
    console.log("数据库连接成功")
  }
})

// 创建表函数
function createTableIfNotExists(): Promise<void> {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS media_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_data TEXT,
      ssd TEXT UNIQUE
    );
  `

  return new Promise((resolve, reject) => {
    db.run(createTableQuery, (err) => {
      if (err) {
        reject("创建表时出错: " + err)
      } else {
        console.log("表已创建或已存在。")
        resolve()
      }
    })
  })
}

// 插入数据逻辑
function insertData(mediaContents: MediaContent[]): Promise<void> {
  return new Promise((resolve, reject) => {
    db.all("SELECT ssd FROM media_contents", [], (err, rows) => {
      if (err) {
        reject("查询已存在数据失败: " + err)
        return
      }

      // 将已存在的 Ssd 转为 Set
      const existingSsd = new Set(rows.map((row) => (row as any).ssd))

      // 筛选出新的 MediaContents 数据
      const newMediaContents = mediaContents.filter((content) => {
        return !existingSsd.has(content.Ssd)
      })

      // 如果没有新的数据需要插入，直接返回
      if (newMediaContents.length === 0) {
        console.log("没有新的数据需要插入。")
        resolve()
        return
      }

      // 插入数据的 SQL 语句
      const query = `
        INSERT INTO media_contents (raw_data, ssd)
        VALUES (?, ?)
      `

      db.serialize(() => {
        db.run("BEGIN TRANSACTION")

        newMediaContents.forEach((content) => {
          db.run(
            query,
            [
              JSON.stringify(content), // 存储完整 JSON 数据
              content.Ssd || null, // 用于去重
            ],
            (err) => {
              if (err) {
                console.error("插入数据失败:", err)
              }
            }
          )
        })

        db.run("COMMIT", (commitErr) => {
          if (commitErr) {
            reject(commitErr)
          } else {
            console.log("数据插入成功！")
            resolve()
          }
        })
      })
    })
  })
}

// 主逻辑
async function write(mediaContents: MediaContent[]): Promise<void> {
  try {
    await createTableIfNotExists() // 确保表已创建
    await insertData(mediaContents) // 插入数据
  } catch (error) {
    console.error("发生错误:", error)
  }
}

async function read(): Promise<MediaContent[]> {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM media_contents", [], (err, rows) => {
      if (err) {
        reject("查询失败: " + err)
      } else {
        resolve(rows as any[]) // rows 是包含所有查询结果的数组
      }
    })
  })
}

export { write, read }
