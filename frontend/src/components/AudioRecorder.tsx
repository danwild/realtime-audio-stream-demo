import React, { useState, useEffect } from "react";
import RecordRTC from "recordrtc";

const AudioRecorder = () => {
  const [recorder, setRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  // Get a list of available audio input devices (microphones)
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((deviceInfos) => {
      const audioInputDevices = deviceInfos.filter(
        (device) => device.kind === "audioinput"
      );
      setDevices(audioInputDevices);
      if (audioInputDevices.length > 0) {
        setSelectedDeviceId(audioInputDevices[0].deviceId); // Default to the first device
      }
    });
  }, []);

  const handleDeviceChange = (e) => {
    setSelectedDeviceId(e.target.value);
  };

  const startRecording = () => {
    const constraints = {
      audio: {
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
      },
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      const newRecorder = new RecordRTC(stream, { type: "audio" });
      newRecorder.startRecording();
      setRecorder(newRecorder);
    });
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        setAudioBlob(blob);
        const formData = new FormData();
        formData.append("file", blob); // Send file as 'file' key

        uploadAudio(formData);
      });
    }
  };

  const uploadAudio = (formData) => {
    fetch("http://localhost:8000/upload-audio", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Server response:", data);
      });
  };

  return (
    <div>
      <h3>Select Audio Input Device</h3>
      <select onChange={handleDeviceChange} value={selectedDeviceId}>
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Microphone ${device.deviceId}`}
          </option>
        ))}
      </select>

      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>

      {audioBlob && <audio controls src={URL.createObjectURL(audioBlob)} />}
    </div>
  );
};

export default AudioRecorder;
