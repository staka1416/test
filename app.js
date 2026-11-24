const STORAGE_KEY = "my-tasks-v1";
const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const priorityInput = document.querySelector("#priorityInput");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const clearDoneButton = document.querySelector("#clearDone");
let currentFilter = "all";
let tasks = loadTasks();

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    alert("端末への保存に失敗しました。ブラウザの空き容量をご確認ください。");
  }
}
function addTask(name, priority) {
  tasks.unshift({
    id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    name, priority, done: false, createdAt: Date.now()
  });
  saveTasks();
  render();
}
function setDone(id, done) {
  tasks = tasks.map(task => task.id === id ? {...task, done} : task);
  saveTasks();
  render();
}
function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  render();
}
function priorityLabel(value) {
  return ({high:"優先度：高", medium:"優先度：中", low:"優先度：低"})[value] || "優先度：中";
}
function render() {
  const doneCount = tasks.filter(task => task.done).length;
  const openCount = tasks.length - doneCount;
  const percent = tasks.length ? Math.round(doneCount / tasks.length * 100) : 0;
  document.querySelector("#totalCount").textContent = tasks.length;
  document.querySelector("#openCount").textContent = openCount;
  document.querySelector("#doneCount").textContent = doneCount;
  document.querySelector("#progressLabel").textContent = `${percent}%`;
  document.querySelector("#progressBar").style.width = `${percent}%`;

  const visible = tasks.filter(task =>
    currentFilter === "all" ||
    (currentFilter === "open" && !task.done) ||
    (currentFilter === "done" && task.done)
  );
  document.querySelector("#visibleCount").textContent = `${visible.length}件`;
  taskList.replaceChildren();

  for (const task of visible) {
    const card = document.createElement("article");
    card.className = `task-card${task.done ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `${task.name}を${task.done ? "未完了" : "完了"}にする`);
    checkbox.addEventListener("change", () => setDone(task.id, checkbox.checked));

    const copy = document.createElement("div");
    copy.className = "task-copy";
    const name = document.createElement("span");
    name.className = "task-name";
    name.textContent = task.name;
    const priority = document.createElement("span");
    priority.className = `priority ${task.priority}`;
    priority.textContent = priorityLabel(task.priority);
    copy.append(name, priority);

    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `${task.name}を削除`);
    remove.addEventListener("click", () => {
      if (confirm(`「${task.name}」を削除しますか？`)) deleteTask(task.id);
    });
    card.append(checkbox, copy, remove);
    taskList.append(card);
  }

  emptyState.classList.toggle("show", visible.length === 0);
  clearDoneButton.hidden = doneCount === 0;
}
taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const name = taskInput.value.trim();
  if (!name) return;
  addTask(name, priorityInput.value);
  taskInput.value = "";
  taskInput.focus();
});
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach(item =>
      item.classList.toggle("active", item === button)
    );
    render();
  });
});
clearDoneButton.addEventListener("click", () => {
  if (!confirm("完了済みのタスクをすべて削除しますか？")) return;
  tasks = tasks.filter(task => !task.done);
  saveTasks();
  render();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.error("Service Worker registration failed:", error);
    });
  });
}
render();
