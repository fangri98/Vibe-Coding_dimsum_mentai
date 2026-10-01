import os
import json
import base64
import hashlib
import urllib.request
import urllib.error

from datetime import datetime
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI()


# ==========================================
# CORS
# ==========================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_methods=["*"],

    allow_headers=["*"],
)


# ==========================================
# MIDTRANS
# ==========================================

MIDTRANS_SERVER_KEY = os.getenv(
    "MIDTRANS_SERVER_KEY",
    "GANTI_DENGAN_SERVER_KEY_MIDTRANS"
)


MIDTRANS_PRODUCTION = os.getenv(
    "MIDTRANS_PRODUCTION",
    "false"
).lower() == "true"


if MIDTRANS_PRODUCTION:

    MIDTRANS_URL = (
        "https://app.midtrans.com/"
        "snap/v1/transactions"
    )

else:

    MIDTRANS_URL = (
        "https://app.sandbox.midtrans.com/"
        "snap/v1/transactions"
    )


# ==========================================
# MODEL
# ==========================================

class ChatRequest(BaseModel):

    message: str


class OrderItem(BaseModel):

    name: str

    price: int

    quantity: int

    subtotal: int


class OrderRequest(BaseModel):

    name: str

    note: str = ""

    payment_method: str

    total: int

    items: list[OrderItem]


# ==========================================
# PENYIMPANAN PESANAN
# ==========================================

orders = {}


# ==========================================
# ORDER ID
# ==========================================

def create_order_id():

    timestamp = datetime.now().strftime(
        "%Y%m%d%H%M%S"
    )

    random_part = (
        uuid4()
        .hex[:6]
        .upper()
    )

    return (
        f"D3R-{timestamp}-{random_part}"
    )


# ==========================================
# VALIDASI ORDER
# ==========================================

def validate_order(order):

    if not order.name.strip():

        raise HTTPException(
            status_code=400,
            detail="Nama wajib diisi."
        )


    if not order.items:

        raise HTTPException(
            status_code=400,
            detail="Keranjang kosong."
        )


    calculated_total = sum(
        item.price * item.quantity
        for item in order.items
    )


    if calculated_total != order.total:

        raise HTTPException(
            status_code=400,
            detail="Total pesanan tidak valid."
        )


    if order.payment_method not in [
        "offline",
        "online"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Metode pembayaran tidak valid."
        )


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():

    return {
        "message":
            "Backend Dimsum 3R aktif!"
    }


# ==========================================
# PESANAN OFFLINE
# ==========================================

@app.post("/orders/offline")
def create_offline_order(
    order: OrderRequest
):

    validate_order(order)


    order_id = create_order_id()


    saved_order = {

        "order_id":
            order_id,

        "name":
            order.name,

        "note":
            order.note,

        "payment_method":
            "offline",

        "payment_status":
            "pending",

        "total":
            order.total,

        "items": [

            item.model_dump()

            for item in order.items

        ],

        "created_at":
            datetime.now().isoformat()

    }


    orders[order_id] = saved_order


    print(
        json.dumps(
            saved_order,
            indent=2,
            ensure_ascii=False
        )
    )


    return {

        "success":
            True,

        "order_id":
            order_id

    }


# ==========================================
# PEMBAYARAN ONLINE
# ==========================================

