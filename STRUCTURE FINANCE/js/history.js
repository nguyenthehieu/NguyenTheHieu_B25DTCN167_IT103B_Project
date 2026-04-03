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