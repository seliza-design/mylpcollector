// ============================================
// KAYOU VAULT
// SUPABASE CONNECTION
// ============================================

const SUPABASE_URL = "https://qgkvmyulbmpjkdbfoyft.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_vtPNz-gXNLjZoVjRHqHTng_E4SKjMWe";

const { createClient } = window.supabase;

const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ============================================
// CURRENT USER
// ============================================

let currentUser = null;
let authMode = "login";


// ============================================
// TEMPORARY SAMPLE CARD DATABASE
// ============================================

const cards = [
    { id: 1, name: "Twilight Sparkle", number: "DEMO-001", rarity: "SSR", color: "purple" },
    { id: 2, name: "Pinkie Pie", number: "DEMO-002", rarity: "SR", color: "pink" },
    { id: 3, name: "Rainbow Dash", number: "DEMO-003", rarity: "UR", color: "blue" },
    { id: 4, name: "Fluttershy", number: "DEMO-004", rarity: "R", color: "yellow" },
    { id: 5, name: "Rarity", number: "DEMO-005", rarity: "SSR", color: "purple" },
    { id: 6, name: "Applejack", number: "DEMO-006", rarity: "SR", color: "yellow" }
];


// ============================================
// TEMPORARY LOCAL COLLECTION STORAGE
// ============================================

let collection = {};
let wishlist = [];

function loadData() {

    const storageId = currentUser
        ? currentUser.id
        : "guest";

    collection = JSON.parse(
        localStorage.getItem("kayouCollection_" + storageId) || "{}"
    );

    wishlist = JSON.parse(
        localStorage.getItem("kayouWishlist_" + storageId) || "[]"
    );

}

function saveData() {

    const storageId = currentUser
        ? currentUser.id
        : "guest";

    localStorage.setItem(
        "kayouCollection_" + storageId,
        JSON.stringify(collection)
    );

    localStorage.setItem(
        "kayouWishlist_" + storageId,
        JSON.stringify(wishlist)
    );

}


// ============================================
// AUTHENTICATION WINDOW
// ============================================

const authModal = document.getElementById("auth-modal");

function openAuthModal(mode = "login") {

    authModal.classList.add("show");
    setAuthMode(mode);

}

function closeAuthModal() {

    authModal.classList.remove("show");

}

document.getElementById("login-button").addEventListener("click", () => {

    if (currentUser) {
        signOut();
    } else {
        openAuthModal("login");
    }

});

document.getElementById("settings-login").addEventListener("click", () => {

    if (currentUser) {
        signOut();
    } else {
        openAuthModal("login");
    }

});

document.getElementById("close-modal").addEventListener(
    "click",
    closeAuthModal
);

authModal.addEventListener("click", event => {

    if (event.target === authModal) {
        closeAuthModal();
    }

});


// ============================================
// SWITCH BETWEEN LOGIN AND SIGNUP
// ============================================

function setAuthMode(mode) {

    authMode = mode;

    const loginMode = mode === "login";

    document.getElementById("name-group").style.display =
        loginMode ? "none" : "block";

    document.getElementById("auth-title").textContent =
        loginMode ? "Welcome to Kayou Vault" : "Create Your Account";

    document.getElementById("auth-subtitle").textContent =
        loginMode
            ? "Log in to access your personal collection."
            : "Join Kayou Vault and organize your collection.";

    document.getElementById("auth-submit").textContent =
        loginMode ? "Log In" : "Create Account";

    document.getElementById("login-tab").classList.toggle(
        "active",
        loginMode
    );

    document.getElementById("signup-tab").classList.toggle(
        "active",
        !loginMode
    );

    document.getElementById("auth-password").autocomplete =
        loginMode ? "current-password" : "new-password";

    document.getElementById("auth-message").textContent = "";

}

document.getElementById("login-tab").addEventListener("click", () => {
    setAuthMode("login");
});

document.getElementById("signup-tab").addEventListener("click", () => {
    setAuthMode("signup");
});


// ============================================
// REGISTER AND LOGIN
// ============================================

