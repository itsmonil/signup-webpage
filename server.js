const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;
const usersFile = path.join(__dirname, 'users.json');

// Middleware to handle JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Get a user by their ID
app.get('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id, 10);

    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Data file not readable' });
        }

        const users = data ? JSON.parse(data) : [];
        const user = users.find((u) => u.id === userId);

        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });
});

// Handle form submissions
app.post('/post', (req, res) => {
    const { name, email, password } = req.body;

    // Check if any field is empty
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields are mandatory' });
    }

    // Check if name contains only letters and spaces
    const namePattern = /^[A-Za-z\s]+$/;
    if (!namePattern.test(name)) {
        return res.status(400).json({ message: 'Name must contain only letters' });
    }

    // Check if password is at least 8 characters
    if (password.length < 8) {
        return res.status(400).json({
            message: 'Password must be at least 8 characters long'
        });
    }

    // Read existing users from the file
    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Could not read data file' });
        }

        // Parse the file data or start with an empty array if no data
        let users = [];
        if (data) {
            users = JSON.parse(data);
        }

        // Check if the user with the same email already exists
        const userExists = users.some((user) => user.email === email);
        if (userExists) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Assign a new ID to the user
        const nextId = users.length > 0 ? users[users.length - 1].id + 1 : 1;
        const newUser = { id: nextId, name, email, password };

        // Add the new user to the users array
        users.push(newUser);

        // Save the updated users list back to the file
        fs.writeFile(usersFile, JSON.stringify(users, null, 2), (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error saving data. Please try again.' });
            }
            res.status(201).json({ message: 'Registered successfully' });
        });
    });
});

// Get all users (for testing)
app.get('/users', (req, res) => {
    fs.readFile(usersFile, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ message: 'Data file not readable' });
        }
        const users = data ? JSON.parse(data) : [];
        res.status(200).json(users);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
