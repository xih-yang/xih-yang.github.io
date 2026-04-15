(function () {
    // 标题
    const title = document.querySelector(".article-title")?.innerText.trim() || "juejin-article";

    // 内容 DOM
    const mdEl = document.querySelector(".markdown-body");
    if (!mdEl) return alert("未找到文章内容");

    // 简单转 MD
    let md = `# ${title}\n\n`;
    const nodes = mdEl.querySelectorAll("p, h1, h2, h3, h4, h5, h6, pre, ul, ol");

    nodes.forEach((n) => {
        const tag = n.tagName.toLowerCase();
        const text = n.innerText.trim();

        if (tag.startsWith("h")) {
            const level = parseInt(tag.replace("h", ""));
            md += `${"#".repeat(level)} ${text}\n\n`;
        } else if (tag === "pre") {
            md += "```\n" + text + "\n```\n\n";
        } else if (tag === "p") {
            md += text + "\n\n";
        } else if (tag === "ul" || tag === "ol") {
            n.querySelectorAll("li").forEach((li, i) => {
                md += (tag === "ul" ? "- " : `${i + 1}. `) + li.innerText.trim() + "\n";
            });
            md += "\n";
        }
    });

    // 下载
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = title + ".md";
    a.href = url;
    a.click();
})();