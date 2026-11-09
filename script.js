const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

const STORE = "growthBridgeAcademyDemo_v2";

const defaults = {
  profile: null,
  coins: 0,
  xp: 0,
  gp: 0,
  totalGP: 0,
  tasks: [],
  claimedDays: [],
  dayIndex: 1,
  chat: [
    {
      name: "Academy Guide",
      text: "Welcome to Growth Bridge RPG Academy! Keep learning together.",
      time: "Now"
    }
  ],
  friends: ["StudyStar007", "DreamerGirl", "MathWizard", "ScienceRider"],
  unpaired: ["ExamChampion", "KnowledgeNinja", "PlayerPro"],
  teams: [
    {
      name: "The Brainy Squad",
      members: ["You", "StudyStar007"],
      id: "T001"
    }
  ],
  settings: {
    notifications: true,
    sound: false,
    theme: "Midnight"
  },
  completedDays: 0
};

let state = load();

function load() {
  try {
    return {
      ...structuredClone(defaults),
      ...JSON.parse(localStorage.getItem(STORE) || "{}")
    };
  } catch {
    return structuredClone(defaults);
  }
}

function save() {
  localStorage.setItem(STORE, JSON.stringify(state));
  updateTop();
}

function updateTop() {
  $("#coinCount").textContent = state.coins;
  $("#xpCount").textContent = state.xp;
  $("#gpCount").textContent = state.gp;
}

const pageTitles = {
  lobby: "Lobby",
  missions: "Missions & Checklist",
  completed: "Completed & Remaining",
  progress: "Progress — Daily & Weekly",
  community: "Community & Friends",
  teammates: "Teammates",
  chat: "Community Chat",
  achievements: "Achievements",
  rewards: "Rewards",
  settings: "Settings"
};

const art = {
  lobby: "lobby.png",
  missions: "missions.png",
  completed: "completed-remaining.png",
  progress: "progress.png",
  community: "community-friends.png",
  teammates: "teammates.png",
  chat: "community-chat.png",
  achievements: "achievements.png",
  settings: "settings.png"
};

