// Bảo vệ trang lịch sử: nếu chưa đăng nhập thì chuyển về trang sign in.
const userLogin = JSON.parse(localStorage.getItem("userLogin"));

if (!userLogin) {
    window.location.href = "../pages/signin.html";
}

const selectBox = document.getElementById("accountSelect");
const toastContainer = document.getElementById("toast");

// Dropdown tài khoản đang dùng cho thao tác đăng xuất.
selectBox.addEventListener("change", function () {
    if (this.value === "logout") {
        showLogoutToast();
        this.value = "";
    }
});

// Hiển thị toast xác nhận trước khi xóa phiên đăng nhập.
function showLogoutToast() {
    toastContainer.innerHTML = "";

    const toast = document.createElement("div");
    toast.className = "toast";

    toast.innerHTML = `
        <img src="../assets/icon/image 2.png" alt="">
        <h3>Xac nhan</h3>
        <p>Bạn có chắc chắn muốn đăng xuất không ?</p>
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

// Bọc input/select bằng một wrapper để hiển thị lỗi ngay bên dưới trường dữ liệu.
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

// Ghi nhớ tháng đang xem để đồng bộ giữa các trang.
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

// Các hàm get* chỉ đọc dữ liệu từ localStorage để tái sử dụng cho toàn trang.
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

// Tính tổng số tiền đã chi trong một danh mục của tháng hiện tại.
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

// Reset lỗi của form thêm giao dịch trước mỗi lần validate.
function clearTransactionErrors() {
    monthError.innerText = "";
    amountError.innerText = "";
    categoryError.innerText = "";
}

// Validate đủ tháng, số tiền và danh mục trước khi cho phép thêm giao dịch.
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

// Tiền còn lại ở đây là ngân sách tháng trừ tổng số tiền đã phân bổ cho các danh mục.
function loadRemainingBudget() {
    const month = monthInput.value;
    // Lấy toàn bộ ngân sách đã lưu, sau đó chỉ lấy phần của user hiện tại.
    const monthlyBudget = getMonthlyBudget();
    const userBudget = monthlyBudget[userLogin.id] || {};
    // monthData là dữ liệu ngân sách của đúng tháng đang chọn.
    const monthData = userBudget[month];

    if (!monthData) {
        moneyDisplay.innerText = "0 VND";
        return;
    }

    const remain = (monthData.budget || 0) - getAllocatedBudget(month);
    moneyDisplay.innerText = remain.toLocaleString("vi-VN") + " VND";
}

// Tạo cảnh báo nếu một danh mục đã chi vượt quá ngân sách được phân bổ.
function renderWarnings() {
    const month = monthInput.value;
    // Lấy danh sách category gốc để đổi categoryId thành tên danh mục khi hiển thị cảnh báo.
    const categories = getCategories();
    // Chỉ lấy các danh mục đã phân bổ của đúng tháng và đúng user hiện tại.
    const monthlyCategories = getMonthlyCategories().filter(
        item => item.month === month && item.userId === userLogin.id
    );
    // Chỉ lấy các giao dịch phát sinh trong tháng đang xem của user hiện tại.
    const transactions = getTransactions().filter(
        item => item.month === month && item.userId === userLogin.id
    );

    const warningMessages = monthlyCategories
        .map(item => {
            // Từ categoryId của monthlyCategories, tìm lại thông tin category đầy đủ.
            const category = categories.find(c => c.id === item.categoryId);
            if (!category) {
                return null;
            }

            // Tính tổng tiền đã chi của riêng danh mục này trong tháng hiện tại.
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

// Nếu toast cảnh báo đã tồn tại thì cập nhật nội dung, nếu chưa có thì tạo mới.
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
            <span>Cảnh báo tài chính</span>
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

// Mỗi toast cảnh báo tự biến mất sau 5 giây nếu không có thay đổi mới.
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

// Ép reflow để animation progress chạy lại từ đầu.
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

// Chỉ load các danh mục của tháng hiện tại để người dùng chọn khi thêm giao dịch.
function loadCategories() {
    const month = monthInput.value;
    // Dữ liệu monthlyCategories dùng để biết tháng này user đã được gán những danh mục nào.
    const monthlyCategories = getMonthlyCategories();
    // Dữ liệu categories dùng để lấy tên danh mục tương ứng với categoryId.
    const categories = getCategories();

    categorySelect.innerHTML = '<option value="">Danh muc chi tieu</option>';

    const userMonthlyCategories = monthlyCategories.filter(
        item => item.month === month && item.userId === userLogin.id
    );

    userMonthlyCategories.forEach(item => {
        // Tìm category gốc để hiển thị tên danh mục trong option.
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

// Lọc theo tháng, user hiện tại và từ khóa; sau đó mới sắp xếp theo số tiền.
function getFilteredTransactions() {
    const month = monthInput.value;
    const keyword = searchInput.value.trim().toLowerCase();
    // Lấy categories để map categoryId sang tên danh mục phục vụ tìm kiếm.
    const categories = getCategories();

    return getTransactions()
        .filter(transaction => {
            // Chỉ giữ lại giao dịch thuộc tháng đang chọn và thuộc user hiện tại.
            if (transaction.month !== month || transaction.userId !== userLogin.id) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            // Từ categoryId trong transaction, tìm tên category để so khớp từ khóa tìm kiếm.
            const category = categories.find(c => c.id === transaction.categoryId);
            const categoryName = category ? category.name.toLowerCase() : "";

            return categoryName.includes(keyword);
        })
        .sort((a, b) => sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount);
}

function updateSortButtonText() {
    sortBtn.textContent = sortDirection === "asc" ? "So tien: tang dan" : "So tien: giam dan";
}

// Phân trang danh sách giao dịch để bảng không quá dài.
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

// Render bảng giao dịch theo kết quả lọc, sắp xếp và phân trang hiện tại.
function renderTransactions() {
    // Lấy categories để đổi categoryId trong giao dịch thành tên danh mục hiển thị trên bảng.
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
        // Mỗi giao dịch chỉ lưu categoryId nên cần tìm lại tên danh mục từ bảng categories.
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

// Xác nhận trước khi xóa giao dịch để tránh thao tác nhầm.
function showDeleteTransactionToast(id) {
    toastContainer.innerHTML = "";

    const toast = document.createElement("div");
    toast.className = "toast";

    toast.innerHTML = `
        <img src="../assets/icon/image 2.png" alt="">
        <h3>Xac nhan</h3>
        <p>Ban co chac chan muon xoa giao dich nay khong?</p>
        <hr>
        <div class="toast-actions">
            <button class="cancel-btn">Huy</button>
            <button class="delete-confirm-btn">Xoa</button>
        </div>
    `;

    toastContainer.appendChild(toast);

    toast.querySelector(".delete-confirm-btn").onclick = () => {
        // Lấy lại toàn bộ dữ liệu liên quan trước khi xóa để cập nhật đồng bộ.
        let transactions = getTransactions();
        let monthlyBudget = getMonthlyBudget();
        let monthlyCategories = getMonthlyCategories();
        // Tìm đúng giao dịch cần xóa dựa trên id được truyền vào.
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

// Thêm giao dịch mới và đồng bộ lại ngân sách, danh mục, bảng dữ liệu và cảnh báo.
addTransactionBtn.addEventListener("click", function () {
    const month = monthInput.value;
    const amount = Number(amountInput.value);
    const categoryId = Number(categorySelect.value);
    const note = noteInput.value.trim();

    if (!validateTransactionForm()) {
        return;
    }

    // Lấy dữ liệu hiện có để thêm mới rồi ghi ngược lại vào localStorage.
    let transactions = getTransactions();
    let monthlyBudget = getMonthlyBudget();
    let monthlyCategories = getMonthlyCategories();

    if (!monthlyBudget[userLogin.id]) {
        monthlyBudget[userLogin.id] = {};
    }

    if (!monthlyBudget[userLogin.id][month]) {
        monthlyBudget[userLogin.id][month] = { budget: 0, spent: 0 };
    }

    // Kiểm tra danh mục này đã từng được gán cho tháng hiện tại chưa.
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

// Khi trang tải xong thì khôi phục tháng đã chọn và render dữ liệu ban đầu.
document.addEventListener("DOMContentLoaded", () => {
    monthInput.value = getSelectedMonth();
    updateSortButtonText();

    loadRemainingBudget();
    loadCategories();
    renderTransactions();
    renderWarnings();
});

// Các listener bên dưới giúp giao diện phản hồi ngay khi đổi tháng, tìm kiếm hoặc sắp xếp.
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
