#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_OUTPUT_DIR = path.resolve(process.cwd(), "tmp/ddkk-springboot");
const DEFAULT_USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";

function parseArgs(argv) {
    const args = {
        url: "",
        outDir: DEFAULT_OUTPUT_DIR,
        limit: Number.POSITIVE_INFINITY,
        single: false,
        includeIndex: false,
        overwrite: false,
    };

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];

        if (arg === "--url") {
            args.url = argv[i + 1] || "";
            i += 1;
        } else if (arg === "--out-dir") {
            args.outDir = path.resolve(process.cwd(), argv[i + 1] || DEFAULT_OUTPUT_DIR);
            i += 1;
        } else if (arg === "--limit") {
            args.limit = Number(argv[i + 1] || Number.POSITIVE_INFINITY);
            i += 1;
        } else if (arg === "--single") {
            args.single = true;
        } else if (arg === "--include-index") {
            args.includeIndex = true;
        } else if (arg === "--overwrite") {
            args.overwrite = true;
        } else if (arg === "--help" || arg === "-h") {
            printHelp();
            process.exit(0);
        }
    }

    if (!args.url) {
        printHelp();
        throw new Error("缺少 --url 参数");
    }

    return args;
}

function printHelp() {
    console.log(`
用法:
  node script/ddkk-scrape.js --url <ddkk页面地址> [--out-dir 目录] [--limit N] [--single] [--include-index] [--overwrite]

示例:
  node script/ddkk-scrape.js --url https://ddkk.com/springboot/4-action/index.html
  node script/ddkk-scrape.js --url https://ddkk.com/springboot/4-action/1.html --limit 3
  node script/ddkk-scrape.js --url https://ddkk.com/springboot/4-action/1.html --single
    `.trim());
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
    return decodeHtml(
        html
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>/gi, "\n")
            .replace(/<[^>]+>/g, "")
    )
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .trim();
}

function decodeHtml(text) {
    const named = {
        amp: "&",
        lt: "<",
        gt: ">",
        quot: '"',
        apos: "'",
        nbsp: " ",
    };

    return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, entity) => {
        if (entity[0] === "#") {
            const isHex = entity[1]?.toLowerCase() === "x";
            const value = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
            return Number.isNaN(value) ? _ : String.fromCodePoint(value);
        }

        return named[entity] ?? _;
    });
}

function extractMatch(html, pattern, label) {
    const match = html.match(pattern);
    if (!match) {
        throw new Error(`未找到 ${label}`);
    }
    return match[1];
}

function normalizeWhitespace(text) {
    return text.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim();
}

