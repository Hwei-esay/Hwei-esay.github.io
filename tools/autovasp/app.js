import { categories, parameters, templates } from "./parameter-schema.js";
import { generateScript } from "./script-generator.js";

const clone = (value) => JSON.parse(JSON.stringify(value));

function closeHelpPopovers(except = null) {
  document.querySelectorAll(".help-popover:not([hidden])").forEach((popover) => {
    if (popover === except) return;
    popover.hidden = true;
    popover.closest(".help-wrap")?.querySelector(".help-button")?.setAttribute("aria-expanded", "false");
  });
}

class ParameterStore {
  constructor(schema) {
    this.schema = schema;
    this.defaults = Object.fromEntries(schema.map((item) => [item.name, clone(item.defaultValue)]));
    this.values = clone(this.defaults);
    this.listeners = new Set();
  }

  get(name) {
    return this.values[name];
  }

  set(name, value, options = {}) {
    this.values[name] = clone(value);
    if (!options.silent) this.emit({ type: "change", name });
  }

  patch(values, options = {}) {
    Object.entries(values).forEach(([name, value]) => this.set(name, value, { silent: true }));
    if (!options.silent) this.emit({ type: "patch" });
  }

  reset(options = {}) {
    this.values = clone(this.defaults);
    if (!options.silent) this.emit({ type: "reset" });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event) {
    this.listeners.forEach((listener) => listener(this.values, event));
  }
}

class HelpTooltip {
  constructor(parameter) {
    this.parameter = parameter;
  }

  render() {
    const wrap = document.createElement("span");
    wrap.className = "help-wrap";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "help-button";
    button.textContent = "i";
    button.setAttribute("aria-label", `查看 ${this.parameter.name} 帮助`);
    button.setAttribute("aria-expanded", "false");

    const popover = document.createElement("div");
    popover.className = "help-popover";
    popover.hidden = true;
    popover.innerHTML = `
      <dl>
        <dt>作用</dt><dd>${this.parameter.help.purpose}</dd>
        <dt>推荐</dt><dd>${this.parameter.help.recommendation}</dd>
        <dt>影响</dt><dd>${this.parameter.help.impact}</dd>
        <dt>适用</dt><dd>${this.parameter.help.useCases}</dd>
        <dt>不建议</dt><dd>${this.parameter.help.avoid}</dd>
      </dl>
    `;

    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = popover.hidden;
      closeHelpPopovers(popover);
      popover.hidden = !willOpen;
      button.setAttribute("aria-expanded", String(willOpen));
    });

    wrap.append(button, popover);
    return wrap;
  }
}

class ParameterCard {
  constructor(parameter, store, onManualChange) {
    this.parameter = parameter;
    this.store = store;
    this.onManualChange = onManualChange;
  }

  render() {
    const card = document.createElement("article");
    card.className = `parameter-card${this.parameter.type === "textarea" ? " is-textarea" : ""}`;
    card.dataset.parameter = this.parameter.name;

    const meta = document.createElement("div");
    meta.className = "parameter-meta";
    const name = document.createElement("div");
    name.className = "parameter-name";
    name.innerHTML = `<strong>${this.parameter.label}</strong><code>${this.parameter.name}</code>`;
    meta.append(name, new HelpTooltip(this.parameter).render());

    const control = document.createElement("div");
    control.className = "parameter-control";
    control.append(this.buildControl());

    card.append(meta, control);
    return card;
  }

  buildControl() {
    switch (this.parameter.type) {
      case "boolean": return this.buildBoolean();
      case "number": return this.buildNumber();
      case "enum": return this.buildEnum();
      case "array": return this.buildArray();
      case "textarea": return this.buildTextarea();
      default: return this.buildText();
    }
  }

