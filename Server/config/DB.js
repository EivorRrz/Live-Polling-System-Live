//Database Connection!!
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

//logic!
const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Trying To Connect To Database ->>>>")
    } catch (err) {
        console.error("Something went wrong while connecting to the database!!", err);
        process.exit(1);
    }
};
export default connectDb;