function go(page) {
  $$(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  render(page);
}

$("#navigation").addEventListener("click", event => {
  const button = event.target.closest("[data-page]");
  if (button) go(button.dataset.page);
});

function panel(title, body) {
  return `
    <section class="panel">
      <h2>${title}</h2>
      ${body}
    </section>
  `;
}

function image(page) {
  return `
    <img
      class="screen-art"
      src="assets/${art[page]}"
      alt="${pageTitles[page]} visual reference"
    >
  `;
}

function render(page = "lobby") {
  const main = $("#mainContent");

  main.innerHTML = `
    <div class="page-title">✦ ${pageTitles[page]} ✦</div>
    ${(views[page] || views.lobby)()}
  `;

  if (page === "progress") bindTabs();
  if (page === "rewards") bindRewardButtons();
  if (page === "chat") bindChat();
  if (page === "settings") bindSettings();
  if (page === "missions") bindTasks();
  if (page === "completed") bindCompleted();
  if (page === "teammates") bindPairing();
}

const views = {
  lobby: () => `
    ${image("lobby")}

    <div class="content-grid">
      ${panel(
        "Welcome, " + escapeHTML(state.profile?.username || "Adventurer"),
        `
          <p class="muted">
            Your academy journey is ready. Complete your study missions,
            earn Growth Points and build steady habits.
          </p>

          <div class="stat-grid">
            <div class="stat"><b>${state.gp}</b>GP today</div>
            <div class="stat"><b>${state.xp}</b>XP earned</div>
            <div class="stat"><b>${state.coins}</b>Coins</div>
          </div>
        `
      )}

      ${panel(
        "Today's focus",
        `
          <div class="stack">
            <div class="list-row">
              📘 Morning study
              <small>Work through your planned subjects.</small>
            </div>

            <div class="list-row">
              ✍️ Writing practice
              <small>Complete your writing tasks.</small>
            </div>

            <div class="list-row">
              🌙 Recall & revision
              <small>Review what you learned today.</small>
            </div>
          </div>

          <button class="primary" data-go="missions">
            Open Missions
          </button>
        `
      )}
    </div>
  `,

  missions: () => `
    ${image("missions")}

    <div class="content-grid">
      ${panel(
        "Your checklist",
        `
          <p class="muted">
            Add demo tasks and mark them done. Teacher-assigned missions
            would be read-only in the connected version.
          </p>

          <form id="taskForm" class="chat-compose">
            <input
              name="task"
              placeholder="Add a personal study task"
              required
            >
            <button class="primary">Add</button>
          </form>

          <div id="taskList"></div>
        `
      )}

      ${panel(
        "Mission rules",
        `
          <p>✓ Complete study blocks to earn GP.</p>
          <p>✓ Personal and Exercise tasks can add up to 5 GP each when present.</p>
          <p>✓ No extra completion bonus.</p>
          <p class="muted tiny">
            This local demo lets you manage personal tasks only.
          </p>
        `
      )}
    </div>
  `,

  completed: () => `
    ${image("completed")}

    <div class="content-grid">
      ${panel("Remaining tasks", `<div id="remainingList"></div>`)}
      ${panel("Completed tasks", `<div id="completedList"></div>`)}
    </div>
  `,

  progress: () => `
    ${image("progress")}

    <div class="tabs">
      <button class="tab active" data-tab="daily">Daily</button>
      <button class="tab" data-tab="weekly">Weekly</button>
    </div>

    <div id="progressView"></div>
  `,

  community: () => `
    ${image("community")}

    <div class="content-grid">
      ${panel(
        "My Friends",
        `
          <p class="muted">
            Approved members in your school community.
          </p>

          ${state.friends.map((name, index) => `
            <div class="friend-row">
              <b>👤 ${escapeHTML(name)}</b>
              <small>
                <span class="online-dot">●</span>
                ${index % 2 ? "Recently active" : "Online"}
              </small>
            </div>
          `).join("")}

          <button class="secondary" data-go="teammates">
            Find Teammates
          </button>
        `
      )}

      ${panel(
        "Top Performers",
        `
          <div class="tabs">
            <button class="tab active" data-leader="weekly">Weekly</button>
            <button class="tab" data-leader="monthly">Monthly</button>
          </div>

          <div class="podium">
            <div><b>2</b>StudyStar007</div>
            <div class="first"><b>👑 1</b>DreamerGirl</div>
            <div><b>3</b>ScienceRider</div>
          </div>

          <p class="muted tiny">
            Sample leaderboard layout. Real rankings require approved community data.
          </p>

          <div class="stack">
            <img
              class="screen-art"
              src="assets/weekly-ambassador.png"
              alt="Original Weekly Ambassador podium"
            >

            <img
              class="screen-art"
              src="assets/monthly-ambassador.png"
              alt="Original Monthly Ambassador podium"
            >
          </div>
        `
      )}
    </div>
  `,

  teammates: () => `
    ${image("teammates")}

    <div class="content-grid">
      ${panel(
        "Unpaired Students",
        `
          <p class="muted">
            Students approved for your school community.
          </p>

          ${
            state.unpaired.map(name => `
              <div class="friend-row row">
                <span>
                  👤 ${escapeHTML(name)}
                  <small>Approved student</small>
                </span>

                <button
                  class="secondary pair-btn"
                  data-name="${escapeHTML(name)}"
                >
                  Pair
                </button>
              </div>
            `).join("") || `
              <p class="empty">No unpaired students right now.</p>
            `
          }
        `
      )}

      ${panel(
        "Your Teams",
        `
          ${
            state.teams.map(team => `
              <div class="team-card">
                <h3>${escapeHTML(team.name)}</h3>
                <p class="muted">Team ID: #${escapeHTML(team.id)}</p>
                <p>
                  ${team.members.map(member =>
                    "👤 " + escapeHTML(member)
                  ).join(" · ")}
                </p>
              </div>
            `).join("")
          }

          <button class="primary" id="createTeam">
            Create demo team
          </button>
        `
      )}
    </div>
  `,

  chat: () => `
    ${image("chat")}

    <div class="content-grid">
      <section class="panel">
        <div class="row">
          <h2>Subject Community Chat</h2>
          <span class="badge">Demo room</span>
        </div>

        <label class="muted tiny">
          Room name
          <select id="chatRoom">
            <option>General</option>
            <option>Mathematics</option>
            <option>Science</option>
            <option>English</option>
          </select>
        </label>

        <div class="chat-window" id="chatWindow">
          ${
            state.chat.map(message => `
              <div class="message ${message.name === "You" ? "mine" : ""}">
                <b>${escapeHTML(message.name)}</b>
                <small>${escapeHTML(message.time)}</small>
                ${escapeHTML(message.text)}
              </div>
            `).join("")
          }
        </div>

        <div class="chat-compose">
          <button class="icon-button" id="plusButton">＋</button>
          <input id="chatInput" placeholder="Type a message…">
          <button class="primary" id="sendMessage">Send</button>
        </div>

        <div class="attachment-menu hidden" id="attachmentMenu">
          <button id="cameraAction">📷 Camera</button>
          <button id="photoAction">🖼 Photos</button>
          <button id="fileAction">📎 Files</button>
        </div>

        <p class="muted tiny">
          Demo only: messages are stored in this browser. Production chat
          must enforce approved subject-room access.
        </p>
      </section>

      ${panel(
        "Room guidelines",
        `
          <p>• Be respectful and helpful.</p>
          <p>• Share study-related messages.</p>
          <p>• Only approved students should access subject rooms.</p>
        `
      )}
    </div>
  `,

  achievements: () => `
    ${image("achievements")}

    <div class="content-grid">
      ${panel(
        "Achievement collection",
        `
          <div class="stat-grid">
            <div class="stat"><b>0/50</b>Unlocked</div>
            <div class="stat"><b>${state.completedDays}</b>Days active</div>
            <div class="stat"><b>${state.totalGP}</b>Total GP</div>
          </div>

          <div class="achievement-card">
            📘 <b>Quick Learner</b>
            <p class="muted">Complete study tasks consistently.</p>
          </div>

          <div class="achievement-card">
            🤝 <b>Team Player</b>
            <p class="muted">Join an approved team.</p>
          </div>

          <div class="achievement-card">
            🌟 <b>Steady Progress</b>
            <p class="muted">Build a regular study routine.</p>
          </div>
        `
      )}

      ${panel(
        "Achievement progress",
        `
          <h3>Keep growing!</h3>

          <div class="progress-track">
            <span style="width:${Math.min(100, state.completedDays * 4)}%"></span>
          </div>

          <p class="muted tiny">
            The complete original 50-achievement catalogue has not been
            recovered; these are demo placeholders.
          </p>
        `
      )}
    </div>
  `,

  rewards: () => `
    <img
      class="screen-art"
      src="assets/rewards.png"
      alt="Original Rewards dashboard artwork"
    >

    <section class="panel">
      <div class="row">
        <div>
          <h2>Daily Reward Calendar</h2>
          <p class="muted">
            Scroll through the month and claim one reward each day.
          </p>
        </div>

        <div class="stat">
          Day <b>${state.dayIndex}/30</b>
        </div>
      </div>

      <p>
        Each daily reward:
        <b class="gold">3 XP · 3 Coins · 3 GB Points</b>
      </p>

      <div class="day-grid">
        ${
          Array.from({ length: 30 }, (_, index) => {
            const day = index + 1;
            const claimed = state.claimedDays.includes(day);
            const next = day === state.claimedDays.length + 1;

            return `
              <div class="reward-day ${claimed ? "claimed" : ""}">
                <strong>Day ${day}</strong>
                <small>3 XP · 3 Coins</small>
                <small>3 GB Points</small>

                <button
                  class="secondary claim-btn"
                  data-day="${day}"
                  ${(claimed || !next) ? "disabled" : ""}
                >
                  ${claimed ? "Claimed" : next ? "Claim" : "Locked"}
                </button>
              </div>
            `;
          }).join("")
        }
      </div>

      <p class="muted tiny">
        Demo calendar: claim status is stored in this browser.
        Connect a secure backend before using real student rewards.
      </p>
    </section>
  `,

  settings: () => `
    ${image("settings")}

    <div class="content-grid">
      ${panel(
        "Profile & Study Details",
        `
          <div class="stack">
            <div>
              <b>${escapeHTML(state.profile?.username || "Student")}</b>
              <p class="muted tiny">
                ${escapeHTML(state.profile?.email || "No profile registered")}
              </p>
            </div>

            <p>Class: ${escapeHTML(state.profile?.className || "—")}</p>
            <p>School: ${escapeHTML(state.profile?.school || "—")}</p>
            <p>Syllabus: ${escapeHTML(state.profile?.syllabus || "—")}</p>
            <p>Subjects: ${escapeHTML(state.profile?.subjects || "—")}</p>
            <p>Gender: ${escapeHTML(state.profile?.gender || "—")}</p>
          </div>
        `
      )}

      ${panel(
        "Preferences",
        `
          <label>
            <input
              type="checkbox"
              id="notifications"
              ${state.settings.notifications ? "checked" : ""}
            >
            Notifications
          </label>

          <br>

          <label>
            <input
              type="checkbox"
              id="sound"
              ${state.settings.sound ? "checked" : ""}
            >
            Sound effects
          </label>

          <h3>Character</h3>

          <img
            class="screen-art"
            src="assets/characters-normal-outfits.png"
            alt="Normal outfit character roster"
          >

          <p class="muted tiny">
            Character selection belongs here in Settings, not in the Lobby.
          </p>

          <button class="secondary" id="resetDemo">
            Reset demo data
          </button>
        `
      )}
    </div>
  `
};

function bindCompleted() {
  const remaining = $("#remainingList");
  const completed = $("#completedList");

  remaining.innerHTML = state.tasks
    .filter(task => !task.done)
    .map(task => `
      <div class="list-row">${escapeHTML(task.text)}</div>
    `).join("") || `
      <p class="empty">Nothing remaining.</p>
    `;

  completed.innerHTML = state.tasks
    .filter(task => task.done)
    .map(task => `
      <div class="list-row">✓ ${escapeHTML(task.text)}</div>
    `).join("") || `
      <p class="empty">No completed tasks yet.</p>
    `;
}

function bindTasks() {
  const list = $("#taskList");

  const draw = () => {
    list.innerHTML = state.tasks.map((task, index) => `
      <label class="task-row ${task.done ? "done" : ""}">
        <input
          type="checkbox"
          data-task="${index}"
          ${task.done ? "checked" : ""}
        >
        ${escapeHTML(task.text)}
      </label>
    `).join("") || `
      <p class="empty">No personal tasks yet.</p>
    `;

    drawCompleted();
  };

  function drawCompleted() {
    const remaining = $("#remainingList");
    const completed = $("#completedList");

    if (remaining) {
      remaining.innerHTML = state.tasks
        .filter(task => !task.done)
        .map(task => `
          <div class="list-row">${escapeHTML(task.text)}</div>
        `).join("") || `
          <p class="empty">Nothing remaining.</p>
        `;
    }

    if (completed) {
      completed.innerHTML = state.tasks
        .filter(task => task.done)
        .map(task => `
          <div class="list-row">✓ ${escapeHTML(task.text)}</div>
        `).join("") || `
          <p class="empty">No completed tasks yet.</p>
        `;
    }
  }

  draw();

  $("#taskForm").addEventListener("submit", event => {
    event.preventDefault();

    const value = new FormData(event.currentTarget)
      .get("task")
      .trim();

    if (value) {
      state.tasks.push({
        text: value,
        done: false
      });

      save();
      draw();
      event.currentTarget.reset();
    }
  });

  list.addEventListener("change", event => {
    if (event.target.dataset.task !== undefined) {
      const task = state.tasks[Number(event.target.dataset.task)];

      task.done = event.target.checked;

      if (task.done) {
        state.gp += 5;
        state.totalGP += 5;
      } else {
        state.gp = Math.max(0, state.gp - 5);
        state.totalGP = Math.max(0, state.totalGP - 5);
      }

      save();
      draw();
    }
  });

  drawCompleted();
}

function bindTabs() {
  const box = $("#progressView");

  const show = mode => {
    const daily = mode === "daily";

    box.innerHTML = `
      <div class="content-grid">
        ${panel(
          daily ? "Daily Progress" : "Weekly Progress",
          `
            <div class="stat-grid">
              <div class="stat"><b>${state.gp}</b>GP earned</div>
              <div class="stat">
                <b>${state.tasks.filter(task => task.done).length}</b>
                Tasks done
              </div>
              <div class="stat"><b>${state.tasks.length}</b>Total tasks</div>
            </div>

            <h3>${daily ? "Today's" : "This week's"} progress</h3>

            <div class="progress-track">
              <span style="width:${
                Math.min(100, state.gp / (daily ? 100 : 500) * 100)
              }%"></span>
            </div>

            <p class="muted tiny">
              ${
                daily
                  ? "Daily target reference: 100 GP on working days or 150 GP on holidays."
                  : "Weekly view is a local demo total; connect schedule data for exact weekly targets."
              }
            </p>
          `
        )}

        ${panel(
          daily ? "Today's tasks" : "Weekly activity",
          daily
            ? (
                state.tasks.map(task => `
                  <div class="list-row">
                    ${task.done ? "✓" : "○"} ${escapeHTML(task.text)}
                  </div>
                `).join("") || `
                  <p class="empty">No tasks added yet.</p>
                `
              )
            : `
                <p>Daily GP accumulated: ${state.gp}</p>
                <p>Total lifetime GP: ${state.totalGP}</p>
                <p>Qualifying days: ${state.completedDays}</p>
              `
        )}
      </div>
    `;
  };

  show("daily");

  $$("[data-tab]").forEach(button => {
    button.addEventListener("click", () => {
      $$("[data-tab]").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      show(button.dataset.tab);
    });
  });
}

