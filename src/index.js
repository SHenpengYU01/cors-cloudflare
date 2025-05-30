// // 允许代理的目标域名白名单
// const ALLOWED_DOMAINS = [
//   "t.alcy.cc"   // 你的主要目标域名
// ];

// // 主处理函数
// export default {
//   async fetch(request, env) {
//     try {
//       // 1. 只允许GET请求（提高安全性）
//       if (request.method !== "GET") {
//         return createJsonResponse(
//           { error: "只允许GET请求" },
//           405,
//           { "Allow": "GET" }
//         );
//       }

//       // 2. 解析请求URL
//       const url = new URL(request.url);
//       const targetUrl = url.searchParams.get("url");
      
//       // 3. 验证目标URL是否存在
//       if (!targetUrl) {
//         return createJsonResponse(
//           { error: "缺少url参数" },
//           400
//         );
//       }
      
//       // 4. 验证目标域名是否在白名单中
//       if (!isDomainAllowed(targetUrl)) {
//         return createJsonResponse(
//           { error: "禁止访问的域名" },
//           403
//         );
//       }

//       // 5. 创建代理请求头
//       const proxyHeaders = new Headers({
//         "User-Agent": "Cloudflare-CORS-Proxy/1.0",
//         "Accept": "application/json",
//         "X-Forwarded-For": request.headers.get("CF-Connecting-IP") || ""
//       });
      
//       // 6. 添加认证头（如果配置了环境变量）
//       if (env.AUTH_KEY) {
//         const authHeader = request.headers.get("X-Auth-Key");
//         if (authHeader !== env.AUTH_KEY) {
//           return createJsonResponse(
//             { error: "未授权的访问" },
//             401
//           );
//         }
//       }

//       // 7. 构建代理请求
//       const proxyRequest = new Request(targetUrl, {
//         headers: proxyHeaders,
//         method: "GET",
//         redirect: "follow"
//       });

//       // 8. 发送请求到目标服务器
//       const response = await fetch(proxyRequest);
      
//       // 9. 检查目标服务器响应状态
//       if (!response.ok) {
//         return createJsonResponse(
//           { 
//             error: "上游服务器错误",
//             status: response.status,
//             url: targetUrl
//           },
//           502
//         );
//       }

//       // 10. 创建可修改的响应副本
//       const modifiedResponse = new Response(response.body, response);
      
//       // 11. 添加CORS头（核心功能）
//       modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
//       modifiedResponse.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
//       modifiedResponse.headers.set("Access-Control-Max-Age", "86400"); // 24小时缓存
      
//       // 12. 添加安全头
//       modifiedResponse.headers.set("X-Content-Type-Options", "nosniff");
//       modifiedResponse.headers.set("X-Proxy-Service", "Cloudflare-Worker-CORS");
//       modifiedResponse.headers.set("X-Target-URL", targetUrl);
      
//       // 13. 可选：添加缓存头
//       // modifiedResponse.headers.set("Cache-Control", "public, max-age=300");
      
//       return modifiedResponse;
      
//     } catch (error) {
//       // 全局错误处理
//       return createJsonResponse(
//         { 
//           error: "代理服务器错误",
//           message: error.message,
//           stack: env.ENVIRONMENT === "development" ? error.stack : undefined
//         },
//         500
//       );
//     }
//   }
// };

// // ===== 工具函数 ===== //

// // 检查域名是否在白名单中
// function isDomainAllowed(targetUrl) {
//   try {
//     const parsedUrl = new URL(targetUrl);
//     return ALLOWED_DOMAINS.some(domain => 
//       parsedUrl.hostname === domain || 
//       parsedUrl.hostname.endsWith(`.${domain}`)
//     );
//   } catch (error) {
//     return false;
//   }
// }

// // 创建JSON响应
// function createJsonResponse(data, status = 200, headers = {}) {
//   return new Response(JSON.stringify(data, null, 2), {
//     status,
//     headers: {
//       "Content-Type": "application/json",
//       "Access-Control-Allow-Origin": "*",
//       ...headers
//     }
//   });
// }


// src/index.js
export default {
  async fetch(request) {
    // 允许代理的目标域名白名单
    const ALLOWED_DOMAINS = [
        "t.alcy.cc",
        "www.dmoe.cc",
        "api.lolicon.app",
        "www.loliapi.com",
        "img.paulzzh.com",
        "image.baidu.com"
    ];
    
    try {
      // 1. 只允许GET请求
      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }
      
      // 2. 解析请求URL
      const url = new URL(request.url);
      const targetUrl = url.searchParams.get("url");
      
      // 3. 验证目标URL
      if (!targetUrl) {
        return new Response("Missing URL parameter", { status: 400 });
      }
      
      // 4. 检查域名是否在白名单
      try {
        const parsedUrl = new URL(targetUrl);
        if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
          return new Response("Forbidden domain", { status: 403 });
        }
      } catch {
        return new Response("Invalid target URL", { status: 400 });
      }
      
      // 5. 发送代理请求
      const response = await fetch(targetUrl);
      
      // 6. 创建可修改的响应
      const modifiedResponse = new Response(response.body, response);
      
      // 7. 添加CORS头
      modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
      modifiedResponse.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      
      return modifiedResponse;
      
    } catch (error) {
      return new Response("Proxy error: " + error.message, { status: 500 });
    }
  }
};