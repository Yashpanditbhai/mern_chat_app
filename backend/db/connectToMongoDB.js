import mongoose from "mongoose";

const connectToMongoDB = async () => {
	const uri = process.env.MONGO_DB_URI;
	if (!uri) {
		throw new Error("MONGO_DB_URI environment variable is not set");
	}

	await mongoose.connect(uri);
	console.log("Connected to MongoDB");
};

export default connectToMongoDB;
