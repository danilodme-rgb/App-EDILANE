/* ---------------------------------------------------------------
   Rotina do Danilo — lógica do app (sem dependências)
--------------------------------------------------------------- */

const STORE_KEY = 'rotina-danilo:v1';
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const PERIODS = {
  manha: { nome: 'Manhã', ordem: 1 },
  tarde: { nome: 'Tarde', ordem: 2 },
  noite: { nome: 'Noite', ordem: 3 },
};
const ICONS = ['✅', '💧', '🏃', '📖', '🥗', '💊', '🧘', '💼', '🛏️', '🧹', '☕', '📱', '🎯', '💪', '🙏'];

const DEFAULT_TASKS = [
  { titulo: 'Acordar e beber água',     periodo: 'manha', hora: '06:30', icone: '💧' },
  { titulo: 'Alongamento / caminhada',  periodo: 'manha', hora: '07:00', icone: '🏃' },
  { titulo: 'Café da manhã',            periodo: 'manha', hora: '08:00', icone: '☕' },
  { titulo: 'Bloco de trabalho focado', periodo: 'manha', hora: '09:00', icone: '💼' },
  { titulo: 'Almoço',                   periodo: 'tarde', hora: '12:00', icone: '🥗' },
  { titulo: 'Estudo / leitura',         periodo: 'tarde', hora: '15:00', icone: '📖' },
  { titulo: 'Treino',                   periodo: 'tarde', hora: '18:00', icone: '💪' },
  { titulo: 'Jantar leve',              periodo: 'noite', hora: '20:00', icone: '🍽️' },
  { titulo: 'Desligar telas',           periodo: 'noite', hora: '22:00', icone: '📱' },
  { titulo: 'Dormir',                   periodo: 'noite', hora: '22:30', icone: '🛏️' },
];

/* ------------------------- estado ------------------------- */

const uid = () => Math.random().toString(36).slice(2, 10);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function seed() {
  return {
    tasks: DEFAULT_TASKS.map((t) => ({ ...t, id: uid(), dias: [0, 1, 2, 3, 4, 5, 6] })),
    done: {},
    notes: {},
    theme: null,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return seed();
    const data = JSON.parse(raw);
    return {
      tasks: Array.isArray(data.tasks) ? data.tasks : seed().tasks,
      done: data.done && typeof data.done === 'object' ? data.done : {},
      notes: data.notes && typeof data.notes === 'object' ? data.notes : {},
      theme: data.theme === 'dark' || data.theme === 'light' ? data.theme : null,
    };
  } catch (e) {
    return seed();
  }
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    toast('Não foi possível salvar neste navegador.');
  }
}

const state = load();
let selectedDate = iso(new Date());
let filter = 'todos';
let editingId = null;

/* ------------------------- helpers ------------------------- */

const $ = (sel) => document.querySelector(sel);
const dateOf = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const doneList = (day) => state.done[day] || [];
const isDone = (day, id) => doneList(day).includes(id);

function tasksOf(day) {
  const wd = dateOf(day).getDay();
  return state.tasks
    .filter((t) => !t.dias || t.dias.length === 0 || t.dias.includes(wd))
    .sort((a, b) => {
      const pa = PERIODS[a.periodo]?.ordem ?? 9;
      const pb = PERIODS[b.periodo]?.ordem ?? 9;
      if (pa !== pb) return pa - pb;
      return (a.hora || '99:99').localeCompare(b.hora || '99:99');
    });
}

function ratio(day) {
  const all = tasksOf(day);
  if (!all.length) return 0;
  const done = all.filter((t) => isDone(day, t.id)).length;
  return done / all.length;
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ------------------------- tema ------------------------- */

function applyTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = state.theme || (prefersDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#06211a' : '#0f5132';
}

$('#themeToggle').addEventListener('click', () => {
  state.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  save();
});

/* ------------------------- render ------------------------- */

function renderHeader() {
  const d = dateOf(selectedDate);
  $('#todayLabel').textContent = d.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  const h = new Date().getHours();
  $('#greeting').textContent = h < 12 ? 'Bom dia!' : h < 18 ? 'Boa tarde!' : 'Boa noite!';
}

function renderWeek() {
  const strip = $('#weekStrip');
  const today = new Date();
  const base = dateOf(selectedDate);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());

  strip.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = iso(d);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = `<span class="wd">${WEEKDAYS[d.getDay()]}</span>
                     <span class="dn">${d.getDate()}</span>
                     <span class="dot"></span>`;
    if (key === selectedDate) btn.classList.add('is-selected');
    if (key === iso(today)) btn.classList.add('is-today');
    if (ratio(key) > 0) btn.classList.add('has-progress');
    btn.addEventListener('click', () => {
      selectedDate = key;
      renderAll();
    });
    strip.appendChild(btn);
  }
}

