import "dotenv/config";
import http from "http";

// 查询本地 Ollama 已下载模型
const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const url = new URL("/api/tags", baseUrl);

http.get(url, (res) => {
  let data = "";
  res.on("data", (d) => (data += d));
  res.on("end", () => {
    const payload = JSON.parse(data);
    const models = payload.models || [];

    console.log(`Ollama 地址: ${baseUrl}`);
    if (models.length === 0) {
      console.log("当前没有已下载模型，可先执行 `ollama pull qwen3:0.6b`。");
      return;
    }

    console.log("已下载模型：");
    models.forEach((model) => console.log(" -", model.name));
  });
});
