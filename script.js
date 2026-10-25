
const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav-btn");

let selectedMood = "";
let editingId = null;

const moodMessages = {
  Happy: "Let your happiness bloom like a flower! ☀️",
  Calm: "Take a deep breath. You are allowed to slow down. 🌿",
  Sad: "It's okay to have difficult days. Be gentle with yourself. 🌧️",
  Stressed: "Pause for a moment. One step at a time. 🍂",
  Excited: "Let your excitement bloom into something wonderful! 🌈"
};

const moodButtons = document.querySelectorAll(".moods button");
const moodMessage = document.getElementById("mood-message");
const journalEntry = document.getElementById("journal-entry");
const saveButton = document.getElementById("save-btn");
const saveMessage = document.getElementById("save-message");
const historyList = document.getElementById("history-list");
const clearButton = document.getElementById("clear-btn");

function getTodayString() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}

function makeId() {
  return Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8);
}

function loadEntries() {
  try {
    const saved = JSON.parse(
      localStorage.getItem("feeloraEntries")
    ) || [];

    return saved.map(entry => ({
      ...entry,
      id: entry.id || makeId(),
      date: /^\d{4}-\d{2}-\d{2}$/.test(entry.date || "")
        ? entry.date
        : getTodayString()
    }));
  } catch {
    return [];
  }
}

let entries = loadEntries();

function persistEntries() {
  try {
    localStorage.setItem(
      "feeloraEntries",
      JSON.stringify(entries)
    );
    return true;
  } catch {
    saveMessage.textContent =
      "Couldn't save. Check your browser storage.";
    return false;
  }
}

// PAGE NAVIGATION
function showPage(pageId) {
  pages.forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  navButtons.forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === pageId
    );
  });

  if (pageId === "history") {
    renderHistory();
    renderCalendar();
  }

  if (pageId === "insights") {
    renderInsights();
  }
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

// MOOD SELECTION
moodButtons.forEach(button => {
  button.addEventListener("click", () => {
    selectedMood = button.dataset.mood;

    moodButtons.forEach(mood => {
      mood.classList.toggle("selected", mood === button);
    });

    moodMessage.textContent = moodMessages[selectedMood];

    document.getElementById("home-insight").textContent =
      `Today's chosen mood: ${selectedMood} 🌱`;
  });
});

// DATE FORMATTING
function formatDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
}

// CREATE HISTORY ENTRY CARDS
function createEntryCard(entry) {
  const card = document.createElement("div");
  card.className = "journal-entry-card";

  const title = document.createElement("strong");
  title.textContent =
    `${entry.mood} • ${formatDate(entry.date)}`;

  const note = document.createElement("p");
  note.textContent = entry.note || "No journal note added.";

  card.append(title, note);

  const actions = document.createElement("div");
  actions.className = "entry-actions";

  // EDIT BUTTON
  const editButton = document.createElement("button");
  editButton.textContent = "✏️ Edit";

  editButton.addEventListener("click", () => {
    editingId = entry.id;
    selectedMood = entry.mood;
    journalEntry.value = entry.note || "";

    moodButtons.forEach(button => {
      button.classList.toggle(
        "selected",
        button.dataset.mood === selectedMood
      );
    });

    saveButton.textContent = "Update my day 🌱";
    saveMessage.textContent =
      "Edit your entry, then save.";

    showPage("journal");
  });

  // DELETE BUTTON
  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-entry";
  deleteButton.textContent = "🗑️ Delete";

  deleteButton.addEventListener("click", () => {
    if (confirm("Delete this journal entry?")) {
      const previousEntries = [...entries];

      entries = entries.filter(item => item.id !== entry.id);

      if (persistEntries()) {
        renderHistory();
        renderCalendar();
        renderInsights();
      } else {
        entries = previousEntries;
      }
    }
  });

  actions.append(editButton, deleteButton);
  card.appendChild(actions);

  return card;
}

// HISTORY PAGE
function renderHistory() {
  historyList.innerHTML = "";

  if (entries.length === 0) {
    historyList.innerHTML =
      '<p class="empty-message">Your mood garden is waiting for its first flower 🌼</p>';
    return;
  }

  const sortedEntries = [...entries].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  sortedEntries.forEach(entry => {
    historyList.appendChild(createEntryCard(entry));
  });
}

