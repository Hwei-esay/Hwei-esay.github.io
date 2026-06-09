document.addEventListener("DOMContentLoaded", () => {
  const linksProse = document.querySelector(".links-page .prose");

  if (linksProse) {
    const groups = [];
    let activeGroup = "other";

    [...linksProse.children].forEach((node) => {
      if (node.tagName === "H2") {
        activeGroup = node.textContent.trim();
        groups.push({ name: activeGroup, entries: [] });
      }

      if (node.tagName === "H3") {
        if (groups.length === 0) groups.push({ name: activeGroup, entries: [] });
        const anchor = node.querySelector("a");
        const description = node.nextElementSibling?.tagName === "P"
          ? node.nextElementSibling.textContent.trim()
          : "";
        if (anchor) {
          groups[groups.length - 1].entries.push({
            title: anchor.textContent.trim(),
            url: anchor.href,
            description
          });
        }
      }
    });

    const layout = document.createElement("div");
    layout.className = "links-layout";
    const sidebar = document.createElement("aside");
    sidebar.className = "listing-sidebar links-sidebar";
    sidebar.innerHTML = '<p class="panel-label">groups</p>';
    const filters = document.createElement("div");
    filters.className = "sidebar-filters";
    filters.setAttribute("aria-label", "Link group filters");
    filters.innerHTML = '<button class="filter-button is-active" type="button" data-filter="all" aria-pressed="true">&gt; all <span>›</span></button>';

    groups.forEach((group) => {
      const button = document.createElement("button");
      button.className = "filter-button";
      button.type = "button";
      button.dataset.filter = group.name;
      button.setAttribute("aria-pressed", "false");
      button.textContent = `_ ${group.name}`;
      filters.appendChild(button);
    });
    sidebar.appendChild(filters);

    const table = document.createElement("div");
    table.className = "links-table";
    table.setAttribute("role", "list");
    table.innerHTML = '<div class="links-head" aria-hidden="true"><span>#</span><span>title / description</span><span>url</span><span></span></div>';

    let index = 0;
    groups.forEach((group) => {
      group.entries.forEach((entry) => {
        index += 1;
        const row = document.createElement("a");
        row.className = "link-row";
        row.href = entry.url;
        row.dataset.categories = group.name;
        row.setAttribute("role", "listitem");
        row.innerHTML = `
          <span class="archive-index">${String(index).padStart(2, "0")}</span>
          <span class="link-title"><strong>${entry.title}</strong><small>${entry.description}</small></span>
          <span class="link-url">${entry.url}</span>
          <span class="external-mark" aria-hidden="true">↗</span>
        `;
        table.appendChild(row);
      });
    });

    layout.append(sidebar, table);
    linksProse.replaceChildren(layout);
  }

  const toc = document.querySelector("#article-toc");
  const article = document.querySelector(".article-content");

  if (toc && article) {
    const headings = [...article.querySelectorAll("h2, h3")];
    if (headings.length === 0) {
      toc.innerHTML = '<span class="muted">no sections</span>';
    } else {
      const list = document.createElement("ol");
      headings.forEach((heading, index) => {
        if (!heading.id) heading.id = `section-${index + 1}`;
        const item = document.createElement("li");
        if (heading.tagName === "H3") item.className = "toc-subitem";
        const link = document.createElement("a");
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
        item.appendChild(link);
        list.appendChild(item);
      });
      toc.replaceChildren(list);
    }
  }

  const filterButtons = [...document.querySelectorAll(".filter-button")];
  const archiveRows = [...document.querySelectorAll(".archive-row, .link-row")];

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      archiveRows.forEach((row) => {
        const categories = (row.dataset.categories || "").split(",");
        row.hidden = filter !== "all" && !categories.includes(filter);
      });
    });
  });
});
