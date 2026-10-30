// =====================================
// KAYOU VAULT - TEMPORARY DEMO DATABASE
// These are illustrative entries, not verified cards.
// =====================================

const cards = [
    {
        id: 1,
        name: "Twilight Sparkle",
        number: "DEMO-001",
        rarity: "SSR",
        color: "purple"
    },
    {
        id: 2,
        name: "Pinkie Pie",
        number: "DEMO-002",
        rarity: "SR",
        color: "pink"
    },
    {
        id: 3,
        name: "Rainbow Dash",
        number: "DEMO-003",
        rarity: "UR",
        color: "blue"
    },
    {
        id: 4,
        name: "Fluttershy",
        number: "DEMO-004",
        rarity: "R",
        color: "yellow"
    },
    {
        id: 5,
        name: "Rarity",
        number: "DEMO-005",
        rarity: "SSR",
        color: "purple"
    },
    {
        id: 6,
        name: "Applejack",
        number: "DEMO-006",
        rarity: "SR",
        color: "yellow"
    }
];


// =====================================
// TEMPORARY BROWSER STORAGE
// =====================================

let collection = JSON.parse(
    localStorage.getItem("kayouCollection") || "{}"
);

let wishlist = JSON.parse(
    localStorage.getItem("kayouWishlist") || "[]"
);


function saveData() {
    localStorage.setItem(
        "kayouCollection",
        JSON.stringify(collection)
    );

    localStorage.setItem(
        "kayouWishlist",
        JSON.stringify(wishlist)
    );
}


// =====================================
// NAVIGATION
// =====================================

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


// =====================================
// CARD DISPLAY
// =====================================

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

    if (mode === "collection") {

        actions = `
            <button onclick="changeQuantity(${card.id}, 1)">
                + Add
            </button>

            <button onclick="changeQuantity(${card.id}, -1)">
                − Remove
            </button>
        `;

    }

    if (mode === "duplicates") {

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

    return `
        <div class="card-item">

            <div class="card-art ${card.color}">
                ✦
            </div>

            <div class="card-info">

                <h3>${card.name}</h3>

                <p>Card No. ${card.number}</p>

                <span class="rarity">${card.rarity}</span>

                ${mode !== "database" ? `
                    <p style="margin-top:10px;">
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


// =====================================
// ADD CARD TO COLLECTION
// =====================================

function addCard(id) {

    collection[id] = (collection[id] || 0) + 1;

    // Remove from wishlist when added
    wishlist = wishlist.filter(cardId => cardId !== id);

    saveData();
    renderAll();

}


// =====================================
// CHANGE CARD QUANTITY
// =====================================

function changeQuantity(id, amount) {

    let current = collection[id] || 0;

    current += amount;

    if (current <= 0) {
        delete collection[id];
    } else {
        collection[id] = current;
    }

    saveData();
    renderAll();

}


// =====================================
// WISHLIST
// =====================================

function addWishlist(id) {

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


// =====================================
// SEARCH AND FILTER
// =====================================

function renderDatabase() {

    const search = document
        .getElementById("search-input")
        .value.toLowerCase();

    const rarity = document
        .getElementById("rarity-filter")
        .value;

    const filteredCards = cards.filter(card => {

        const matchesSearch =
            card.name.toLowerCase().includes(search) ||
            card.number.toLowerCase().includes(search);

        const matchesRarity =
            rarity === "" || card.rarity === rarity;

        return matchesSearch && matchesRarity;

    });

    const grid = document.getElementById("database-grid");

    grid.innerHTML = filteredCards.length
        ? filteredCards.map(card =>
            createCardHTML(card, "database")
          ).join("")
        : `<div class="empty-state">
                <h3>No cards found</h3>
                <p>Try another search.</p>
           </div>`;

}


// =====================================
// COLLECTION
// =====================================

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


// =====================================
// DUPLICATES
// =====================================

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


// =====================================
// WISHLIST DISPLAY
// =====================================

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


// =====================================
// DASHBOARD STATISTICS
// =====================================

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
                    <button class="primary-button"
                        data-page="database">
                        Explore Cards
                    </button>
               </div>`;

    // Reconnect dynamically created navigation button
    document.querySelectorAll("#recent-cards [data-page]").forEach(button => {
        button.addEventListener("click", () => {
            showPage(button.dataset.page);
        });
    });

}


// =====================================
// REFRESH ALL SECTIONS
// =====================================

function renderAll() {

    renderDashboard();
    renderDatabase();
    renderCollection();
    renderDuplicates();
    renderWishlist();

}


// =====================================
// LOGIN PLACEHOLDER
// =====================================

document.getElementById("login-button").addEventListener("click", () => {

    alert("User registration and login will be available when Supabase is connected!");

});

document.getElementById("settings-login").addEventListener("click", () => {

    alert("User registration and login will be available when Supabase is connected!");

});


// =====================================
// SEARCH EVENTS
// =====================================

document.getElementById("search-input").addEventListener(
    "input",
    renderDatabase
);

document.getElementById("rarity-filter").addEventListener(
    "change",
    renderDatabase
);


// INITIALIZE WEBSITE

renderAll();