// SAVE JOURNAL ENTRY
saveButton.addEventListener("click", () => {
  if (!selectedMood) {
    saveMessage.textContent =
      "Please choose your mood on Home first 🌱";
    return;
  }

  const todayString = getTodayString();

  // New entries use today's date automatically.
  // Edited entries keep their original date.
  const existingEntry = entries.find(
    entry => entry.id === editingId
  );

  const date = existingEntry
    ? existingEntry.date
    : todayString;

  const previousEntries = [...entries];

  if (editingId) {
    entries = entries.map(entry =>
      entry.id === editingId
        ? {
            ...entry,
            mood: selectedMood,
            note: journalEntry.value.trim()
          }
        : entry
    );
  } else {
    entries.unshift({
      id: makeId(),
      mood: selectedMood,
      note: journalEntry.value.trim(),
      date: date
    });
  }

  if (!persistEntries()) {
    entries = previousEntries;
    return;
  }

  editingId = null;
  journalEntry.value = "";
  saveButton.textContent = "Save my day 🌱";
  saveMessage.textContent = "Your day has been saved! 🌿";

  renderHistory();
  renderCalendar();
  renderInsights();
});

// MOOD INSIGHTS AND CHART
// MOOD INSIGHTS AND CHART
function renderInsights() {
  const chart = document.getElementById("mood-chart");

  if (!chart) return;

  const moods = ["Happy", "Calm", "Sad", "Stressed", "Excited"];

  const counts = {};

  moods.forEach(mood => {
    counts[mood] = entries.filter(
      entry => entry.mood === mood
    ).length;
  });

  chart.innerHTML = "";

  const maxCount = Math.max(1, ...Object.values(counts));

  moods.forEach(mood => {
    const row = document.createElement("div");
    row.className = "chart-row";

    const label = document.createElement("span");
    label.textContent = mood;

    const track = document.createElement("div");
    track.className = "chart-track";

    const fill = document.createElement("div");
    fill.className = "chart-fill";

    fill.style.width =
      `${(counts[mood] / maxCount) * 100}%`;

    track.appendChild(fill);

    const count = document.createElement("span");
    count.textContent = counts[mood];

    row.append(label, track, count);
    chart.appendChild(row);
  });
}

// MOOD CALENDAR
let calendarDate = new Date(
  new Date().getFullYear(),
  new Date().getMonth(),
  1
);

function renderCalendar() {
  const monthLabel = document.getElementById("calendar-month");
  const daysContainer = document.getElementById("calendar-days");
  const detail = document.getElementById("calendar-detail");

  monthLabel.textContent = calendarDate.toLocaleDateString(
    undefined,
    {
      month: "long",
      year: "numeric"
    }
  );

  daysContainer.innerHTML = "";

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayString = getTodayString();

  for (let i = 0; i < firstDay; i++) {
    daysContainer.appendChild(document.createElement("span"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = [
      year,
      String(month + 1).padStart(2, "0"),
      String(day).padStart(2, "0")
    ].join("-");

    const dayEntries = entries.filter(
      entry => entry.date === dateString
    );

    const button = document.createElement("button");
    button.className = "calendar-day";
    button.textContent = day;

    if (dayEntries.length) {
      button.classList.add("has-entry");
      button.title = dayEntries
        .map(entry => entry.mood)
        .join(", ");
    }

    if (dateString === todayString) {
      button.classList.add("today");
    }

    button.addEventListener("click", () => {
      detail.textContent = dayEntries.length
        ? `${formatDate(dateString)}: ${
            dayEntries.map(entry =>
              `${entry.mood}${entry.note ? " — " + entry.note : ""}`
            ).join(" | ")
          }`
        : `No saved mood for ${formatDate(dateString)}.`;
    });

    daysContainer.appendChild(button);
  }
}

document.getElementById("prev-month").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById("next-month").addEventListener("click", () => {
  const next = new Date(
    calendarDate.getFullYear(),
    calendarDate.getMonth() + 1,
    1
  );

  const now = new Date();

  if (
    next <= new Date(now.getFullYear(), now.getMonth(), 1)
  ) {
    calendarDate = next;
    renderCalendar();
  }
});

// CLEAR HISTORY
clearButton.addEventListener("click", () => {
  if (
    confirm("Clear all your saved mood entries? This cannot be undone.")
  ) {
    const previousEntries = [...entries];

    entries = [];

    if (persistEntries()) {
      editingId = null;
      selectedMood = "";
      journalEntry.value = "";
      saveButton.textContent = "Save my day 🌱";
      saveMessage.textContent = "";

      moodButtons.forEach(button => {
        button.classList.remove("selected");
      });

      renderHistory();
      renderCalendar();
      renderInsights();
    } else {
      entries = previousEntries;
    }
  }
});

function selectMood(mood) {
  selectedMood = mood;

  document.querySelectorAll(".mood-button").forEach(button => {
    button.classList.remove("active");
  });

  const buttons = document.querySelectorAll(".mood-button");

  buttons.forEach(button => {
    if (button.textContent.trim().includes(mood)) {
      button.classList.add("active");
    }
  });

  const message = document.getElementById("mood-message");

  if (message) {
    message.textContent = `Your mood today is ${mood}.`;
  }
}

// INITIAL DISPLAY
renderHistory();
renderCalendar();
renderInsights();