function bindRewardButtons() {
  $$(".claim-btn").forEach(button => {
    button.addEventListener("click", () => {
      const day = Number(button.dataset.day);

      if (
        state.claimedDays.includes(day) ||
        day !== state.claimedDays.length + 1
      ) {
        return;
      }

      state.claimedDays.push(day);
      state.dayIndex = Math.max(state.dayIndex, day);

      state.xp += 3;
      state.coins += 3;
      state.gp += 3;
      state.totalGP += 3;

      save();
      render("rewards");
    });
  });
}

function bindChat() {
  const send = () => {
    const input = $("#chatInput");
    const messageText = input.value.trim();

    if (!messageText) return;

    state.chat.push({
      name: "You",
      text: messageText,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    });

    save();
    render("chat");

    $("#chatWindow").scrollTop = $("#chatWindow").scrollHeight;
  };

  $("#sendMessage").addEventListener("click", send);

  $("#chatInput").addEventListener("keydown", event => {
    if (event.key === "Enter") send();
  });

  $("#plusButton").addEventListener("click", () => {
    $("#attachmentMenu").classList.toggle("hidden");
  });

  $("#cameraAction").onclick = () => {
    $("#photoPicker").click();
  };

  $("#photoAction").onclick = () => {
    $("#photoPicker").removeAttribute("capture");
    $("#photoPicker").click();
  };

  $("#fileAction").onclick = () => {
    $("#filesPicker").click();
  };

  ["photoPicker", "filesPicker"].forEach(id => {
    $("#" + id).addEventListener("change", event => {
      const file = event.target.files[0];

      if (file) {
        state.chat.push({
          name: "You",
          text: "Attachment selected: " + file.name,
          time: "Now"
        });

        save();
        render("chat");
      }

      event.target.value = "";
    });
  });
}

