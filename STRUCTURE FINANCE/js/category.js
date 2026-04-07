// Bảo vệ trang danh mục: chưa đăng nhập thì quay về trang sign in.
const userLogin = JSON.parse(localStorage.getItem("userLogin"));

if (!userLogin) {
    window.location.href = "../pages/signin.html";
}

// Nhóm xử lý đăng xuất dùng chung với các trang còn lại.
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

// Xác nhận trước khi xóa một danh mục đã phân bổ trong tháng.
function showDeleteToast(id) {
    const toast = document.createElement("div");
    toast.className = "toast";

    toast.innerHTML = `
        <img src="../assets/icon/image 2.png" alt="">
        <h3>Xac nhan</h3>
        <p>Ban co chac chan muon xoa danh muc nay khong?</p>
        <hr>
        <div class="toast-actions">
            <button class="cancel-btn">Huy</button>
            <button class="confirm-btn">Xoa</button>
        </div>
    `;

    toastContainer.appendChild(toast);

    toast.querySelector(".confirm-btn").onclick = () => {
        let monthlyCategories = JSON.parse(localStorage.getItem("monthlyCategories")) || [];

        monthlyCategories = monthlyCategories.filter(item => item.id !== id);
        localStorage.setItem("monthlyCategories", JSON.stringify(monthlyCategories));

        loadBudget();
        renderCategories();
        toast.remove();
    };

    toast.querySelector(".cancel-btn").onclick = () => {
        toast.remove();
    };
}

// Các phần tử chính của màn hình quản lý danh mục.
const monthInput = document.getElementById("monthIn");
const moneyDisplay = document.querySelector(".cell h3");
const categoryName = document.getElementById("categoryName");
const categoryMoney = document.getElementById("categoryMoney");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const categoryList = document.getElementById("categoryList");
const SELECTED_MONTH_KEY = "selectedMonth";

let isEditing = false;
let editingId = null;

// Ghi nhớ tháng đang thao tác để đồng bộ giữa các trang.
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

const nameError = document.createElement("p");
nameError.style.color = "red";
nameError.style.fontSize = "12px";
nameError.style.marginTop = "5px";

const selectWrapper = document.createElement("div");
selectWrapper.style.display = "inline-block";
selectWrapper.style.position = "relative";
categoryName.parentNode.insertBefore(selectWrapper, categoryName);
selectWrapper.appendChild(categoryName);
selectWrapper.appendChild(nameError);

const moneyError = document.createElement("p");
moneyError.style.color = "red";
moneyError.style.fontSize = "12px";
moneyError.style.marginTop = "5px";

const inputWrapper = document.createElement("div");
inputWrapper.style.display = "inline-block";
inputWrapper.style.position = "relative";
categoryMoney.parentNode.insertBefore(inputWrapper, categoryMoney);
inputWrapper.appendChild(categoryMoney);
inputWrapper.appendChild(moneyError);

// Các hàm đọc dữ liệu từ localStorage được gom riêng để tránh lặp lại logic parse JSON.
function getMonthlyCategories() {
    return JSON.parse(localStorage.getItem("monthlyCategories")) || [];
}

function getCategories() {
    return JSON.parse(localStorage.getItem("categories")) || [];
}

function getTransactions() {
    return JSON.parse(localStorage.getItem("transactions")) || [];
}

function getCategorySpent(month, categoryId) {
    return getTransactions()
        .filter(item => item.month === month && item.userId === userLogin.id && item.categoryId === categoryId)
        .reduce((total, item) => total + Number(item.amount || 0), 0);
}

function getAllocatedBudget(month, excludedMonthlyCategoryId = null) {
    return getMonthlyCategories()
        .filter(item =>
            item.month === month &&
            item.userId === userLogin.id &&
            item.id !== excludedMonthlyCategoryId
        )
        .reduce((total, item) => total + Number(item.budget || 0), 0);
}

// Hiển thị số tiền còn lại của tháng sau khi trừ tổng ngân sách đã phân bổ cho danh mục.
function loadBudget() {
    const month = monthInput.value;
    const data = JSON.parse(localStorage.getItem("monthlyBudget")) || {};
    const userData = data[userLogin.id] || {};

    if (userData[month]) {
        const remain = userData[month].budget - getAllocatedBudget(month);
        moneyDisplay.innerText = remain.toLocaleString("vi-VN") + " VND";
    } else {
        moneyDisplay.innerText = "0 VND";
    }
}