  buildBoolean() {
    const label = document.createElement("label");
    label.className = "switch-control";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(this.store.get(this.parameter.name));
    input.setAttribute("role", "switch");
    input.setAttribute("aria-label", this.parameter.label);
    const track = document.createElement("span");
    track.className = "switch-track";
    track.setAttribute("aria-hidden", "true");
    const value = document.createElement("span");
    value.className = "switch-value";
    value.textContent = input.checked ? "Enabled · 1" : "Disabled · 0";
    input.addEventListener("change", () => {
      const next = input.checked ? 1 : 0;
      value.textContent = next ? "Enabled · 1" : "Disabled · 0";
      this.commit(next);
    });
    label.append(input, track, value);
    return label;
  }

  buildNumber() {
    const input = document.createElement("input");
    input.type = "number";
    input.value = this.store.get(this.parameter.name);
    input.id = `parameter-${this.parameter.name}`;
    input.setAttribute("aria-label", this.parameter.label);
    ["min", "max", "step"].forEach((key) => {
      if (this.parameter[key] !== undefined) input[key] = this.parameter[key];
    });
    input.addEventListener("input", () => {
      if (input.value === "" || !input.validity.valid) return;
      this.commit(Number(input.value));
    });
    return input;
  }

  buildEnum() {
    const select = document.createElement("select");
    select.setAttribute("aria-label", this.parameter.label);
    this.parameter.options.forEach((option) => {
      const element = document.createElement("option");
      element.value = String(option.value);
      element.textContent = option.label;
      element.dataset.typedValue = JSON.stringify(option.value);
      select.append(element);
    });
    select.value = String(this.store.get(this.parameter.name));
    select.addEventListener("change", () => {
      const selected = select.options[select.selectedIndex];
      this.commit(JSON.parse(selected.dataset.typedValue));
    });
    return select;
  }

  buildArray() {
    const current = this.store.get(this.parameter.name);
    const wrap = document.createElement("div");
    wrap.className = `array-control${this.parameter.length ? "" : " is-fluid"}`;

    if (!this.parameter.length) {
      const input = document.createElement("input");
      input.type = "text";
      input.value = current.join(" ");
      input.setAttribute("aria-label", `${this.parameter.label}，空格分隔`);
      const note = document.createElement("small");
      note.className = "control-note";
      note.textContent = "使用空格分隔数组元素";
      input.addEventListener("input", () => {
        const values = input.value.trim() === "" ? [] : input.value.trim().split(/\s+/).map(parseToken);
        this.commit(values);
      });
      wrap.append(input, note);
      return wrap;
    }

    wrap.style.setProperty("--array-columns", this.parameter.length);
    current.forEach((item, index) => {
      const input = document.createElement("input");
      input.type = "number";
      input.value = item;
      input.setAttribute("aria-label", `${this.parameter.label} ${index + 1}`);
      ["min", "max", "step"].forEach((key) => {
        if (this.parameter[key] !== undefined) input[key] = this.parameter[key];
      });
      input.addEventListener("input", () => {
        if (input.value === "" || !input.validity.valid) return;
        const next = clone(this.store.get(this.parameter.name));
        next[index] = Number(input.value);
        this.commit(next);
      });
      wrap.append(input);
    });
    return wrap;
  }

  buildTextarea() {
    const textarea = document.createElement("textarea");
    textarea.value = this.store.get(this.parameter.name);
    textarea.spellcheck = false;
    textarea.setAttribute("aria-label", this.parameter.label);
    textarea.addEventListener("input", () => this.commit(textarea.value));
    return textarea;
  }

  buildText() {
    const input = document.createElement("input");
    input.type = "text";
    input.value = this.store.get(this.parameter.name);
    input.setAttribute("aria-label", this.parameter.label);
    input.addEventListener("input", () => this.commit(input.value));
    return input;
  }

  commit(value) {
    this.store.set(this.parameter.name, value);
    this.onManualChange();
  }
}

class ParameterGroup {
  constructor(category, schema, store, onManualChange) {
    this.category = category;
    this.schema = schema;
    this.store = store;
    this.onManualChange = onManualChange;
  }

