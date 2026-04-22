import { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { useSocketContext } from "./SocketContext";
import { useAuthContext } from "./AuthContext";

const CallContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useCallContext = () => {
	return useContext(CallContext);
};

const ICE_SERVERS = {
	iceServers: [
		{ urls: "stun:stun.l.google.com:19302" },
		{ urls: "stun:stun1.l.google.com:19302" },
	],
};

// Call states: idle, calling, ringing, inCall
export const CallProvider = ({ children }) => {
	const { socket } = useSocketContext();
	const { authUser } = useAuthContext();

	const [callState, setCallState] = useState("idle"); // idle | calling | ringing | inCall
	const [callType, setCallType] = useState(null); // "audio" | "video"
	const [remoteUser, setRemoteUser] = useState(null); // { _id, fullName, profilePic }
	const [localStream, setLocalStream] = useState(null);
	const [remoteStream, setRemoteStream] = useState(null);
	const [isMuted, setIsMuted] = useState(false);
	const [isCameraOff, setIsCameraOff] = useState(false);
	const [isScreenSharing, setIsScreenSharing] = useState(false);
	const [callDuration, setCallDuration] = useState(0);

	const peerConnectionRef = useRef(null);
	const localStreamRef = useRef(null);
	const screenStreamRef = useRef(null);
	const timerRef = useRef(null);
	const pendingCandidatesRef = useRef([]);

	// Cleanup function
	const cleanup = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
		if (peerConnectionRef.current) {
			peerConnectionRef.current.close();
			peerConnectionRef.current = null;
		}
		if (localStreamRef.current) {
			localStreamRef.current.getTracks().forEach((track) => track.stop());
			localStreamRef.current = null;
		}
		if (screenStreamRef.current) {
			screenStreamRef.current.getTracks().forEach((track) => track.stop());
			screenStreamRef.current = null;
		}
		pendingCandidatesRef.current = [];
		setLocalStream(null);
		setRemoteStream(null);
		setCallState("idle");
		setCallType(null);
		setRemoteUser(null);
		setIsMuted(false);
		setIsCameraOff(false);
		setIsScreenSharing(false);
		setCallDuration(0);
	}, []);

	// Create peer connection
	const createPeerConnection = useCallback(() => {
		const pc = new RTCPeerConnection(ICE_SERVERS);

		pc.onicecandidate = (event) => {
			if (event.candidate && socket && remoteUser) {
				socket.emit("iceCandidate", {
					to: remoteUser._id,
					candidate: event.candidate,
				});
			}
		};

		pc.ontrack = (event) => {
			setRemoteStream(event.streams[0]);
		};

		pc.oniceconnectionstatechange = () => {
			if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
				endCall();
			}
		};

		peerConnectionRef.current = pc;
		return pc;
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [socket, remoteUser]);

	// Start a call (outgoing)
	const startCall = useCallback(async (user, type) => {
		if (!socket || callState !== "idle") return;

		try {
			const constraints = {
				audio: true,
				video: type === "video",
			};
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			localStreamRef.current = stream;
			setLocalStream(stream);
			setCallType(type);
			setRemoteUser(user);
			setCallState("calling");

			const pc = createPeerConnection();

			stream.getTracks().forEach((track) => {
				pc.addTrack(track, stream);
			});

			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			socket.emit("callUser", {
				to: user._id,
				offer: pc.localDescription,
				callerInfo: {
					_id: authUser._id,
					fullName: authUser.fullName,
					profilePic: authUser.profilePic,
				},
				callType: type,
			});
		} catch (err) {
			console.error("Failed to start call:", err);
			cleanup();
		}
	}, [socket, callState, authUser, createPeerConnection, cleanup]);

	// Answer an incoming call
	const answerCall = useCallback(async () => {
		if (!socket || callState !== "ringing") return;

		try {
			const constraints = {
				audio: true,
				video: callType === "video",
			};
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			localStreamRef.current = stream;
			setLocalStream(stream);

			const pc = peerConnectionRef.current;
			if (!pc) return;

			stream.getTracks().forEach((track) => {
				pc.addTrack(track, stream);
			});

			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);

			// Process any pending ICE candidates
			for (const candidate of pendingCandidatesRef.current) {
				await pc.addIceCandidate(new RTCIceCandidate(candidate));
			}
			pendingCandidatesRef.current = [];

			socket.emit("answerCall", {
				to: remoteUser._id,
				answer: pc.localDescription,
			});

			setCallState("inCall");

			// Start timer
			timerRef.current = setInterval(() => {
				setCallDuration((prev) => prev + 1);
			}, 1000);
		} catch (err) {
			console.error("Failed to answer call:", err);
			cleanup();
		}
	}, [socket, callState, callType, remoteUser, cleanup]);

	// Reject incoming call
	const rejectCall = useCallback(() => {
		if (socket && remoteUser) {
			socket.emit("rejectCall", { to: remoteUser._id });
		}
		cleanup();
	}, [socket, remoteUser, cleanup]);

	// End call
	const endCall = useCallback(() => {
		if (socket && remoteUser) {
			socket.emit("endCall", { to: remoteUser._id });
		}
		cleanup();
	}, [socket, remoteUser, cleanup]);

	// Toggle mute
	const toggleMute = useCallback(() => {
		if (localStreamRef.current) {
			const audioTrack = localStreamRef.current.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !audioTrack.enabled;
				setIsMuted(!audioTrack.enabled);
			}
		}
	}, []);

	// Toggle camera
	const toggleCamera = useCallback(() => {
		if (localStreamRef.current) {
			const videoTrack = localStreamRef.current.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.enabled = !videoTrack.enabled;
				setIsCameraOff(!videoTrack.enabled);
			}
		}
	}, []);

	// Screen sharing
	const toggleScreenShare = useCallback(async () => {
		const pc = peerConnectionRef.current;
		if (!pc) return;

		if (isScreenSharing) {
			// Stop screen sharing, revert to camera
			if (screenStreamRef.current) {
				screenStreamRef.current.getTracks().forEach((track) => track.stop());
				screenStreamRef.current = null;
			}
			const videoTrack = localStreamRef.current?.getVideoTracks()[0];
			if (videoTrack) {
				const sender = pc.getSenders().find((s) => s.track?.kind === "video");
				if (sender) {
					await sender.replaceTrack(videoTrack);
				}
			}
			setIsScreenSharing(false);
		} else {
			try {
				const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
				screenStreamRef.current = screenStream;
				const screenTrack = screenStream.getVideoTracks()[0];

				const sender = pc.getSenders().find((s) => s.track?.kind === "video");
				if (sender) {
					await sender.replaceTrack(screenTrack);
				}

				screenTrack.onended = () => {
					// User clicked browser's "stop sharing"
					const videoTrack = localStreamRef.current?.getVideoTracks()[0];
					if (videoTrack && sender) {
						sender.replaceTrack(videoTrack);
					}
					screenStreamRef.current = null;
					setIsScreenSharing(false);
				};

				setIsScreenSharing(true);
			} catch (err) {
				console.error("Screen share failed:", err);
			}
		}
	}, [isScreenSharing]);

	// Socket event listeners
	useEffect(() => {
		if (!socket) return;

		const handleIncomingCall = ({ from, offer, callerInfo, callType: type }) => {
			if (callState !== "idle") {
				socket.emit("rejectCall", { to: callerInfo._id });
				return;
			}

			setRemoteUser(callerInfo);
			setCallType(type);
			setCallState("ringing");

			const pc = new RTCPeerConnection(ICE_SERVERS);

			pc.onicecandidate = (event) => {
				if (event.candidate) {
					socket.emit("iceCandidate", {
						to: callerInfo._id,
						candidate: event.candidate,
					});
				}
			};

			pc.ontrack = (event) => {
				setRemoteStream(event.streams[0]);
			};

			pc.oniceconnectionstatechange = () => {
				if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
					cleanup();
				}
			};

			pc.setRemoteDescription(new RTCSessionDescription(offer));
			peerConnectionRef.current = pc;
		};

		const handleCallAnswered = async ({ answer }) => {
			const pc = peerConnectionRef.current;
			if (!pc) return;

			await pc.setRemoteDescription(new RTCSessionDescription(answer));

			// Process any pending ICE candidates
			for (const candidate of pendingCandidatesRef.current) {
				await pc.addIceCandidate(new RTCIceCandidate(candidate));
			}
			pendingCandidatesRef.current = [];

			setCallState("inCall");

			timerRef.current = setInterval(() => {
				setCallDuration((prev) => prev + 1);
			}, 1000);
		};

		const handleIceCandidate = async ({ candidate }) => {
			const pc = peerConnectionRef.current;
			if (!pc) return;

			if (pc.remoteDescription) {
				await pc.addIceCandidate(new RTCIceCandidate(candidate));
			} else {
				pendingCandidatesRef.current.push(candidate);
			}
		};

		const handleCallEnded = () => {
			cleanup();
		};

		const handleCallRejected = () => {
			cleanup();
		};

		socket.on("incomingCall", handleIncomingCall);
		socket.on("callAnswered", handleCallAnswered);
		socket.on("iceCandidate", handleIceCandidate);
		socket.on("callEnded", handleCallEnded);
		socket.on("callRejected", handleCallRejected);

		return () => {
			socket.off("incomingCall", handleIncomingCall);
			socket.off("callAnswered", handleCallAnswered);
			socket.off("iceCandidate", handleIceCandidate);
			socket.off("callEnded", handleCallEnded);
			socket.off("callRejected", handleCallRejected);
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [socket, callState, cleanup]);

	return (
		<CallContext.Provider
			value={{
				callState,
				callType,
				remoteUser,
				localStream,
				remoteStream,
				isMuted,
				isCameraOff,
				isScreenSharing,
				callDuration,
				startCall,
				answerCall,
				rejectCall,
				endCall,
				toggleMute,
				toggleCamera,
				toggleScreenShare,
			}}
		>
			{children}
		</CallContext.Provider>
	);
};
