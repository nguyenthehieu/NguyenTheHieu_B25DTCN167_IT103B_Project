const userLogin = JSON.parse(localStorage.getItem("userLogin"));

if (!userLogin) {
    window.location.href = "../pages/signin.html";
}

const selectBox = document.querySelector("header select");
const toastContainer = document.getElementById("toast");
const monthInput = document.getElementById("monthIn");
const moneyInput = document.getElementById("money");
const saveBtn = document.getElementById("saveBtn");
const moneyDisplay = document.querySelector(".cell h3");
const monthError = document.getElementById("monthError");
const moneyError = document.getElementById("moneyError");
const summaryBox = document.getElementById("summaryBox");
const budgetText = document.getElementById("budgetText");
const spentText = document.getElementById("spentText");
const allocatedText = document.getElementById("allocatedText");
const remainText = document.getElementById("remainText");
const displayName = document.getElementById("displayName");
const displayEmail = document.getElementById("displayEmail");
const displayPhone = document.getElementById("displayPhone");
const displayGender = document.getElementById("displayGender");
const changeInfoBtn = document.getElementById("changeInfoBtn");
const profileModal = document.getElementById("profileModal");
const closeProfileModal = document.getElementById("closeProfileModal");
const cancelProfileModal = document.getElementById("cancelProfileModal");
const profileModalForm = document.getElementById("profileModalForm");
const modalName = document.getElementById("modalName");
const modalEmail = document.getElementById("modalEmail");
const modalPhone = document.getElementById("modalPhone");
const modalGender = document.getElementById("modalGender");
const modalNameError = document.getElementById("modalNameError");
const modalEmailError = document.getElementById("modalEmailError");
const modalPhoneError = document.getElementById("modalPhoneError");
const modalGenderError = document.getElementById("modalGenderError");
const SELECTED_MONTH_KEY = "selectedMonth";

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
        <h3>Xac nhan</h3>
        <p>Ban co chac chan muon dang xuat khong?</p>
        <hr>
        <div class="toast-actions">
            <button class="cancel-btn">Huy</button>
            <button class="confirm-btn">Dang xuat</button>
        </div>
    `;

    toastContainer.innerHTML = "";
    toastContainer.appendChild(toast);

    toast.querySelector(".confirm-btn").onclick = () => {
        localStorage.removeItem("userLogin");
        window.location.href = "../pages/signin.html";
    };

    toast.querySelector(".cancel-btn").onclick = () => {
        toast.remove();
    };
}

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

function getUsers() {
    return JSON.parse(localStorage.getItem("users")) || [];
}

function getCurrentUser() {
    const users = getUsers();
    return users.find((user) => user.id === userLogin.id) || userLogin;
}

function getProfileValue(value, fallback = "") {
    return value ? String(value).trim() : fallback;
}

function getAllocatedBudget(month) {
    return getMonthlyCategories()
        .filter((item) => item.month === month && item.userId === userLogin.id)
        .reduce((total, item) => total + Number(item.budget || 0), 0);
}

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

function renderUserProfile() {
    const currentUser = getCurrentUser();

    displayName.value = getProfileValue(currentUser.name, "Chua cap nhat");
    displayEmail.value = getProfileValue(currentUser.email, "Chua cap nhat");
    displayPhone.value = getProfileValue(currentUser.phone, "Chua cap nhat");
    displayGender.value = getProfileValue(currentUser.gender, "Chua cap nhat");
}

function fillProfileModal() {
    const currentUser = getCurrentUser();

    modalName.value = getProfileValue(currentUser.name);
    modalEmail.value = getProfileValue(currentUser.email);
    modalPhone.value = getProfileValue(currentUser.phone);

    const normalizedGender = getProfileValue(currentUser.gender);
    modalGender.value = ["Male", "Female", "Other"].includes(normalizedGender)
        ? normalizedGender
        : "";
}

function clearProfileErrors() {
    modalNameError.innerText = "";
    modalEmailError.innerText = "";
    modalPhoneError.innerText = "";
    modalGenderError.innerText = "";
}

function clearFieldError(field) {
    if (field === modalName) {
        modalNameError.innerText = "";
    }

    if (field === modalEmail) {
        modalEmailError.innerText = "";
    }

    if (field === modalPhone) {
        modalPhoneError.innerText = "";
    }

    if (field === modalGender) {
        modalGenderError.innerText = "";
    }
}

function openProfileModal() {
    clearProfileErrors();
    fillProfileModal();
    profileModal.classList.remove("hidden");
}

function closeModal() {
    profileModal.classList.add("hidden");
}

function showSuccessToast(message) {
    const toast = document.createElement("div");
    toast.className = "success-toast";
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^\d{9,11}$/.test(phone);
}

monthInput.addEventListener("input", () => {
    monthError.innerText = "";
});

moneyInput.addEventListener("input", () => {
    moneyError.innerText = "";
});

monthInput.addEventListener("change", () => {
    setSelectedMonth(monthInput.value);
    loadData();
});

changeInfoBtn.addEventListener("click", openProfileModal);
closeProfileModal.addEventListener("click", closeModal);
cancelProfileModal.addEventListener("click", closeModal);

profileModal.addEventListener("click", (event) => {
    if (event.target === profileModal) {
        closeModal();
    }
});

[modalName, modalEmail, modalPhone, modalGender].forEach((input) => {
    input.addEventListener("input", () => clearFieldError(input));
    input.addEventListener("change", () => clearFieldError(input));
});

saveBtn.addEventListener("click", function () {
    const month = monthInput.value;
    const money = Number(moneyInput.value);
    let isValid = true;

    if (!month) {
        monthError.innerText = "Vui long chon thang!";
        isValid = false;
    }

    if (!moneyInput.value || money <= 0) {
        moneyError.innerText = "So tien phai > 0!";
        isValid = false;
    }

    if (!isValid) return;

    const data = JSON.parse(localStorage.getItem("monthlyBudget")) || {};

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
    showSuccessToast("Luu ngan sach thanh cong!");
});

profileModalForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearProfileErrors();

    const name = modalName.value.trim();
    const email = modalEmail.value.trim();
    const phone = modalPhone.value.trim();
    const gender = modalGender.value;
    let isValid = true;

    const users = getUsers();
    const emailExists = users.some((user) => user.email === email && user.id !== userLogin.id);

    if (!name) {
        modalNameError.innerText = "Vui long nhap ten.";
        isValid = false;
    }

    if (!email) {
        modalEmailError.innerText = "Vui long nhap email.";
        isValid = false;
    } else if (!isValidEmail(email)) {
        modalEmailError.innerText = "Email khong dung dinh dang.";
        isValid = false;
    } else if (emailExists) {
        modalEmailError.innerText = "Email da ton tai.";
        isValid = false;
    }

    if (!phone) {
        modalPhoneError.innerText = "Vui long nhap so dien thoai.";
        isValid = false;
    } else if (!isValidPhone(phone)) {
        modalPhoneError.innerText = "So dien thoai phai co 9-11 chu so.";
        isValid = false;
    }

    if (!gender) {
        modalGenderError.innerText = "Vui long chon gioi tinh.";
        isValid = false;
    }

    if (!isValid) return;

    const updatedUsers = users.map((user) => {
        if (user.id !== userLogin.id) {
            return user;
        }

        return {
            ...user,
            name,
            email,
            phone,
            gender
        };
    });

    const updatedUser = updatedUsers.find((user) => user.id === userLogin.id);

    localStorage.setItem("users", JSON.stringify(updatedUsers));
    localStorage.setItem("userLogin", JSON.stringify(updatedUser));

    userLogin.name = updatedUser.name;
    userLogin.email = updatedUser.email;
    userLogin.phone = updatedUser.phone;
    userLogin.gender = updatedUser.gender;

    renderUserProfile();
    closeModal();
    showSuccessToast("Cap nhat thong tin thanh cong!");
});

document.addEventListener("DOMContentLoaded", () => {
    monthInput.value = getSelectedMonth();
    renderUserProfile();
    loadData();
});