  render() {
    const section = document.createElement("section");
    section.className = "parameter-group";
    section.id = `group-${this.category.key}`;
    section.innerHTML = `
      <header class="group-header">
        <div>
          <p class="section-index">${this.category.index} / ${this.category.key}</p>
          <h2>${this.category.title}</h2>
        </div>
        <p>${this.category.description}</p>
      </header>
    `;
    const grid = document.createElement("div");
    grid.className = "parameter-grid";
    this.schema
      .filter((parameter) => parameter.category === this.category.key)
      .forEach((parameter) => grid.append(new ParameterCard(parameter, this.store, this.onManualChange).render()));
    section.append(grid);
    return section;
  }
}

class TemplateSelector {
  constructor(items, store, onSelect) {
    this.items = items;
    this.store = store;
    this.onSelect = onSelect;
    this.activeId = "custom";
  }

  render(container) {
    container.replaceChildren();
    this.items.forEach((template) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `template-card${template.id === this.activeId ? " is-active" : ""}`;
      button.dataset.template = template.id;
      button.setAttribute("aria-pressed", String(template.id === this.activeId));
      button.innerHTML = `<strong>${template.name}</strong><small>${template.description}</small>`;
      button.addEventListener("click", () => this.select(template));
      container.append(button);
    });
  }

  select(template) {
    if (template.values) {
      this.store.reset({ silent: true });
      this.store.patch(template.values);
    }
    this.activeId = template.id;
    this.onSelect(template);
  }

  setCustom() {
    if (this.activeId === "custom") return;
    this.activeId = "custom";
    this.onSelect(this.items.find((item) => item.id === "custom"), { rerenderControls: false });
  }
}

class ScriptPreview {
  constructor(store, originalScript) {
    this.store = store;
    this.originalScript = originalScript;
    this.output = document.querySelector("#script-output");
    this.status = document.querySelector("#preview-status");
  }

  render() {
    this.script = generateScript(this.originalScript, this.store.values);
    this.output.textContent = this.script;
    this.status.textContent = "已同步全部 29 个变量与高对称路径配置";
  }

  async copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(this.script);
      this.status.textContent = "完整脚本已复制到剪贴板";
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = this.script;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (copied) {
        this.status.textContent = "完整脚本已复制到剪贴板";
      } else {
        const range = document.createRange();
        range.selectNodeContents(this.output);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        this.status.textContent = "浏览器阻止了剪贴板权限，脚本已选中，请按 Ctrl/Cmd + C";
      }
    }
  }

  download() {
    const blob = new Blob([this.script], { type: "text/x-shellscript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "AutoVASP.sh";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.status.textContent = "AutoVASP.sh 已生成";
  }
}

function parseToken(value) {
  const number = Number(value);
  return value !== "" && Number.isFinite(number) ? number : value;
}

const store = new ParameterStore(parameters);
const groupContainer = document.querySelector("#parameter-groups");
const templateContainer = document.querySelector("#template-list");
let preview;

const selector = new TemplateSelector(templates, store, (template, options = {}) => {
  selector.render(templateContainer);
  if (options.rerenderControls !== false) renderGroups();
  if (preview) preview.render();
});

function renderGroups() {
  groupContainer.replaceChildren();
  categories.forEach((category) => {
    groupContainer.append(new ParameterGroup(category, parameters, store, () => selector.setCustom()).render());
  });
}

async function init() {
  document.addEventListener("click", () => closeHelpPopovers());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeHelpPopovers();
  });
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  document.querySelector("#parameter-count").textContent = "29 vars + path";
  selector.render(templateContainer);
  renderGroups();

  try {
    const response = await fetch("./AutoVASP.template.sh");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const originalScript = await response.text();
    preview = new ScriptPreview(store, originalScript);
    preview.render();
    store.subscribe(() => preview.render());

    document.querySelector("#copy-script").addEventListener("click", () => preview.copy());
    document.querySelector("#download-script").addEventListener("click", () => preview.download());
    document.querySelector("#reset-config").addEventListener("click", () => {
      store.reset();
      selector.activeId = "custom";
      selector.render(templateContainer);
      renderGroups();
    });
  } catch (error) {
    document.querySelector("#preview-status").textContent = "原始脚本载入失败，请通过本地服务器打开此页面";
    document.querySelector("#script-output").textContent = error.message;
  }
}

init();
