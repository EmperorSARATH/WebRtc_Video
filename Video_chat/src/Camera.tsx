import { useEffect, useRef } from "react";

const Camera = () => {
	console.log("coming to camera element");
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		// Request access to the camera
		const getCameraStream = async () => {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: true,
				});
				if (videoRef.current) {
					videoRef.current.srcObject = stream; // Set the video source to the stream
					stream.getTracks().forEach(
						track => {
							peerConnection.addTrack(track, stream);
						}
					);
				}
			} catch (error) {
				console.error("Error accessing camera: ", error);
			}
		};


		const peerConnection = new RTCPeerConnection({
			iceServers: [
				{ urls: "stun:stun.l.google.com:19302" }
			]
		})

		//peerConnection.ontrack = (event) => {
		//	const remoteStream = event.streams[0];
		//	//document.getElementById("remote").srcObject = remoteStream;
		//
		//}


		getCameraStream();

		// Cleanup function to stop the video stream when component unmounts
		return () => {
			//if (videoRef.current) {
			//	const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
			//	tracks.forEach((track) => track.stop());
			//}
		};
	}, []);

	return (
		<div>
			<h2>Camera Feed</h2>
			<video ref={videoRef} autoPlay width="600" height="400" />
		</div>
	);
};

export default Camera;