function bindPairing() {
  $$(".pair-btn").forEach(button => {
    button.addEventListener("click", () => {
      const name = button.dataset.name;

      state.unpaired = state.unpaired.filter(
        student => student !== name
      );

      let team = state.teams[0];

      if (!team || team.members.length >= 4) {
        team = {
          name: "New Study Team",
          members: ["You"],
          id: "T" + String(Date.now()).slice(-4)
        };

        state.teams.push(team);
      }

      team.members.push(name);

      save();
      render("teammates");
    });
  });

  $("#createTeam").onclick = () => {
    state.teams.push({
      name: "Study Team " + (state.teams.length + 1),
      members: ["You"],
      id: "T" + String(Date.now()).slice(-4)
    });

    save();
    render("teammates");
  };
}

function bindSettings() {
  $("#notifications").onchange = event => {
    state.settings.notifications = event.target.checked;
    save();
  };

  $("#sound").onchange = event => {
    state.settings.sound = event.target.checked;
    save();
  };

  $("#resetDemo").onclick = () => {
    if (confirm("Reset all locally saved demo data?")) {
      localStorage.removeItem(STORE);
      state = load();
      updateTop();
      render("settings");
    }
  };
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));
}

document.addEventListener("click", event => {
  const button = event.target.closest("[data-go]");

  if (button) {
    go(button.dataset.go);
  }
});

$("#registerForm").addEventListener("submit", event => {
  event.preventDefault();

  const formData = Object.fromEntries(
    new FormData(event.currentTarget).entries()
  );

  state.profile = formData;

  save();

  $("#authScreen").classList.add("hidden");
  $("#app").classList.remove("hidden");

  go("lobby");
});

$("#profileButton").onclick = () => {
  go("settings");
};

updateTop();

setTimeout(() => {
  $("#loadingScreen").classList.add("hidden");

  if (state.profile) {
    $("#app").classList.remove("hidden");
    go("lobby");
  } else {
    $("#authScreen").classList.remove("hidden");
  }
}, 1450);
