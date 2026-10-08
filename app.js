const THEME_KEY = 'ttk-tema';
const HARI_JANGKA_PANJANG = 7;

const taskList = document.getElementById('task-list');
const longList = document.getElementById('long-list');
const emptyState = document.getElementById('empty-state');
const longEmpty = document.getElementById('long-empty');
const themeButton = document.getElementById('theme-button');
const trashIcon = document.getElementById('icon-trash');
const taskForm = document.getElementById('task-form');
const taskTitle = document.getElementById('task-title');
const taskCourse = document.getElementById('task-course');
const taskDeadline = document.getElementById('task-deadline');
const errorTitle = document.getElementById('error-title');
const errorCourse = document.getElementById('error-course');
const errorDeadline = document.getElementById('error-deadline');

let tasks = [];

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function daysUntil(iso) {
  const [tahun, bulan, tanggal] = iso.split('-').map(Number);
  const sekarang = new Date();
  const hariIni = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
  const target = new Date(tahun, bulan - 1, tanggal);
  return Math.round((target - hariIni) / (24 * 60 * 60 * 1000));
}

function isLongTerm(task) {
  return daysUntil(task.deadline) > HARI_JANGKA_PANJANG;
}

// Deadline diurai manual sebagai tanggal lokal supaya tidak bergeser zona waktu.
function formatDate(iso) {
  const [tahun, bulan, tanggal] = iso.split('-').map(Number);
  return new Date(tahun, bulan - 1, tanggal).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function emptyMessage() {
  if (tasks.length === 0) return 'Belum ada tugas. Tambahkan lewat form di atas.';
  return 'Tidak ada tugas dalam 7 hari ke depan. Cek Tugas Jangka Panjang.';
}

function createTaskItem(task) {
  const item = document.createElement('li');
  item.className = 'tugas';
  item.dataset.id = task.id;
  if (task.selesai) item.classList.add('selesai');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'tugas-cek';
  checkbox.id = `cek-${task.id}`;
  checkbox.checked = task.selesai;
  checkbox.setAttribute('aria-label', `Tandai "${task.judul}" selesai`);

  const body = document.createElement('label');
  body.className = 'tugas-isi';
  body.htmlFor = checkbox.id;

  const title = document.createElement('span');
  title.className = 'tugas-judul';
  title.textContent = task.judul;

  const meta = document.createElement('span');
  meta.className = 'tugas-meta';

  const course = document.createElement('span');
  course.className = 'tugas-matkul';
  course.textContent = task.matkul;

  const deadline = document.createElement('span');
  deadline.className = 'tugas-deadline';
  if (!task.selesai && daysUntil(task.deadline) < 0) {
    deadline.classList.add('lewat');
    deadline.textContent = `Lewat: ${formatDate(task.deadline)}`;
  } else {
    deadline.textContent = formatDate(task.deadline);
  }

  meta.append(course, deadline);
  body.append(title, meta);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'tugas-hapus';
  remove.setAttribute('aria-label', `Hapus "${task.judul}"`);
  remove.append(trashIcon.content.cloneNode(true));

  item.append(checkbox, body, remove);
  return item;
}

function render() {
  const shortTasks = tasks.filter((task) => !isLongTerm(task));
  const longTasks = tasks.filter((task) => isLongTerm(task));

  taskList.replaceChildren();
  for (const task of shortTasks) taskList.append(createTaskItem(task));

  longList.replaceChildren();
  for (const task of longTasks) longList.append(createTaskItem(task));

  emptyState.hidden = shortTasks.length > 0;
  emptyState.textContent = emptyMessage();
  longEmpty.hidden = longTasks.length > 0;
}

function showError(input, element, message) {
  input.setAttribute('aria-invalid', 'true');
  element.textContent = message;
  element.hidden = false;
}

function clearError(input, element) {
  input.removeAttribute('aria-invalid');
  element.textContent = '';
  element.hidden = true;
}

taskForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const judul = taskTitle.value.trim();
  const matkul = taskCourse.value;
  const deadline = taskDeadline.value;
  let firstInvalid = null;

  if (judul.length < 3) {
    showError(taskTitle, errorTitle, 'Judul tugas minimal 3 karakter.');
    firstInvalid = taskTitle;
  }

  if (matkul === '') {
    showError(taskCourse, errorCourse, 'Pilih mata kuliah dulu.');
    if (!firstInvalid) firstInvalid = taskCourse;
  }

  if (deadline === '') {
    showError(taskDeadline, errorDeadline, 'Deadline wajib diisi.');
    if (!firstInvalid) firstInvalid = taskDeadline;
  }

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  tasks.push({ id: createId(), judul, matkul, deadline, selesai: false });
  taskForm.reset();
  taskTitle.focus();
  render();
});

taskTitle.addEventListener('input', () => clearError(taskTitle, errorTitle));
taskCourse.addEventListener('change', () => clearError(taskCourse, errorCourse));
taskDeadline.addEventListener('input', () => clearError(taskDeadline, errorDeadline));

function themeLabel(theme) {
  themeButton.textContent = theme === 'gelap' ? 'Mode terang' : 'Mode gelap';
}

themeButton.addEventListener('click', () => {
  const next = document.documentElement.dataset.tema === 'gelap' ? 'terang' : 'gelap';
  document.documentElement.dataset.tema = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Tema tetap berlaku untuk sesi ini walau gagal disimpan.
  }
  themeLabel(next);
});

themeLabel(document.documentElement.dataset.tema || 'terang');

render();
