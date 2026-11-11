const db = window.db;

let currentUser = null;
let currentProfile = null;
let currentAuthMode = "login";
let missions = [];

const $ = (id) => document.getElementById(id);

// AUTH MODE

function setAuthMode(mode) {
  currentAuthMode = mode;

  $("loginTab").classList.toggle("active", mode === "login");
  $("registerTab").classList.toggle("active", mode === "register");
  $("registerFields").classList.toggle("hidden", mode !== "register");

  $("authSubmit").textContent =
    mode === "login" ? "Login" : "Create Account";

  $("authMessage").textContent = "";
}

$("loginTab").addEventListener("click", () => setAuthMode("login"));
$("registerTab").addEventListener("click", () => setAuthMode("register"));

// REGISTRATION AND LOGIN

$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!db) {
    $("authMessage").textContent = "Supabase is not configured.";
    return;
  }

  const email = $("email").value.trim();
  const password = $("password").value;

  $("authSubmit").disabled = true;
  $("authMessage").textContent = "Please wait...";

  try {
    if (currentAuthMode === "register") {
      const username = $("username").value.trim();

      if (!username) {
        throw new Error("Please enter a username.");
      }

      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            class_name: $("className").value.trim(),
            school_name: $("schoolName").value.trim(),
            syllabus: $("syllabus").value.trim(),
            subjects: $("subjects").value.trim(),
            gender: $("gender").value
          }
        }
      });

      if (error) throw error;

      if (data.session) {
        await loadApplication(data.user);
      } else {
        $("authMessage").textContent =
          "Registration successful. Check your email to confirm your account, then log in.";
      }

    } else {
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      await loadApplication(data.user);
    }

  } catch (error) {
    $("authMessage").textContent = error.message;
  } finally {
    $("authSubmit").disabled = false;
  }
});

// LOAD APPLICATION

async function loadApplication(user) {
  currentUser = user;

  const { data: profile, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  currentProfile = profile || {
    username: user.user_metadata?.username || user.email.split("@")[0],
    class_name: user.user_metadata?.class_name || "",
    school_name: user.user_metadata?.school_name || ""
  };

  $("authScreen").classList.add("hidden");
  $("app").classList.remove("hidden");

  const username = currentProfile.username || "Student";

  $("welcomeName").textContent = username;
  $("sidebarUsername").textContent = username;
  $("topUsername").textContent = username;
  $("userInitial").textContent = username.charAt(0).toUpperCase();

  $("settingsEmail").textContent = "Email: " + user.email;
  $("settingsUsername").textContent = "Username: " + username;
  $("settingsClass").textContent =
    "Class: " + (currentProfile.class_name || "Not added");
  $("settingsSchool").textContent =
    "School: " + (currentProfile.school_name || "Not added");

  await loadMissions();
  await loadBalances();
}

// LOGOUT

$("logoutButton").addEventListener("click", async () => {
  if (!db) return;

  const { error } = await db.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  currentUser = null;
  currentProfile = null;
  missions = [];

  $("app").classList.add("hidden");
  $("authScreen").classList.remove("hidden");
});

// NAVIGATION

function showPage(pageName) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.page === pageName
    );
  });

  const page = $("page-" + pageName);

  if (page) {
    page.classList.add("active");
  }

  const activeButton = document.querySelector(
    `.nav-item[data-page="${pageName}"]`
  );

  $("topTitle").textContent = activeButton
    ? activeButton.textContent.trim()
    : "Lobby";

  closeMenu();

  if (pageName === "completed") renderCompleted();
  if (pageName === "progress") updateProgress();
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.go);
  });
});

// MOBILE MENU

function openMenu() {
  $("sidebar").classList.add("open");
  $("overlay").classList.add("show");
}

function closeMenu() {
  $("sidebar").classList.remove("open");
  $("overlay").classList.remove("show");
}

$("menuButton").addEventListener("click", () => {
  $("sidebar").classList.contains("open") ? closeMenu() : openMenu();
});

