let users = JSON.parse(localStorage.getItem("users")) || [];
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const confirmError = document.getElementById("confirmError");
const button = document.querySelector("button");

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// reset lỗi
function clearError(input, errorElement) {
    input.classList.remove("input-error");
    errorElement.innerText = "";
}

// set lỗi
function setError(input, errorElement, message) {
    input.classList.add("input-error");
    errorElement.innerText = message;
}

button.addEventListener("click", function () {
    let email = emailInput.value.trim();
    let password = passwordInput.value.trim();
    let confirmPassword = confirmPasswordInput.value.trim();

    let isValid = true;

    clearError(emailInput, emailError);
    clearError(passwordInput, passwordError);
    clearError(confirmPasswordInput, confirmError);

    if (email === "") {
        setError(emailInput, emailError, "Please enter your email");
        isValid = false;
    } else if (!isValidEmail(email)) {
        setError(emailInput, emailError, "Email is not in the correct format");
        isValid = false;
    }

    if (password === "") {
        setError(passwordInput, passwordError, "Please enter your password");
        isValid = false;
    } else if (password.length < 6) {
        setError(passwordInput, passwordError, "Password must be at least 6 characters long");
        isValid = false;
    }

    if (confirmPassword === "") {
        setError(confirmPasswordInput, confirmError, "Please confirm your password");
        isValid = false;
    } else if (confirmPassword !== password) {
        setError(confirmPasswordInput, confirmError, "Passwords do not match");
        isValid = false;
    }

    if (isValid) {
    let users = JSON.parse(localStorage.getItem("users")) || [];

    let isExist = users.some(user => user.email === email);
    if (isExist) {
        setError(emailInput, emailError, "Email already exists");
        return;
    }

    const newUser = {
        id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
        email,
        password,
        gender: "true",
        status: "true"
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    // chuyển sang đăng nhập
    window.location.href = "../pages/signin.html";
}
});

// nhập lại thì xóa lỗi
emailInput.addEventListener("input", function () {
    clearError(emailInput, emailError);
});

passwordInput.addEventListener("input", function () {
    clearError(passwordInput, passwordError);
});

confirmPasswordInput.addEventListener("input", function () {
    clearError(confirmPasswordInput, confirmError);
});