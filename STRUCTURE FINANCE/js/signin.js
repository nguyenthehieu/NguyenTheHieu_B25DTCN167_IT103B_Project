const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const button = document.querySelector("button");
const userLogin = JSON.parse(localStorage.getItem("userLogin"));
const currentUser = userLogin;

if (currentUser) {
    window.location.href = "../pages/index.html";
}

function clearError(input, errorElement) {
    input.classList.remove("input-error");
    errorElement.innerText = "";
}

function setError(input, errorElement, message) {
    input.classList.add("input-error");
    errorElement.innerText = message;
}

button.addEventListener("click", function () {
    let email = emailInput.value.trim();
    let password = passwordInput.value.trim();
    let isValid = true;

    clearError(emailInput, emailError);
    clearError(passwordInput, passwordError);

    // validate
    if (email === "") {
        setError(emailInput, emailError, "Email cannot be left blank.");
        isValid = false;
    }

    if (password === "") {
        setError(passwordInput, passwordError, "Password cannot be left blank.");
        isValid = false;
    }

    if (!isValid) return;

    // lấy danh sách user
    const users = JSON.parse(localStorage.getItem("users")) || [];

    // tìm user
    
    const foundUser = users.find(user => user.email === email);

    if (!foundUser) {
        setError(emailInput, emailError, "Email isn't correct");
        return;
    }

    if (foundUser.password !== password) {
        setError(passwordInput, passwordError, "Password isn't correct");
        return;
    }

    // lưu thông tin user đã đăng nhập
    localStorage.setItem("userLogin", JSON.stringify(foundUser));

    window.location.href = "../pages/index.html";
});

// ===== CLEAR ERROR =====
emailInput.addEventListener("input", function () {
    clearError(emailInput, emailError);
});

passwordInput.addEventListener("input", function () {
    clearError(passwordInput, passwordError);
});