function slugify(text) {
    return text
        .replace(/[\\/:*?"<>|]/g, "-")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\.+$/g, "");
}

function extractTitle(html) {
    const articleTitleMatch = html.match(/<h1[^>]*class="pb-1 fw-bold"[^>]*>([\s\S]*?)<\/h1>/i);
    if (articleTitleMatch) {
        return stripTags(articleTitleMatch[1]);
    }

    const categoryTitleMatch = html.match(/<h1[^>]*class="ddkk-category-hero-title"[^>]*>([\s\S]*?)<\/h1>/i);
    if (categoryTitleMatch) {
        return stripTags(categoryTitleMatch[1]);
    }

    throw new Error("未找到文章标题");
}

function extractDate(html) {
    const pageInfo = extractMatch(html, /<div class="page-info[^"]*"[^>]*>([\s\S]*?)<\/div>/i, "文章信息");
    const match = pageInfo.match(/<span class="blog-post-meta">(\d{4}-\d{2}-\d{2})<\/span>/i);
    return match ? match[1] : "";
}

function extractCategory(html) {
    const pageInfo = extractMatch(html, /<div class="page-info[^"]*"[^>]*>([\s\S]*?)<\/div>/i, "文章信息");
    const match = pageInfo.match(/<a[^>]*class="me-3"[^>]*>([\s\S]*?)<\/a>/i);
    return match ? stripTags(match[1]) : "";
}

function absolutizeUrl(url, href) {
    return new URL(href, url).toString();
}

function parseSidebarLinks(html, pageUrl) {
    const sectionMatches = [...html.matchAll(/<span class="ddkk-sidebar-article-group-title-text">([\s\S]*?)<\/span>/gi)];
    const sections = sectionMatches.map((match) => stripTags(match[1]));
    const groups = [...html.matchAll(/<ul class="ddkk-sidebar-article-group-content">([\s\S]*?)<\/ul>/gi)];
    const articles = [];

    groups.forEach((groupMatch, groupIndex) => {
        const section = sections[groupIndex] || `分组-${groupIndex + 1}`;
        const linkMatches = groupMatch[1].matchAll(/<a class="ddkk-sidebar-article-link[^"]*"[\s\S]*?href="([^"]+)"[\s\S]*?>([\s\S]*?)<\/a>/gi);
        for (const linkMatch of linkMatches) {
            articles.push({
                section,
                url: absolutizeUrl(pageUrl, linkMatch[1]),
                title: stripTags(linkMatch[2]),
            });
        }
    });

    return dedupeByUrl(articles);
}

function parseGuideLinks(html, pageUrl) {
    const links = [...html.matchAll(/<a[^>]+href="(https?:\/\/www\.ddkk\.com\/springboot\/4-action\/\d+\.html)"[^>]*>([\s\S]*?)<\/a>/gi)];
    return dedupeByUrl(
        links.map((match) => ({
            section: "阅读指南",
            url: absolutizeUrl(pageUrl, match[1]),
            title: stripTags(match[2]),
        }))
    );
}

function parseCategoryArticleLinks(html, pageUrl) {
    const articleGroupMatches = [...html.matchAll(/<div class="ddkk-category-article-group">([\s\S]*?)<\/ul>/gi)];
    const entries = [];

    articleGroupMatches.forEach((groupMatch, index) => {
        const groupHtml = groupMatch[1];
        const groupTitle = stripTags(groupHtml.match(/<h3 class="ddkk-category-article-group-title">([\s\S]*?)<\/h3>/i)?.[1] || `分组-${index + 1}`);
        const linkMatches = groupHtml.matchAll(/<a[^>]*class="ddkk-sidebar-article-link[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi);

        for (const linkMatch of linkMatches) {
            entries.push({
                section: groupTitle,
                url: absolutizeUrl(pageUrl, linkMatch[1]),
                title: stripTags(linkMatch[2]),
            });
        }
    });

    if (entries.length > 0) {
        return dedupeByUrl(entries);
    }

    const fallbackLinks = [...html.matchAll(/<a[^>]+href="(\/zhuanlan\/[^"]+\/\d+\.html)"[^>]*>([\s\S]*?)<\/a>/gi)];
    return dedupeByUrl(
        fallbackLinks.map((match) => ({
            section: "专栏文章",
            url: absolutizeUrl(pageUrl, match[1]),
            title: stripTags(match[2]),
        }))
    );
}

function dedupeByUrl(items) {
    const seen = new Set();
    return items.filter((item) => {
        if (seen.has(item.url)) {
            return false;
        }
        seen.add(item.url);
        return true;
    });
}

function extractArticleHtml(html) {
    return extractMatch(
        html,
        /<article class="article-content markdown-body">([\s\S]*?)<\/article>/i,
        "文章正文"
    );
}

function convertArticleHtmlToMarkdown(articleHtml) {
    let html = articleHtml.replace(/\r/g, "").trim();
    const codeBlocks = [];

    html = html.replace(/<pre[^>]*>\s*<code[^>]*class="[^"]*language-([^"\s]+)[^"]*"[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, lang, code) => {
        const token = `__DDKK_CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push(`\`\`\`${lang}\n${extractCodeText(code)}\n\`\`\``);
        return `\n\n${token}\n\n`;
    });

    html = html.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, code) => {
        const token = `__DDKK_CODE_BLOCK_${codeBlocks.length}__`;
        codeBlocks.push(`\`\`\`\n${extractCodeText(code)}\n\`\`\``);
        return `\n\n${token}\n\n`;
    });

    html = html.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
        const text = stripTags(content)
            .split("\n")
            .map((line) => (line.trim() ? `> ${line.trim()}` : ">"))
            .join("\n");
        return `\n\n${text}\n\n`;
    });

    html = html.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, level, content) => {
        return `\n\n${"#".repeat(Number(level))} ${stripTags(content)}\n\n`;
    });

    html = html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, content) => {
        return `\n\n${convertList(content, false)}\n\n`;
    });

    html = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, content) => {
        return `\n\n${convertList(content, true)}\n\n`;
    });

    html = html.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, content) => {
        return `\n\n${convertInline(content)}\n\n`;
    });

    html = html.replace(/<br\s*\/?>/gi, "\n");
    html = html.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, content) => {
        return `\n\n${stripTags(content)}\n\n`;
    });
    html = html.replace(/<[^>]+>/g, "");

    let markdown = normalizeWhitespace(decodeHtml(html)).replace(/\n{3,}/g, "\n\n");

    markdown = markdown.replace(/__DDKK_CODE_BLOCK_(\d+)__/g, (_, index) => codeBlocks[Number(index)] || "");

    return markdown;
}

