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

  function addSession(state, start, end) {
    if (!(end > start)) return;
    let cursor = start;
    while (cursor < end) {
      const segmentEnd = Math.min(end, nextDayStart(cursor));
      const durationMs = segmentEnd - cursor;
      const day = ensureDay(state, dateKey(cursor));
      day.sessions.push({ start: cursor, end: segmentEnd, durationMs });
      day.elapsedMs += durationMs;
      cursor = segmentEnd;
    }
  }

  function normalizeDay(day) {
    const sessions = Array.isArray(day?.sessions) ? day.sessions.map(session => ({
      ...session,
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
      addSession(state, state.activeStart, todayStart);
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
    addSession(state, start, start + recordedMs);
    return { recordedMs, discarded: false };
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
    dayElapsedMs,
    todaySessions,
    hourlyTrend
  };
});
