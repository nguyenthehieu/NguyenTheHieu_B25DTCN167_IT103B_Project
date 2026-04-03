const userLogin = JSON.parse(localStorage.getItem("userLogin"));
const currentUser = userLogin;

if (!currentUser) {
    window.location.href = "../pages/signin.html";
}

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
        <p>Bạn có chắc chắn muốn xóa tài khoản này không?</p>
        <hr>
        <div class="toast-actions">
            <button class="cancel-btn">Hủy</button>
            <button class="confirm-btn">Xóa</button>
            
        </div>
    `;

    toastContainer.appendChild(toast);

    // Đồng ý
    toast.querySelector(".confirm-btn").onclick = () => {
        localStorage.removeItem("userLogin");
        window.location.href = "../pages/signin.html";
        currentUser = null;
    };

    // Hủy
    toast.querySelector(".cancel-btn").onclick = () => {
        toast.remove();
    };
}

const monthInput = document.getElementById("month");
const moneyInput = document.getElementById("money");
const saveBtn = document.getElementById("saveBtn");
const moneyDisplay = document.querySelector('.cell h3');
const monthError = document.getElementById("monthError");
const moneyError = document.getElementById("moneyError");

// xóa lỗi khi nhập lại
monthInput.addEventListener("input", () => {
    monthError.innerText = "";
});

moneyInput.addEventListener("input", () => {
    moneyError.innerText = "";
});

// load dữ liệu khi chọn tháng
function loadData() {
    const month = monthInput.value;
    const data = JSON.parse(localStorage.getItem("monthlyBudget")) || {};

    if (data[month]) {
        const money = Number(data[month]);
        moneyInput.value = money;
        moneyDisplay.innerText = money.toLocaleString() + " VND";
    } else {
        moneyInput.value = "";
        moneyDisplay.innerText = "0 VND";
    }
}

monthInput.addEventListener("change", loadData);

// toast thành công
function showSuccessToast(message) {
    const toast = document.createElement("div");
    toast.className = "success-toast";
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// lưu
saveBtn.addEventListener("click", function () {
    const month = monthInput.value;
    const money = moneyInput.value;

    let isValid = true;

    // validate tháng
    if (!month) {
        monthError.innerText = "Vui lòng chọn tháng!";
        isValid = false;
    }

    // validate tiền
    if (!money) {
        moneyError.innerText = "Vui lòng nhập số tiền!";
        isValid = false;
    }

    if (!isValid) return;

    // lưu dữ liệu
    let data = JSON.parse(localStorage.getItem("monthlyBudget")) || {};
    data[month] = Number(money);
    localStorage.setItem("monthlyBudget", JSON.stringify(data));

    // hiển thị tiền còn lại (hiện tại = ngân sách)
    moneyDisplay.innerText = Number(money).toLocaleString() + " VND";

    // toast thành công
    showSuccessToast("Lưu ngân sách thành công!");
});