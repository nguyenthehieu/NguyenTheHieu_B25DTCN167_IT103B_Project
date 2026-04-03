const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn.addEventListener("click", function () {
        const isConfirm = confirm("Bạn có chắc muốn đăng xuất?");

        if (isConfirm) {
            // xóa trạng thái đăng nhập
            localStorage.removeItem("userLogin");

            // chuyển về trang đăng nhập
            window.location.href = "../pages/signin.html";
        }
    });

// ===== CATEGORY =====
const categoryName = document.getElementById("categoryName");
const categoryMoney = document.getElementById("categoryMoney");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const categoryList = document.getElementById("categoryList");

// Lấy dữ liệu từ localStorage
let categories = JSON.parse(localStorage.getItem("categories")) || [];

// Hiển thị danh sách
function renderCategories() {
    categoryList.innerHTML = "";

    categories.forEach((item, index) => {
        const div = document.createElement("div");
        div.classList.add("outcome-money");

        div.innerHTML = `
            <div>
                <i class="bi bi-currency-dollar"></i>
            </div>

            <div>
                <h4>${item.name}</h4>
                <p>${Number(item.money).toLocaleString()} $</p>
            </div>

            <div class="control">
                <button class="icon-larger" onclick="deleteCategory(${index})">&times;</button>
                <button onclick="editCategory(${index})">✎</button>
            </div>
        `;

        categoryList.appendChild(div);
    });
}

// Thêm danh mục
addCategoryBtn.addEventListener("click", function () {
    const name = categoryName.value;
    const money = categoryMoney.value;

    // validate
    if (!name) {
        alert("Vui lòng chọn danh mục!");
        return;
    }

    if (!money || money <= 0) {
        alert("Số tiền không hợp lệ!");
        return;
    }

    // tạo object
    const newCategory = {
        name: name,
        money: money
    };

    categories.push(newCategory);

    // lưu localStorage
    localStorage.setItem("categories", JSON.stringify(categories));

    // render lại
    renderCategories();

    // reset input
    categoryName.value = "";
    categoryMoney.value = "";
});

// Xóa danh mục
function deleteCategory(index) {
    const isConfirm = confirm("Bạn có chắc muốn xóa?");

    if (isConfirm) {
        categories.splice(index, 1);
        localStorage.setItem("categories", JSON.stringify(categories));
        renderCategories();
    }
}

// Load lần đầu
renderCategories();