// Render danh sách danh mục đã tạo trong tháng hiện tại.
function renderCategories() {
    const month = monthInput.value;
    const monthlyCategories = getMonthlyCategories();
    const categories = getCategories();

    categoryList.innerHTML = "";

    const filtered = monthlyCategories.filter(
        item => item.month === month && item.userId === userLogin.id
    );

    if (filtered.length === 0) {
        categoryList.innerHTML = `<p class="no-categories">Thang nay chua co danh muc</p>`;
        return;
    }

    filtered.forEach(item => {
        const category = categories.find(c => c.id === item.categoryId);
        if (!category) {
            return;
        }

        const spent = getCategorySpent(month, item.categoryId);
        const remain = item.budget - spent;

        const div = document.createElement("div");
        div.className = "outcome-money";

        div.innerHTML = `
            <div>
                <i class="bi bi-currency-dollar"></i>
            </div>

            <div>
                <h4>${category.name}</h4>
                <p>${Number(item.budget || 0).toLocaleString("vi-VN")} VND</p>
            </div>

            <div class="control">
                <button type="button" onclick="deleteCategory(${item.id})">&times;</button>
                <button type="button" onclick="editCategory(${item.id})">&#9998;</button>
            </div>
        `;

        categoryList.appendChild(div);
    });
}

// Validate form thêm/sửa danh mục trước khi lưu.
function validate() {
    let isValid = true;

    if (!categoryName.value.trim()) {
        nameError.innerText = "Ten danh muc khong duoc de trong";
        isValid = false;
    } else {
        nameError.innerText = "";
    }

    if (!categoryMoney.value || categoryMoney.value <= 0) {
        moneyError.innerText = "So tien phai > 0";
        isValid = false;
    } else {
        moneyError.innerText = "";
    }

    return isValid;
}

categoryName.addEventListener("input", () => {
    nameError.innerText = "";
});

categoryMoney.addEventListener("input", () => {
    moneyError.innerText = "";
});

// Nút này dùng chung cho cả thêm mới và chỉnh sửa danh mục.
addCategoryBtn.addEventListener("click", function () {
    const month = monthInput.value;

    if (!month) {
        alert("Vui long chon thang");
        return;
    }

    if (!validate()) {
        return;
    }

    let categories = getCategories();
    let monthlyCategories = getMonthlyCategories();
    let monthlyBudget = JSON.parse(localStorage.getItem("monthlyBudget")) || {};
    const budget = Number(categoryMoney.value);

    if (!monthlyBudget[userLogin.id]) {
        monthlyBudget[userLogin.id] = {};
    }

    if (!monthlyBudget[userLogin.id][month]) {
        alert("Thang nay chua co ngan sach!");
        return;
    }

    const currentMonthBudget = Number(monthlyBudget[userLogin.id][month].budget || 0);
    const allocatedBudget = getAllocatedBudget(month, isEditing ? editingId : null);

    if (allocatedBudget + budget > currentMonthBudget) {
        moneyError.innerText = "Tong danh muc dang vuot ngan sach thang";
        return;
    }

    if (isEditing) {
        const item = monthlyCategories.find(i => i.id === editingId);
        if (!item) {
            return;
        }

        const category = categories.find(c => c.id === item.categoryId);
        if (category) {
            category.name = categoryName.value.trim();
        }

        item.budget = budget;
        isEditing = false;
        editingId = null;
        addCategoryBtn.textContent = "Them danh muc";
    } else {
        const newCategoryId = categories.length > 0
            ? categories[categories.length - 1].id + 1
            : 1;

        const newCategory = {
            id: newCategoryId,
            name: categoryName.value.trim(),
            imageUrl: "default.png",
            status: true
        };

        categories.push(newCategory);

        const newMonthly = {
            id: monthlyCategories.length > 0
                ? monthlyCategories[monthlyCategories.length - 1].id + 1
                : 1,
            month: month,
            userId: userLogin.id,
            categoryId: newCategoryId,
            budget: budget
        };

        monthlyCategories.push(newMonthly);
    }

    localStorage.setItem("categories", JSON.stringify(categories));
    localStorage.setItem("monthlyCategories", JSON.stringify(monthlyCategories));
    localStorage.setItem("monthlyBudget", JSON.stringify(monthlyBudget));

    categoryName.value = "";
    categoryMoney.value = "";

    loadBudget();
    renderCategories();
});

function deleteCategory(id) {
    showDeleteToast(id);
}

// Khi bấm sửa, đổ dữ liệu hiện tại lên form và chuyển trạng thái nút sang cập nhật.
function editCategory(id) {
    const monthlyCategories = getMonthlyCategories();
    const categories = getCategories();
    const item = monthlyCategories.find(i => i.id === id);

    if (!item) {
        return;
    }

    const category = categories.find(c => c.id === item.categoryId);
    if (!category) {
        return;
    }

    categoryName.value = category.name;
    categoryMoney.value = item.budget;
    isEditing = true;
    editingId = id;
    addCategoryBtn.textContent = "Sua danh muc";
}

// Khôi phục tháng đã chọn và dữ liệu danh mục tương ứng khi vào trang.
document.addEventListener("DOMContentLoaded", () => {
    monthInput.value = getSelectedMonth();
    loadBudget();
    renderCategories();
});

monthInput.addEventListener("change", () => {
    setSelectedMonth(monthInput.value);
    isEditing = false;
    editingId = null;
    addCategoryBtn.textContent = "Them danh muc";
    loadBudget();
    renderCategories();
});
