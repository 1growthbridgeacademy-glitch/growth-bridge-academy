const $ = (id) => document.getElementById(id);

let currentUser = null;
let missions = JSON.parse(localStorage.getItem("gb_missions") || "[]");
let rewards = JSON.parse(localStorage.getItem("gb_rewards") || '{"xp":0,"coins":0,"gb":0}');
let todayGP = 0;

const DAILY_TARGET = 100;

function saveData() {
  localStorage.setItem("gb_missions", JSON.stringify(missions));
  localStorage.setItem("gb_rewards", JSON.stringify(rewards));
}

function showMessage(message) {
  $("authMessage").textContent = message;
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active-page");
  });

  const selected = $(pageId);
  if (selected) selected.classList.add("active-page");

  document.querySelectorAll(".nav-link[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  closeDrawer();
}

function openDrawer() {
  $("sidebar").classList.add("open");
  $("drawerOverlay").classList.add("show");
}

function closeDrawer() {
  $("sidebar").classList.remove("open");
  $("drawerOverlay").classList.remove("show");
}

function renderMissions() {
  const missionList = $("missionList");
  const lobbyList = $("lobbyMissions");
  const completedList = $("completedList");
  const remainingList = $("remainingList");

  missionList.innerHTML = "";
  lobbyList.innerHTML = "";
  completedList.innerHTML = "";
  remainingList.innerHTML = "";

  missions.forEach((mission, index) => {
    const item = document.createElement("div");
    item.className = "mission-item" + (mission.completed ? " completed" : "");

    const title = document.createElement("span");
    title.textContent = `${mission.title} (${mission.gp} GP)`;

    const button = document.createElement("button");
    button.textContent = mission.completed ? "Completed" : "Done";
    button.disabled = mission.completed;
    button.addEventListener("click", () => completeMission(index));

    item.append(title, button);
    missionList.appendChild(item);

    const copy = document.createElement("p");
    copy.textContent = `${mission.title} — ${mission.gp} GP`;
    lobbyList.appendChild(copy);

    const listCopy = document.createElement("p");
    listCopy.textContent = mission.title;

    if (mission.completed) {
      completedList.appendChild(listCopy);
    } else {
      remainingList.appendChild(listCopy);
    }
  });

  updateDashboard();
}

function completeMission(index) {
  const mission = missions[index];
  if (!mission || mission.completed) return;

  mission.completed = true;
  todayGP += mission.gp;

  if (todayGP >= DAILY_TARGET && !mission.dailyRewardGiven) {
    rewards.xp += 10;
    rewards.coins += 20;
    mission.dailyRewardGiven = true;
  }

  saveData();
  renderMissions();
}

function updateDashboard() {
  $("todayGP").textContent = todayGP;
  $("totalXP").textContent = rewards.xp;
  $("totalCoins").textContent = rewards.coins;
  $("totalGB").textContent = rewards.gb;

  $("rewardXP").textContent = rewards.xp;
  $("rewardCoins").textContent = rewards.coins;
  $("rewardGB").textContent = rewards.gb;

  $("dailyProgressText").textContent = `${todayGP} of ${DAILY_TARGET} GP earned`;
  $("dailyProgressBar").style.width =
    `${Math.min(100, (todayGP / DAILY_TARGET) * 100)}%`;

  $("weeklyProgressText").textContent =
    `${missions.filter(m => m.completed).length} missions completed in this browser session.`;

  $("achievementList").textContent =
    missions.some(m => m.completed)
      ? "First Steps: You have completed a mission!"
      : "Complete your first mission to begin earning achievements.";
}

$("menuButton").addEventListener("click", openDrawer);
$("drawerOverlay").addEventListener("click", closeDrawer);

document.querySelectorAll(".nav-link[data-page]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

$("missionForm").addEventListener("submit", event => {
  event.preventDefault();

  const title = $("missionTitle").value.trim();
  const gp = Number($("missionGP").value);

  if (!title || !Number.isFinite(gp) || gp < 0) return;

  missions.push({
    title,
    gp,
    completed: false
  });

  $("missionTitle").value = "";
  saveData();
  renderMissions();
});

$("showRegister").addEventListener("click", () => {
  $("loginForm").classList.add("hidden");
  $("registerForm").classList.remove("hidden");
});

$("backToLogin").addEventListener("click", () => {
  $("registerForm").classList.add("hidden");
  $("loginForm").classList.remove("hidden");
});

$("registerForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!window.db) {
    showMessage("Supabase is not configured yet. Add your project URL and publishable key.");
    return;
  }

  const email = $("regEmail").value.trim();
  const password = $("regPassword").value;
  const username = $("username").value.trim();

  const { error } = await window.db.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        school: $("school").value.trim(),
        class_name: $("className").value.trim(),
        syllabus: $("syllabus").value.trim(),
        subjects: $("subjects").value.trim()
      }
    }
  });

  if (error) {
    showMessage(error.message);
  } else {
    showMessage("Account created. Check your email if confirmation is enabled.");
  }
});

$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!window.db) {
    showMessage("Supabase is not configured yet. Add your project URL and publishable key.");
    return;
  }

  const { data, error } = await window.db.auth.signInWithPassword({
    email: $("email").value.trim(),
    password: $("password").value
  });

  if (error) {
    showMessage(error.message);
  } else {
    currentUser = data.user;
    enterApp();
  }
});

async function enterApp() {
  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");

  const displayName =
    currentUser?.user_metadata?.username ||
    currentUser?.email ||
    "Student";

  $("userDisplay").textContent = displayName;
  $("settingsUsername").textContent = displayName;
  $("settingsEmail").textContent = currentUser?.email || "";

  renderMissions();
}

$("logoutButton").addEventListener("click", async () => {
  if (window.db) {
    await window.db.auth.signOut();
  }

  currentUser = null;
  $("app").classList.add("hidden");
  $("authScreen").classList.remove("hidden");
});

async function checkExistingSession() {
  if (!window.db) return;

  const { data } = await window.db.auth.getSession();

  if (data.session) {
    currentUser = data.session.user;
    enterApp();
  }
}

checkExistingSession();
renderMissions();
