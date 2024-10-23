import os
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    """
    Accepts an audio file and saves it to the server.
    """
    if not file:
        return JSONResponse(status_code=400, content={"message": "No file uploaded"})
    
    contents = await file.read()
    
    with open(f"received_audio_{file.filename}", "wb") as f:
        f.write(contents)
    
    return JSONResponse({"message": "Audio uploaded successfully."})

@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    """
    Accepts a WebSocket connection and receives audio data from the client.
    """
    await websocket.accept()
    audio_file = open("/app/files/received_audio.webm", "wb")  # Create the file where we'll store the audio

    try:
        while True:
            message = await websocket.receive()
            print('got message...')
            # Check the type of the message received
            if "bytes" in message:
                print('writing bytes...')
                audio_file.write(message["bytes"])  # Write binary audio data to the file
            elif "text" in message and message["text"] == "end":
                print("Audio stream ended")
                break  # Stop receiving when the "end" message is sent
            else:
                print("Invalid message received")
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    finally:
        audio_file.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)