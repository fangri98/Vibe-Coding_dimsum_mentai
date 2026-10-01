from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Mengizinkan website mengakses backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


@app.get("/")
def home():
    return {"message": "Backend Dimsum 3R aktif!"}


@app.post("/chat")
def chat(request: ChatRequest):
    message = request.message.lower()

    if "menu" in message:
        reply = (
            "Menu Dimsum 3R tersedia Dimsum Mentai dan Wonton. "
            "Silakan lihat daftar menu di website ya!"
        )

    elif "harga" in message:
        reply = (
            "Untuk harga, silakan cek bagian menu di website Dimsum 3R."
        )

    elif "halo" in message or "hai" in message:
        reply = "Halo!  Ada yang bisa saya bantu?"

    elif "pesan" in message:
        reply = (
            "Tentu! Pilih menu yang kamu mau, "
            "masukkan ke keranjang, lalu lanjutkan checkout."
        )

    else:
        reply = (
            "Maaf, aku belum memahami pertanyaan itu. "
            "Kamu bisa bertanya tentang menu, harga, atau cara pesan."
        )

    return {"reply": reply}