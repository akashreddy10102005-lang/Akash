const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// --- Middleware Setup ---
// Enable CORS so your frontend can talk to this backend
app.use(cors());

// Parse JSON bodies (as sent by your fetch API)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (Your HTML, CSS, Images) from the 'public' folder
app.use(express.static('public'));


// --- Data Storage Path ---
// We will store contact messages in a local JSON file
const DATA_DIR = path.join(__dirname, 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Helper function to get existing contacts
const getContacts = () => {
    try {
        if (fs.existsSync(CONTACTS_FILE)) {
            const data = fs.readFileSync(CONTACTS_FILE, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error("Error reading contacts file:", error);
        return [];
    }
};


// --- API Routes ---

// 1. Contact Form Endpoint
// This matches the fetch request in your HTML: 'http://localhost:3000/api/contact'
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;

    // Server-side Validation
    if (!name || !email || !message) {
        return res.status(400).json({ 
            success: false, 
            error: "All fields are required." 
        });
    }

    // Simple Email Format Check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ 
            success: false, 
            error: "Invalid email format." 
        });
    }

    // Create Message Object
    const newMessage = {
        id: Date.now(),
        name: name,
        email: email,
        message: message,
        submittedAt: new Date().toISOString(),
        ipAddress: req.ip // Log IP for security (optional)
    };

    // Read existing contacts, add new one, and save
    const contacts = getContacts();
    contacts.push(newMessage);

    fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2), (err) => {
        if (err) {
            console.error("Error saving message:", err);
            return res.status(500).json({ 
                success: false, 
                error: "Failed to save message to server." 
            });
        }

        console.log(`[SERVER] New message saved from: ${name} (${email})`);
        
        // Success Response sent back to your frontend
        res.status(200).json({ 
            success: true, 
            message: "Message sent successfully!" 
        });
    });
});


// 2. Get all messages (Optional - for you to view messages)
// Visit http://localhost:3000/api/messages in your browser to see them
app.get('/api/messages', (req, res) => {
    const contacts = getContacts();
    res.json(contacts);
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  Server is running on port ${PORT}`);
    console.log(`  Website: http://localhost:${PORT}`);
    console.log(`  Messages stored in: ${CONTACTS_FILE}`);
    console.log(`========================================\n`);
});