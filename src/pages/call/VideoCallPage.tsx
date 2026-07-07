import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { ACCESS_TOKEN_KEY, API_BASE_URL } from '../../api/client';

// Public STUN server so browsers on different networks can discover each other.
// (No TURN server configured — fine for same-network/basic demo calls, per
// the task's "Video Calling Integration (Basic)" scope.)
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export const VideoCallPage: React.FC = () => {
  const { roomName } = useParams<{ roomName: string }>();
  const navigate = useNavigate();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const isCallerRef = useRef(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    let closed = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (closed) return;
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
          setStatus('Connected');
        };

        const wsBase = API_BASE_URL.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);
        const socket = new WebSocket(`${wsBase}/ws/call/${roomName}/?token=${token}`);
        socketRef.current = socket;

        pc.onicecandidate = (event) => {
          if (event.candidate && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ event: 'ice-candidate', candidate: event.candidate }));
          }
        };

        socket.onopen = () => setStatus('Waiting for the other person to join...');

        socket.onmessage = async (msg) => {
          const data = JSON.parse(msg.data);

          if (data.event === 'peer-joined') {
            // Someone else is already here (or just joined) - become the caller
            // and send the first offer.
            isCallerRef.current = true;
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.send(JSON.stringify({ event: 'offer', sdp: offer }));
          } else if (data.event === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.send(JSON.stringify({ event: 'answer', sdp: answer }));
          } else if (data.event === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          } else if (data.event === 'ice-candidate' && data.candidate) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            } catch {
              // Ignore late candidates that arrive after connection is closed
            }
          } else if (data.event === 'peer-left') {
            setStatus('The other person left the call.');
          }
        };

        socket.onerror = () => setStatus('Connection error — check the backend is running.');
      } catch (err) {
        toast.error('Could not access camera/microphone.');
        setStatus('Could not access camera/microphone.');
      }
    };

    start();

    return () => {
      closed = true;
      socketRef.current?.close();
      peerConnectionRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [roomName]);

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => (track.enabled = isMuted));
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => (track.enabled = isVideoOff));
    setIsVideoOff(!isVideoOff);
  };

  const endCall = () => {
    socketRef.current?.close();
    peerConnectionRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-black"
        />
        <div className="absolute top-4 left-4 bg-black/50 text-white text-sm px-3 py-1.5 rounded-full">
          {status}
        </div>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white shadow-lg"
        />
      </div>

      <div className="bg-gray-800 py-4 flex justify-center gap-4">
        <Button
          variant={isMuted ? 'error' : 'outline'}
          className="rounded-full p-3"
          onClick={toggleMute}
          aria-label="Toggle microphone"
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </Button>
        <Button
          variant={isVideoOff ? 'error' : 'outline'}
          className="rounded-full p-3"
          onClick={toggleVideo}
          aria-label="Toggle camera"
        >
          {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
        </Button>
        <Button
          variant="error"
          className="rounded-full p-3"
          onClick={endCall}
          aria-label="End call"
        >
          <PhoneOff size={20} />
        </Button>
      </div>
    </div>
  );
};
