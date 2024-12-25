import axios from "axios"

const instance = axios.create()

instance.interceptors.request.use((config) => {
  config.headers["Accept-Language"] = "en-US,en;q=0.9"
  config.headers["Content-Type"] = "text/html; charset=utf-8"
  config.headers["User-Agent"] =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
  return config
})

export default instance
