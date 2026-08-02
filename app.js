const API_URL = "http://localhost:5000/api";

/* ============ State ============ */
let currentUser = null; // { _id, name, email, isAdmin } once logged in

/* ============ API helpers ============ */

async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }
  return data;
}

const registerUser = (name, email, password) =>
  apiRequest("/auth/register", { method: "POST", body: { name, email, password } });

const loginUser = (email, password) =>
  apiRequest("/auth/login", { method: "POST", body: { email, password } });

const getProfile = () => apiRequest("/auth/profile", { auth: true });

const getProducts = (category) =>
  apiRequest(`/products${category ? `?category=${encodeURIComponent(category)}` : ""}`);

const getCart = () => apiRequest("/cart", { auth: true });

const addToCartRequest = (productId, qty = 1) =>
  apiRequest("/cart", { method: "POST", body: { productId, qty }, auth: true });

const updateCartItemRequest = (productId, qty) =>
  apiRequest(`/cart/${productId}`, { method: "PUT", body: { qty }, auth: true });

const removeCartItemRequest = (productId) =>
  apiRequest(`/cart/${productId}`, { method: "DELETE", auth: true });

const createOrderRequest = (shippingAddress, paymentMethod) =>
  apiRequest("/orders", { method: "POST", body: { shippingAddress, paymentMethod }, auth: true });

const getMyOrders = () => apiRequest("/orders/myorders", { auth: true });

/* ============ Auth UI ============ */

const authLoggedOut = document.getElementById("auth-logged-out");
const authLoggedIn = document.getElementById("auth-logged-in");
const headerGreeting = document.getElementById("header-greeting");
const userNameEl = document.getElementById("user-name");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginMsg = document.getElementById("login-msg");
const registerMsg = document.getElementById("register-msg");
const showRegisterLink = document.getElementById("show-register");
const showLoginLink = document.getElementById("show-login");
const showLoginWrap = document.getElementById("show-login-wrap");
const logoutBtn = document.getElementById("logout-btn");
const viewOrdersLink = document.getElementById("view-orders");

function setMsg(el, text, type) {
  if (!el) return;
  el.textContent = text || "";
  el.className = "auth-msg" + (type ? ` ${type}` : "");
}

function showLoggedInUI(user) {
  currentUser = user;
  if (authLoggedOut) authLoggedOut.style.display = "none";
  if (authLoggedIn) authLoggedIn.style.display = "block";
  if (userNameEl) userNameEl.textContent = user.name;
  if (headerGreeting) headerGreeting.textContent = `Hello, ${user.name}`;
}

function showLoggedOutUI() {
  currentUser = null;
  if (authLoggedOut) authLoggedOut.style.display = "block";
  if (authLoggedIn) authLoggedIn.style.display = "none";
  if (headerGreeting) headerGreeting.textContent = "Hello, Sign in";
}

async function restoreSession() {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const user = await getProfile();
    showLoggedInUI(user);
    refreshCartBadge();
  } catch (err) {
    localStorage.removeItem("token");
    showLoggedOutUI();
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(loginMsg, "", "");
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    try {
      const data = await loginUser(email, password);
      localStorage.setItem("token", data.token);
      showLoggedInUI(data);
      setMsg(loginMsg, "Signed in!", "success");
      refreshCartBadge();
    } catch (err) {
      setMsg(loginMsg, err.message, "error");
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(registerMsg, "", "");
    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    try {
      const data = await registerUser(name, email, password);
      localStorage.setItem("token", data.token);
      showLoggedInUI(data);
      setMsg(registerMsg, "Account created!", "success");
      refreshCartBadge();
    } catch (err) {
      setMsg(registerMsg, err.message, "error");
    }
  });
}

if (showRegisterLink) {
  showRegisterLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    document.getElementById("show-register-wrap").style.display = "none";
    registerForm.style.display = "flex";
    showLoginWrap.style.display = "block";
  });
}

if (showLoginLink) {
  showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    registerForm.style.display = "none";
    showLoginWrap.style.display = "none";
    loginForm.style.display = "flex";
    document.getElementById("show-register-wrap").style.display = "block";
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    showLoggedOutUI();
    refreshCartBadge();
  });
}

