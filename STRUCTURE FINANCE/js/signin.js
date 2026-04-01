const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const button = document.querySelector("button");

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

    if (email === "") {
        setError(emailInput, emailError, "Email không được để trống");
        isValid = false;
    }

    if (password === "") {
        setError(passwordInput, passwordError, "Mật khẩu không được để trống");
        isValid = false;
    }

    if (!isValid) return;

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.email !== email) {
        setError(emailInput, emailError, "Email không đúng");
        return;
    }

    if (user.password !== password) {
        setError(passwordInput, passwordError, "Mật khẩu không đúng");
        return;
    }

    window.location.href = "../pages/index.html";
});