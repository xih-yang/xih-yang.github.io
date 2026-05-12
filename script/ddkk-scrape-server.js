#!/usr/bin/env node

const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");
const { spawn } = require("node:child_process");

const HOST = process.env.DDKK_SCRAPE_HOST || "127.0.0.1";
const PORT = Number(process.env.DDKK_SCRAPE_PORT || 3456);
const CORS_ORIGIN = process.env.DDKK_SCRAPE_ORIGIN || "*";
const PROJECT_ROOT = process.cwd();
const DEFAULT_USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": CORS_ORIGIN,
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end(JSON.stringify(payload));
}

function collectBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
    });
}

function isValidDdkkUrl(value) {
    try {
        const url = new URL(value);
        return /(^|\.)ddkk\.com$/i.test(url.hostname);
    } catch {
        return false;
    }
}

async function listMarkdownFiles(outDir) {
    const entries = await fs.readdir(outDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b, "zh-CN"));
}

async function runScraper(payload) {
    const outDir = path.resolve(PROJECT_ROOT, payload.outDir || "tmp/ddkk-springboot-ui");
    const args = [
        "script/ddkk-scrape.js",
        "--url",
        payload.url,
        "--out-dir",
        outDir,
    ];

    if (payload.single) args.push("--single");
    if (payload.includeIndex) args.push("--include-index");
    if (payload.overwrite) args.push("--overwrite");
    if (payload.limit && Number.isFinite(Number(payload.limit)) && Number(payload.limit) > 0) {
        args.push("--limit", String(Number(payload.limit)));
    }

    const child = spawn(process.execPath, args, {
        cwd: PROJECT_ROOT,
        env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
        stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
        stderr += chunk.toString("utf8");
    });

    const exitCode = await new Promise((resolve, reject) => {
        child.on("error", reject);
        child.on("close", resolve);
    });

    const files = exitCode === 0 ? await listMarkdownFiles(outDir) : [];

    return {
        ok: exitCode === 0,
        exitCode,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        outDir,
        files,
    };
}

async function fetchHtml(url) {
    const response = await fetch(url, {
        headers: {
            "user-agent": DEFAULT_USER_AGENT,
            accept: "text/html,application/xhtml+xml",
        },
    });

    if (!response.ok) {
        throw new Error(`抓取失败: ${response.status} ${response.statusText} - ${url}`);
    }

    return response.text();
}

