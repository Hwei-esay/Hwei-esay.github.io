(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.WorktimeCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SECOND_MS = 1000;
  const MIN_SESSION_MS = SECOND_MS;

  function dateKey(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function startOfDay(timestamp) {
    const date = new Date(timestamp);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  function nextDayStart(timestamp) {
    const date = new Date(timestamp);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
  }

  function emptyDay() {
    return { elapsedMs: 0, sessions: [] };
  }

  function ensureDay(state, key) {
    if (!state.days[key]) state.days[key] = emptyDay();
    return state.days[key];
  }

  function makeSessionId(start, end, suffix = "") {
    return `session-${start}-${end}${suffix}`;
  }

  function addSession(state, start, end, options = {}) {
    if (!(end > start)) return [];
    const ids = [];
    let cursor = start;
    let segmentIndex = 0;
    while (cursor < end) {
      const segmentEnd = Math.min(end, nextDayStart(cursor));
      const durationMs = segmentEnd - cursor;
      const day = ensureDay(state, dateKey(cursor));
      const id = segmentIndex === 0
        ? (options.id || makeSessionId(start, end))
        : makeSessionId(start, end, `-${segmentIndex}`);
      day.sessions.push({ id, start: cursor, end: segmentEnd, durationMs, source: options.source || "timer" });
      day.elapsedMs += durationMs;
      ids.push(id);
      cursor = segmentEnd;
      segmentIndex += 1;
    }
    return ids;
  }

  function normalizeDay(day) {
    const sessions = Array.isArray(day?.sessions) ? day.sessions.map((session, index) => ({
      ...session,
      id: session.id || makeSessionId(session.start, session.end, `-${index}`),
      source: session.source || "timer",
      durationMs: Number.isFinite(session.durationMs)
        ? session.durationMs
        : Number(session.minutes || 0) * 60 * SECOND_MS
    })) : [];
    const elapsedMs = Number.isFinite(day?.elapsedMs)
      ? day.elapsedMs
      : sessions.reduce((sum, session) => sum + session.durationMs, 0);
    return { elapsedMs, sessions };
  }

  function normalizeState(savedState, now) {
    const saved = savedState && typeof savedState === "object" ? savedState : {};
    const today = dateKey(now);
    const state = {
      version: 2,
      targetMinutes: Number.isFinite(saved.targetMinutes) ? saved.targetMinutes : 480,
      activeStart: Number.isFinite(saved.activeStart) ? saved.activeStart : null,
      days: {},
      tasks: Array.isArray(saved.tasks)
        ? saved.tasks.map(task => ({ ...task, date: task.date || today }))
        : []
    };

    if (saved.days && typeof saved.days === "object") {
      Object.entries(saved.days).forEach(([key, day]) => { state.days[key] = normalizeDay(day); });
    } else {
      const elapsedMs = Number.isFinite(saved.elapsedTodayMs)
        ? saved.elapsedTodayMs
        : Number(saved.elapsedToday || 0) * 60 * SECOND_MS;
      state.days[saved.currentDate || today] = normalizeDay({ elapsedMs, sessions: saved.sessions || [] });
    }

    ensureDay(state, today);
    rollover(state, now);
    return state;
  }

  function rollover(state, now) {
    const todayStart = startOfDay(now);
    if (state.activeStart !== null && state.activeStart < todayStart) {
      addSession(state, state.activeStart, todayStart, { source: "timer" });
      state.activeStart = todayStart;
    } else if (state.activeStart !== null && state.activeStart > now) {
      state.activeStart = now;
    }
    ensureDay(state, dateKey(now));
    return state;
  }

  function startClock(state, now) {
    rollover(state, now);
    if (state.activeStart === null) state.activeStart = now;
    return state;
  }

  function stopClock(state, now) {
    rollover(state, now);
    if (state.activeStart === null) return { recordedMs: 0, discarded: true };
    const start = state.activeStart;
    const rawDurationMs = Math.max(0, now - start);
    const recordedMs = Math.floor(rawDurationMs / SECOND_MS) * SECOND_MS;
    state.activeStart = null;
    if (recordedMs < MIN_SESSION_MS) return { recordedMs: 0, discarded: true };
    addSession(state, start, start + recordedMs, { source: "timer" });
    return { recordedMs, discarded: false };
  }

  function parseLocalDateTime(date, time) {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(time || "");
    if (!dateMatch || !timeMatch) return null;
    const [, year, month, day] = dateMatch.map(Number);
    const [, hour, minute] = timeMatch.map(Number);
    const value = new Date(year, month - 1, day, hour, minute, 0, 0);
    if (value.getFullYear() !== year || value.getMonth() !== month - 1 || value.getDate() !== day || value.getHours() !== hour || value.getMinutes() !== minute) return null;
    return value.getTime();
  }

  function removeSession(state, id) {
    let removed = null;
    Object.values(state.days).forEach(day => {
      day.sessions = day.sessions.filter(session => {
        if (session.id !== id) return true;
        day.elapsedMs = Math.max(0, day.elapsedMs - session.durationMs);
        removed = session;
        return false;
      });
    });
    return removed;
  }

  function saveManualSession(state, record, now) {
    const start = parseLocalDateTime(record.date, record.startTime);
    const end = parseLocalDateTime(record.date, record.endTime);
    if (start === null || end === null) return { ok: false, error: "日期或时间格式不正确" };
    if (end <= start) return { ok: false, error: "结束时间必须晚于开始时间" };
    if (end > now) return { ok: false, error: "不能记录尚未发生的时间" };

    const overlaps = allSessions(state).some(session =>
      session.id !== record.id && start < session.end && end > session.start
    );
    if (overlaps) return { ok: false, error: "该时间段与已有记录重叠" };

    if (record.id) removeSession(state, record.id);
    let id = record.id || makeSessionId(start, end, "-manual");
    const existingIds = new Set(allSessions(state).map(session => session.id));
    let suffix = 1;
    while (existingIds.has(id)) {
      id = makeSessionId(start, end, `-manual-${suffix}`);
      suffix += 1;
    }
    addSession(state, start, end, { id, source: "manual" });
    return { ok: true, id, durationMs: end - start };
  }

  function allSessions(state) {
    return Object.entries(state.days)
      .flatMap(([date, day]) => day.sessions.map(session => ({ ...session, date })))
      .sort((a, b) => b.start - a.start);
  }

  function dayElapsedMs(state, now) {
    rollover(state, now);
    const key = dateKey(now);
    const committed = ensureDay(state, key).elapsedMs;
    const active = state.activeStart === null ? 0 : Math.max(0, now - Math.max(state.activeStart, startOfDay(now)));
    return committed + active;
  }

  function todaySessions(state, now) {
    rollover(state, now);
    const sessions = [...ensureDay(state, dateKey(now)).sessions];
    if (state.activeStart !== null) {
      const start = Math.max(state.activeStart, startOfDay(now));
      sessions.push({ start, end: now, durationMs: Math.max(0, now - start), active: true });
    }
    return sessions;
  }

  function hourlyTrend(state, now) {
    const buckets = Array(24).fill(0);
    todaySessions(state, now).forEach(session => {
      let cursor = session.start;
      while (cursor < session.end) {
        const date = new Date(cursor);
        const hourEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 1).getTime();
        const segmentEnd = Math.min(session.end, hourEnd);
        buckets[date.getHours()] += segmentEnd - cursor;
        cursor = segmentEnd;
      }
    });
    return buckets;
  }

  return {
    MIN_SESSION_MS,
    dateKey,
    normalizeState,
    rollover,
    startClock,
    stopClock,
    saveManualSession,
    removeSession,
    allSessions,
    dayElapsedMs,
    todaySessions,
    hourlyTrend
  };
});