@app.post("/payments/create")
def create_payment(
    order: OrderRequest
):

    validate_order(order)


    if MIDTRANS_SERVER_KEY.startswith(
        "GANTI_"
    ):

        raise HTTPException(

            status_code=500,

            detail=
                "Server Key Midtrans belum diatur."

        )


    order_id = create_order_id()


    saved_order = {

        "order_id":
            order_id,

        "name":
            order.name,

        "note":
            order.note,

        "payment_method":
            "online",

        "payment_status":
            "pending",

        "total":
            order.total,

        "items": [

            item.model_dump()

            for item in order.items

        ],

        "created_at":
            datetime.now().isoformat()

    }


    orders[order_id] = saved_order


    payload = {

        "transaction_details": {

            "order_id":
                order_id,

            "gross_amount":
                order.total

        },

        "customer_details": {

            "first_name":
                order.name

        },

        "item_details": [

            {

                "id":
                    str(index + 1),

                "price":
                    item.price,

                "quantity":
                    item.quantity,

                "name":
                    item.name[:50]

            }

            for index, item
            in enumerate(order.items)

        ]

    }


    body = json.dumps(
        payload
    ).encode("utf-8")


    auth = base64.b64encode(

        (
            f"{MIDTRANS_SERVER_KEY}:"
        ).encode("utf-8")

    ).decode("ascii")


    request = urllib.request.Request(

        MIDTRANS_URL,

        data=body,

        headers={

            "Content-Type":
                "application/json",

            "Accept":
                "application/json",

            "Authorization":
                f"Basic {auth}"

        },

        method="POST"

    )


    try:

        with urllib.request.urlopen(
            request,
            timeout=20
        ) as response:

            result = json.loads(
                response
                .read()
                .decode("utf-8")
            )


    except urllib.error.HTTPError as error:

        print(
            "Midtrans error:",
            error.read()
            .decode("utf-8")
        )


        raise HTTPException(

            status_code=502,

            detail=
                "Gagal membuat pembayaran Midtrans."

        )


    except urllib.error.URLError:

        raise HTTPException(

            status_code=502,

            detail=
                "Tidak dapat terhubung ke Midtrans."

        )


    return {

        "success":
            True,

        "order_id":
            order_id,

        "token":
            result.get("token"),

        "redirect_url":
            result.get("redirect_url")

    }


# ==========================================
# NOTIFIKASI MIDTRANS
# ==========================================

@app.post("/midtrans/notification")
def midtrans_notification(
    notification: dict
):

    order_id = notification.get("order_id")


    status_code =notification.get("status_code")


    gross_amount = notification.get("gross_amount")


    signature_key = notification.get("signature_key")


    raw_signature = (

        f"{order_id}"
        f"{status_code}"
        f"{gross_amount}"
        f"{MIDTRANS_SERVER_KEY}"

    )


    expected_signature = hashlib.sha512(

            raw_signature
            .encode("utf-8")

        ).hexdigest()


    if (
        expected_signature
        != signature_key
    ):

        raise HTTPException(

            status_code=403,

            detail=
                "Signature tidak valid."

        )


    transaction_status = notification.get(     "transaction_status" )


    if order_id in orders:

        orders[order_id][
            "payment_status"
        ] = transaction_status


        orders[order_id][
            "payment_type"
        ] = notification.get(
            "payment_type"
        )


    return {
        "success": True
    }


# ==========================================
# CEK ORDER
# ==========================================

@app.get("/orders/{order_id}")
def get_order(
    order_id: str
):

    if order_id not in orders:

        raise HTTPException(

            status_code=404,

            detail=
                "Pesanan tidak ditemukan."

        )


    return orders[order_id]


# ==========================================
# CHATBOT
# ==========================================

@app.post("/chat")
def chat(
    request: ChatRequest
):

    message = request.message.lower()


    if "menu" in message:

        reply = (
            "Menu Dimsum 3R tersedia "
            "Dimsum Mentai, Dimsum Ori, "
            "Wonton Goreng, dan Wonton Basah. "
            "Silakan lihat daftar menu di website ya!"
        )


    elif "harga" in message:

        reply = (
            "Untuk harga, silakan cek "
            "bagian menu di website Dimsum 3R."
        )


    elif (
        "halo" in message
        or "hai" in message
    ):

        reply = (
            "Halo!  Ada yang bisa saya bantu?"
        )


    elif "pesan" in message:

        reply = (
            "Tentu! Pilih menu yang kamu mau, "
            "masukkan ke keranjang, lalu "
            "lanjutkan checkout."
        )


    else:

        reply = (
            "Maaf, aku belum memahami "
            "pertanyaan itu. Kamu bisa "
            "bertanya tentang menu, harga, "
            "atau cara pesan."
        )


    return {
        "reply": reply
    }