
import { useEffect, useRef, useState } from 'react';

const WebSocketSignaling = () => {
  const ws = useRef<WebSocket | null>(null); // WebSocket connection
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null); // WebRTC connection
  const localStream = useRef<MediaStream | null>(null); // Local media stream
  const remoteStream = useRef<MediaStream>(new MediaStream()); // Remote media stream
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  type SignalMessage = {
    type: 'offer' | 'answer' | 'candidate';
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  };

  useEffect(() => {
    // Step 1: Initialize WebSocket connection
    ws.current = new WebSocket('ws://localhost:8080/socket1'); // Replace with your WebSocket server URL

    ws.current.onopen = () => {
      console.log('WebSocket connection opened');
    };

    ws.current.onmessage = async (event: MessageEvent<string>) => {
      try {
        const data: SignalMessage = JSON.parse(event.data);
        console.log('Received message:', data);

        if (data.type === 'offer' && data.offer) {
          // Step 2: Handle incoming offer
          await handleOffer(data.offer);
        } else if (data.type === 'answer' && data.answer) {
          // Step 3: Handle incoming answer
          await handleAnswer(data.answer);
        } else if (data.type === 'candidate' && data.candidate) {
          // Step 4: Handle incoming ICE candidate
          if (peerConnection) {
            await peerConnection.addIceCandidate(data.candidate);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [peerConnection]);

  useEffect(() => {
    // Step 5: Initialize WebRTC peer connection
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, // Public STUN server
      ],
    });

    // Local ICE candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && ws.current) {
        ws.current.send(
          JSON.stringify({
            type: 'candidate',
            candidate: event.candidate,
          })
        );
      }
    };

    // Remote stream handling
    pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.current.addTrack(track);
      });

    };

    setPeerConnection(pc);

    return () => {
      pc.close();
    };
  }, []);

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnection) return;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    if (ws.current) {
      ws.current.send(
        JSON.stringify({
          type: 'answer',
          answer,
        })
      );
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnection) return;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const startCall = async () => {
    if (!peerConnection) return;

    // Access local media
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }

      localStream.current.getTracks().forEach(
        (track) => {
          peerConnection.addTrack(track, localStream.current as MediaStream);
        }
      );

      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (ws.current) {
        ws.current.send(
          JSON.stringify({
            type: 'offer',
            offer,
          })
        );
      }
    } catch (error) {
      console.error('Error accessing local media:', error);
    }
  };

  const endCall = () => {
    //setPeerConnection(null);

    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
      console.log("Peer connection closed.");
    }

  }

  return (
    <div>
      <h1>WebRTC Signaling with WebSocket</h1>
      <button onClick={startCall}>Start Call</button>

      <button onClick={endCall}>End Call</button>
      <video
        id='localVideo'
        autoPlay
        muted
        ref={localVideoRef}
      />
      <video
        id='remoteVideo'
        autoPlay
        ref={(video) => {
          if (video) {
            video.srcObject = remoteStream.current;
          }
        }}
      />
    </div>
  );
};

export default WebSocketSignaling;
