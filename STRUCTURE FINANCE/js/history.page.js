const userLogin = JSON.parse(localStorage.getItem("userLogin"));

if (!userLogin) {
    window.location.href = "../pages/signin.html";
}

const selectBox = document.getElementById("accountSelect");
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
        <h3>Xac nhan</h3>
        <p>Ban co chac chan muon dang xuat khong?</p>
        <hr>
        <div class="toast-actions">
            <button class="cancel-btn">Huy</button>
            <button class="confirm-btn">Dang xuat</button>
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

const monthInput = document.getElementById("monthIn");
const amountInput = document.getElementById("amountInput");
const categorySelect = document.getElementById("categorySelect");
const noteInput = document.getElementById("noteInput");
const addTransactionBtn = document.getElementById("addTransactionBtn");
const tableBody = document.querySelector("tbody");
const moneyDisplay = document.querySelector(".cell h3");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const sortBtn = document.getElementById("sortBtn");
const pagination = document.getElementById("pagination");
const warningToastContainer = document.getElementById("warningToastContainer");
const activeWarningToasts = new Map();
const SELECTED_MONTH_KEY = "selectedMonth";
const PAGE_SIZE = 5;

let currentPage = 1;
let sortDirection = "desc";

function createFieldError(element) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "stretch";

    if (element.classList.contains("input-Money") || element.classList.contains("note-Input")) {
        wrapper.style.width = "174px";
    } else if (element.tagName === "SELECT") {
        wrapper.style.width = "173px";
    } else if (element.type === "month") {
        wrapper.style.width = "fit-content";
        wrapper.style.margin = "0 auto";
    }

    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);

    const error = document.createElement("p");
    error.style.color = "red";
    error.style.fontSize = "12px";
    error.style.marginTop = "6px";
    error.style.marginBottom = "0";
    error.style.width = "100%";
    error.style.textAlign = "left";
    wrapper.appendChild(error);
    return error;
}

const monthError = createFieldError(monthInput);
const amountError = createFieldError(amountInput);
const categoryError = createFieldError(categorySelect);

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

function getTransactions() {
    return JSON.parse(localStorage.getItem("transactions")) || [];
}

function getCategories() {
    return JSON.parse(localStorage.getItem("categories")) || [];
}

function getMonthlyCategories() {
    return JSON.parse(localStorage.getItem("monthlyCategories")) || [];
}

function getMonthlyBudget() {
    return JSON.parse(localStorage.getItem("monthlyBudget")) || {};
}

function getCategorySpent(month, categoryId) {
    return getTransactions()
        .filter(item => item.month === month && item.userId === userLogin.id && item.categoryId === categoryId)
        .reduce((total, item) => total + Number(item.amount || 0), 0);
}

function getAllocatedBudget(month) {
    return getMonthlyCategories()
        .filter(item => item.month === month && item.userId === userLogin.id)
        .reduce((total, item) => total + Number(item.budget || 0), 0);
}

function clearTransactionErrors() {
    monthError.innerText = "";
    amountError.innerText = "";
    categoryError.innerText = "";
}

function validateTransactionForm() {
    const month = monthInput.value;
    const amount = Number(amountInput.value);
    const categoryId = Number(categorySelect.value);
    let isValid = true;

    clearTransactionErrors();

    if (!month) {
        monthError.innerText = "Vui long chon thang";
        isValid = false;
    }

    if (!amountInput.value || amount <= 0) {
        amountError.innerText = "So tien phai > 0";
        isValid = false;
    }

    if (!categoryId) {
        categoryError.innerText = "Vui long chon danh muc";
        isValid = false;
    }

    return isValid;
}

function loadRemainingBudget() {
    const month = monthInput.value;
    const monthlyBudget = getMonthlyBudget();
    const userBudget = monthlyBudget[userLogin.id] || {};
    const monthData = userBudget[month];

    if (!monthData) {
        moneyDisplay.innerText = "0 VND";
        return;
    }

    const remain = (monthData.budget || 0) - getAllocatedBudget(month);
    moneyDisplay.innerText = remain.toLocaleString("vi-VN") + " VND";
}