$("overlay").addEventListener("click", closeMenu);

// MISSIONS

async function loadMissions() {
  if (!currentUser) return;

  const { data, error } = await db
    .from("missions")
    .select("*")
    .eq("student_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    $("missionList").innerHTML =
      "<p class='muted'>Could not load missions.</p>";
    return;
  }

  missions = data || [];
  renderMissions();
}

function renderMissions() {
  const list = $("missionList");

  if (!missions.length) {
    list.innerHTML = "<p class='muted'>No missions added yet.</p>";
    return;
  }

  list.innerHTML = missions.map(mission => `
    <div class="mission-item ${mission.completed ? "done" : ""}">
      <span>${escapeHTML(mission.title)}</span>
      ${
        mission.completed
          ? "<small>Completed</small>"
          : `<button data-complete="${mission.id}">Mark Done</button>`
      }
    </div>
  `).join("");

  list.querySelectorAll("[data-complete]").forEach(button => {
    button.addEventListener("click", () => {
      completeMission(button.dataset.complete);
    });
  });
}

$("missionForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = $("missionTitle").value.trim();

  if (!title || !currentUser) return;

  const { error } = await db.from("missions").insert({
    student_id: currentUser.id,
    title,
    completed: false
  });

  if (error) {
    alert(error.message);
    return;
  }

  $("missionTitle").value = "";
  await loadMissions();
});

async function completeMission(id) {
  const { error } = await db
    .from("missions")
    .update({ completed: true })
    .eq("id", id)
    .eq("student_id", currentUser.id);

  if (error) {
    alert(error.message);
    return;
  }

  await loadMissions();
}

function renderCompleted() {
  const completed = missions.filter(item => item.completed);
  const remaining = missions.filter(item => !item.completed);

  $("completedList").innerHTML = completed.length
    ? completed.map(item => `<p>✓ ${escapeHTML(item.title)}</p>`).join("")
    : "<p class='muted'>Nothing completed yet.</p>";

  $("remainingList").innerHTML = remaining.length
    ? remaining.map(item => `<p>○ ${escapeHTML(item.title)}</p>`).join("")
    : "<p class='muted'>No remaining missions.</p>";
}

// PROGRESS

function updateProgress() {
  $("progressGP").textContent =
    "You have " + missions.filter(m => m.completed).length +
    " completed missions.";
}

document.querySelectorAll("[data-progress]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-progress]").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    $("progressDetails").innerHTML =
      button.dataset.progress === "daily"
        ? "<h2>Daily Progress</h2><p>Review today's study activities.</p>"
        : "<h2>Weekly Progress</h2><p>Review your weekly study activities.</p>";

    updateProgress();
  });
});

// BALANCES

async function loadBalances() {
  if (!currentUser) return;

  const { data, error } = await db
    .from("reward_balances")
    .select("*")
    .eq("student_id", currentUser.id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  const balance = data || {
    gp: 0,
    xp: 0,
    coins: 0,
    gb_points: 0
  };

  $("gpValue").textContent = balance.gp;
  $("xpValue").textContent = balance.xp;
  $("coinValue").textContent = balance.coins;
  $("gbValue").textContent = balance.gb_points;

  $("rewardXP").textContent = balance.xp;
  $("rewardCoins").textContent = balance.coins;
  $("rewardGB").textContent = balance.gb_points;

  const target = 100;
  const percentage = Math.min(100, (balance.gp / target) * 100);

  $("dailyProgressBar").style.width = percentage + "%";
  $("dailyProgressText").textContent =
    balance.gp + " / " + target + " GP completed";
}

// BASIC HTML SAFETY

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// CHECK EXISTING LOGIN SESSION

async function startApplication() {
  if (!db) return;

  const { data, error } = await db.auth.getSession();

  if (error) {
    console.error(error);
    return;
  }

  if (data.session?.user) {
    await loadApplication(data.session.user);
  }
}

startApplication();
