const Submission = require('../models/Submission');

exports.create = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { title, genre, word_count, bio, notes } = req.body;

    if (!title || !genre || !bio) {
      return res.status(400).json({
        error: "Title, genre, and bio are required"
      });
    }

    const submission_id = await Submission.nextSubmissionID();

    const submission = await Submission.create({
      submission_id,
      user_id,
      title,
      genre,
      word_count,
      bio,
      notes
    });

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await Submission.addFile(
          submission.id,
          file.filename,
          file.originalname,
          file.mimetype,
          file.size
        );
      }
    }

    res.status(201).json({
      message: "Submission created successfully",
      submission
    });

  } catch (error) {
    console.error("Create Submission Error:", error);
    res.status(500).json({
      error: "Failed to create submission"
    });
  }
};

exports.getMine = async (req, res) => {
  try {
    const submissions = await Submission.findByUserId(req.user.id);
    res.json(submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch submissions"
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { status, genre } = req.query;

    const submissions = await Submission.findAll({ status, genre });
    res.json(submissions);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch submissions"
    });
  }
};

exports.getOne = async (req, res) => {
  try {
    const submission = await Submission.findBySubmissionId(req.params.id);

    if (!submission) {
      return res.status(404).json({
        error: "Submission not found"
      });
    }

    res.json(submission);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to fetch submission"
    });
  }
};

exports.getFiles = async (req, res) => {
  try {
    const files = await Submission.getFiles(req.params.id);
    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to retrieve files"
    });
  }
};

// validate and update status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "in_review",
      "accepted",
      "rejected"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status value"
      });
    }

    const updated = await Submission.updateStatus(req.params.id, status);

    if (!updated) {
      return res.status(404).json({
        error: "Submission not found"
      });
    }

    res.json(updated);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to update status"
    });
  }
};