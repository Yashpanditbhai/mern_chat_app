// Global error handler — catches unhandled errors from all routes
const errorHandler = (err, req, res, _next) => {
	console.error("Unhandled error:", err.stack || err.message);

	// Mongoose validation error
	if (err.name === "ValidationError") {
		const messages = Object.values(err.errors).map((e) => e.message);
		return res.status(400).json({ error: messages.join(", ") });
	}

	// Mongoose duplicate key
	if (err.code === 11000) {
		const field = Object.keys(err.keyValue)[0];
		return res.status(400).json({ error: `${field} already exists` });
	}

	// JWT errors
	if (err.name === "JsonWebTokenError") {
		return res.status(401).json({ error: "Invalid token" });
	}

	res.status(err.statusCode || 500).json({
		error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
	});
};

export default errorHandler;
