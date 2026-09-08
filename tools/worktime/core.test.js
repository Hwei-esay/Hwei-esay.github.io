const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("./core.js");

function at(value) { return new Date(value).getTime(); }

test("a new calendar day starts with fresh totals", () => {
  const yesterday = at("2026-09-07T16:00:00+08:00");
  const today = at("2026-09-08T09:00:00+08:00");
  const state = core.normalizeState({
    version: 2,
    days: { "2026-09-07": { elapsedMs: 3_600_000, sessions: [] } },
    tasks: []
  }, today);
  assert.equal(core.dayElapsedMs(state, today), 0);
  assert.equal(state.days[core.dateKey(yesterday)].elapsedMs, 3_600_000);
});

test("legacy tasks are assigned to the migration date", () => {
  const now = at("2026-09-08T09:00:00+08:00");
  const state = core.normalizeState({ tasks: [{ id: "one", title: "旧任务", done: false }] }, now);
  assert.equal(state.tasks[0].date, "2026-09-08");
});

test("an active session is split at midnight", () => {
  const start = at("2026-09-07T23:59:30+08:00");
  const now = at("2026-09-08T00:00:30+08:00");
  const state = core.normalizeState({ version: 2, activeStart: start, days: {}, tasks: [] }, now);
  assert.equal(state.days["2026-09-07"].elapsedMs, 30_000);
  assert.equal(core.dayElapsedMs(state, now), 30_000);
});

test("rapid start-stop interactions do not accumulate phantom seconds", () => {
  const state = core.normalizeState({}, at("2026-09-08T09:00:00+08:00"));
  for (let index = 0; index < 4; index += 1) {
    const start = at("2026-09-08T09:00:00+08:00") + index * 500;
    core.startClock(state, start);
    const result = core.stopClock(state, start + 300);
    assert.equal(result.discarded, true);
  }
  assert.equal(core.dayElapsedMs(state, at("2026-09-08T09:00:03+08:00")), 0);
  assert.equal(state.days["2026-09-08"].sessions.length, 0);
});

test("hourly trend reflects real session overlap", () => {
  const now = at("2026-09-08T12:00:00+08:00");
  const state = core.normalizeState({ version: 2, days: {}, tasks: [] }, now);
  core.startClock(state, at("2026-09-08T09:30:00+08:00"));
  core.stopClock(state, at("2026-09-08T10:15:00+08:00"));
  const trend = core.hourlyTrend(state, now);
  assert.equal(trend[9], 30 * 60 * 1000);
  assert.equal(trend[10], 15 * 60 * 1000);
  assert.equal(trend.reduce((sum, value) => sum + value, 0), 45 * 60 * 1000);
});