function renderStats() {
  const all = tasksOf(selectedDate);
  const done = all.filter((t) => isDone(selectedDate, t.id)).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;

  $('#progressPct').textContent = `${pct}%`;
  $('#progressCount').textContent = `${done} de ${all.length}`;

  const C = 2 * Math.PI * 52;
  $('#ringFg').style.strokeDashoffset = String(C - (C * pct) / 100);

  $('#statDone').textContent = String(done);

  // média da semana exibida
  const base = dateOf(selectedDate);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());
  let soma = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    soma += ratio(iso(d));
  }
  $('#statWeek').textContent = `${Math.round((soma / 7) * 100)}%`;

  // sequência de dias com 100% (contando para trás a partir de hoje)
  let streak = 0;
  const cursor = new Date();
  while (streak < 400) {
    const key = iso(cursor);
    if (tasksOf(key).length && ratio(key) === 1) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (key === iso(new Date())) {
      cursor.setDate(cursor.getDate() - 1); // hoje ainda em andamento
    } else break;
  }
  $('#statStreak').textContent = String(streak);

  $('#heroMsg').textContent =
    !all.length ? 'Nenhuma tarefa para este dia. Toque em + para criar.'
    : pct === 100 ? 'Rotina concluída. Excelente trabalho! 🎉'
    : pct >= 50 ? 'Mais da metade feita. Continua assim!'
    : 'Vamos começar a rotina de hoje.';
}

function taskNode(t) {
  const done = isDone(selectedDate, t.id);
  const el = document.createElement('article');
  el.className = 'task' + (done ? ' done' : '');
  el.innerHTML = `
    <span class="task-emoji">${t.icone || '✅'}</span>
    <span class="task-body">
      <span class="task-title"></span>
      <span class="task-meta">${t.hora ? t.hora + ' · ' : ''}${PERIODS[t.periodo]?.nome || ''}</span>
    </span>
    <button class="edit-btn" type="button" aria-label="Editar tarefa">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>
      </svg>
    </button>
    <span class="check">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
    </span>`;
  el.querySelector('.task-title').textContent = t.titulo;

  el.addEventListener('click', (ev) => {
    if (ev.target.closest('.edit-btn')) return;
    toggleTask(t.id);
  });
  el.querySelector('.edit-btn').addEventListener('click', () => openDialog(t));
  return el;
}

function renderList() {
  const list = $('#list');
  list.innerHTML = '';

  const all = tasksOf(selectedDate).filter((t) => filter === 'todos' || t.periodo === filter);

  if (!all.length) {
    list.innerHTML = `<div class="empty">
      <strong>Nada por aqui</strong>
      Adicione uma tarefa no botão + para montar sua rotina.
    </div>`;
    return;
  }

  Object.keys(PERIODS).forEach((p) => {
    const items = all.filter((t) => t.periodo === p);
    if (!items.length) return;

    const feitas = items.filter((t) => isDone(selectedDate, t.id)).length;
    const group = document.createElement('section');
    group.className = 'group';
    group.innerHTML = `<h3>${PERIODS[p].nome} <small>${feitas}/${items.length}</small></h3>`;

    const box = document.createElement('div');
    box.className = 'items';
    items.forEach((t) => box.appendChild(taskNode(t)));
    group.appendChild(box);
    list.appendChild(group);
  });
}

function renderNotes() {
  $('#noteBox').value = state.notes[selectedDate] || '';
}

function renderAll() {
  renderHeader();
  renderWeek();
  renderStats();
  renderList();
  renderNotes();
}

