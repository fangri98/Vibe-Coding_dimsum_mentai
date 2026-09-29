// ==========================================
// NOMOR WHATSAPP DIMSUM 3R
// ==========================================

// GANTI NOMOR INI DENGAN NOMOR WHATSAPP
// PEMILIK DIMSUM 3R.
//
// Contoh:
// 081234567890
//
// Ditulis:
// 6281234567890

const STORE_WHATSAPP = "6281234567890";


// ==========================================
// KERANJANG
// ==========================================

let cart = [];


// ==========================================
// FORMAT RUPIAH
// ==========================================

function formatRupiah(number) {

    return new Intl.NumberFormat("id-ID", {

        style: "currency",

        currency: "IDR",

        maximumFractionDigits: 0

    }).format(number);

}


// ==========================================
// TAMBAH KE KERANJANG
// ==========================================

function addToCart(name, price) {

    const existingItem = cart.find(
        item => item.name === name
    );


    if (existingItem) {

        existingItem.quantity++;

    } else {

        cart.push({

            name: name,

            price: price,

            quantity: 1

        });

    }


    updateCart();

    openCart();

}


// ==========================================
// UPDATE KERANJANG
// ==========================================

function updateCart() {

    const cartItems =
        document.getElementById("cart-items");

    const cartCount =
        document.getElementById("cart-count");

    const cartTotal =
        document.getElementById("cart-total");

    const checkoutTotal =
        document.getElementById("checkout-total");


    cartItems.innerHTML = "";


    let totalItems = 0;

    let totalPrice = 0;


    // Jika kosong

    if (cart.length === 0) {

        cartItems.innerHTML = `

            <div class="empty-cart">

                <i class="fa-solid fa-cart-shopping"></i>

                <p>
                    Keranjang masih kosong
                </p>

                <span>
                    Pilih menu untuk mulai memesan.
                </span>

            </div>

        `;

    }


    // Tampilkan setiap item

    cart.forEach((item, index) => {

        totalItems += item.quantity;

        totalPrice +=
            item.price * item.quantity;


        const cartItem =
            document.createElement("div");


        cartItem.className = "cart-item";


        cartItem.innerHTML = `

            <div class="cart-item-info">

                <h4>
                    ${item.name}
                </h4>

                <p>
                    ${formatRupiah(item.price)}
                </p>

            </div>


            <div class="quantity">

                <button
                    onclick="decreaseQuantity(${index})">

                    <i class="fa-solid fa-minus"></i>

                </button>


                <span>
                    ${item.quantity}
                </span>


                <button
                    onclick="increaseQuantity(${index})">

                    <i class="fa-solid fa-plus"></i>

                </button>

            </div>

        `;


        cartItems.appendChild(cartItem);

    });


    // Update angka

    cartCount.textContent =
        totalItems;


    // Update total

    cartTotal.textContent =
        formatRupiah(totalPrice);


    checkoutTotal.textContent =
        formatRupiah(totalPrice);

}


// ==========================================
// TAMBAH JUMLAH
// ==========================================

function increaseQuantity(index) {

    cart[index].quantity++;

    updateCart();

}


// ==========================================
// KURANGI JUMLAH
// ==========================================

function decreaseQuantity(index) {

    cart[index].quantity--;


    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    }


    updateCart();

}


// ==========================================
// BUKA KERANJANG
// ==========================================

function openCart() {

    document
        .getElementById("cart-sidebar")
        .classList.add("active");


    document
        .getElementById("overlay")
        .classList.add("active");

}


// ==========================================
// TUTUP KERANJANG
// ==========================================

function closeCart() {

    document
        .getElementById("cart-sidebar")
        .classList.remove("active");


    document
        .getElementById("overlay")
        .classList.remove("active");

}


// ==========================================
// BUKA CHECKOUT
// ==========================================

function openCheckout() {

    if (cart.length === 0) {

        alert(
            "Keranjang kamu masih kosong!"
        );

        return;

    }


    closeCart();


    document
        .getElementById("checkout-modal")
        .classList.add("active");

}


// ==========================================
// TUTUP CHECKOUT
// ==========================================

function closeCheckout() {

    document
        .getElementById("checkout-modal")
        .classList.remove("active");

}


// ==========================================
// KIRIM PESAN KE WHATSAPP
// ==========================================

document
    .getElementById("checkout-form")
    .addEventListener("submit", function(event) {

        event.preventDefault();


        // Cek keranjang

        if (cart.length === 0) {

            alert(
                "Keranjang kamu masih kosong!"
            );

            return;

        }


        // Ambil nama

        const name =
            document
                .getElementById("customer-name")
                .value
                .trim();


        // Ambil catatan

        const note =
            document
                .getElementById("customer-note")
                .value
                .trim();


        // Total

        let total = 0;


        // Daftar pesanan

        let orderList = "";


        cart.forEach(item => {

            const subtotal =
                item.price * item.quantity;


            total += subtotal;


            orderList +=
                `• ${item.name} x${item.quantity} — ${formatRupiah(subtotal)}\n`;

        });


        // =====================================
        // PESAN WHATSAPP
        // =====================================

        const message = `🍜 PESANAN DIMSUM 3R

Nama: ${name}

Pesanan:
${orderList}
Total: ${formatRupiah(total)}

Pembayaran: Offline
Catatan: ${note || "-"}`;


        // Buat URL WhatsApp

        const whatsappURL =
            `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(message)}`;


        // Buka WhatsApp

        window.open(
            whatsappURL,
            "_blank"
        );


        // Kosongkan keranjang

        cart = [];


        updateCart();


        // Reset form

        this.reset();


        // Tutup checkout

        closeCheckout();

    });


// ==========================================
// JALANKAN SAAT WEBSITE DIBUKA
// ==========================================

updateCart();