document.getElementById("auth-form").addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const email = document.getElementById("auth-email").value.trim();

        const password = document.getElementById("auth-password").value;

        const displayName = document
            .getElementById("display-name")
            .value.trim();

        const message = document.getElementById("auth-message");

        const submitButton = document.getElementById("auth-submit");

        message.textContent = "";

        submitButton.disabled = true;

        try {

            if (authMode === "signup") {

                if (!displayName) {
                    throw new Error("Please enter a display name.");
                }

                if (password.length < 8) {
                    throw new Error("Your password must be at least 8 characters.");
                }

                const { data, error } = await supabaseClient.auth.signUp({

                    email: email,

                    password: password,

                    options: {

                        data: {
                            display_name: displayName
                        },

                        emailRedirectTo: window.location.origin +
                            window.location.pathname

                    }

                });

                if (error) throw error;

                if (data.session) {

                    message.textContent =
                        "Account created successfully! Welcome to Kayou Vault.";

                } else {

                    message.textContent =
                        "Account created! Please check your email and click the confirmation link before logging in.";

                }

                document.getElementById("auth-form").reset();

            } else {

                const { data, error } =
                    await supabaseClient.auth.signInWithPassword({

                        email: email,

                        password: password

                    });

                if (error) throw error;

                message.textContent = "Login successful!";

                closeAuthModal();

                document.getElementById("auth-form").reset();

            }

        } catch (error) {

            message.textContent = error.message;

        } finally {

            submitButton.disabled = false;

        }

    }
);


// ============================================
// LOG OUT
// ============================================

async function signOut() {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert(error.message);
    }

}


// ============================================
// UPDATE LOGIN BUTTON
// ============================================

function updateAuthDisplay() {

    const loginButton = document.getElementById("login-button");

    const settingsButton = document.getElementById("settings-login");

    if (currentUser) {

        loginButton.textContent = "Log Out";

        settingsButton.textContent = "Log Out";

        document.querySelector(".sidebar-note p").textContent =
            "Welcome, " + (
                currentUser.user_metadata.display_name ||
                currentUser.email
            );

    } else {

        loginButton.textContent = "Log in / Sign up";

        settingsButton.textContent = "Log in / Sign up";

        document.querySelector(".sidebar-note p").textContent =
            "Your collection, organized.";

    }

}


// ============================================
// SUPABASE AUTHENTICATION LISTENER
// ============================================

supabaseClient.auth.onAuthStateChange((event, session) => {

    currentUser = session ? session.user : null;

    loadData();

    updateAuthDisplay();

    renderAll();

});


// ============================================
// NAVIGATION
// ============================================

function showPage(pageName) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.querySelectorAll(".nav-item[data-page]").forEach(button => {
        button.classList.remove("active");
    });

    document.getElementById(pageName).classList.add("active");

    document.querySelectorAll(`[data-page="${pageName}"]`).forEach(button => {
        button.classList.add("active");
    });

    document.getElementById("page-name").textContent =
        pageName.toUpperCase();

    renderAll();

    window.scrollTo(0, 0);

}

document.querySelectorAll("[data-page]").forEach(button => {

    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });

});


// ============================================
// CARD DISPLAY
// ============================================

function createCardHTML(card, mode = "database") {

    const quantity = collection[card.id] || 0;

    let actions = "";

    if (mode === "database") {

        actions = `
            <button onclick="addCard(${card.id})">+ Add Card</button>
            <button onclick="addWishlist(${card.id})">♡ Wishlist</button>
        `;

    }

    if (mode === "collection" || mode === "duplicates") {

        actions = `
            <button onclick="changeQuantity(${card.id}, 1)">+ Add</button>
            <button onclick="changeQuantity(${card.id}, -1)">− Remove</button>
        `;

    }

    if (mode === "wishlist") {

        actions = `
            <button onclick="addCard(${card.id})">+ Add to Collection</button>
            <button class="remove-button" onclick="removeWishlist(${card.id})">
                Remove
            </button>
        `;

    }

    return `
        <div class="card-item">

            <div class="card-art ${card.color}">✦</div>

            <div class="card-info">

                <h3>${card.name}</h3>

                <p>Card No. ${card.number}</p>

                <span class="rarity">${card.rarity}</span>

                ${mode !== "database" ? `
                    <p style="margin-top:10px">
                        Quantity owned: ${quantity}
                    </p>
                ` : ""}

                <div class="card-actions">
                    ${actions}
                </div>

            </div>

        </div>
    `;

}


// ============================================
// ADD AND REMOVE CARDS
// ============================================

function addCard(id) {

    if (!currentUser) {
        openAuthModal("login");
        return;
    }

    collection[id] = (collection[id] || 0) + 1;

    wishlist = wishlist.filter(cardId => cardId !== id);

    saveData();

    renderAll();

}


function changeQuantity(id, amount) {

    if (!currentUser) {
        openAuthModal("login");
        return;
    }

    let quantity = (collection[id] || 0) + amount;

    if (quantity <= 0) {
        delete collection[id];
    } else {
        collection[id] = quantity;
    }

    saveData();

    renderAll();

}


// ============================================
// WISHLIST
// ============================================

