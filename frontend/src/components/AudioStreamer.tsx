import React, { useState } from "react";
import RecordRTC from "recordrtc";

const AudioRecorder = () => {
  const [recorder, setRecorder] = useState(null);
  const [socket, setSocket] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = () => {
    const ws = new WebSocket("ws://localhost:8000/ws/audio");

    ws.onopen = () => {
      console.log("WebSocket connection established");

      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        console.log("Media stream obtained", stream);
        setMediaStream(stream);

        const newRecorder = new RecordRTC(stream, {
          type: "audio",
          mimeType: "audio/webm",
        });

        // Automatically trigger `ondataavailable` at regular intervals (e.g., 1000ms)
        newRecorder.startRecording({
          timeSlice: 1000, // 1 second intervals
          ondataavailable: (blob) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(blob); // Send the audio blob over the WebSocket
              console.log("Audio chunk sent");
            } else {
              console.error("WebSocket connection is not open");
            }
          },
        });

        setRecorder(newRecorder);
        setSocket(ws);
        setIsRecording(true);
      });
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stopRecording(() => {
        setIsRecording(false);

        if (mediaStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
        }
      });
    }

    if (socket) {
      socket.send("end"); // Inform the server that recording has ended
      socket.close(); // Close the WebSocket connection
    }
  };

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
    </div>
  );
};

export default AudioRecorder;