function renderWarnings() {
    const month = monthInput.value;
    const categories = getCategories();
    const monthlyCategories = getMonthlyCategories().filter(
        item => item.month === month && item.userId === userLogin.id
    );
    const transactions = getTransactions().filter(
        item => item.month === month && item.userId === userLogin.id
    );

    const warningMessages = monthlyCategories
        .map(item => {
            const category = categories.find(c => c.id === item.categoryId);
            if (!category) {
                return null;
            }

            const spent = transactions
                .filter(transaction => transaction.categoryId === item.categoryId)
                .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

            if (spent <= item.budget) {
                return null;
            }

            return {
                key: `${month}-${item.categoryId}`,
                message: `Danh muc "${category.name}" da vuot muc chi tieu: ${spent.toLocaleString("vi-VN")} / ${Number(item.budget || 0).toLocaleString("vi-VN")} VND`
            };
        })
        .filter(Boolean);

    const nextKeys = new Set(warningMessages.map(item => item.key));

    activeWarningToasts.forEach((toastData, key) => {
        if (!nextKeys.has(key)) {
            removeWarningToast(key);
        }
    });

    warningMessages.forEach((item, index) => {
        upsertWarningToast(item.key, item.message, index);
    });
}

function upsertWarningToast(key, message, index) {
    const existingToast = activeWarningToasts.get(key);

    if (existingToast) {
        existingToast.message.innerText = message;
        existingToast.element.style.setProperty("--toast-index", index);
        existingToast.element.classList.remove("is-leaving");
        existingToast.element.classList.remove("is-refreshing");
        void existingToast.element.offsetWidth;
        existingToast.element.classList.add("is-refreshing");
        restartWarningToastProgress(existingToast.progress);
        resetWarningToastTimer(key);
        return;
    }

    const toast = document.createElement("div");
    toast.className = "warning-toast";
    toast.style.setProperty("--toast-index", index);
    toast.innerHTML = `
        <div class="warning-toast-title">
            <img src="../assets/icon/warning.png" alt="">
            <span>Canh bao tai chinh</span>
        </div>
        <p></p>
        <div class="warning-toast-progress"></div>
    `;

    const messageElement = toast.querySelector("p");
    const progressElement = toast.querySelector(".warning-toast-progress");
    messageElement.innerText = message;
    warningToastContainer.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("is-visible");
        restartWarningToastProgress(progressElement);
    });

    activeWarningToasts.set(key, {
        element: toast,
        message: messageElement,
        progress: progressElement,
        timeoutId: null
    });

    resetWarningToastTimer(key);
}

function resetWarningToastTimer(key) {
    const toastData = activeWarningToasts.get(key);
    if (!toastData) {
        return;
    }

    if (toastData.timeoutId) {
        clearTimeout(toastData.timeoutId);
    }

    toastData.timeoutId = setTimeout(() => {
        removeWarningToast(key);
    }, 5000);
}

function restartWarningToastProgress(progressElement) {
    if (!progressElement) {
        return;
    }

    progressElement.classList.remove("is-running");
    void progressElement.offsetWidth;
    progressElement.classList.add("is-running");
}

function removeWarningToast(key) {
    const toastData = activeWarningToasts.get(key);
    if (!toastData) {
        return;
    }

    if (toastData.timeoutId) {
        clearTimeout(toastData.timeoutId);
    }

    toastData.element.classList.remove("is-visible");
    toastData.element.classList.add("is-leaving");

    const handleRemove = () => {
        toastData.element.removeEventListener("transitionend", handleRemove);
        toastData.element.remove();
    };

    toastData.element.addEventListener("transitionend", handleRemove);
    activeWarningToasts.delete(key);
}

function loadCategories() {
    const month = monthInput.value;
    const monthlyCategories = getMonthlyCategories();
    const categories = getCategories();

    categorySelect.innerHTML = '<option value="">Danh muc chi tieu</option>';

    const userMonthlyCategories = monthlyCategories.filter(
        item => item.month === month && item.userId === userLogin.id
    );

    userMonthlyCategories.forEach(item => {
        const category = categories.find(c => c.id === item.categoryId);
        if (!category || !category.status) {
            return;
        }

        const spent = getCategorySpent(month, item.categoryId);
        const remain = Number(item.budget || 0) - spent;

        const option = document.createElement("option");
        option.value = item.categoryId;
        option.textContent = `${category.name} - con lai ${remain.toLocaleString("vi-VN")} VND`;
        categorySelect.appendChild(option);
    });
}