function addWishlist(id) {

    if (!currentUser) {
        openAuthModal("login");
        return;
    }

    if (!wishlist.includes(id) && !collection[id]) {

        wishlist.push(id);

        saveData();

        renderAll();

    }

}


function removeWishlist(id) {

    wishlist = wishlist.filter(cardId => cardId !== id);

    saveData();

    renderAll();

}


// ============================================
// DATABASE SEARCH
// ============================================

function renderDatabase() {

    const search = document.getElementById("search-input")
        .value.toLowerCase();

    const rarity = document.getElementById("rarity-filter").value;

    const filteredCards = cards.filter(card => {

        const matchesSearch =
            card.name.toLowerCase().includes(search) ||
            card.number.toLowerCase().includes(search);

        const matchesRarity =
            rarity === "" || card.rarity === rarity;

        return matchesSearch && matchesRarity;

    });

    document.getElementById("database-grid").innerHTML =

        filteredCards.length

            ? filteredCards.map(card =>
                createCardHTML(card, "database")
              ).join("")

            : `<div class="empty-state">
                    <h3>No cards found</h3>
                    <p>Try another search.</p>
               </div>`;

}


// ============================================
// PERSONAL COLLECTION
// ============================================

function renderCollection() {

    const ownedCards = cards.filter(card =>
        collection[card.id] > 0
    );

    document.getElementById("collection-grid").innerHTML =

        ownedCards.length

            ? ownedCards.map(card =>
                createCardHTML(card, "collection")
              ).join("")

            : `<div class="empty-state">
                    <span>✧</span>
                    <h3>Your collection is empty</h3>
                    <p>Add cards from the database to get started.</p>
               </div>`;

    document.getElementById("collection-description").textContent =
        `${ownedCards.length} unique cards in your collection`;

}


// ============================================
// DUPLICATES
// ============================================

function renderDuplicates() {

    const duplicateCards = cards.filter(card =>
        collection[card.id] > 1
    );

    document.getElementById("duplicates-grid").innerHTML =

        duplicateCards.length

            ? duplicateCards.map(card =>
                createCardHTML(card, "duplicates")
              ).join("")

            : `<div class="empty-state">
                    <span>⧉</span>
                    <h3>No duplicates yet</h3>
                    <p>Cards with multiple copies will appear here.</p>
               </div>`;

}


// ============================================
// WISHLIST DISPLAY
// ============================================

function renderWishlist() {

    const wantedCards = cards.filter(card =>
        wishlist.includes(card.id)
    );

    document.getElementById("wishlist-grid").innerHTML =

        wantedCards.length

            ? wantedCards.map(card =>
                createCardHTML(card, "wishlist")
              ).join("")

            : `<div class="empty-state">
                    <span>♡</span>
                    <h3>Your wishlist is empty</h3>
                    <p>Add cards you're hoping to collect.</p>
               </div>`;

}


// ============================================
// DASHBOARD
// ============================================

function renderDashboard() {

    const quantities = Object.values(collection);

    const total = quantities.reduce(
        (sum, quantity) => sum + quantity, 0
    );

    const unique = quantities.length;

    const duplicates = quantities.reduce(
        (sum, quantity) => sum + Math.max(0, quantity - 1), 0
    );

    document.getElementById("total-owned").textContent = total;

    document.getElementById("unique-owned").textContent = unique;

    document.getElementById("duplicate-total").textContent = duplicates;

    document.getElementById("wishlist-total").textContent = wishlist.length;

    const recent = Object.keys(collection)
        .filter(id => collection[id] > 0)
        .slice(-4)
        .reverse();

    const recentCards = cards.filter(card =>
        recent.includes(String(card.id))
    );

    document.getElementById("recent-cards").innerHTML =

        recentCards.length

            ? recentCards.map(card =>
                createCardHTML(card, "collection")
              ).join("")

            : `<div class="empty-state">
                    <span>✧</span>
                    <h3>Your collection starts here</h3>
                    <p>Visit the card database to start adding cards.</p>
                    <button class="primary-button" data-page="database">
                        Explore Cards
                    </button>
               </div>`;

    document.querySelectorAll("#recent-cards [data-page]").forEach(button => {

        button.addEventListener("click", () => {
            showPage(button.dataset.page);
        });

    });

}


// ============================================
// RENDER EVERYTHING
// ============================================

function renderAll() {

    renderDashboard();

    renderDatabase();

    renderCollection();

    renderDuplicates();

    renderWishlist();

}


// ============================================
// INITIALIZE
// ============================================

loadData();

renderAll();

updateAuthDisplay();
