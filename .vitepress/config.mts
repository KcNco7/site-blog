import { defineConfig } from "vitepress";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  vite: {
    plugins: [
      visualizer({
        // open: true, // 构建完自动打开浏览器
        // gzipSize: true, // 显示 gzip 后的体积
        // brotliSize: true, // 显示 brotli 压缩后的体积
        // filename: "stats.html", // 报告文件保存位置
      }),
    ], // 打包分析
  },
  title: "加菲猫的博客",
  lastUpdated: true, // 显示最后更新时间
  head: [
    // SEO优化
    ["link", { rel: "icon", href: "/site-blog/favicon.ico" }], // 修改图标
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    [
      "meta",
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "加菲猫的技术知识库" }],
    ["meta", { property: "og:description", content: "记录自己的学习过程" }],
  ],
  // 站点地图 SEO
  sitemap: {
    hostname: "https://kcncozz.github.io/site-blog/",
  },

  markdown: {
    lineNumbers: true, // 显示代码行号
    image: {
      lazyLoading: true, // 默认禁用；设置为 true 可为所有图片启用懒加载。
    },
    // 代码块主题
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
  },

  description: "记录自己的学习过程",
  base: "/site-blog/",
  outDir: "docs", // 修改构建输出目录
  themeConfig: {
    logo: "logo.png", // 修改logo
    search: {
      provider: "local",
    },
    siteTitle: "加菲猫",
    // https://vitepress.dev/reference/default-theme-config

    // // 改进的导航
    outline: {
      level: [2, 3],
      label: "目录",
    },

    // 显示最后更新时间格式
    lastUpdated: {
      text: "最后更新于",
      formatOptions: {
        dateStyle: "short",
        timeStyle: "short",
      },
    },

    // 深色模式切换
    darkModeSwitchLabel: "主题",
    lightModeSwitchTitle: "切换到浅色模式",
    darkModeSwitchTitle: "切换到深色模式",

    // // 返回顶部 当前版本不生效
    // returnToTopLabel: "返回顶部",

    // 上下页导航标签 改为中文
    docFooter: {
      prev: "上一页",
      next: "下一页",
    },

    nav: [
      // 顶部导航栏
      {
        text: "主页",
        link: "/",
      },
      {
        text: "前端",
        items: [
          {
            text: "前端基础",
            link: "/src/frontend/base/html.md",
          },
          {
            text: "前端框架",
            link: "/src/frontend/framework/vue3.md",
          },
          {
            text: "前端工具",
            link: "/src/frontend/ESLint、OXC（Oxlint）和 Prettier 说明.md",
          },
        ],
      },
      {
        text: "后端",
        items: [
          {
            text: "nestjs",
            link: "/src/backend/TS后端/nestjs-xmzs.md",
          },
          {
            text: "Go",
            link: "/src/backend/Go/go基础.md",
          },
          {
            text: "中间件",
            link: "/src/backend/中间件/docker.md",
          },
        ],
      },
      {
        text: "AI",
        items: [
          {
            text: "Langchain",
            link: "/src/AI/Langchain/Langchain.md",
          },
          {
            text: "RAG",
            link: "/src/AI/Langchain/RAG.md",
          },
          {
            text: "Agent",
            link: "/src/AI/Langchain/Agent.md",
          },
        ],
      },
      {
        text: "项目总结",
        items: [
          {
            text: "Nestjs项目",
            link: "/src/demo/nestjs+vue3项目前置知识总结.md",
          },
        ],
      },
      {
        text: "小知识",
        link: "/src/web/git.md",
      },
      {
        text: "随便记录",
        items: [
          { text: "碎碎念", link: "/src/other/2026年的碎碎念.md" },
          { text: "装机流程", link: "/src/other/装机注意事项.md" },
          { text: "剪辑技巧", link: "/src/other/jianji/达芬奇.md" },
        ],
      },
    ],

    // 主要内容
    sidebar: {
      // 前端
      "/src/frontend/": [
        {
          text: "前端",
          items: [
            {
              text: "前端基础",
              items: [
                {
                  text: "HTML",
                  link: "/src/frontend/base/html.md",
                },
                {
                  text: "CSS",
                  link: "/src/frontend/base/css.md",
                },
                {
                  text: "JavaScript",
                  link: "/src/frontend/base/javascript.md",
                },
                {
                  text: "JavaScript 常用方法参考",
                  link: "/src/frontend/base/JS方法参考手册.md",
                },
              ],
            },
            {
              text: "前端框架",
              items: [
                {
                  text: "Vue3",
                  link: "/src/frontend/framework/vue3.md",
                },
                {
                  text: "Vue3-review",
                  link: "/src/frontend/framework/vue3-review.md",
                },
                {
                  text: "React19",
                  link: "/src/frontend/framework/react.md",
                },
                {
                  text: "Nextjs",
                  link: "/src/frontend/framework/nextjs.md",
                },
              ],
            },
            {
              text: "TailwindCSS",
              link: "/src/frontend/base/tailwindcss4.md",
            },
            {
              text: "AJAX",
              link: "/src/frontend/ajax.md",
            },
            {
              text: "Vite",
              link: "/src/frontend/vite.md",
            },
            {
              text: "TypeScript",
              link: "/src/frontend/typescript.md",
            },
            {
              text: "nodejs",
              link: "/src/frontend/nodejs.md",
            },
          ],
        },
        {
          text: "前端工具部分",
          items: [
            {
              text: "ESLint、OXC（Oxlint）和 Prettier 说明",
              link: "/src/frontend/ESLint、OXC（Oxlint）和 Prettier 说明.md",
            },
            {
              text: "package.json 与前端工程化工具说明",
              link: "/src/frontend/package.json 与前端工程化工具说明.md",
            },
          ],
        },
      ],
      // 后端
      "/src/backend/": [
        {
          text: "后端",
          items: [
            {
              text: "TS",
              items: [
                {
                  text: "nestjs-xmzs",
                  link: "/src/backend/TS后端/nestjs-xmzs.md",
                },
                {
                  text: "nestjs-alex",
                  link: "/src/backend/TS后端/nestjs-Alex.md",
                },
              ],
            },
            {
              text: "Go",
              items: [
                {
                  text: "Go",
                  link: "/src/backend/Go/go基础.md",
                },
              ],
            },
            {
              text: "Java",
              items: [
                { text: "JavaSE", link: "/src/backend/Java/JavaSE.md" },
                { text: "JavaWeb", link: "/src/backend/Java/JavaWeb.md" },
                { text: "SpringSSM", link: "/src/backend/Java/SpringSSM.md" },
                { text: "Springboot", link: "/src/backend/Java/Springboot.md" },
                {
                  text: "SpringCloud",
                  link: "/src/backend/Java/SpringCloud.md",
                },
              ],
            },
            {
              text: "中间件",
              items: [
                { text: "Docker", link: "/src/backend/中间件/docker.md" },
              ],
            },
          ],
        },
      ],
      // 小知识
      "/src/web/": [
        {
          text: "小知识总结",
          items: [
            { text: "Git", link: "/src/web/git.md" },
            { text: "EventLoop", link: "/src/web/EventLoop.md" },
            { text: "小知识总结", link: "/src/web/小知识总结.md" },
            { text: "RBAC", link: "/src/web/RBAC权限控制.md" },
            { text: "JWT", link: "/src/web/JWT.md" },
            {
              text: "Axios二次封装示例",
              link: "/src/web/axios二次封装示例.md",
            },
            {
              text: "Vue3常用宏讲解",
              link: "/src/web/vue3常用宏讲解",
            },
            // { text: "正则表达式", link: "/src/web/正则表达式.md" },
          ],
        },
      ],
      // AI
      "/src/AI/": [
        {
          text: "AI",
          items: [
            {
              text: "Langchain",
              link: "/src/AI/Langchain/Langchain.md",
            },
            {
              text: "Langchain自己总结的",
              link: "/src/AI/Langchain/Langchain-自己总结的.md",
            },
            {
              text: "RAG",
              link: "/src/AI/Langchain/RAG.md",
            },
            {
              text: "Agent",
              link: "/src/AI/Langchain/Agent.md",
            },
          ],
        },
        {
          text: "Codex命令总结",
          link: "/src/AI/Codex命令总结.md",
        },
      ],
      // 项目总结
      "/src/demo/": [
        {
          text: "项目总结",
          items: [
            {
              text: "Nestjs项目",
              items: [
                {
                  text: "Nestjs项目前置知识总结",
                  link: "/src/demo/nestjs+vue3项目前置知识总结.md",
                },
              ],
            },
          ],
        },
      ],
      // 其他
      "/src/other/": [
        { text: "2026年学习日志", link: "/src/other/2026年的碎碎念.md" },
        {
          text: "碎碎念",
          items: [
            {
              text: "一些需要记录的东西",
              // link: "/src/other/装机注意事项.md",
              items: [
                { text: "装机注意事项", link: "/src/other/装机注意事项.md" },
                { text: "电影清单", link: "/src/other/电影清单.md" },
                {
                  text: "简单记录一下工作流程",
                  link: "/src/other/工作流程.md",
                },
                {
                  text: "配置 Go 环境",
                  link: "/src/other/配置 Go 环境.md",
                },
                {
                  text: "雅思",
                  link: "/src/other/雅思.md",
                },
              ],
            },
            {
              text: "一些小知识",
              items: [
                { text: "剪映", link: "/src/other/jianji/剪映.md" },
                { text: "达芬奇", link: "/src/other/jianji/达芬奇.md" },
                { text: "测试页面", link: "/src/other/jianji/测试页面.md" },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026-present Xiaoai Student",
    },
    socialLinks: [{ icon: "github", link: "https://github.com/KcNcozz" }],
  },
  ignoreDeadLinks: true, // 忽略所有死链检查
});
