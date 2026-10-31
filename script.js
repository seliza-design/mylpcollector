// ============================================
// KAYOU VAULT
// SUPABASE CONNECTION
// ============================================

const SUPABASE_URL = "https://qgkvmyulbmpjkdbfoyft.supabase.co";
const SUPABASE_KEY = "sb_publishable_vtPNz-gXNLjZoVjRHqHTng_E4SKjMWe";

const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);


// ============================================
// CURRENT USER AND DATA
// ============================================

let currentUser = null;
let authMode = "login";

let cards = [];
let series = [];
let collection = {};
let wishlist = [];

let activeSeriesName = "";
let dataLoadVersion = 0;


// ============================================
// HELPER FUNCTIONS
// ============================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}


function getCardColor(name) {

    const colors = {
        "Twilight Sparkle": "purple",
        "Pinkie Pie": "pink",
        "Rainbow Dash": "blue",
        "Fluttershy": "yellow",
        "Rarity": "purple",
        "Applejack": "yellow"
    };

    return colors[name] || "purple";
}


// ============================================
// LOAD SERIES FROM SUPABASE
// ============================================

async function loadSeries() {

    const { data, error } = await supabaseClient
        .from("series")
        .select("*")
        .order("series_name");

    if (error) throw error;

    series = data || [];

    updateSeriesFilter();
}


// ============================================
// LOAD CARD DATABASE FROM SUPABASE
// ============================================

async function loadCards() {

    const { data, error } = await supabaseClient
        .from("cards")
        .select(`
            *,
            series (
                series_name,
                card_type,
                language,
                region
            )
        `)
        .order("id");

    if (error) throw error;

    cards = (data || []).map(card => ({

        id: card.id,

        name: card.card_name,

        number: card.card_number,

        rarity: card.rarity || "Unknown",

        character: card.character_name || "",

        language: card.language || "Unknown",

        seriesId: card.series_id,

        seriesName: card.series?.series_name || "Unassigned",

        cardType: card.card_type || card.series?.card_type || "collectible",

        region: card.region || card.series?.region || "",

        imageUrl: card.image_url,

        variant: card.variant,

        color: getCardColor(
            card.character_name || card.card_name
        )

    }));

    updateSeriesFilter();
}


// ============================================
// LOAD USER COLLECTION AND WISHLIST
// ============================================

async function loadUserData() {

    const version = ++dataLoadVersion;

    if (!currentUser) {

        collection = {};
        wishlist = [];

        renderAll();
        return;

    }

    const userId = currentUser.id;

    const [collectionResult, wishlistResult] = await Promise.all([

        supabaseClient
            .from("collections")
            .select("card_id, quantity")
            .eq("user_id", userId),

        supabaseClient
            .from("wishlists")
            .select("card_id")
            .eq("user_id", userId)

    ]);

    if (collectionResult.error) throw collectionResult.error;

    if (wishlistResult.error) throw wishlistResult.error;

    if (
        version !== dataLoadVersion ||
        !currentUser ||
        currentUser.id !== userId
    ) {
        return;
    }

    collection = {};

    collectionResult.data.forEach(item => {
        collection[item.card_id] = item.quantity;
    });

    wishlist = wishlistResult.data.map(item => item.card_id);

    renderAll();
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
        loginMode
            ? "Welcome to Kayou Vault"
            : "Create Your Account";

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
                    throw new Error(
                        "Your password must be at least 8 characters."
                    );
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
                        "Account created! Please check your email and confirm your account.";

                }

                document.getElementById("auth-form").reset();

            } else {

                const { error } =
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

    updateAuthDisplay();

    loadUserData().catch(error => {

        console.error("Could not load account data:", error);

        alert(
            "There was a problem loading your collection: " +
            error.message
        );

    });

});


// ============================================
// NAVIGATION
// ============================================

function showPage(pageName, selectedButton = null) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.querySelectorAll(".nav-item[data-page]").forEach(button => {
        button.classList.remove("active");
    });

    const targetPage = document.getElementById(pageName);

    if (!targetPage) return;

    targetPage.classList.add("active");

    if (selectedButton) {
        selectedButton.classList.add("active");
    } else {
        const matchingButton = document.querySelector(
            `.nav-item[data-page="${pageName}"]:not([data-series-name])`
        );

        if (matchingButton) {
            matchingButton.classList.add("active");
        }
    }

    document.getElementById("page-name").textContent =
        pageName.toUpperCase();

    renderAll();

    window.scrollTo(0, 0);

}


// ============================================
// NAVIGATION BUTTON EVENTS
// ============================================

document.querySelectorAll("[data-page]").forEach(button => {

    button.addEventListener("click", () => {

        const pageName = button.dataset.page;

        if (pageName === "database") {

            const cardType = button.dataset.cardType || "";

            activeSeriesName = button.dataset.seriesName || "";

            document.getElementById("card-type-filter").value =
                cardType;

            updateSeriesFilter();

            document.getElementById("series-filter").value = "";

            document.getElementById("search-input").value = "";

            document.getElementById("rarity-filter").value = "";

        }

        showPage(pageName, button);

    });

});


