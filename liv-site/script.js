// script.js
document.getElementById("login-form").addEventListener("submit", function (event) {
    event.preventDefault();
  
    // Get input values
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
  
    // Example validation (Replace this with actual logic)
    if (username === "liv" && password === "daddygeto") {
      window.location.href = "/liv-site/messages/message_1.html"; // Redirect to another page
    } else {
      document.getElementById("error-message").textContent = "Invalid username or password!";
    }
  });