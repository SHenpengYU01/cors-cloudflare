// // 允许的域名白名单
// const ALLOWED_DOMAINS = [
//   "t.alcy.cc",  // 你的目标域名
//   // 可添加其他信任的域名
// ];

// addEventListener('fetch', event => {
//   event.respondWith(handleRequest(event.request))
// })

// async function handleRequest(request) {
//   try {
//     // 1. 只允许GET请求
//     if (request.method !== 'GET') {
//       return createResponse('只允许GET请求', 405);
//     }
    
//     // 2. 解析目标URL
//     const url = new URL(request.url);
//     const targetUrl = url.searchParams.get('url');
    
//     // 3. 验证目标URL
//     if (!targetUrl) {
//       return createResponse('缺少url参数', 400);
//     }
    
//     // 4. 检查域名是否在白名单
//     if (!isDomainAllowed(targetUrl)) {
//       return createResponse('禁止访问的域名', 403);
//     }
    
//     // 5. 创建代理请求
//     const proxyRequest = new Request(targetUrl, {
//       headers: {
//         'User-Agent': 'Cloudflare-CORS-Proxy/1.0',
//         // 可添加其他必要头信息
//       },
//       redirect: 'follow'
//     });
    
//     // 6. 发送请求
//     const response = await fetch(proxyRequest);
    
//     // 7. 创建可修改的响应
//     const modifiedResponse = new Response(response.body, response);
    
//     // 8. 添加CORS头
//     modifiedResponse.headers.set('Access-Control-Allow-Origin', '*');
//     modifiedResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
//     // 9. 添加安全头
//     modifiedResponse.headers.set('X-Content-Type-Options', 'nosniff');
//     modifiedResponse.headers.set('X-Proxy-Service', 'Cloudflare-Worker-CORS');
    
//     return modifiedResponse;
//   } catch (error) {
//     return createResponse(`代理错误: ${error.message}`, 500);
//   }
// }

// // 域名验证函数
// function isDomainAllowed(targetUrl) {
//   try {
//     const parsedUrl = new URL(targetUrl);
//     return ALLOWED_DOMAINS.includes(parsedUrl.hostname);
//   } catch {
//     return false;
//   }
// }

// // 创建响应辅助函数
// function createResponse(message, status = 200) {
//   return new Response(JSON.stringify({ error: message }), {
//     status,
//     headers: {
//       'Content-Type': 'application/json',
//       'Access-Control-Allow-Origin': '*'
//     }
//   });
// }

// 允许代理的目标域名白名单
const ALLOWED_DOMAINS = [
  "t.alcy.cc"   // 你的主要目标域名
];

// 主处理函数
export default {
  async fetch(request, env) {
    try {
      // 1. 只允许GET请求（提高安全性）
      if (request.method !== "GET") {
        return createJsonResponse(
          { error: "只允许GET请求" },
          405,
          { "Allow": "GET" }
        );
      }

      // 2. 解析请求URL
      const url = new URL(request.url);
      const targetUrl = url.searchParams.get("url");
      
      // 3. 验证目标URL是否存在
      if (!targetUrl) {
        return createJsonResponse(
          { error: "缺少url参数" },
          400
        );
      }
      
      // 4. 验证目标域名是否在白名单中
      if (!isDomainAllowed(targetUrl)) {
        return createJsonResponse(
          { error: "禁止访问的域名" },
          403
        );
      }

      // 5. 创建代理请求头
      const proxyHeaders = new Headers({
        "User-Agent": "Cloudflare-CORS-Proxy/1.0",
        "Accept": "application/json",
        "X-Forwarded-For": request.headers.get("CF-Connecting-IP") || ""
      });
      
      // 6. 添加认证头（如果配置了环境变量）
      if (env.AUTH_KEY) {
        const authHeader = request.headers.get("X-Auth-Key");
        if (authHeader !== env.AUTH_KEY) {
          return createJsonResponse(
            { error: "未授权的访问" },
            401
          );
        }
      }

      // 7. 构建代理请求
      const proxyRequest = new Request(targetUrl, {
        headers: proxyHeaders,
        method: "GET",
        redirect: "follow"
      });

      // 8. 发送请求到目标服务器
      const response = await fetch(proxyRequest);
      
      // 9. 检查目标服务器响应状态
      if (!response.ok) {
        return createJsonResponse(
          { 
            error: "上游服务器错误",
            status: response.status,
            url: targetUrl
          },
          502
        );
      }

      // 10. 创建可修改的响应副本
      const modifiedResponse = new Response(response.body, response);
      
      // 11. 添加CORS头（核心功能）
      modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
      modifiedResponse.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      modifiedResponse.headers.set("Access-Control-Max-Age", "86400"); // 24小时缓存
      
      // 12. 添加安全头
      modifiedResponse.headers.set("X-Content-Type-Options", "nosniff");
      modifiedResponse.headers.set("X-Proxy-Service", "Cloudflare-Worker-CORS");
      modifiedResponse.headers.set("X-Target-URL", targetUrl);
      
      // 13. 可选：添加缓存头
      // modifiedResponse.headers.set("Cache-Control", "public, max-age=300");
      
      return modifiedResponse;
      
    } catch (error) {
      // 全局错误处理
      return createJsonResponse(
        { 
          error: "代理服务器错误",
          message: error.message,
          stack: env.ENVIRONMENT === "development" ? error.stack : undefined
        },
        500
      );
    }
  }
};

// ===== 工具函数 ===== //

// 检查域名是否在白名单中
function isDomainAllowed(targetUrl) {
  try {
    const parsedUrl = new URL(targetUrl);
    return ALLOWED_DOMAINS.some(domain => 
      parsedUrl.hostname === domain || 
      parsedUrl.hostname.endsWith(`.${domain}`)
    );
  } catch (error) {
    return false;
  }
}

// 创建JSON响应
function createJsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      ...headers
    }
  });
}