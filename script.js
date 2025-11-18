// ---------------------------------------------------------
// 설정: 목업(localStorage) vs 실제 백엔드 API 사용 여부
// true  = localStorage를 이용한 프론트 목업 모드
// false = 실제 서버의 /api/login, /api/signup, /api/forgot-password 호출
// ---------------------------------------------------------
const USE_MOCK_BACKEND = true;

// ---------------------------------------------------------
// 공통 유틸
// ---------------------------------------------------------
function showMessage(type, text) {
  const box = document.getElementById("messageBox");
  box.className = "message-box show " + (type === "success" ? "success" : "error");
  box.textContent = text;
}

function clearMessage() {
  const box = document.getElementById("messageBox");
  box.className = "message-box";
  box.textContent = "";
}

// 🔄 로딩 스피너 제어
function showSpinner() {
  const overlay = document.getElementById("loadingOverlay");
  if (!overlay) return;
  overlay.classList.add("show");

  const buttons = document.querySelectorAll(".primary-btn");
  buttons.forEach((btn) => (btn.disabled = true));
}

function hideSpinner() {
  const overlay = document.getElementById("loadingOverlay");
  if (!overlay) return;
  overlay.classList.remove("show");

  const buttons = document.querySelectorAll(".primary-btn");
  buttons.forEach((btn) => (btn.disabled = false));
}

