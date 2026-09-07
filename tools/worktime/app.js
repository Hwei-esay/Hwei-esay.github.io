(() => {
  const storageKey = "worktime-dashboard-v1";
  const minuteMs = 60 * 1000;
  const defaultState = { targetMinutes: 480, activeStart: null, elapsedTodayMs: 0, sessions: [], tasks: [] };
  let state = loadState();
  let toastTimer;
  const elements = {
    today: document.querySelector("#today"), greeting: document.querySelector("#greeting"), status: document.querySelector("#work-status"), startedAt: document.querySelector("#started-at"), elapsedSmall: document.querySelector("#elapsed-small"), elapsedLarge: document.querySelector("#elapsed-large"), targetLabel: document.querySelector("#target-label"), targetValue: document.querySelector("#target-value"), completedValue: document.querySelector("#completed-value"), remainingValue: document.querySelector("#remaining-value"), ring: document.querySelector("#progress-ring"), line: document.querySelector("#progress-line"), percent: document.querySelector("#progress-percent"), clockButton: document.querySelector("#clock-button"), sessionCount: document.querySelector("#session-count"), overviewElapsed: document.querySelector("#overview-elapsed"), overviewTarget: document.querySelector("#overview-target"), overviewPercent: document.querySelector("#overview-percent"), records: document.querySelector("#recent-records"), chart: document.querySelector("#work-chart"), taskList: document.querySelector("#task-list"), completedList: document.querySelector("#completed-list"), emptyTasks: document.querySelector("#empty-tasks"), emptyCompleted: document.querySelector("#empty-completed"), dialog: document.querySelector("#task-dialog"), form: document.querySelector("#task-form"), toast: document.querySelector("#toast")
  };

  function loadState() {
    try {
      const savedState = JSON.parse(localStorage.getItem(storageKey));
      const elapsedTodayMs = Number.isFinite(savedState.elapsedTodayMs) ? savedState.elapsedTodayMs : (savedState.elapsedToday || 0) * minuteMs;
      return {
        ...defaultState,
        ...savedState,
        elapsedTodayMs,
        sessions: (savedState.sessions || []).map(session => ({
          ...session,
          durationMs: Number.isFinite(session.durationMs) ? session.durationMs : (session.minutes || 0) * minuteMs
        }))
      };
    } catch { return { ...defaultState }; }
  }
  function saveState() { localStorage.setItem(storageKey, JSON.stringify(state)); }
  function currentElapsedMs() { return state.elapsedTodayMs + (state.activeStart ? Date.now() - state.activeStart : 0); }
  function formatMinutes(value) { const hours = Math.floor(value / 60); const minutes = value % 60; return hours ? `${hours} 小时 ${minutes} 分钟` : `${minutes} 分钟`; }
  function formatDuration(value) { const totalSeconds = Math.floor(value / 1000); const hours = Math.floor(totalSeconds / 3600); const minutes = Math.floor(totalSeconds % 3600 / 60); const seconds = totalSeconds % 60; return hours ? `${hours} 小时 ${minutes} 分 ${seconds} 秒` : `${minutes} 分 ${seconds} 秒`; }
  function formatTime(timestamp) { return new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }).format(timestamp); }
  function showToast(message) { elements.toast.textContent = message; elements.toast.classList.add("is-visible"); clearTimeout(toastTimer); toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 2200); }
  function getDateLabel() { return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(new Date()); }
  function updateGreeting() { const hour = new Date().getHours(); elements.greeting.textContent = `${hour < 12 ? "早上" : hour < 18 ? "下午" : "晚上"}好，研究员`; elements.today.textContent = getDateLabel(); }

  function render() {
    const elapsedMs = currentElapsedMs(); const target = state.targetMinutes; const targetMs = target * minuteMs; const remainingMs = Math.max(targetMs - elapsedMs, 0); const progress = Math.min(Math.round(elapsedMs / targetMs * 100), 100); const active = Boolean(state.activeStart);
    elements.status.textContent = active ? "已上机" : "未上机";
    elements.startedAt.textContent = active ? formatTime(state.activeStart) : "--:--";
    elements.elapsedSmall.textContent = formatDuration(elapsedMs); elements.elapsedLarge.innerHTML = formatDuration(elapsedMs).replace(" 小时 ", " 小时 <span>").replace(" 秒", " 秒</span>");
    if (elapsedMs < 3600000) elements.elapsedLarge.innerHTML = `${Math.floor(elapsedMs / 60000)} 分 <span>${Math.floor(elapsedMs / 1000) % 60} 秒</span>`;
    elements.targetLabel.textContent = `目标：${formatMinutes(target)}`; elements.targetValue.textContent = formatMinutes(target); elements.completedValue.textContent = formatDuration(elapsedMs); elements.remainingValue.textContent = formatDuration(remainingMs);
    elements.ring.style.setProperty("--progress", `${progress}%`); elements.line.style.setProperty("--progress", `${progress}%`); elements.percent.textContent = `${progress}%`;
    elements.clockButton.querySelector("span").textContent = active ? "下机" : "上机";
    elements.sessionCount.textContent = `${state.sessions.length + (active ? 1 : 0)} 次`; elements.overviewElapsed.textContent = formatDuration(elapsedMs); elements.overviewTarget.textContent = formatMinutes(target); elements.overviewPercent.textContent = `${progress}%`;
    renderRecords(active); renderTasks(); renderChart();
  }
  function renderRecords(active) {
    const records = [...state.sessions]; if (active) records.push({ start: state.activeStart, end: Date.now(), durationMs: Date.now() - state.activeStart, active: true });
    elements.records.innerHTML = records.slice(-5).reverse().map(record => `<li><time>${formatTime(record.start)}</time><span class="record-action">${record.active ? "上机中" : "工作"}</span><span>${formatDuration(record.durationMs)}</span></li>`).join("") || "<li><span>--:--</span><span>尚无记录</span><span>--</span></li>";
  }
  function renderTasks() {
    const tasks = state.tasks.filter(task => !task.done); const completed = state.tasks.filter(task => task.done);
    elements.taskList.innerHTML = tasks.map(taskMarkup).join(""); elements.completedList.innerHTML = completed.map(taskMarkup).join("");
    elements.emptyTasks.hidden = tasks.length > 0; elements.emptyCompleted.hidden = completed.length > 0;
  }
  function taskMarkup(task) { return `<li class="${task.done ? "completed-item" : "task-item"}"><input class="task-check" type="checkbox" data-task-id="${task.id}" ${task.done ? "checked" : ""} aria-label="完成任务"><span class="task-title">${escapeHtml(task.title)}${task.time ? `<small class="task-time">今天 ${task.time}</small>` : ""}</span><button class="task-delete" data-delete-id="${task.id}" aria-label="删除任务">×</button></li>`; }
  function escapeHtml(value) { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }
  function renderChart() {
    const hours = [8, 10, 12, 14, 16, 18, 20]; const totalMinutes = currentElapsedMs() / minuteMs; const bars = hours.map((hour, index) => Math.max(3, Math.min(96, totalMinutes ? ((index * 23 + totalMinutes / 5) % 75) + 12 : 3)));
    elements.chart.innerHTML = `<div class="chart-bars">${bars.map(height => `<span class="bar-item"><i style="height:${height}%"></i></span>`).join("")}</div><div class="bar-labels">${hours.map(hour => `<span>${String(hour).padStart(2, "0")}:00</span>`).join("")}</div>`;
  }
  function toggleClock() {
    if (!state.activeStart) { state.activeStart = Date.now(); showToast("已上机，开始记录专注时间"); }
    else { const durationMs = Date.now() - state.activeStart; state.elapsedTodayMs += durationMs; state.sessions.push({ start: state.activeStart, end: Date.now(), durationMs }); state.activeStart = null; showToast(`本次工作 ${formatDuration(durationMs)}`); }
    saveState(); render();
  }
  function addTask(event) { event.preventDefault(); const title = document.querySelector("#task-name").value.trim(); const time = document.querySelector("#task-time").value; if (!title) return; state.tasks.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title, time, done: false }); saveState(); elements.form.reset(); elements.dialog.close(); render(); showToast("任务已添加"); }
  function setTarget() { const response = window.prompt("请输入每日目标时长（小时）", String((state.targetMinutes / 60).toFixed(1))); if (response === null) return; const hours = Number(response); if (!Number.isFinite(hours) || hours <= 0 || hours > 24) return showToast("请输入 0 到 24 之间的数字"); state.targetMinutes = Math.round(hours * 60); saveState(); render(); showToast("每日目标已更新"); }
  function handleTaskAction(event) { const checked = event.target.closest("[data-task-id]"); const deleted = event.target.closest("[data-delete-id]"); const id = (checked || deleted)?.dataset[checked ? "taskId" : "deleteId"]; if (!id) return; state.tasks = state.tasks.filter(task => { if (task.id !== id) return true; if (deleted) return false; task.done = checked.checked; return true; }); saveState(); render(); if (checked?.checked) showToast("做得好，任务已完成！"); }

  elements.clockButton.addEventListener("click", toggleClock); document.querySelector("#edit-target").addEventListener("click", setTarget); document.querySelector("#add-task").addEventListener("click", () => elements.dialog.showModal()); elements.form.addEventListener("submit", addTask); elements.taskList.addEventListener("change", handleTaskAction); elements.taskList.addEventListener("click", handleTaskAction); elements.completedList.addEventListener("change", handleTaskAction); elements.completedList.addEventListener("click", handleTaskAction);
  document.querySelector("#clear-completed").addEventListener("click", () => { state.tasks = state.tasks.filter(task => !task.done); saveState(); render(); showToast("已清空完成列表"); });
  document.querySelectorAll("[data-nav]").forEach(button => button.addEventListener("click", () => { document.querySelectorAll(".nav-item").forEach(item => item.classList.toggle("is-active", item === button)); if (button.dataset.nav === "settings") return setTarget(); document.querySelector(button.dataset.nav === "dashboard" ? ".time-card" : button.dataset.nav === "records" ? ".records-card" : ".chart-card").scrollIntoView({ behavior: "smooth", block: "center" }); }));
  updateGreeting(); render(); setInterval(render, 1000);
})();
