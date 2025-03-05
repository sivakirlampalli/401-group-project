// JavaScript Code
let users = {}; // Object to store registered users

// Function to handle signup
function handleSignup(event) {
    event.preventDefault();
    let username = document.getElementById('signup-username').value;
    let benchCode = document.getElementById('bench-code').value;
    let password = document.getElementById('signup-password').value;
    let confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // Check for valid bench code (assuming alphanumeric check)
    let benchCodePattern = /^[A-Za-z0-9]+$/;
    if (!benchCodePattern.test(benchCode)) {
        alert("Bench Code must be alphanumeric!");
        return;
    }

    // Store the new user's credentials
    users[username] = password;
    alert("Signup successful! Please login.");

    // Close signup modal
    closeModal('signupModal');
}

// Function to handle login
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();

    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;

    // Check if username exists and password matches
    if (users[username] && users[username] === password) {
        alert("Login successful!");

        // Show user section and update username display
        document.getElementById('user-section').style.display = 'block';
        document.getElementById('username-display').textContent = username;

        // Hide the login button and change heading after login
        document.getElementById('loginButton').style.display = 'none';
        document.getElementById('page-heading').style.display = 'none';

        // Replace heading with dropdown menu
        document.getElementById('dropdown-menu').style.display = 'block';

        // Close login modal
        closeModal('loginModal');
    } else {
        alert("Invalid username or password!");
    }
});

// Function to open modals
function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function openSignupModal() {
    document.getElementById('signupModal').style.display = 'block';
}

// Function to close modals
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Ensure dropdown menu is hidden initially
document.getElementById('dropdown-menu').style.display = 'none';


document.querySelector('#overview-option').addEventListener('click', function() {
    document.querySelector('.content').scrollIntoView({ behavior: 'smooth' });
});document.querySelector('#mission-option').addEventListener('click', function() {
    document.querySelector('.themes-section').scrollIntoView({ behavior: 'smooth' });
});

// Highlight Home Button
document.querySelector('#dropdown-menu li').classList.add('active');