function getFilteredTransactions() {
    const month = monthInput.value;
    const keyword = searchInput.value.trim().toLowerCase();
    const categories = getCategories();

    return getTransactions()
        .filter(transaction => {
            if (transaction.month !== month || transaction.userId !== userLogin.id) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            const category = categories.find(c => c.id === transaction.categoryId);
            const categoryName = category ? category.name.toLowerCase() : "";

            return categoryName.includes(keyword);
        })
        .sort((a, b) => sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount);
}

function updateSortButtonText() {
    sortBtn.textContent = sortDirection === "asc" ? "So tien: tang dan" : "So tien: giam dan";
}

function renderPagination(totalItems) {
    pagination.innerHTML = "";

    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.innerHTML = '<i class="bi bi-arrow-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => {
        if (currentPage === 1) {
            return;
        }
        currentPage -= 1;
        renderTransactions();
    });
    pagination.appendChild(prevBtn);

    for (let page = 1; page <= totalPages; page++) {
        const pageBtn = document.createElement("button");
        pageBtn.type = "button";
        pageBtn.textContent = page;
        if (page === currentPage) {
            pageBtn.classList.add("active");
        }
        pageBtn.addEventListener("click", () => {
            currentPage = page;
            renderTransactions();
        });
        pagination.appendChild(pageBtn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.innerHTML = '<i class="bi bi-arrow-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => {
        if (currentPage === totalPages) {
            return;
        }
        currentPage += 1;
        renderTransactions();
    });
    pagination.appendChild(nextBtn);
}