function stripLeadingTrailingNewlines(text) {
    return text.replace(/^\n+|\n+$/g, "");
}

function extractCodeText(codeHtml) {
    return decodeHtml(
        stripLeadingTrailingNewlines(
            codeHtml
                .replace(/<br\s*\/?>/gi, "\n")
                .replace(/<\/span>/gi, "")
                .replace(/<span[^>]*>/gi, "")
                .replace(/<[^>]+>/g, "")
        )
    );
}

function convertList(content, ordered) {
    const items = [...content.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
    return items
        .map((match, index) => `${ordered ? `${index + 1}.` : "-"} ${convertInline(match[1])}`)
        .join("\n");
}

function convertInline(content) {
    let html = content;

    html = html.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
        const label = stripTags(text);
        return label ? `[${label}](${decodeHtml(href)})` : decodeHtml(href);
    });

    html = html.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, text) => `**${stripTags(text)}**`);
    html = html.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_, __, text) => `*${stripTags(text)}*`);
    html = html.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, text) => `\`${decodeHtml(stripTags(text))}\``);
    html = html.replace(/<br\s*\/?>/gi, "\n");
    html = html.replace(/<\/?(span|div|section|article)[^>]*>/gi, "");

    return decodeHtml(stripTags(html))
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function buildMarkdown(doc) {
    const header = [
        `# ${doc.title}`,
        "",
        `- 来源：${doc.url}`,
        doc.category ? `- 分类：${doc.category}` : "",
        doc.section ? `- 分组：${doc.section}` : "",
        doc.date ? `- 日期：${doc.date}` : "",
        "",
    ]
        .filter(Boolean)
        .join("\n");

    return `${header}\n${doc.content}\n`;
}

function buildOutputFileName(doc) {
    return `${slugify(doc.section || "未分组")}__${slugify(doc.title)}.md`;
}

async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function scrapeArticle(entry, overwrite) {
    const html = await fetchHtml(entry.url);
    const title = extractTitle(html);
    const articleHtml = extractArticleHtml(html);

    return {
        title,
        url: entry.url,
        section: entry.section,
        category: extractCategory(html),
        date: extractDate(html),
        content: convertArticleHtmlToMarkdown(articleHtml),
        overwrite,
    };
}

function deriveEntries(pageUrl, html, options) {
    if (options.single) {
        return [
            {
                section: "单篇文章",
                url: pageUrl,
                title: extractTitle(html),
            },
        ];
    }

    const fromSidebar = parseSidebarLinks(html, pageUrl).filter((item) => options.includeIndex || !/\/index\.html$/i.test(item.url));
    if (fromSidebar.length > 0) {
        return fromSidebar;
    }

    const fromCategory = parseCategoryArticleLinks(html, pageUrl);
    if (fromCategory.length > 0) {
        return fromCategory;
    }

    const fromGuide = parseGuideLinks(html, pageUrl);
    if (fromGuide.length > 0) {
        return fromGuide;
    }

    if (/\/\d+\.html$/i.test(pageUrl)) {
        return [
            {
                section: "单篇文章",
                url: pageUrl,
                title: extractTitle(html),
            },
        ];
    }

    throw new Error("当前页面里没有解析出文章链接");
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    await ensureDir(args.outDir);

    const rootHtml = await fetchHtml(args.url);
    const entries = deriveEntries(args.url, rootHtml, args).slice(0, args.limit);

    console.log(`准备抓取 ${entries.length} 篇文章，输出目录：${args.outDir}`);

    const indexRows = [];

    for (const entry of entries) {
        console.log(`抓取中: ${entry.title} - ${entry.url}`);
        const doc = await scrapeArticle(entry, args.overwrite);
        const fileName = buildOutputFileName(doc);
        const filePath = path.join(args.outDir, fileName);

        if (!args.overwrite && (await fileExists(filePath))) {
            console.log(`跳过已存在文件: ${fileName}`);
            indexRows.push(`- [${doc.title}](./${fileName})`);
            continue;
        }

        await fs.writeFile(filePath, buildMarkdown(doc), "utf8");
        indexRows.push(`- [${doc.title}](./${fileName})`);
    }

    const readmePath = path.join(args.outDir, "README.md");
    const readme = `# DDKK 抓取结果\n\n- 入口：${args.url}\n- 文章数：${entries.length}\n\n${indexRows.join("\n")}\n`;
    await fs.writeFile(readmePath, readme, "utf8");

    console.log(`完成，共输出 ${entries.length} 篇内容`);
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
