import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"
import { join } from "path"

// 创建数据库文件的路径
const dbFilePath = join("./db", "media_contents.json")

// 定义数据库结构类型
interface MediaContent {
  Ssd: string
  raw_data?: string
}

interface DatabaseSchema {
  mediaContents: MediaContent[]
}

// 初始化 LowDB 实例
const adapter = new JSONFile<DatabaseSchema>(dbFilePath)
const db = new Low(adapter, { mediaContents: [] })

// 初始化数据库默认值
async function initializeDatabase(): Promise<void> {
  await db.read()
  if (!db.data) {
    db.data = { mediaContents: [] }
    await db.write()
  }
}

// 插入数据逻辑
async function insertData(mediaContents: MediaContent[]): Promise<void> {
  await initializeDatabase()

  const existingSsd = new Set(
    db.data.mediaContents.map((content) => content.Ssd)
  )

  // 筛选出新的 MediaContents 数据
  const newMediaContents = mediaContents.filter(
    (content) => !existingSsd.has(content.Ssd)
  )

  if (newMediaContents.length === 0) {
    console.log("没有新的数据需要插入。")
    return
  }

  // 插入新数据
  db.data.mediaContents.push(...newMediaContents)
  await db.write()
  console.log("数据插入成功！")
}

// 读取数据逻辑
async function readData(): Promise<MediaContent[]> {
  await initializeDatabase()
  return db.data.mediaContents
}

// 主逻辑
async function write(mediaContents: MediaContent[]): Promise<void> {
  try {
    await insertData(mediaContents)
  } catch (error) {
    console.error("发生错误:", error)
  }
}

async function read(): Promise<MediaContent[]> {
  try {
    return await readData()
  } catch (error) {
    console.error("读取数据时发生错误:", error)
    return []
  }
}

export { write, read }