// ---------------------------------------------------------
// localStorage 기반 목업 유저 관리 (프론트 테스트용)
// ---------------------------------------------------------
function loadUsers() {
  const raw = localStorage.getItem("users");
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("사용자 데이터 파싱 오류:", e);
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function ensureTestUser() {
  const users = loadUsers();
  const exists = users.some((u) => u.email === "test@test.com");
  if (!exists) {
    users.push({
      name: "Test User",
      email: "test@test.com",
      password: "1234"
    });
    saveUsers(users);
  }
}

// ---------------------------------------------------------
// 대시보드 로직
// ---------------------------------------------------------
function goToDashboard(user) {
  const authSection = document.getElementById("authSection");
  const dashboardSection = document.getElementById("dashboardSection");

  if (user?.name) {
    document.getElementById("dashUserName").textContent = user.name;
    document.getElementById("dashWelcomeText").textContent =
      `${user.name}님, 반가워요! 오늘도 멋진 작업을 시작해 볼까요?`;
  }
  if (user?.email) {
    document.getElementById("dashUserEmail").textContent = user.email;
  }

  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(
    2,
    "0"
  )}:${String(now.getMinutes()).padStart(2, "0")}`;
  document.getElementById("dashLoginTime").textContent = timeStr;

  sessionStorage.setItem(
    "currentUser",
    JSON.stringify({
      name: user.name,
      email: user.email,
      loginTime: timeStr
    })
  );

  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
}

function restoreDashboardIfSessionExists() {
  const raw = sessionStorage.getItem("currentUser");
  if (!raw) return;
  try {
    const user = JSON.parse(raw);
    if (user && user.email) {
      goToDashboard(user);
    }
  } catch (e) {
    console.error("세션 유저 파싱 오류:", e);
  }
}

function setupDashboard() {
  const logoutBtn = document.getElementById("logoutBtn");
  const memoInput = document.getElementById("dashMemo");
  const memoInfoText = document.getElementById("memoInfoText");
  const saveMemoBtn = document.getElementById("saveMemoBtn");

  const storedMemo = localStorage.getItem("dashMemo");
  if (storedMemo) {
    memoInput.value = storedMemo;
    memoInfoText.textContent = "마지막 저장된 메모가 있습니다.";
  }

  saveMemoBtn.addEventListener("click", () => {
    const memo = memoInput.value.trim();
    localStorage.setItem("dashMemo", memo);
    memoInfoText.textContent = memo
      ? "메모가 저장되었습니다."
      : "메모가 비어 있어서, 저장 내용이 초기화되었습니다.";
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("currentUser");
    document.getElementById("dashboardSection").classList.add("hidden");
    document.getElementById("authSection").classList.remove("hidden");
    clearMessage();
    showMessage("success", "로그아웃 되었습니다.");
  });
}

// ---------------------------------------------------------
// 탭, 비밀번호 토글
// ---------------------------------------------------------
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const forms = document.querySelectorAll(".form");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;

      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      forms.forEach((form) => {
        if (
          (target === "login" && form.id === "loginForm") ||
          (target === "signup" && form.id === "signupForm")
        ) {
          form.classList.add("active");
        } else {
          form.classList.remove("active");
        }
      });

      clearMessage();
    });
  });
}

function setupPasswordToggle() {
  const toggles = document.querySelectorAll(".toggle-password");

  toggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        btn.textContent = "🙈";
      } else {
        input.type = "password";
        btn.textContent = "👁";
      }
    });
  });
}

// ---------------------------------------------------------
// 비밀번호 찾기 모달
// ---------------------------------------------------------
function showForgotModal() {
  const overlay = document.getElementById("forgotModal");
  const emailInput = document.getElementById("forgotEmail");
  const msg = document.getElementById("forgotMessageBox");
  if (!overlay) return;

  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
  msg.className = "modal-message";
  msg.textContent = "";
  emailInput.value = "";
  emailInput.focus();
}

function hideForgotModal() {
  const overlay = document.getElementById("forgotModal");
  const msg = document.getElementById("forgotMessageBox");
  if (!overlay) return;

  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden", "true");
  if (msg) {
    msg.className = "modal-message";
    msg.textContent = "";
  }
}

function showForgotMessage(type, text) {
  const box = document.getElementById("forgotMessageBox");
  if (!box) return;
  box.className =
    "modal-message show " + (type === "success" ? "success" : "error");
  box.textContent = text;
}

function setupForgotModal() {
  const link = document.getElementById("forgotPasswordLink");
  const overlay = document.getElementById("forgotModal");
  const closeBtn = document.getElementById("forgotCloseBtn");
  const cancelBtn = document.getElementById("forgotCancelBtn");
  const form = document.getElementById("forgotForm");

  if (link) {
    link.addEventListener("click", () => {
      showForgotModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", hideForgotModal);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener("click", hideForgotModal);
  }

  // 바깥 클릭하면 닫기
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        hideForgotModal();
      }
    });
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("forgotEmail");
      const email = emailInput.value.trim();

      if (!email) {
        showForgotMessage("error", "이메일을 입력해주세요.");
        return;
      }
      if (!email.includes("@") || !email.includes(".")) {
        showForgotMessage("error", "이메일 형식이 올바르지 않습니다.");
        return;
      }

      showSpinner();

      if (USE_MOCK_BACKEND) {
        // ---- 목업 모드: localStorage에서 유저 검색 후, 현재 비밀번호를 안내 메시지로 표시 ----
        setTimeout(() => {
          const users = loadUsers();
          const user = users.find((u) => u.email === email);

          if (!user) {
            hideSpinner();
            showForgotMessage("error", "등록되지 않은 이메일입니다.");
            return;
          }

          hideSpinner();
          showForgotMessage(
            "success",
            `비밀번호 재설정 링크를 이메일로 보냈다고 가정합니다.\n테스트용으로 현재 비밀번호는 "${user.password}" 입니다.`
          );
        }, 800);
      } else {
        // ---- 실제 API 모드: /api/forgot-password ----
        fetch("/api/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        })
          .then((res) => res.json())
          .then((data) => {
            if (!data.ok) {
              throw new Error(data.message || "비밀번호 찾기에 실패했습니다.");
            }
            hideSpinner();
            showForgotMessage("success", data.message || "재설정 링크를 이메일로 보냈습니다.");
          })
          .catch((err) => {
            console.error(err);
            hideSpinner();
            showForgotMessage(
              "error",
              err.message || "비밀번호 찾기 중 오류가 발생했습니다."
            );
          });
      }
    });
  }
}

// ---------------------------------------------------------
// 로그인 / 회원가입: 목업 vs 실제 API 분기
// ---------------------------------------------------------
function setupLoginForm() {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const pwInput = document.getElementById("loginPassword");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = pwInput.value;

    if (!email || !password) {
      showMessage("error", "이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    showSpinner();

    if (USE_MOCK_BACKEND) {
      setTimeout(() => {
        const users = loadUsers();
        const user = users.find((u) => u.email === email);

        if (!user || user.password !== password) {
          hideSpinner();
          showMessage("error", "이메일 또는 비밀번호가 올바르지 않습니다.");
          return;
        }

        hideSpinner();
        clearMessage();
        goToDashboard(user);
      }, 800);
    } else {
      fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.ok) {
            throw new Error(data.message || "로그인에 실패했습니다.");
          }
          const user = data.user || { name: "User", email };
          clearMessage();
          goToDashboard(user);
        })
        .catch((err) => {
          console.error(err);
          showMessage("error", err.message || "로그인 중 오류가 발생했습니다.");
        })
        .finally(() => {
          hideSpinner();
        });
    }
  });
}

function setupSignupForm() {
  const form = document.getElementById("signupForm");
  const nameInput = document.getElementById("signupName");
  const emailInput = document.getElementById("signupEmail");
  const pwInput = document.getElementById("signupPassword");
  const pwCheckInput = document.getElementById("signupPasswordCheck");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = pwInput.value;
    const passwordCheck = pwCheckInput.value;

    if (!name || !email || !password || !passwordCheck) {
      showMessage("error", "모든 필드를 입력해주세요.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      showMessage("error", "이메일 형식이 올바르지 않습니다.");
      return;
    }

    if (password.length < 4) {
      showMessage("error", "비밀번호는 최소 4자 이상이어야 합니다.");
      return;
    }

    if (password !== passwordCheck) {
      showMessage("error", "비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    showSpinner();

    if (USE_MOCK_BACKEND) {
      setTimeout(() => {
        const users = loadUsers();
        const exists = users.some((u) => u.email === email);

        if (exists) {
          hideSpinner();
          showMessage("error", "이미 사용 중인 이메일입니다.");
          return;
        }

        users.push({ name, email, password });
        saveUsers(users);

        hideSpinner();
        showMessage(
          "success",
          "회원가입이 완료되었습니다. 이제 로그인 해주세요. ✅"
        );

        form.reset();

        const loginTabButton = document.querySelector(
          '.tab-button[data-target="login"]'
        );
        if (loginTabButton) {
          loginTabButton.click();
        }
      }, 900);
    } else {
      fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password })
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.ok) {
            throw new Error(data.message || "회원가입에 실패했습니다.");
          }

          hideSpinner();
          showMessage(
            "success",
            "회원가입이 완료되었습니다. 이제 로그인 해주세요. ✅"
          );

          form.reset();

          const loginTabButton = document.querySelector(
            '.tab-button[data-target="login"]'
          );
          if (loginTabButton) {
            loginTabButton.click();
          }
        })
        .catch((err) => {
          console.error(err);
          hideSpinner();
          showMessage("error", err.message || "회원가입 중 오류가 발생했습니다.");
        });
    }
  });
}

// ---------------------------------------------------------
// 초기화
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (USE_MOCK_BACKEND) {
    ensureTestUser();
  }

  setupTabs();
  setupPasswordToggle();
  setupForgotModal();
  setupLoginForm();
  setupSignupForm();
  setupDashboard();
  restoreDashboardIfSessionExists();
});
