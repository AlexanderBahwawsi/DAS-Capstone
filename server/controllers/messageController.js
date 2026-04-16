const messageModel = require('../models/Message');
const Submission = require('../models/Submission');
const User = require('../models/User');

// send a message
exports.send = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { body } = req.body;

        // look up submission
        const submission = await Submission.findBySubmissionId(submissionId);
        if (!submission) {
            return res.status(404).json({ error: "Submission not found" });
        }

        // check if body text isn't empty
        if (!body || !body.trim()) {
            return res.status(400).json({ error: "Message body cannot be empty" });
        }

        // create message
        const message = await messageModel.create({
            submission_id: submissionId,
            sender_id: req.user.id,
            body: body.trim()
        });

        // Emit Socket.IO
        const sender = await User.findById(req.user.id);
        const enriched = {
            ...message,
            first_name: sender ? sender.first_name : null,
            last_name: sender ? sender.last_name : null,
            role: sender ? sender.role : null
        };
        const io = req.app.get('io');
        if (io) {
            io.to(String(submission.id)).emit('new_message', enriched);
        }

        res.status(201).json(enriched);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

// return all messages for a submission
exports.getForSubmission = async (req, res) => {
    try {
        const messages = await messageModel.findBySubmission(req.params.submissionId);
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

// return the user's message threads
exports.getMyThreads = async (req, res) => {
    try {
        const threads = await messageModel.getThreadsForUser(req.user.id);
        res.json(threads);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
};