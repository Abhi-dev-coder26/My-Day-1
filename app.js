const STORAGE_KEY = "daylight-dashboard-v1";

const defaults = {
  meals: [
    { name: "Breakfast", detail: "Oats, banana and almonds", time: "8:00 AM", done: false },
    { name: "Lunch", detail: "Rice, dal, vegetables and curd", time: "1:00 PM", done: false },
    { name: "Snack", detail: "Yogurt and seasonal fruit", time: "5:00 PM", done: false },
    { name: "Dinner", detail: "Paneer, roti and salad", time: "8:30 PM", done: false }
  ],
  workouts: [
    { name: "Bodyweight squats", detail: "3 sets × 12 reps", done: false },
    { name: "Push-ups", detail: "3 sets × 10 reps", done: false },
    { name: "Dumbbell rows", detail: "3 sets × 12 reps", done: false },
    { name: "Plank", detail: "3 sets × 30 sec", done: false }
  ],
  assignments: [
    { name: "Mathematics problem set", detail: "Chapter 5 · 10 questions", due: "Today", done: false },
    { name: "Physics lab record", detail: "Complete experiment 4", due: "Tomorrow", done: false },
    { name: "English essay draft", detail: "Around 500 words", due: "Fri, 20 Nov", done: false }
  ],
  dailyGoals: [
    { name: "Drink 8 glasses of water", detail: "Health · Daily", done: false },
    { name: "Study for 2 focused hours", detail: "College · Daily", done: false },
    { name: "Get at least 7 hours of sleep", detail: "Wellbeing · Daily", done: false }
  ],
  goals: [
    { name: "Finish my semester project", detail: "College · This semester", done: false },
    { name: "Build a steady workout routine", detail: "Fitness · This month", done: false },
    { name: "Read a book this month", detail: "Personal · This month", done: false }
  ],
  attendance: { present: 18, total: 22 }
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return structuredClone(defaults);
    const oldGoals = Array.isArray(saved.goals) ? saved.goals : defaults.dailyGoals;
    return {
      ...structuredClone(defaults),
      ...saved,
      dailyGoals: Array.isArray(saved.dailyGoals) ? saved.dailyGoals : oldGoals,
      goals: Array.isArray(saved.dailyGoals) && Array.isArray(saved.goals) ? saved.goals : structuredClone(defaults.goals),
      attendance: { ...defaults.attendance, ...(saved.attendance || {}) }
    };
  } catch (error) {
    console.warn("Could not read the saved dashboard data. Starting with default data.", error);
    return structuredClone(defaults);
  }
}

let state = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[character]));
}

function renderItems(elementId, items, listName) {
  const element = document.getElementById(elementId);
  if (!element) return;
  if (!items.length) {
    element.innerHTML = '<p class="empty-state">Nothing here yet. Add an item to get started.</p>';
    return;
  }
  element.innerHTML = items.map((item, index) => `
    <div class="list-row${item.done ? " done" : ""}">
      <button class="check-button" type="button" data-list="${listName}" data-index="${index}" aria-label="${item.done ? "Mark incomplete" : "Mark complete"}: ${escapeHTML(item.name)}" aria-pressed="${item.done}">${item.done ? "✓" : ""}</button>
      <div class="list-copy"><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.detail || item.due || "")}</span></div>
      ${item.time ? `<span class="count-label">${escapeHTML(item.time)}</span>` : ""}
      ${item.due ? `<span class="count-label">${escapeHTML(item.due)}</span>` : ""}
    </div>`).join("");
}

function dateKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function updateDashboard() {
  const dailyDone = state.dailyGoals.filter(item => item.done).length;
  const workoutDone = state.workouts.filter(item => item.done).length;
  const pending = state.assignments.filter(item => !item.done).length;
  const rate = state.attendance.total ? Math.round(state.attendance.present / state.attendance.total * 100) : 0;
  const values = {
    "dash-daily": `${dailyDone} / ${state.dailyGoals.length}`,
    "dash-attendance": `${rate}%`,
    "dash-assignments": pending,
    "dash-workout": `${workoutDone} / ${state.workouts.length}`,
    "meal-count": `${state.meals.filter(item => item.done).length} / ${state.meals.length} complete`,
    "workout-count": `${workoutDone} / ${state.workouts.length} complete`,
    "assignment-count": `${pending} pending`,
    "daily-count": `${dailyDone} / ${state.dailyGoals.length} complete`,
    "goal-count": `${state.goals.filter(item => item.done).length} / ${state.goals.length} complete`,
    "attendance-rate": `${rate}%`,
    "present-count": state.attendance.present,
    "total-count": state.attendance.total
  };
  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });
  const bar = document.getElementById("attendance-bar");
  if (bar) bar.style.width = `${Math.min(rate, 100)}%`;
  const status = document.getElementById("attendance-status");
  if (status) {
    const markedToday = state.attendance.markedOn === dateKey();
    status.textContent = markedToday
      ? `Today's attendance: ${state.attendance.markedPresent ? "present" : "absent"}`
      : "Today's attendance has not been marked.";
  }
  renderItems("dashboard-daily-list", state.dailyGoals.slice(0, 3), "dailyGoals");
  renderItems("meal-list", state.meals, "meals");
  renderItems("workout-list", state.workouts, "workouts");
  renderItems("assignment-list", state.assignments, "assignments");
  renderItems("daily-goal-list", state.dailyGoals, "dailyGoals");
  renderItems("goal-list", state.goals, "goals");
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-list]");
  if (!button) return;
  const items = state[button.dataset.list];
  const item = items && items[Number(button.dataset.index)];
  if (!item) return;
  item.done = !item.done;
  saveState();
  updateDashboard();
});

function handleAdd(formId, inputId, listName, detail) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener("submit", event => {
    event.preventDefault();
    const input = document.getElementById(inputId);
    const name = input.value.trim();
    if (!name) return;
    state[listName].push({ name, detail, done: false });
    saveState();
    updateDashboard();
    input.value = "";
    input.focus();
  });
}

handleAdd("assignment-form", "assignment-input", "assignments", "Added just now");
handleAdd("daily-goal-form", "daily-goal-input", "dailyGoals", "Daily");
handleAdd("goal-form", "goal-input", "goals", "Personal goal");

function markAttendance(isPresent) {
  const attendance = state.attendance;
  if (attendance.markedOn === dateKey()) {
    if (attendance.markedPresent === isPresent) return;
    attendance.present += isPresent ? 1 : -1;
  } else {
    attendance.total++;
    if (isPresent) attendance.present++;
    attendance.markedOn = dateKey();
  }
  attendance.markedPresent = isPresent;
  saveState();
  updateDashboard();
}

const presentButton = document.getElementById("present-button");
const absentButton = document.getElementById("absent-button");
if (presentButton) presentButton.addEventListener("click", () => markAttendance(true));
if (absentButton) absentButton.addEventListener("click", () => markAttendance(false));

const dateElement = document.getElementById("today-date");
if (dateElement) {
  dateElement.textContent = new Intl.DateTimeFormat("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  }).format(new Date());
}

updateDashboard();