function stripTags(html) {
    return html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeSegment(text) {
    return text.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}

function deriveCategoryScrapeUrl(categoryUrl) {
    const normalized = categoryUrl.replace(/^https?:\/\/(?:www\.)?ddkk\.com/i, "https://ddkk.com");
    if (normalized.includes("/category/mq/")) {
        return normalized.replace("/category/mq/", "/zhuanlan/mq/");
    }
    return normalized.replace("/category/", "/zhuanlan/");
}

function parseMqCollectionItems(html) {
    const marker = 'id="mq"';
    const markerIndex = html.indexOf(marker);
    if (markerIndex === -1) {
        throw new Error("未找到消息队列合集区块");
    }

    const sectionStart = html.lastIndexOf('<section class="category-section">', markerIndex);
    if (sectionStart === -1) {
        throw new Error("未找到消息队列合集区块起点");
    }

    const nextSectionIndex = html.indexOf('<section class="category-section">', markerIndex + marker.length);
    const sectionHtml = html.slice(sectionStart, nextSectionIndex === -1 ? html.length : nextSectionIndex);
    const cardMatches = [...sectionHtml.matchAll(/<a href="([^"]+)"[\s\S]*?<h3 class="card-title">([\s\S]*?)<\/h3>/gi)];

    return cardMatches.map((match, index) => ({
        index: index + 1,
        title: stripTags(match[2]),
        categoryUrl: new URL(match[1], "https://ddkk.com").toString(),
        scrapeUrl: deriveCategoryScrapeUrl(new URL(match[1], "https://ddkk.com").toString()),
    }));
}

function parseCollectionItemsByMenuName(html, menuName) {
    const normalizedMenuName = menuName.trim();
    if (!normalizedMenuName) {
        throw new Error("菜单栏名称不能为空");
    }

    const sections = html.split('<section class="category-section">').slice(1);
    const sectionHtml = sections
        .map((section) => `<section class="category-section">${section}`)
        .find((section) => new RegExp(`<a class="category-heading"[\\s\\S]*?>${escapeRegExp(normalizedMenuName)}<\\/a>`, "i").test(section));

    if (!sectionHtml) {
        throw new Error(`未找到菜单栏：${normalizedMenuName}`);
    }

    const cardMatches = [...sectionHtml.matchAll(/<a href="([^"]+)"[\s\S]*?<h3 class="card-title">([\s\S]*?)<\/h3>/gi)];

    return cardMatches.map((match, index) => ({
        index: index + 1,
        title: stripTags(match[2]),
        categoryUrl: new URL(match[1], "https://ddkk.com").toString(),
        scrapeUrl: deriveCategoryScrapeUrl(new URL(match[1], "https://ddkk.com").toString()),
    }));
}

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function runMqQuickScrape() {
    const collectionName = "12、消息队列合集";
    const html = await fetchHtml("https://ddkk.com/");
    const items = parseMqCollectionItems(html);
    const logs = [];
    const tasks = [];

    for (const item of items) {
        const outDir = path.join("tmp", collectionName, `${item.index}、 ${normalizeSegment(item.title)}`);
        logs.push(`开始抓取 [${item.index}/${items.length}] ${item.title}`);
        const result = await runScraper({
            url: item.scrapeUrl,
            outDir,
            limit: 200,
            includeIndex: true,
            overwrite: true,
        });

        tasks.push({
            index: item.index,
            title: item.title,
            url: item.scrapeUrl,
            outDir: result.outDir,
            ok: result.ok,
            exitCode: result.exitCode,
            files: result.files,
            stdout: result.stdout,
            stderr: result.stderr,
        });

        logs.push(result.ok ? `完成: ${item.title}` : `失败: ${item.title}`);
    }

    const failed = tasks.filter((task) => !task.ok);

    return {
        ok: failed.length === 0,
        collectionName,
        total: tasks.length,
        failed: failed.length,
        logs,
        tasks,
    };
}

async function runMenuCollectionScrape(menuName) {
    const html = await fetchHtml("https://ddkk.com/");
    const items = parseCollectionItemsByMenuName(html, menuName);
    const logs = [];
    const tasks = [];

    for (const item of items) {
        const outDir = path.join("tmp", menuName, `${item.index}、 ${normalizeSegment(item.title)}`);
        logs.push(`开始抓取 [${item.index}/${items.length}] ${item.title}`);
        const result = await runScraper({
            url: item.scrapeUrl,
            outDir,
            limit: 200,
            includeIndex: true,
            overwrite: true,
        });

        tasks.push({
            index: item.index,
            title: item.title,
            url: item.scrapeUrl,
            outDir: result.outDir,
            ok: result.ok,
            exitCode: result.exitCode,
            files: result.files,
            stdout: result.stdout,
            stderr: result.stderr,
        });

        logs.push(result.ok ? `完成: ${item.title}` : `失败: ${item.title}`);
    }

    const failed = tasks.filter((task) => !task.ok);

    return {
        ok: failed.length === 0,
        collectionName: menuName,
        total: tasks.length,
        failed: failed.length,
        logs,
        tasks,
    };
}

const server = http.createServer(async (req, res) => {
    if (!req.url) {
        sendJson(res, 400, { ok: false, message: "缺少请求地址" });
        return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

    if (req.method === "OPTIONS") {
        res.writeHead(204, {
            "Access-Control-Allow-Origin": CORS_ORIGIN,
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        });
        res.end();
        return;
    }

    if (req.method === "GET" && requestUrl.pathname === "/api/ddkk/health") {
        sendJson(res, 200, {
            ok: true,
            host: HOST,
            port: PORT,
            cwd: PROJECT_ROOT,
        });
        return;
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/ddkk/scrape") {
        try {
            const rawBody = await collectBody(req);
            const payload = rawBody ? JSON.parse(rawBody) : {};

            if (!isValidDdkkUrl(payload.url || "")) {
                sendJson(res, 400, {
                    ok: false,
                    message: "只支持 ddkk.com 域名下的页面",
                });
                return;
            }

            const result = await runScraper(payload);
            sendJson(res, result.ok ? 200 : 500, result);
            return;
        } catch (error) {
            sendJson(res, 500, {
                ok: false,
                message: error instanceof Error ? error.message : "服务异常",
            });
            return;
        }
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/ddkk/quick-scrape-mq") {
        try {
            const result = await runMqQuickScrape();
            sendJson(res, result.ok ? 200 : 500, result);
            return;
        } catch (error) {
            sendJson(res, 500, {
                ok: false,
                message: error instanceof Error ? error.message : "服务异常",
            });
            return;
        }
    }

    if (req.method === "POST" && requestUrl.pathname === "/api/ddkk/quick-scrape-menu") {
        try {
            const rawBody = await collectBody(req);
            const payload = rawBody ? JSON.parse(rawBody) : {};
            const menuName = String(payload.menuName || "").trim();

            if (!menuName) {
                sendJson(res, 400, {
                    ok: false,
                    message: "缺少菜单栏名称",
                });
                return;
            }

            const result = await runMenuCollectionScrape(menuName);
            sendJson(res, result.ok ? 200 : 500, result);
            return;
        } catch (error) {
            sendJson(res, 500, {
                ok: false,
                message: error instanceof Error ? error.message : "服务异常",
            });
            return;
        }
    }

    sendJson(res, 404, { ok: false, message: "接口不存在" });
});

server.listen(PORT, HOST, () => {
    console.log(`DDKK scraper server running at http://${HOST}:${PORT}`);
});
