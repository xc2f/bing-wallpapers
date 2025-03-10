/* eslint-disable @typescript-eslint/no-explicit-any */
import request from "./request"
import * as cheerio from "cheerio"
import { write, read } from "./db"
import { write as write_low } from "./db_low"
import "dotenv/config"

const BASE_URL = process.env.BASE_URL

// 从字符串中提取 `MediaContents` 对象
function extractWallpapersFromData(htmlContent: string): any[] {
  const modelDataMatch = htmlContent.match(/var _model\s*=\s*({[\s\S]*?});/)
  if (modelDataMatch) {
    try {
      const modelData = JSON.parse(modelDataMatch[1])
      return modelData.MediaContents || []
    } catch (error) {
      console.error("JSON 解析失败:", error)
      return []
    }
  } else {
    console.error("未找到 _model 数据块")
    return []
  }
}

// 转换响应数据，提取 MediaContents
const extractWallpapersFromResponse = (htmlContent: string): any[] => {
  const $ = cheerio.load(htmlContent)
  const scripts = $("script")
    .map((idx, el) => $(el).html())
    .toArray()

  const mediaContentScriptBlock = scripts.find((script) =>
    script.includes("MediaContents")
  )
  return mediaContentScriptBlock
    ? extractWallpapersFromData(mediaContentScriptBlock)
    : []
}

// 定义抓取壁纸函数
const fetchWallpapers = async (): Promise<any[] | null> => {
  try {
    // 请求目标网站
    const response = await request.get(BASE_URL as string, {
      params: {
        setlang: "en",
        cc: "hk",
      },
    })
    return extractWallpapersFromResponse(response.data)
  } catch (error) {
    console.error("抓取失败:", error)
    return null
  }
}

// 保存壁纸数据到数据库
async function saveWallpapers() {
  const wallpapers = await fetchWallpapers()
  if (wallpapers && wallpapers.length > 0) {
    console.log("sqlite写入开始...")
    await write(wallpapers)
    console.log("sqlite写入完成！")
    console.log("lowdb写入开始...")
    await write_low(wallpapers)
    console.log("lowdb写入完成！")
  } else {
    console.log("没有找到可保存的壁纸数据。")
  }
}

// 获取壁纸数据
async function getWallpapers() {
  try {
    const wallpapers = await read()
    if (wallpapers && wallpapers.length > 0) {
      console.log("壁纸数据读取成功！", wallpapers)
    } else {
      console.log("没有壁纸数据。")
    }
    return wallpapers
  } catch (error) {
    console.error("读取壁纸数据失败:", error)
    return []
  }
}

export { saveWallpapers, getWallpapers }
