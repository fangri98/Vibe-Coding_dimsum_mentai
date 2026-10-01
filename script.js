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

const STORE_WHATSAPP = "6285714808516";


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
// KONFIGURASI BACKEND
// ==========================================

const API_BASE_URL = "http://127.0.0.1:8000";


// ==========================================
// METODE PEMBAYARAN
// ==========================================

let selectedPaymentMethod = "offline";


function selectPaymentMethod(method) {

    selectedPaymentMethod = method;


    const offlineOption =
        document.getElementById("offline-option");

    const onlineOption =
        document.getElementById("online-option");

    const paymentInfo =
        document.getElementById("payment-info");


    offlineOption.classList.remove("active");

    onlineOption.classList.remove("active");


    if (method === "offline") {

        offlineOption.classList.add("active");


        paymentInfo.innerHTML = `
            <p class="payment-info-text">
                Bayar langsung kepada penjual.
            </p>
        `;

    } else {

        onlineOption.classList.add("active");


        paymentInfo.innerHTML = `
            <p class="payment-info-text">
                Kamu akan diarahkan ke halaman pembayaran Midtrans.
            </p>
        `;

    }

}


// ==========================================
// CHECKOUT
// ==========================================

document
    .getElementById("checkout-form")
    .addEventListener("submit", async function(event) {

        event.preventDefault();


        if (cart.length === 0) {

            alert(
                "Keranjang kamu masih kosong!"
            );

            return;

        }


        const name =
            document
                .getElementById("customer-name")
                .value
                .trim();


        const note =
            document
                .getElementById("customer-note")
                .value
                .trim();


        if (!name) {

            alert(
                "Nama wajib diisi."
            );

            return;

        }


        let total = 0;


        const items = cart.map(item => {

            const subtotal =
                item.price * item.quantity;


            total += subtotal;


            return {

                name: item.name,

                price: item.price,

                quantity: item.quantity,

                subtotal: subtotal

            };

        });


        const orderData = {

            name: name,

            note: note,

            payment_method:
                selectedPaymentMethod,

            total: total,

            items: items

        };


        try {

            if (
                selectedPaymentMethod ===
                "offline"
            ) {

                await createOfflineOrder(
                    orderData
                );

            } else {

                await createOnlinePayment(
                    orderData
                );

            }

        } catch (error) {

            console.error(error);

            alert(
                error.message ||
                "Terjadi kesalahan."
            );

        }

    });


// ==========================================
// PESANAN OFFLINE
// ==========================================

async function createOfflineOrder(
    orderData
) {

    const response =
        await fetch(
            `${API_BASE_URL}/orders/offline`,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(orderData)

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.detail ||
            "Gagal membuat pesanan."
        );

    }


    // Buat pesan WhatsApp
    let orderList = "";


    orderData.items.forEach(item => {

        orderList +=
            `• ${item.name} x${item.quantity} — ${formatRupiah(item.subtotal)}\n`;

    });


    const message =
        `🍜 PESANAN DIMSUM 3R\n\n` +

        `Nomor Pesanan: ${data.order_id}\n\n` +

        `Nama: ${orderData.name}\n\n` +

        `Pesanan:\n${orderList}\n` +

        `Total: ${formatRupiah(orderData.total)}\n\n` +

        `Pembayaran: Offline\n` +

        `Catatan: ${orderData.note || "-"}`;


    const whatsappURL =
        `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(message)}`;


    window.open(
        whatsappURL,
        "_blank"
    );


    cart = [];


    updateCart();


    thisResetCheckout();


    closeCheckout();

}


// ==========================================
// PEMBAYARAN ONLINE
// ==========================================

async function createOnlinePayment(
    orderData
) {

    const response =
        await fetch(
            `${API_BASE_URL}/payments/create`,
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(orderData)

            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.detail ||
            "Gagal membuat pembayaran."
        );

    }


    if (!data.token) {

        throw new Error(
            "Token pembayaran Midtrans tidak ditemukan."
        );

    }


    if (
        typeof window.snap ===
        "undefined"
    ) {

        throw new Error(
            "Midtrans belum terhubung. Periksa Client Key."
        );

    }


    window.snap.pay(
        data.token,
        {

            onSuccess: function(result) {

                console.log(
                    "Pembayaran berhasil:",
                    result
                );


                alert(
                    "Pembayaran berhasil!"
                );


                cart = [];


                updateCart();


                thisResetCheckout();


                closeCheckout();

            },


            onPending: function(result) {

                console.log(
                    "Pembayaran pending:",
                    result
                );


                alert(
                    "Pembayaran sedang menunggu."
                );

            },


            onError: function(result) {

                console.error(
                    "Pembayaran gagal:",
                    result
                );


                alert(
                    "Pembayaran gagal."
                );

            },


            onClose: function() {

                console.log(
                    "Halaman pembayaran ditutup."
                );

            }

        }
    );

}


// ==========================================
// RESET CHECKOUT
// ==========================================

function thisResetCheckout() {

    const form =
        document.getElementById(
            "checkout-form"
        );


    if (form) {

        form.reset();

    }


    selectedPaymentMethod =
        "offline";


    selectPaymentMethod(
        "offline"
    );

}


// ==========================================
// JALANKAN SAAT WEBSITE DIBUKA
// ==========================================

updateCart();

selectPaymentMethod(
    "offline"
);