function renderTransactions() {
    const categories = getCategories();
    const filtered = getFilteredTransactions();
    const keyword = searchInput.value.trim();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedTransactions = filtered.slice(startIndex, startIndex + PAGE_SIZE);

    tableBody.innerHTML = "";

    if (filtered.length === 0) {
        const emptyMessage = keyword ? "Khong tim thay giao dich phu hop" : "Chua co giao dich";
        tableBody.innerHTML = `<tr><td colspan="5">${emptyMessage}</td></tr>`;
        renderPagination(0);
        return;
    }

    paginatedTransactions.forEach((transaction, index) => {
        const category = categories.find(c => c.id === transaction.categoryId);
        const categoryName = category ? category.name : "Unknown";
        const noteText = transaction.note ? transaction.note : "Khong co ghi chu";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td>${categoryName}</td>
            <td>${transaction.amount.toLocaleString("vi-VN")} VND</td>
            <td>${noteText}</td>
            <td><i class="bi bi-trash" onclick="deleteTransaction(${transaction.id})"></i></td>
        `;
        tableBody.appendChild(row);
    });

    renderPagination(filtered.length);
}

function showDeleteTransactionToast(id) {
    const toast = document.createElement("div");
    toast.className = "toast";

    toast.innerHTML = `
        <img src="../assets/icon/image 2.png" alt="">
        <h3>Xac nhan</h3>
        <p>Ban co chac chan muon xoa giao dich nay khong?</p>
        <hr>
        <div class="toast-actions">
            <button class="cancel-btn">Huy</button>
            <button class="confirm-btn">Xoa</button>
        </div>
    `;

    toastContainer.appendChild(toast);

    toast.querySelector(".confirm-btn").onclick = () => {
        let transactions = getTransactions();
        let monthlyBudget = getMonthlyBudget();
        let monthlyCategories = getMonthlyCategories();
        const transaction = transactions.find(item => item.id === id);

        if (!transaction) {
            toast.remove();
            return;
        }

        const transactionMonth = transaction.month;

        if (!monthlyBudget[userLogin.id]) {
            monthlyBudget[userLogin.id] = {};
        }

        if (!monthlyBudget[userLogin.id][transactionMonth]) {
            monthlyBudget[userLogin.id][transactionMonth] = { budget: 0, spent: 0 };
        }

        monthlyBudget[userLogin.id][transactionMonth].spent = Math.max(
            0,
            (monthlyBudget[userLogin.id][transactionMonth].spent || 0) - transaction.amount
        );

        transactions = transactions.filter(item => item.id !== id);

        const hasCategoryTransactions = transactions.some(
            item =>
                item.month === transactionMonth &&
                item.userId === userLogin.id &&
                item.categoryId === transaction.categoryId
        );

        if (!hasCategoryTransactions) {
            monthlyCategories = monthlyCategories.filter(
                item =>
                    !(
                        item.month === transactionMonth &&
                        item.userId === userLogin.id &&
                        item.categoryId === transaction.categoryId
                    )
            );
        }

        localStorage.setItem("transactions", JSON.stringify(transactions));
        localStorage.setItem("monthlyBudget", JSON.stringify(monthlyBudget));
        localStorage.setItem("monthlyCategories", JSON.stringify(monthlyCategories));

        loadRemainingBudget();
        loadCategories();
        renderTransactions();
        renderWarnings();
        toast.remove();
    };

    toast.querySelector(".cancel-btn").onclick = () => {
        toast.remove();
    };
}

addTransactionBtn.addEventListener("click", function () {
    const month = monthInput.value;
    const amount = Number(amountInput.value);
    const categoryId = Number(categorySelect.value);
    const note = noteInput.value.trim();

    if (!validateTransactionForm()) {
        return;
    }

    let transactions = getTransactions();
    let monthlyBudget = getMonthlyBudget();
    let monthlyCategories = getMonthlyCategories();

    if (!monthlyBudget[userLogin.id]) {
        monthlyBudget[userLogin.id] = {};
    }

    if (!monthlyBudget[userLogin.id][month]) {
        monthlyBudget[userLogin.id][month] = { budget: 0, spent: 0 };
    }

    const existingMonthlyCategory = monthlyCategories.find(
        item => item.month === month && item.userId === userLogin.id && item.categoryId === categoryId
    );

    if (!existingMonthlyCategory) {
        monthlyCategories.push({
            id: monthlyCategories.length > 0 ? monthlyCategories[monthlyCategories.length - 1].id + 1 : 1,
            month: month,
            userId: userLogin.id,
            categoryId: categoryId,
            budget: 0
        });
    }

    transactions.push({
        id: transactions.length > 0 ? transactions[transactions.length - 1].id + 1 : 1,
        userId: userLogin.id,
        month: month,
        categoryId: categoryId,
        amount: amount,
        note: note,
        date: new Date().toISOString()
    });

    monthlyBudget[userLogin.id][month].spent += amount;

    localStorage.setItem("transactions", JSON.stringify(transactions));
    localStorage.setItem("monthlyBudget", JSON.stringify(monthlyBudget));
    localStorage.setItem("monthlyCategories", JSON.stringify(monthlyCategories));

    amountInput.value = "";
    categorySelect.value = "";
    noteInput.value = "";
    clearTransactionErrors();
    currentPage = 1;

    loadRemainingBudget();
    loadCategories();
    renderTransactions();
    renderWarnings();
}
);

function deleteTransaction(id) {
    showDeleteTransactionToast(id);
}

document.addEventListener("DOMContentLoaded", () => {
    monthInput.value = getSelectedMonth();
    updateSortButtonText();

    loadRemainingBudget();
    loadCategories();
    renderTransactions();
    renderWarnings();
});

monthInput.addEventListener("change", () => {
    setSelectedMonth(monthInput.value);
    monthError.innerText = "";
    currentPage = 1;
    loadRemainingBudget();
    loadCategories();
    renderTransactions();
    renderWarnings();
});

monthInput.addEventListener("input", () => {
    monthError.innerText = "";
});

amountInput.addEventListener("input", () => {
    amountError.innerText = "";
});

categorySelect.addEventListener("change", () => {
    categoryError.innerText = "";
});

sortBtn.addEventListener("click", () => {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
    updateSortButtonText();
    currentPage = 1;
    renderTransactions();
});

searchBtn.addEventListener("click", () => {
    currentPage = 1;
    renderTransactions();
});

searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderTransactions();
});
