import express from "express";
import Goal from "../models/Goal.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Get all goals for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const data = await Goal.find({
      user: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch goals",
    });
  }
});

// Add new goal
router.post("/", auth, async (req, res) => {
  try {
    const {
      title,
      target,
      saved,
      deadline,
    } = req.body;

    if (!title || target === undefined) {
      return res.status(400).json({
        message: "Goal title and target amount are required",
      });
    }

    const item = await Goal.create({
      user: req.user.id,
      title,
      target,
      saved: saved || 0,
      deadline,
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// Update goal
router.put("/:id", auth, async (req, res) => {
  try {
    const {
      title,
      target,
      saved,
      deadline,
    } = req.body;

    const updatedGoal =
      await Goal.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.id,
        },
        {
          title,
          target,
          saved,
          deadline,
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedGoal) {
      return res.status(404).json({
        message: "Goal not found",
      });
    }

    res.json(updatedGoal);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

// Delete goal
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedGoal =
      await Goal.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id,
      });

    if (!deletedGoal) {
      return res.status(404).json({
        message: "Goal not found",
      });
    }

    res.json({
      message: "Goal deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete goal",
    });
  }
});

export default router;