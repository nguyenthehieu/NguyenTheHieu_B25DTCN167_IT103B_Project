// ================== KIỂM TRA ĐĂNG NHẬP ==================
const userLogin = JSON.parse(localStorage.getItem("userLogin"));

if (!userLogin) {
    window.location.href = "../pages/signin.html";
}

// ================== LOGOUT ==================
const selectBox = document.querySelector("header select");
const toastContainer = document.getElementById("toast");

selectBox.addEventListener("change", function () {
    if (this.value === "logout") {
        showLogoutToast();
        this.value = "";
    }
});

function showLogoutToast() {
    const toast = document.createElement("div");
    toast.className = "toast";

    toast.innerHTML = `
        <img src="../assets/icon/image 2.png" alt="">
        <h3>Xác nhận</h3>
        <p>Bạn có chắc chắn muốn đăng xuất không?</p>
        <hr>
        <div class="toast-actions">
            <button class="cancel-btn">Hủy</button>
            <button class="confirm-btn">Đăng xuất</button>
        </div>
    `;

    toastContainer.appendChild(toast);

    toast.querySelector(".confirm-btn").onclick = () => {
        localStorage.removeItem("userLogin");
        window.location.href = "../pages/signin.html";
    };

    toast.querySelector(".cancel-btn").onclick = () => {
        toast.remove();
    };
}

// ================== DOM ==================
const monthInput = document.getElementById("monthIn");
const moneyInput = document.getElementById("money");
const saveBtn = document.getElementById("saveBtn");
const moneyDisplay = document.querySelector(".cell h3");

const monthError = document.getElementById("monthError");
const moneyError = document.getElementById("moneyError");

// summary
const summaryBox = document.getElementById("summaryBox");
const budgetText = document.getElementById("budgetText");
const spentText = document.getElementById("spentText");
const allocatedText = document.getElementById("allocatedText");
const remainText = document.getElementById("remainText");
const SELECTED_MONTH_KEY = "selectedMonth";

function getDefaultMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getSelectedMonth() {
    return localStorage.getItem(SELECTED_MONTH_KEY) || getDefaultMonth();
}

function setSelectedMonth(month) {
    localStorage.setItem(SELECTED_MONTH_KEY, month);
}

function getMonthlyCategories() {
    return JSON.parse(localStorage.getItem("monthlyCategories")) || [];
}

function getAllocatedBudget(month) {
    return getMonthlyCategories()
        .filter(item => item.month === month && item.userId === userLogin.id)
        .reduce((total, item) => total + Number(item.budget || 0), 0);
}

// ================== CLEAR ERROR ==================
monthInput.addEventListener("input", () => {
    monthError.innerText = "";
});

moneyInput.addEventListener("input", () => {
    moneyError.innerText = "";
});

// ================== RENDER SUMMARY ==================
function renderSummary(month) {
    const data = JSON.parse(localStorage.getItem("monthlyBudget")) || {};
    const userData = data[userLogin.id] || {};

    if (!userData[month]) {
        summaryBox.style.display = "none";
        return;
    }

    const budget = userData[month].budget;
    const spent = userData[month].spent || 0;
    const allocated = getAllocatedBudget(month);
    const remain = budget - allocated;

    budgetText.innerText = budget.toLocaleString();
    spentText.innerText = spent.toLocaleString();
    allocatedText.innerText = allocated.toLocaleString();
    remainText.innerText = remain.toLocaleString();

    summaryBox.style.display = "block";
}

// ================== LOAD DATA ==================
function loadData() {
    const month = monthInput.value;
    const data = JSON.parse(localStorage.getItem("monthlyBudget")) || {};
    const userData = data[userLogin.id] || {};

    if (userData[month]) {
        const budget = userData[month].budget;
        const remain = budget - getAllocatedBudget(month);

        moneyInput.value = budget;
        moneyDisplay.innerText = remain.toLocaleString() + " VND";

        renderSummary(month);
    } else {
        moneyInput.value = "";
        moneyDisplay.innerText = "0 VND";
        summaryBox.style.display = "none";
    }
}

monthInput.addEventListener("change", () => {
    setSelectedMonth(monthInput.value);
    loadData();
});

// ================== TOAST ==================
function showSuccessToast(message) {
    const toast = document.createElement("div");
    toast.className = "success-toast";
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// ================== SAVE ==================
saveBtn.addEventListener("click", function () {
    const month = monthInput.value;
    const money = Number(moneyInput.value);

    let isValid = true;

    if (!month) {
        monthError.innerText = "Vui lòng chọn tháng!";
        isValid = false;
    }

    if (!moneyInput.value || money <= 0) {
        moneyError.innerText = "Số tiền phải > 0!";
        isValid = false;
    }

    if (!isValid) return;

    let data = JSON.parse(localStorage.getItem("monthlyBudget")) || {};

    if (!data[userLogin.id]) {
        data[userLogin.id] = {};
    }

    const allocatedBudget = getAllocatedBudget(month);
    if (allocatedBudget > money) {
        moneyError.innerText = "Ngan sach thang phai >= tong danh muc da phan bo!";
        return;
    }

    data[userLogin.id][month] = {
        budget: money,
        spent: data[userLogin.id][month]?.spent || 0
    };

    localStorage.setItem("monthlyBudget", JSON.stringify(data));

    loadData();

    showSuccessToast("Lưu ngân sách thành công!");
});

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", () => {
    monthInput.value = getSelectedMonth();

    loadData();
});
