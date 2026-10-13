// ==========================================
// NEXORA SCHOOL MANAGEMENT SYSTEM
// Supabase Authentication
// ==========================================

const SUPABASE_URL = "https://wziomowgprtudxfuikxk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_dDOOWELGkwLJOFWqcZUiXw_qJLzno_b";

// Session stored in sessionStorage — clears when the browser tab is closed.
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.sessionStorage
        }
    }
);

// Page elements
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");
const message = document.getElementById("message");
const togglePassword = document.getElementById("togglePassword");
const forgotPassword = document.getElementById("forgotPassword");

function showMessage(text, type = "error") {
    if (!message) return;
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = "block";
}

if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
        togglePassword.textContent = isPassword ? "Hide" : "Show";
        togglePassword.setAttribute(
            "aria-label",
            isPassword ? "Hide password" : "Show password"
        );
    });
}

function setLoading(isLoading) {
    if (!loginButton) return;
    loginButton.disabled = isLoading;
    if (loginButtonText) {
        loginButtonText.textContent = isLoading ? "Signing in..." : "Sign In";
    } else {
        loginButton.textContent = isLoading ? "Signing in..." : "Sign In";
    }
}

async function redirectByRole(user) {
    const { data: profile, error } = await supabaseClient
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Profile lookup failed:", error);
        showMessage(
            "Login succeeded, but your profile could not be loaded. Please contact the school administrator."
        );
        return;
    }

    if (!profile) {
        showMessage(
            "Your account has no assigned school role. Please contact the school administrator."
        );
        await supabaseClient.auth.signOut();
        return;
    }

    const dashboards = {
        admin: "admin-dashboard.html",
        teacher: "teacher-dashboard.html",
        student: "student-dashboard.html",
        parent: "parent-dashboard.html"
    };

    const destination = dashboards[profile.role];

    if (!destination) {
        showMessage(
            "Your account has an unrecognised role. Please contact the administrator."
        );
        await supabaseClient.auth.signOut();
        return;
    }

    window.location.replace(destination);
}

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            showMessage("Please enter your email and password.");
            return;
        }

        setLoading(true);

        if (message) {
            message.style.display = "none";
        }

        try {
            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) {
                showMessage(
                    "Unable to sign in. Check your email and password, then try again."
                );
                return;
            }

            await redirectByRole(data.user);
        } catch (error) {
            console.error("Login error:", error);
            showMessage(
                "A connection error occurred. Please check your internet connection and try again."
            );
        } finally {
            setLoading(false);
        }
    });
}

if (forgotPassword && emailInput) {
    forgotPassword.addEventListener("click", async () => {
        const email = emailInput.value.trim();

        if (!email) {
            showMessage(
                "Enter your email address first, then select Forgot Password."
            );
            emailInput.focus();
            return;
        }

        try {
            forgotPassword.disabled = true;

            const { error } =
                await supabaseClient.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + "/reset-password.html"
                });

            if (error) {
                console.error("Password recovery error:", error);
                showMessage(
                    "We couldn't send the recovery email. Please try again later."
                );
                return;
            }

            showMessage(
                "If the account is registered, a password recovery email will be sent.",
                "success"
            );
        } catch (error) {
            console.error(error);
            showMessage(
                "A connection error occurred. Please try again."
            );
        } finally {
            forgotPassword.disabled = false;
        }
    });
}

async function checkExistingSession() {
    try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) {
            console.error("Session check failed:", error);
            return;
        }

        if (data.session?.user) {
            await redirectByRole(data.session.user);
        }
    } catch (error) {
        console.error("Session check error:", error);
    }
}

checkExistingSession();