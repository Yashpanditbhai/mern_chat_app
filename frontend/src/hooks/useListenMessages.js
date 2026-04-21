// This hook is now a NO-OP.
// All real-time message handling has been moved to SocketContext
// which uses Zustand's getState() to avoid stale closures and
// handles messages globally (even when chat is not open).
//
// Kept for backward compatibility — can be removed if all
// imports are cleaned up.
const useListenMessages = () => {
	// Nothing to do — SocketContext handles everything
};

export default useListenMessages;