// ============================================
// SERIES FILTER
// ============================================

function updateSeriesFilter() {

    const seriesFilter = document.getElementById("series-filter");

    if (!seriesFilter) return;

    const selectedType =
        document.getElementById("card-type-filter").value;

    const previousValue = seriesFilter.value;

    const filteredSeries = series.filter(item => {

        return !selectedType ||
            item.card_type === selectedType;

    });

    seriesFilter.innerHTML = `
        <option value="">All Collections</option>
        ${filteredSeries.map(item => `
            <option value="${item.id}">
                ${escapeHTML(item.series_name)}
            </option>
        `).join("")}
    `;

    if (
        filteredSeries.some(item =>
            String(item.id) === previousValue
        )
    ) {
        seriesFilter.value = previousValue;
    }

}


// ============================================
// CARD DISPLAY
// ============================================

function createCardHTML(card, mode = "database") {

    const quantity = collection[card.id] || 0;

    let actions = "";

    if (mode === "database") {

        actions = `
            <button onclick="addCard(${card.id})">
                + Add Card
            </button>

            <button onclick="addWishlist(${card.id})">
                ♡ Wishlist
            </button>
        `;

    }

    if (mode === "collection" || mode === "duplicates") {

        actions = `
            <button onclick="changeQuantity(${card.id}, 1)">
                + Add
            </button>

            <button onclick="changeQuantity(${card.id}, -1)">
                − Remove
            </button>
        `;

    }

    if (mode === "wishlist") {

        actions = `
            <button onclick="addCard(${card.id})">
                + Add to Collection
            </button>

            <button class="remove-button"
                onclick="removeWishlist(${card.id})">
                Remove
            </button>
        `;

    }

    const artwork = card.imageUrl
        ? `
            <img
                src="${escapeHTML(card.imageUrl)}"
                alt="${escapeHTML(card.name)}"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
            >
            <span style="display:none;">✦</span>
        `
        : `<span>✦</span>`;

    return `
        <div class="card-item">

            <div class="card-art ${escapeHTML(card.color)}">
                ${artwork}
            </div>

            <div class="card-info">

                <h3>${escapeHTML(card.name)}</h3>

                <p>Card No. ${escapeHTML(card.number)}</p>

                <span class="rarity">
                    ${escapeHTML(card.rarity)}
                </span>

                <p style="margin-top:8px">
                    Character: ${escapeHTML(card.character)}
                </p>

                <p>
                    Collection: ${escapeHTML(card.seriesName)}
                </p>

                <p>
                    Type: ${card.cardType === "tcg"
                        ? "Trading Card Game"
                        : "Collectible Card"}
                </p>

                <p>
                    Language: ${escapeHTML(card.language)}
                </p>

                ${card.region ? `
                    <p>Region: ${escapeHTML(card.region)}</p>
                ` : ""}

                ${card.variant ? `
                    <p>Variant: ${escapeHTML(card.variant)}</p>
                ` : ""}

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
// ADD CARDS TO COLLECTION
// ============================================

async function addCard(id) {

    if (!currentUser) {
        openAuthModal("login");
        return;
    }

    const newQuantity = (collection[id] || 0) + 1;

    const { error } = await supabaseClient
        .from("collections")
        .upsert({

            user_id: currentUser.id,
            card_id: id,
            quantity: newQuantity

        }, {
            onConflict: "user_id,card_id"
        });

    if (error) {
        alert("Could not add card: " + error.message);
        return;
    }

    collection[id] = newQuantity;

    if (wishlist.includes(id)) {

        const { error: wishlistError } = await supabaseClient
            .from("wishlists")
            .delete()
            .eq("user_id", currentUser.id)
            .eq("card_id", id);

        if (wishlistError) {

            alert(
                "Card added, but wishlist update failed: " +
                wishlistError.message
            );

        } else {

            wishlist = wishlist.filter(cardId => cardId !== id);

        }

    }

    renderAll();

}


// ============================================
// CHANGE CARD QUANTITY
// ============================================

async function changeQuantity(id, amount) {

    if (!currentUser) {
        openAuthModal("login");
        return;
    }

    const quantity = (collection[id] || 0) + amount;

    if (quantity <= 0) {

        const { error } = await supabaseClient
            .from("collections")
            .delete()
            .eq("user_id", currentUser.id)
            .eq("card_id", id);

        if (error) {
            alert("Could not remove card: " + error.message);
            return;
        }

        delete collection[id];

    } else {

        const { error } = await supabaseClient
            .from("collections")
            .upsert({

                user_id: currentUser.id,
                card_id: id,
                quantity: quantity

            }, {
                onConflict: "user_id,card_id"
            });

        if (error) {
            alert("Could not update quantity: " + error.message);
            return;
        }

        collection[id] = quantity;

    }

    renderAll();

}


// ============================================
// WISHLIST
// ============================================

async function addWishlist(id) {

    if (!currentUser) {
        openAuthModal("login");
        return;
    }

    if (wishlist.includes(id) || collection[id]) {
        return;
    }

    const { error } = await supabaseClient
        .from("wishlists")
        .upsert({

            user_id: currentUser.id,
            card_id: id

        }, {
            onConflict: "user_id,card_id",
            ignoreDuplicates: true
        });

    if (error) {
        alert("Could not add to wishlist: " + error.message);
        return;
    }

    wishlist.push(id);

    renderAll();

}


async function removeWishlist(id) {

    if (!currentUser) {
        openAuthModal("login");
        return;
    }

    const { error } = await supabaseClient
        .from("wishlists")
        .delete()
        .eq("user_id", currentUser.id)
        .eq("card_id", id);

    if (error) {
        alert("Could not remove wishlist card: " + error.message);
        return;
    }

    wishlist = wishlist.filter(cardId => cardId !== id);

    renderAll();

}


// ============================================
// DATABASE SEARCH AND FILTERING
// ============================================

function renderDatabase() {

    const search = document.getElementById("search-input")
        .value.toLowerCase();

    const rarity = document.getElementById("rarity-filter").value;

    const cardType = document.getElementById("card-type-filter").value;

    const seriesId = document.getElementById("series-filter").value;

    const filteredCards = cards.filter(card => {

        const matchesSearch =
            card.name.toLowerCase().includes(search) ||
            card.number.toLowerCase().includes(search) ||
            card.character.toLowerCase().includes(search) ||
            card.seriesName.toLowerCase().includes(search);

        const matchesRarity =
            rarity === "" || card.rarity === rarity;

        const matchesType =
            cardType === "" || card.cardType === cardType;

        const matchesSeries =
            seriesId === "" ||
            String(card.seriesId) === seriesId;

        const matchesSidebarSeries =
            activeSeriesName === "" ||
            card.seriesName.toLowerCase().includes(
                activeSeriesName.toLowerCase()
            );

        return (
            matchesSearch &&
            matchesRarity &&
            matchesType &&
            matchesSeries &&
            matchesSidebarSeries
        );

    });

    document.getElementById("database-grid").innerHTML =

        filteredCards.length

            ? filteredCards.map(card =>
                createCardHTML(card, "database")
              ).join("")

            : `
                <div class="empty-state">
                    <h3>No cards found</h3>
                    <p>Try another search or collection filter.</p>
                </div>
            `;

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

            : `
                <div class="empty-state">
                    <span>✧</span>
                    <h3>Your collection is empty</h3>
                    <p>Add cards from the database to get started.</p>
                </div>
            `;

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

            : `
                <div class="empty-state">
                    <span>⧉</span>
                    <h3>No duplicates yet</h3>
                    <p>Cards with multiple copies will appear here.</p>
                </div>
            `;

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

            : `
                <div class="empty-state">
                    <span>♡</span>
                    <h3>Your wishlist is empty</h3>
                    <p>Add cards you're hoping to collect.</p>
                </div>
            `;

}


// ============================================
// DASHBOARD
// ============================================

function renderDashboard() {

    const quantities = Object.values(collection);

    const total = quantities.reduce(
        (sum, quantity) => sum + quantity,
        0
    );

    const unique = quantities.length;

    const duplicates = quantities.reduce(
        (sum, quantity) => sum + Math.max(0, quantity - 1),
        0
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

            : `
                <div class="empty-state">
                    <span>✧</span>
                    <h3>Your collection starts here</h3>
                    <p>Visit the card database to start adding cards.</p>
                    <button class="primary-button" data-page="database">
                        Explore Cards
                    </button>
                </div>
            `;

    document.querySelectorAll("#recent-cards [data-page]").forEach(button => {

        button.addEventListener("click", () => {
            showPage(button.dataset.page, null);
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
// SEARCH AND FILTER LISTENERS
// ============================================

document.getElementById("search-input").addEventListener(
    "input",
    renderDatabase
);


document.getElementById("rarity-filter").addEventListener(
    "change",
    renderDatabase
);


document.getElementById("card-type-filter").addEventListener(
    "change",
    () => {

        activeSeriesName = "";

        updateSeriesFilter();

        document.getElementById("series-filter").value = "";

        renderDatabase();

    }
);


document.getElementById("series-filter").addEventListener(
    "change",
    () => {

        activeSeriesName = "";

        renderDatabase();

    }
);


// ============================================
// INITIALIZE APPLICATION
// ============================================

async function initializeApp() {

    renderAll();

    updateAuthDisplay();

    try {

        await loadSeries();

        await loadCards();

        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) throw error;

        currentUser = data.session ? data.session.user : null;

        updateAuthDisplay();

        await loadUserData();

        renderAll();

    } catch (error) {

        console.error(
            "Kayou Vault initialization error:",
            error
        );

        alert(
            "Kayou Vault could not load its data: " +
            error.message
        );

    }

}


initializeApp();
