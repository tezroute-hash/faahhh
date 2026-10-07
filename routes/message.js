const express = require("express");

const router = express.Router();

const Message = require("../models/message");
const User = require("../models/user");

const {
    restrictToLoggedinUserOnly
} = require("../middlewares/auth");


// =========================
// MESSAGES INBOX
// =========================

router.get(
    "/",
    restrictToLoggedinUserOnly,
    async (req, res) => {

        try {

            const currentUserId = req.user._id;


            // Get all messages involving current user
            const messages = await Message.find({
                $or: [
                    { sender: currentUserId },
                    { receiver: currentUserId }
                ]
            })
                .populate("sender")
                .populate("receiver")
                .sort({ createdAt: -1 });


            // Store latest message for each person
            const conversations = new Map();


            for (const message of messages) {

                let otherUser;


                // I sent the message
                if (
                    message.sender._id.toString() ===
                    currentUserId.toString()
                ) {

                    otherUser = message.receiver;

                }


                // I received the message
                else {

                    otherUser = message.sender;

                }


                // Make sure user exists
                if (!otherUser) {
                    continue;
                }


                // Only keep latest message
                if (
                    !conversations.has(
                        otherUser._id.toString()
                    )
                ) {

                    conversations.set(
                        otherUser._id.toString(),
                        {
                            user: otherUser,
                            lastMessage: message
                        }
                    );

                }

            }


            const conversationList =
                Array.from(conversations.values());


            // IMPORTANT:
            // No chat is selected on /messages
            res.render("messages", {

                conversations: conversationList,

                receiver: null,

                messages: [],

                currentUser: req.user

            });


        } catch (error) {

            console.log(error);

            res.status(500).render("error", {
                error: "Something went wrong",
                currentUser: req.user
            });

        }

    }
);



// =========================
// OPEN CHAT
// =========================

router.get(
    "/:id",
    restrictToLoggedinUserOnly,
    async (req, res) => {

        try {

            const currentUserId = req.user._id;
            const receiverId = req.params.id;


            // Find receiver
            const receiver =
                await User.findById(receiverId);


            if (!receiver) {

                return res
                    .status(404)
                    .render("error", { error: "User not found", currentUser: req.user });

            }


            // Get messages between current user
            // and receiver
            const messages =
                await Message.find({

                    $or: [

                        {
                            sender: currentUserId,
                            receiver: receiverId
                        },

                        {
                            sender: receiverId,
                            receiver: currentUserId
                        }

                    ]

                })
                    .populate("sender")
                    .populate("receiver")
                    .sort({ createdAt: 1 });


            // ==================================
            // GET ALL CONVERSATIONS FOR SIDEBAR
            // ==================================

            const allMessages =
                await Message.find({

                    $or: [
                        { sender: currentUserId },
                        { receiver: currentUserId }
                    ]

                })
                    .populate("sender")
                    .populate("receiver")
                    .sort({ createdAt: -1 });


            const conversations = new Map();


            for (const message of allMessages) {

                let otherUser;


                if (
                    message.sender._id.toString() ===
                    currentUserId.toString()
                ) {

                    otherUser = message.receiver;

                } else {

                    otherUser = message.sender;

                }


                if (!otherUser) {
                    continue;
                }


                // Keep only latest message
                if (
                    !conversations.has(
                        otherUser._id.toString()
                    )
                ) {

                    conversations.set(
                        otherUser._id.toString(),
                        {
                            user: otherUser,
                            lastMessage: message
                        }
                    );

                }

            }


            const conversationList =
                Array.from(conversations.values());


            // Render SAME messages.ejs
            res.render("messages", {

                conversations: conversationList,

                receiver: receiver,

                messages: messages,

                currentUser: req.user

            });


        } catch (error) {

            console.log(error);

            res.status(500).render("error", {
                error: "Something went wrong",
                currentUser: req.user
            });

        }

    }
);



// =========================
// SEND MESSAGE
// =========================

router.post(
    "/:id",
    restrictToLoggedinUserOnly,
    async (req, res) => {

        try {

            const receiverId = req.params.id;

            const text = req.body.text;


            // Empty message check
            if (!text || !text.trim()) {

                return res.redirect(
                    `/messages/${receiverId}`
                );

            }


            // Find receiver
            const receiver =
                await User.findById(receiverId);


            if (!receiver) {

                return res
                    .status(404)
                    .render("error", { error: "User not found", currentUser: req.user });

            }


            // Prevent messaging yourself
            if (
                req.user._id.toString() ===
                receiver._id.toString()
            ) {

                return res.redirect(
                    `/messages/${receiver._id}`
                );

            }


            // Create message
            await Message.create({

                sender: req.user._id,

                receiver: receiver._id,

                text: text.trim()

            });


            // Open conversation after sending
            res.redirect(
                `/messages/${receiver._id}`
            );


        } catch (error) {

            console.log(error);

            res.status(500).render("error", {
                error: "Something went wrong",
                currentUser: req.user
            });

        }

    }
);

// =========================
// DELETE ENTIRE CHAT
// =========================
router.post(
    "/delete/:userId",
    restrictToLoggedinUserOnly,
    async (req, res) => {
        try {
            const currentUserId = req.user._id;
            const otherUserId = req.params.userId;
        
            await Message.deleteMany({
                $or: [
                    {
                        sender: currentUserId,
                        receiver: otherUserId
                    },
                    {
                        sender: otherUserId,
                        receiver: currentUserId
                    }
                    ]
                });
            
                return res.redirect("/messages");
            
            } catch (error) {
            console.error("Delete chat error:", error);
            return res.status(500).send("Failed to delete chat");
        }
    }
);


module.exports = router;