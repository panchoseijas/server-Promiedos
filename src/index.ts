import express, { Request, Response } from "express"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"

dotenv.config()
const app = express()
const port = process.env.PORT || 3000

const prisma = new PrismaClient()

// Define a basic route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express!")
})

app.get("/standings", async (req: Request, res: Response) => {
  const standings = await prisma.standings.findMany()
  res.json(standings)
  
})

// app.get("/1", async (req: Request, res: Response) => {
//   try {
//     const user = await prisma.user.create({
//       data: {
//         email: "a@example.com", // Use a valid email format
//         name: "a",
//       },
//     })
//     res.json(user)
//   } catch (error) {
//     console.error("Error creating user:", error)
//     res.status(500).json({ error: "Failed to create user" })
//   }
// })
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})
