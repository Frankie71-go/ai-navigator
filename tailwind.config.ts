import type { Config } from "tailwindcss";

// 恢复的 Tailwind 配置（原文件遗失，按同项目设计系统 biz-navigator 的同款「极光浅色科技」主题重建）。
// 缺失此文件时 Tailwind v3 的 content 为空 → 所有工具类被 purge → 页面裸奔（仅剩 preflight）。
const config: Config = {
  content: [
    "./index.html",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // —— 「极光浅色科技」调色板：凉调白底 + 鲜活青蓝主色 + 靛蓝辅色 + 珊瑚橘点缀 ——
        ink: "#0f1b3d", // 主文字（深海军蓝，浅底上清晰）
        muted: "#5b6b8c", // 次要文字（蓝灰）
        line: "rgba(15,27,61,0.12)", // 分割线 / 边框（深底半透明）
        panel: "rgba(255,255,255,0.70)", // 玻璃面板底（浅透白）
        "panel-2": "rgba(255,255,255,0.85)",
        accent: "#06b6d4", // 主色（鲜活青蓝）
        accent2: "#6366f1", // 辅色（靛蓝）
        accent3: "#8b5cf6", // 点缀（紫罗兰，用于渐变）
        "accent-soft": "rgba(6,182,212,0.12)",
        "accent-warm": "#ff7a59", // 暖色点缀（珊瑚橘，用于交互焦点）
        "accent-warm-soft": "rgba(255,122,89,0.12)",
      },
      fontFamily: {
        sans: [
          "DM Sans",
          "-apple-system",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
        display: ["Space Grotesk", "DM Sans", "sans-serif"],
        mono: ["Space Grotesk", "DM Sans", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        // 浅底柔影，取代暗色外发光
        card: "0 1px 2px rgba(15,27,61,0.06), 0 8px 24px rgba(15,27,61,0.06)",
        // 高级感分层柔影（比 card 更深一档，用于悬停 / 浮起）
        elevate: "0 2px 6px rgba(15,27,61,0.05), 0 18px 44px rgba(15,27,61,0.13)",
        neon: "0 0 0 1px rgba(6,182,212,0.32), 0 0 18px rgba(6,182,212,0.18)",
        "neon-strong": "0 0 0 1px rgba(6,182,212,0.5), 0 0 26px rgba(6,182,212,0.28)",
        "neon-pink": "0 0 0 1px rgba(99,102,241,0.38), 0 0 18px rgba(99,102,241,0.20)",
        "neon-warm": "0 0 0 1px rgba(255,122,89,0.5), 0 0 20px rgba(255,122,89,0.30)",
        glass: "0 10px 30px rgba(15,27,61,0.10), inset 0 1px 0 rgba(255,255,255,0.6)",
        "glow-pulse": "0 0 22px rgba(6,182,212,0.30)",
      },
      backgroundImage: {
        "neon-grid":
          "linear-gradient(rgba(15,27,61,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,27,61,0.04) 1px, transparent 1px)",
        "neon-fade":
          "radial-gradient(1200px 520px at 50% -12%, rgba(6,182,212,0.12), transparent 70%)",
        // 极光：浅色双层柔光
        aurora:
          "radial-gradient(55% 50% at 18% 0%, rgba(6,182,212,0.12), transparent 60%), radial-gradient(45% 45% at 85% 8%, rgba(99,102,241,0.12), transparent 60%)",
        // 鲜活青蓝→靛蓝渐变（按钮/装饰用，已加深保证浅底白字对比）
        "neon-grad": "linear-gradient(120deg, #0891b2, #4338ca)",
      },
      keyframes: {
        flicker: {
          "0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%": { opacity: "1" },
          "20%, 22%, 24%, 55%": { opacity: "0.4" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-glow": {
          "0%,100%": { boxShadow: "0 0 12px rgba(6,182,212,0.18)" },
          "50%": { boxShadow: "0 0 22px rgba(6,182,212,0.36)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
      animation: {
        flicker: "flicker 4.5s infinite",
        scan: "scan 6s linear infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