if (viewOrdersLink) {
  viewOrdersLink.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      const orders = await getMyOrders();
      if (orders.length === 0) {
        alert("You have no orders yet.");
      } else {
        const summary = orders
          .map((o) => `Order ${o._id.slice(-6)} — $${o.totalPrice.toFixed(2)} — ${o.status}`)
          .join("\n");
        alert(summary);
      }
    } catch (err) {
      alert(err.message);
    }
  });
}

/* ============ Product rendering ============ */

function requireLogin() {
  alert("Please sign in first.");
  document.querySelector(".ac")?.dispatchEvent(new Event("click"));
}

function productCardHTML(product) {
  const inStock = product.countInStock > 0;
  return `
    <li class="product-card" data-id="${product._id}">
      <img src="${product.image || "https://via.placeholder.com/300x300?text=Product"}" alt="${product.name}">
      <span class="p-name">${product.name}</span>
      <span class="p-price">$${product.price.toFixed(2)}</span>
      <button class="add-to-cart-btn" data-id="${product._id}" ${inStock ? "" : "disabled"}>
        ${inStock ? "Add to Cart" : "Out of stock"}
      </button>
    </li>`;
}

async function renderProductSlide(category, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  try {
    const data = await getProducts(category);
    if (!data.products || data.products.length === 0) return; // keep placeholder images if nothing seeded yet
    container.innerHTML = data.products.map(productCardHTML).join("");
  } catch (err) {
    console.error(`Failed to load products for ${category}:`, err.message);
  }
}

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".add-to-cart-btn");
  if (!btn) return;
  if (!currentUser) return requireLogin();
  const productId = btn.dataset.id;
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = "Adding...";
  try {
    await addToCartRequest(productId, 1);
    await refreshCartBadge();
    btn.textContent = "Added!";
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 1000);
  } catch (err) {
    alert(err.message);
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

/* ============ Cart panel ============ */

const cartToggle = document.getElementById("cart-toggle");
const cartPanel = document.getElementById("cart-panel");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const cartCountEl = document.getElementById("cart-count");
const checkoutBtn = document.getElementById("checkout-btn");
const checkoutMsg = document.getElementById("checkout-msg");

async function refreshCartBadge() {
  if (!currentUser) {
    if (cartCountEl) cartCountEl.textContent = "0";
    return;
  }
  try {
    const cart = await getCart();
    const count = cart.items.reduce((sum, i) => sum + i.qty, 0);
    if (cartCountEl) cartCountEl.textContent = String(count);
  } catch (err) {
    // ignore silently, badge just won't update
  }
}

function cartItemHTML(item) {
  return `
    <div class="cart-item" data-id="${item.product}">
      <img src="${item.image || "https://via.placeholder.com/60x60"}" alt="${item.name}">
      <div class="cart-item-info">
        <span class="name">${item.name}</span>
        <span>$${item.price.toFixed(2)} each</span>
      </div>
      <div class="cart-item-controls">
        <button class="qty-decrease" data-id="${item.product}">-</button>
        <input type="text" value="${item.qty}" readonly>
        <button class="qty-increase" data-id="${item.product}">+</button>
        <button class="remove-item" data-id="${item.product}">Remove</button>
      </div>
    </div>`;
}

async function renderCart() {
  if (!cartItemsEl) return;
  if (!currentUser) {
    cartItemsEl.innerHTML = "<p style='padding:20px;'>Sign in to see your cart.</p>";
    if (cartTotalEl) cartTotalEl.textContent = "$0.00";
    return;
  }
  try {
    const cart = await getCart();
    if (cart.items.length === 0) {
      cartItemsEl.innerHTML = "<p style='padding:20px;'>Your cart is empty.</p>";
    } else {
      cartItemsEl.innerHTML = cart.items.map(cartItemHTML).join("");
    }
    const total = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    if (cartTotalEl) cartTotalEl.textContent = `$${total.toFixed(2)}`;
  } catch (err) {
    cartItemsEl.innerHTML = `<p style='padding:20px;'>${err.message}</p>`;
  }
}

if (cartToggle) {
  cartToggle.addEventListener("click", async () => {
    cartPanel.classList.toggle("active");
    if (cartPanel.classList.contains("active")) {
      await renderCart();
    }
  });
}

if (cartItemsEl) {
  cartItemsEl.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;
    try {
      if (e.target.classList.contains("qty-increase")) {
        const row = e.target.closest(".cart-item");
        const newQty = Number(row.querySelector("input").value) + 1;
        await updateCartItemRequest(id, newQty);
      } else if (e.target.classList.contains("qty-decrease")) {
        const row = e.target.closest(".cart-item");
        const newQty = Number(row.querySelector("input").value) - 1;
        await updateCartItemRequest(id, newQty);
      } else if (e.target.classList.contains("remove-item")) {
        await removeCartItemRequest(id);
      } else {
        return;
      }
      await renderCart();
      await refreshCartBadge();
    } catch (err) {
      alert(err.message);
    }
  });
}

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", async () => {
    if (!currentUser) return requireLogin();
    setMsg(checkoutMsg, "", "");
    const line1 = prompt("Street address:");
    if (!line1) return;
    const city = prompt("City:");
    if (!city) return;
    const state = prompt("State:");
    if (!state) return;
    const postalCode = prompt("Postal code:");
    if (!postalCode) return;
    const country = prompt("Country:") || "";

    try {
      const order = await createOrderRequest(
        { line1, city, state, postalCode, country },
        "COD"
      );
      setMsg(checkoutMsg, `Order placed! Total: $${order.totalPrice.toFixed(2)}`, "success");
      await renderCart();
      await refreshCartBadge();
    } catch (err) {
      setMsg(checkoutMsg, err.message, "error");
    }
  });
}