/* ------------------------- ações ------------------------- */

function toggleTask(id) {
  const cur = doneList(selectedDate);
  state.done[selectedDate] = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  if (!state.done[selectedDate].length) delete state.done[selectedDate];
  save();
  renderAll();
}

$('#noteBox').addEventListener('input', (e) => {
  const v = e.target.value;
  if (v.trim()) state.notes[selectedDate] = v;
  else delete state.notes[selectedDate];
  save();
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    filter = chip.dataset.filter;
    renderList();
  });
});

$('#resetDay').addEventListener('click', () => {
  if (!doneList(selectedDate).length) return toast('Nenhuma marcação neste dia.');
  if (!confirm('Limpar todas as marcações deste dia?')) return;
  delete state.done[selectedDate];
  save();
  renderAll();
  toast('Marcações do dia limpas.');
});

/* ------------------------- diálogo ------------------------- */

const dialog = $('#taskDialog');
let dialogDays = [];

function buildPickers() {
  const ip = $('#iconPicker');
  ip.innerHTML = '';
  ICONS.forEach((ic) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = ic;
    b.addEventListener('click', () => {
      $('#fIcon').value = ic;
      ip.querySelectorAll('button').forEach((x) => x.classList.remove('is-active'));
      b.classList.add('is-active');
    });
    ip.appendChild(b);
  });

  const dp = $('#dayPicker');
  dp.innerHTML = '';
  WEEKDAYS.forEach((label, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', () => {
      dialogDays = dialogDays.includes(i) ? dialogDays.filter((x) => x !== i) : [...dialogDays, i];
      b.classList.toggle('is-active', dialogDays.includes(i));
    });
    dp.appendChild(b);
  });
}

function syncPickers(icone) {
  $('#iconPicker').querySelectorAll('button').forEach((b) => {
    b.classList.toggle('is-active', b.textContent === icone);
  });
  $('#dayPicker').querySelectorAll('button').forEach((b, i) => {
    b.classList.toggle('is-active', dialogDays.includes(i));
  });
}

function openDialog(task) {
  editingId = task ? task.id : null;
  $('#dialogTitle').textContent = task ? 'Editar tarefa' : 'Nova tarefa';
  $('#fTitle').value = task ? task.titulo : '';
  $('#fPeriod').value = task ? task.periodo : 'manha';
  $('#fTime').value = task ? (task.hora || '') : '';
  $('#fIcon').value = task ? (task.icone || '✅') : '✅';
  dialogDays = task ? [...(task.dias || [])] : [0, 1, 2, 3, 4, 5, 6];
  $('#deleteTask').hidden = !task;
  syncPickers($('#fIcon').value);
  dialog.showModal();
  $('#fTitle').focus();
}

$('#fab').addEventListener('click', () => openDialog(null));
$('#cancelTask').addEventListener('click', () => dialog.close());

$('#taskForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const titulo = $('#fTitle').value.trim();
  if (!titulo) return;

  const dados = {
    titulo,
    periodo: $('#fPeriod').value,
    hora: $('#fTime').value,
    icone: $('#fIcon').value || '✅',
    dias: dialogDays.length ? [...dialogDays].sort() : [0, 1, 2, 3, 4, 5, 6],
  };

  if (editingId) {
    const t = state.tasks.find((x) => x.id === editingId);
    if (t) Object.assign(t, dados);
    toast('Tarefa atualizada.');
  } else {
    state.tasks.push({ id: uid(), ...dados });
    toast('Tarefa adicionada.');
  }

  save();
  dialog.close();
  renderAll();
});

$('#deleteTask').addEventListener('click', () => {
  if (!editingId) return;
  if (!confirm('Excluir esta tarefa da rotina?')) return;
  state.tasks = state.tasks.filter((t) => t.id !== editingId);
  Object.keys(state.done).forEach((d) => {
    state.done[d] = state.done[d].filter((id) => id !== editingId);
    if (!state.done[d].length) delete state.done[d];
  });
  save();
  dialog.close();
  renderAll();
  toast('Tarefa excluída.');
});

/* ------------------------- início ------------------------- */

applyTheme();
buildPickers();
renderAll();
save();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
