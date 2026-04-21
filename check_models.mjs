import "dotenv/config";
import https from "https";

// 查询 OpenRouter 当前所有免费模型
const options = {
  hostname: "openrouter.ai",
  path: "/api/v1/models",
  headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
};

https.get(options, (res) => {
  let data = "";
  res.on("data", (d) => (data += d));
  res.on("end", () => {
    const models = JSON.parse(data).data.filter((x) => x.id.includes(":free"));
    console.log("支持 tools 的免费模型：");
    models.forEach((x) => {
      const params = x.supported_parameters || [];
      if (params.includes("tools")) console.log(" -", x.id);
    });
    console.log("\n所有免费模型：");
    models.forEach((x) => console.log(" -", x.id));
  });
});