/* ============ Init ============ */

renderProductSlide("Wireless", "slide-wireless");
renderProductSlide("PC", "slide-pc");
renderProductSlide("Books", "slide-books");
restoreSession();

/* ============ Original template UI behavior (sliders, sidebar, sign dropdown) ============ */

const leftBtn = document.querySelector(".l-btn");
const rightBtn = document.querySelector(".r-btn");

rightBtn.addEventListener("click", function (event) {
  const conent = document.querySelector(".product-slide");
  conent.scrollLeft += 1100;
  event.preventDefault();
});
leftBtn.addEventListener("click", function (event) {
  const conent = document.querySelector(".product-slide");
  conent.scrollLeft -= 1100;
  event.preventDefault();
});

const leftBtn1 = document.querySelector(".btn-1b");
const rightBtn1 = document.querySelector(".btn-1a");

rightBtn1.addEventListener("click", function (event) {
  const conent = document.querySelector(".product-slide-1");
  conent.scrollLeft += 1100;
  event.preventDefault();
});
leftBtn1.addEventListener("click", function (event) {
  const conent = document.querySelector(".product-slide-1");
  conent.scrollLeft -= 1100;
  event.preventDefault();
});

const leftBtn2 = document.querySelector(".btn-1c");
const rightBtn2 = document.querySelector(".btn-1d");

rightBtn2.addEventListener("click", function (event) {
  const conent = document.querySelector(".product-slide-2");
  conent.scrollLeft += 1100;
  event.preventDefault();
});
leftBtn2.addEventListener("click", function (event) {
  const conent = document.querySelector(".product-slide-2");
  conent.scrollLeft -= 1100;
  event.preventDefault();
});

const backtop = document.querySelector(".backtop");
backtop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const sidebar = document.querySelector(".sidebar");
const cross = document.querySelector(".fa-xmark");
const black = document.querySelector(".black");
const sidebtn = document.querySelector(".second-1");

sidebtn.addEventListener("click", () => {
  sidebar.classList.add("active");
  cross.classList.add("active");
  black.classList.add("active");
  document.body.classList.add("stop-scroll");
});
cross.addEventListener("click", () => {
  sidebar.classList.remove("active");
  cross.classList.remove("active");
  black.classList.remove("active");
  document.body.classList.remove("stop-scroll");
});

const sign = document.querySelector(".ac");
const tri = document.querySelector(".triangle");
const signin = document.querySelector(".hdn-sign");

sign.addEventListener("click", () => {
  black.classList.toggle("active-1");
  signin.classList.toggle("active");
  tri.classList.toggle("active");
  document.body.classList.toggle("stop-scroll");
});
