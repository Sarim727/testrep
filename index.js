const express = require("express")
const fs = require("fs")
const path = require("path")
const app = express()

const usersFile = "./users.json"

// Middleware
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

const readUsers = async () => {
  try {
    const data = await fs.promises.readFile(usersFile, "utf-8")
    return JSON.parse(data)
  } catch (err) {
    console.error("Error reading users file:", err)
    return []
  }
}

const writeUsers = async (data) => {
  try {
    await fs.promises.writeFile(usersFile, JSON.stringify(data, null, 2))
    return true
  } catch (err) {
    console.error("Error writing users file:", err)
    return false
  }
}

// HTML Routes
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "register.html"))
})

app.get("/users", async (req, res) => {
  const users = await readUsers()
  const html = `
    <h1>Registered Users</h1>
    <ul>
    ${users.map((user) => `<li>${user.fullName} - ${user.email}</li>`).join("")}
    </ul>
    <a href="/register">Register New User</a>  <!-- Changed from /signup -->
    `
  res.send(html)
})

// API Routes
app.get("/api/users", async (req, res) => {
  const users = await readUsers()
  res.json(users)
  
})

app
  .route("/api/users/:id")
  .get(async (req, res) => {
    const id = Number(req.params.id)
    const users = await readUsers()
    const user = users.find((user) => user.id === id)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    return res.json(user)
  })

  .patch(async (req, res) => {
    const id = Number(req.params.id)
    const users = await readUsers()
    const index = users.findIndex((user) => user.id === id)

    const updatedUser = { ...users[index], ...req.body }
    users[index] = updatedUser

    const success = await writeUsers(users)
    if (!success) {
      return res.status(500).json({ error: "Failed to update user" })
    }

    return res.json({ status: "Updated", user: updatedUser })
  })

  .delete(async (req, res) => {
    const id = Number(req.params.id)
    const users = await readUsers()
    const index = users.findIndex((user) => user.id === id)

    if (index === -1) {
      return res.status(404).json({ error: "User not found" })
    }

    users.splice(index, 1)

    const success = await writeUsers(users)
    if (!success) {
      return res.status(500).json({ error: "Failed to delete user" })
    }

    return res.json({ status: "Deleted", id })
  })

// POST - Create new user
app.post("/api/users", async (req, res) => {
  const users = await readUsers()
  const newUser = {
    id: users.length + 1,
    ...req.body,
  }

  users.push(newUser)

  const success = await writeUsers(users)
  if (!success) {
    return res.status(500).json({ error: "Failed to create user" })
  }

  return res.json({ status: "Success", user: newUser })
})

// Form submission handler
app.post("/submit-registration", async (req, res) => {
  const { fullName, email, phone, password, confirmPassword } = req.body

  if (password !== confirmPassword) {
    return res.send("Passwords do not match. Please try again.")
  }

  const users = await readUsers()
  const newUser = {
    id: users.length + 1,
    fullName,
    email,
    phone,
    password,
  }

  users.push(newUser)
  await writeUsers(users)

  res.redirect("/users")
})

app.listen(8000, () => console.log("Server Started!"))