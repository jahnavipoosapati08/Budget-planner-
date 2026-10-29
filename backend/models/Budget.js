import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  month: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("Budget", schema);
