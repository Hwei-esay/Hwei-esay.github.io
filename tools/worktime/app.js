(() => {
  "use strict";

  const storageKey = "worktime-dashboard-v2";
  const retiredStorageKeys = ["worktime-dashboard-v1"];
  const minuteMs = 60 * 1000;
  const core = window.WorktimeCore;
  retiredStorageKeys.forEach(key => localStorage.removeItem(key));
  let state = loadState();
  let toastTimer;

  const elements = {
    today: document.querySelector("#today"),
    greeting: document.querySelector("#greeting"),
    status: document.querySelector("#work-status"),
    startedAt: document.querySelector("#started-at"),
    elapsedSmall: document.querySelector("#elapsed-small"),
    elapsedLarge: document.querySelector("#elapsed-large"),
    targetLabel: document.querySelector("#target-label"),
    targetValue: document.querySelector("#target-value"),
    completedValue: document.querySelector("#completed-value"),
    remainingValue: document.querySelector("#remaining-value"),
    ring: document.querySelector("#progress-ring"),
    line: document.querySelector("#progress-line"),
    percent: document.querySelector("#progress-percent"),
    clockButton: document.querySelector("#clock-button"),
    sessionCount: document.querySelector("#session-count"),
    overviewElapsed: document.querySelector("#overview-elapsed"),
    overviewTarget: document.querySelector("#overview-target"),
    overviewPercent: document.querySelector("#overview-percent"),
    records: document.querySelector("#recent-records"),
    chart: document.querySelector("#work-chart"),
    taskList: document.querySelector("#task-list"),
    completedList: document.querySelector("#completed-list"),
    emptyTasks: document.querySelector("#empty-tasks"),
    emptyCompleted: document.querySelector("#empty-completed"),
    dialog: document.querySelector("#task-dialog"),
    form: document.querySelector("#task-form"),
    toast: document.querySelector("#toast"),
    historyList: document.querySelector("#history-list"),
    recordDialog: document.querySelector("#record-dialog"),
    recordForm: document.querySelector("#record-form"),
    recordDialogTitle: document.querySelector("#record-dialog-title"),
    recordId: document.querySelector("#record-id"),
    recordDate: document.querySelector("#record-date"),
    recordStart: document.querySelector("#record-start"),
    recordEnd: document.querySelector("#record-end"),
    recordError: document.querySelector("#record-error")
  };

  function loadState() {
    try {
      return core.normalizeState(JSON.parse(localStorage.getItem(storageKey)), Date.now());
    } catch {
      return core.normalizeState({}, Date.now());
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function syncDate(now) {
    const previousStart = state.activeStart;
    const hadToday = Boolean(state.days[core.dateKey(now)]);
    core.rollover(state, now);
    if (previousStart !== state.activeStart || !hadToday) saveState();
  }

  function formatMinutes(value) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return hours ? `${hours} 小时 ${minutes} 分钟` : `${minutes} 分钟`;
  }

  function formatDuration(value) {
    const totalSeconds = Math.max(0, Math.floor(value / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = totalSeconds % 60;
    return hours ? `${hours} 小时 ${minutes} 分 ${seconds} 秒` : `${minutes} 分 ${seconds} 秒`;
  }

  function formatCompactDuration(value) {
    if (value < minuteMs) return `${Math.floor(value / 1000)} 秒`;
    const minutes = Math.floor(value / minuteMs);
    return minutes >= 60 ? `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分` : `${minutes} 分钟`;
  }

  function formatTime(timestamp) {
    return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(timestamp);
  }

  function getDateLabel(now) {
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(now);
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2200);
  }

  function updateGreeting(now) {
    const hour = new Date(now).getHours();
    elements.greeting.textContent = `${hour < 12 ? "早上" : hour < 18 ? "下午" : "晚上"}好，研究员`;
    elements.today.textContent = getDateLabel(now);
    elements.today.dateTime = core.dateKey(now);
  }

  function render() {
    const now = Date.now();
    syncDate(now);
    updateGreeting(now);
    const elapsedMs = core.dayElapsedMs(state, now);
    const target = state.targetMinutes;
    const targetMs = target * minuteMs;
    const remainingMs = Math.max(targetMs - elapsedMs, 0);
    const progress = targetMs ? Math.min(Math.round(elapsedMs / targetMs * 100), 100) : 0;
    const active = state.activeStart !== null;

    elements.status.textContent = active ? "专注中" : "等待开始";
    elements.status.closest(".status-pane").classList.toggle("is-active", active);
    elements.startedAt.textContent = active ? formatTime(state.activeStart) : "--:--";
    elements.elapsedSmall.textContent = formatDuration(elapsedMs);
    if (elapsedMs >= 3600000) {
      const totalSeconds = Math.floor(elapsedMs / 1000);
      elements.elapsedLarge.innerHTML = `${Math.floor(totalSeconds / 3600)} 小时 <span>${Math.floor(totalSeconds % 3600 / 60)} 分 ${totalSeconds % 60} 秒</span>`;
    } else {
      elements.elapsedLarge.innerHTML = `${Math.floor(elapsedMs / minuteMs)} 分 <span>${Math.floor(elapsedMs / 1000) % 60} 秒</span>`;
    }
    elements.targetLabel.textContent = `目标：${formatMinutes(target)}`;
    elements.targetValue.textContent = formatMinutes(target);
    elements.completedValue.textContent = formatDuration(elapsedMs);
    elements.remainingValue.textContent = formatDuration(remainingMs);
    elements.ring.style.setProperty("--progress", `${progress}%`);
    elements.line.style.setProperty("--progress", `${progress}%`);
    elements.percent.textContent = `${progress}%`;
    elements.clockButton.classList.toggle("is-active", active);
    elements.clockButton.querySelector("span").textContent = active ? "结束工作" : "开始工作";
    const sessions = core.todaySessions(state, now);
    elements.sessionCount.textContent = `${sessions.length} 次`;
    elements.overviewElapsed.textContent = formatDuration(elapsedMs);
    elements.overviewTarget.textContent = formatMinutes(target);
    elements.overviewPercent.textContent = `${progress}%`;
    renderRecords(sessions);
    renderTasks(now);
    renderChart(now);
    renderHistory();
  }

  function renderRecords(records) {
    elements.records.innerHTML = records.slice(-5).reverse().map(record => `
      <li>
        <time datetime="${new Date(record.start).toISOString()}">${formatTime(record.start)}</time>
        <span class="record-action">${record.active ? "进行中" : "已完成"}</span>
        <span>${formatDuration(record.durationMs)}</span>
      </li>`).join("") || "<li class=\"empty-record\"><span>今天还没有工作记录</span></li>";
  }

  function renderTasks(now) {
    const today = core.dateKey(now);
    const tasks = state.tasks.filter(task => task.date === today && !task.done);
    const completed = state.tasks.filter(task => task.date === today && task.done);
    elements.taskList.innerHTML = tasks.map(taskMarkup).join("");
    elements.completedList.innerHTML = completed.map(taskMarkup).join("");
    elements.emptyTasks.hidden = tasks.length > 0;
    elements.emptyCompleted.hidden = completed.length > 0;
  }

  function taskMarkup(task) {
    return `<li class="${task.done ? "completed-item" : "task-item"}"><input class="task-check" type="checkbox" data-task-id="${task.id}" ${task.done ? "checked" : ""} aria-label="完成任务"><span class="task-title">${escapeHtml(task.title)}${task.time ? `<small class="task-time">今天 ${task.time}</small>` : ""}</span><button class="task-delete" data-delete-id="${task.id}" aria-label="删除任务">×</button></li>`;
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  function renderChart(now) {
    const buckets = core.hourlyTrend(state, now);
    const maxValue = Math.max(...buckets, minuteMs);
    const activeHour = state.activeStart === null ? -1 : new Date(now).getHours();
    const total = buckets.reduce((sum, value) => sum + value, 0);
    elements.chart.innerHTML = `
      <div class="chart-summary"><strong>${formatCompactDuration(total)}</strong><span>按小时统计 · 数据实时更新</span></div>
      <div class="chart-plot">
        <div class="chart-bars">${buckets.map((value, hour) => {
          const height = value ? Math.max(5, value / maxValue * 100) : 0;
          const label = `${String(hour).padStart(2, "0")}:00，${formatCompactDuration(value)}`;
          return `<span class="bar-item${hour === activeHour ? " is-active" : ""}" title="${label}" aria-label="${label}"><i style="height:${height}%"></i></span>`;
        }).join("")}</div>
        <div class="bar-labels">${[0, 4, 8, 12, 16, 20, 24].map(hour => `<span>${String(hour).padStart(2, "0")}:00</span>`).join("")}</div>
      </div>`;
  }

  function formatRecordDate(date) {
    return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date(`${date}T00:00:00`));
  }

  function timeInputValue(timestamp) {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function renderHistory() {
    const records = core.allSessions(state);
    elements.historyList.innerHTML = records.map(record => `
      <article class="history-item">
        <div class="history-date"><strong>${formatRecordDate(record.date)}</strong><span>${record.date}</span></div>
        <div class="history-period"><strong>${formatTime(record.start)}–${formatTime(record.end)}</strong><span>${record.source === "manual" ? "手动记录" : "计时记录"}</span></div>
        <strong class="history-duration">${formatDuration(record.durationMs)}</strong>
        <div class="history-actions">
          <button type="button" data-edit-record="${record.id}" aria-label="修改 ${record.date} 的工作记录">修改</button>
          <button type="button" data-delete-record="${record.id}" aria-label="删除 ${record.date} 的工作记录">删除</button>
        </div>
      </article>`).join("") || `<div class="empty-history"><span>◷</span><strong>还没有历史记录</strong><p>点击“手动记录”补充今天或往日的工作时间。</p></div>`;
  }

  function openRecordDialog(record) {
    const now = new Date();
    elements.recordForm.reset();
    elements.recordError.textContent = "";
    elements.recordDate.max = core.dateKey(now.getTime());
    if (record) {
      elements.recordDialogTitle.textContent = "修改工作记录";
      elements.recordId.value = record.id;
      elements.recordDate.value = record.date;
      elements.recordStart.value = timeInputValue(record.start);
      elements.recordEnd.value = timeInputValue(record.end);
    } else {
      const endMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = Math.max(0, endMinutes - 60);
      const formatClockMinutes = value => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
      elements.recordDialogTitle.textContent = "手动记录工作";
      elements.recordId.value = "";
      elements.recordDate.value = core.dateKey(now.getTime());
      elements.recordStart.value = formatClockMinutes(startMinutes);
      elements.recordEnd.value = formatClockMinutes(endMinutes);
    }
    elements.recordDialog.showModal();
  }

  function saveRecord(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") return elements.recordDialog.close();
    const result = core.saveManualSession(state, {
      id: elements.recordId.value || null,
      date: elements.recordDate.value,
      startTime: elements.recordStart.value,
      endTime: elements.recordEnd.value
    }, Date.now());
    if (!result.ok) {
      elements.recordError.textContent = result.error;
      return;
    }
    saveState();
    elements.recordDialog.close();
    render();
    showToast(elements.recordId.value ? "工作记录已更新" : "工作记录已添加");
  }

  function handleHistoryAction(event) {
    const editButton = event.target.closest("[data-edit-record]");
    const deleteButton = event.target.closest("[data-delete-record]");
    const id = editButton?.dataset.editRecord || deleteButton?.dataset.deleteRecord;
    if (!id) return;
    const record = core.allSessions(state).find(session => session.id === id);
    if (!record) return;
    if (editButton) return openRecordDialog(record);
    if (!window.confirm(`确定删除 ${record.date} ${formatTime(record.start)}–${formatTime(record.end)} 的记录吗？`)) return;
    core.removeSession(state, id);
    saveState();
    render();
    showToast("工作记录已删除");
  }

  function clearAllData() {
    if (!window.confirm("确定清除全部工作记录、任务和设置吗？此操作无法撤销。")) return;
    localStorage.removeItem(storageKey);
    retiredStorageKeys.forEach(key => localStorage.removeItem(key));
    state = core.normalizeState({}, Date.now());
    saveState();
    render();
    showToast("全部数据已清除");
  }

  function toggleClock() {
    const now = Date.now();
    if (state.activeStart === null) {
      core.startClock(state, now);
      showToast("已开始，专注时间正在记录");
    } else {
      const result = core.stopClock(state, now);
      showToast(result.discarded ? "不足 1 秒，本次未计入工作时长" : `本次工作 ${formatDuration(result.recordedMs)}`);
    }
    saveState();
    render();
  }

  function addTask(event) {
    event.preventDefault();
    if (event.submitter?.value === "cancel") return elements.dialog.close();
    const title = document.querySelector("#task-name").value.trim();
    const time = document.querySelector("#task-time").value;
    if (!title) return;
    state.tasks.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title, time, done: false, date: core.dateKey(Date.now()) });
    saveState();
    elements.form.reset();
    elements.dialog.close();
    render();
    showToast("任务已添加");
  }

  function setTarget() {
    const response = window.prompt("请输入每日目标时长（小时）", String((state.targetMinutes / 60).toFixed(1)));
    if (response === null) return;
    const hours = Number(response);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 24) return showToast("请输入 0 到 24 之间的数字");
    state.targetMinutes = Math.round(hours * 60);
    saveState();
    render();
    showToast("每日目标已更新");
  }

  function toggleTask(event) {
    const checkbox = event.target.closest("[data-task-id]");
    if (!checkbox) return;
    const task = state.tasks.find(item => item.id === checkbox.dataset.taskId);
    if (!task) return;
    task.done = checkbox.checked;
    saveState();
    render();
    if (task.done) showToast("做得好，任务已完成！");
  }

  function deleteTask(event) {
    const button = event.target.closest("[data-delete-id]");
    if (!button) return;
    state.tasks = state.tasks.filter(task => task.id !== button.dataset.deleteId);
    saveState();
    render();
  }

  elements.clockButton.addEventListener("click", toggleClock);
  document.querySelector("#edit-target").addEventListener("click", setTarget);
  document.querySelector("#add-task").addEventListener("click", () => elements.dialog.showModal());
  document.querySelector("#add-record").addEventListener("click", () => openRecordDialog());
  document.querySelector("#clear-data").addEventListener("click", clearAllData);
  elements.form.addEventListener("submit", addTask);
  elements.recordForm.addEventListener("submit", saveRecord);
  elements.historyList.addEventListener("click", handleHistoryAction);
  [elements.taskList, elements.completedList].forEach(list => {
    list.addEventListener("change", toggleTask);
    list.addEventListener("click", deleteTask);
  });
  document.querySelector("#clear-completed").addEventListener("click", () => {
    const today = core.dateKey(Date.now());
    state.tasks = state.tasks.filter(task => !task.done || task.date !== today);
    saveState();
    render();
    showToast("已清空完成列表");
  });
  document.querySelectorAll("[data-nav]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("is-active", item === button));
    if (button.dataset.nav === "settings") return setTarget();
    document.querySelector(button.dataset.nav === "dashboard" ? ".time-card" : button.dataset.nav === "records" ? ".history-card" : ".chart-card").scrollIntoView({ behavior: "smooth", block: "center" });
  }));

  render();
  setInterval(render, 1000);
})();
