// lib/cloudbase/client.ts
// ============================================================================
// 腾讯云云开发（CloudBase）浏览器端接入
// ----------------------------------------------------------------------------
// - 仅注入 NEXT_PUBLIC_TCB_ENV（环境 ID，属于可公开信息），真实密钥不进前端包。
// - 未配置环境 ID 时 getTcbApp() / callTcbFunction() 返回 null，
//   上层（db、verifySkills）自动回退本地实现，保证构建与运行都不中断。
// - 云函数调用走匿名登录（signInAnonymously），无需用户注册。
// ============================================================================

let appPromise: Promise<any> | null = null;
// 一旦云端鉴权失败（如控制台未开启「匿名登录」），本会话内不再反复尝试云调用，
// 避免浏览器控制台反复刷 "invalidaccesskey" 等鉴权报错。刷新页面会重置。
let cloudDisabled = false;
let warnedOnce = false;

/** 返回配置好的 CloudBase 环境 ID，未配置（或仍是占位符）返回 null */
export function tcbEnv(): string | null {
  const env = import.meta.env.VITE_TCB_ENV;
  return env && env.trim().length > 0 && !env.includes("__REPLACE") ? env : null;
}

/** 懒加载并初始化 CloudBase Web SDK（仅在浏览器执行，避免破坏静态构建） */
export async function getTcbApp(): Promise<any | null> {
  const env = tcbEnv();
  if (!env || cloudDisabled) return null;
  if (typeof window === "undefined") return null;

  if (!appPromise) {
    appPromise = (async () => {
      try {
        const tcb = (await import("@cloudbase/js-sdk")).default;
        const app = tcb.init({ env });
        // 匿名登录：云函数调用需要登录态来给请求签名。
        // 若控制台未开启「匿名登录」，这里会失败——此时云端调用必失败，
        // 提前标记 cloudDisabled，后续直接走本地，彻底避免刷 invalidaccesskey。
        try {
          await app.auth().signInAnonymously();
        } catch {
          cloudDisabled = true;
          if (!warnedOnce) {
            warnedOnce = true;
            console.info(
              "[tcb] 未检测到匿名登录，已切换本地模式。如需启用云端（队友共享库 / 云端大模型审查），请在 CloudBase 控制台开启「匿名登录」后刷新。"
            );
          }
          appPromise = null;
          return null;
        }
        return app;
      } catch (e) {
        cloudDisabled = true;
        console.warn("[tcb] init 失败，已切本地模式：", e instanceof Error ? e.message : e);
        appPromise = null;
        return null;
      }
    })();
  }
  return appPromise;
}

/**
 * 调用云函数；任何失败（未配置 / 鉴权 / 网络 / 函数错误）都返回 null，
 * 由调用方回退到本地逻辑。这是「云端优先、本地兜底」的核心切换点。
 * 一旦鉴权类错误出现，标记 cloudDisabled，后续调用直接返回 null（不再触发报错）。
 *
 * ⚠️ 免费版 CloudBase 没有「匿名登录 / WEB 安全域名」，SDK 调用（callFunction）
 * 永远走不通。因此 ai-verify、teammate-ops 改为走「HTTP 触发」公开 URL
 * （见 callAiVerifyHttp / callTeammateHttp），分别由 VITE_AI_VERIFY_HTTP_URL、
 * VITE_TEAMMATE_HTTP_URL 注入，彻底绕开登录态，让"云端大模型审查"和"队友共享池"
 * 在免费版可用。
 */
export async function callTcbFunction(name: string, data: unknown): Promise<any | null> {
  // —— 免费版关键分支：ai-verify / teammate-ops 走 HTTP 触发，不依赖匿名登录 ——
  if (name === "ai-verify") {
    return callAiVerifyHttp(data);
  }
  if (name === "teammate-ops") {
    return callTeammateHttp(data);
  }
  if (cloudDisabled) return null;
  const app = await getTcbApp();
  if (!app) return null;
  try {
    const res = await app.callFunction({ name, data });
    return res?.result ?? null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e ?? "");
    // 鉴权/签名类错误：不再反复尝试，避免控制台刷 invalidaccesskey
    if (/invalid.?access.?key|no.?auth|unauthorized|signature|forbidden/i.test(msg)) {
      cloudDisabled = true;
      if (!warnedOnce) {
        warnedOnce = true;
        console.info(
          "[tcb] 云端鉴权未就绪（常见于未开启「匿名登录」），已切换本地模式。开启后刷新即可启用云端。"
        );
      }
    } else {
      console.warn(`[tcb] callFunction ${name} 失败，回退本地：`, msg);
    }
    return null;
  }
}

/**
 * ai-verify 的 HTTP 触发调用：免费版无匿名登录，用公开 URL 直接 POST。
 * data 即 { profile }；函数返回 {statusCode,headers,body}（HTTP 触发）或裸对象，
 * 此处统一解包。任何失败都返回 null → 上层回退本地规则，页面不中断。
 */
async function callAiVerifyHttp(data: unknown): Promise<any | null> {
  const url = import.meta.env.VITE_AI_VERIFY_HTTP_URL as string | undefined;
  if (!url) {
    console.info("[ai-verify] 未配置 VITE_AI_VERIFY_HTTP_URL，回退本地规则");
    return null;
  }
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), // data 已是 { profile }
    });
    if (!resp.ok) {
      console.warn(`[ai-verify] HTTP 触发返回 ${resp.status}，回退本地`);
      return null;
    }
    const json = await resp.json();
    // HTTP 触发的响应体即结构化报告；若云函数未被正确解包则返回 {statusCode,body}
    if (json && typeof json.statusCode === "number") {
      if (json.statusCode >= 400) return null;
      const body = typeof json.body === "string" ? JSON.parse(json.body) : json.body;
      return body ?? null;
    }
    return json ?? null;
  } catch (e) {
    console.warn("[ai-verify] HTTP 调用失败，回退本地：", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * teammate-ops 的 HTTP 触发调用：免费版无匿名登录，用公开 URL 直接 POST。
 * data 即 { action, payload }；函数返回 {statusCode,headers,body}（HTTP 触发）或裸对象，
 * 此处统一解包。任何失败都返回 null → 上层（db.ts）回退本地 localStorage，页面不中断。
 * 未配置 VITE_TEAMMATE_HTTP_URL 时返回 null，队友投稿自动退化为纯本地模式。
 */
async function callTeammateHttp(data: unknown): Promise<any | null> {
  const url = import.meta.env.VITE_TEAMMATE_HTTP_URL as string | undefined;
  if (!url) {
    console.info("[teammate-ops] 未配置 VITE_TEAMMATE_HTTP_URL，回退本地投稿");
    return null;
  }
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data), // data 已是 { action, payload }
    });
    if (!resp.ok) {
      console.warn(`[teammate-ops] HTTP 触发返回 ${resp.status}，回退本地`);
      return null;
    }
    const json = await resp.json();
    // HTTP 触发的响应体即 { rows } / { ok,id }；若函数被未解包则返回 {statusCode,body}
    if (json && typeof json.statusCode === "number") {
      if (json.statusCode >= 400) return null;
      const body = typeof json.body === "string" ? JSON.parse(json.body) : json.body;
      return body ?? null;
    }
    return json ?? null;
  } catch (e) {
    console.warn("[teammate-ops] HTTP 调用失败，回退本地：", e instanceof Error ? e.message : e);
    return null;
  }
}
