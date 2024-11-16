import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { hostname } from "os";

dotenv.config();
const app = express();
const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "localhost";

const prisma = new PrismaClient();

// Define a basic route
app.get("/", (req: Request, res: Response) => {
  res.send("Promiedos!!!");
});

app.get("/standings", async (req: Request, res: Response) => {
  const standings = await prisma.standings.findMany();
  res.json(standings);
});

app.get("/competition/:competitionId", async (req: Request, res: Response) => {
  const { competitionId } = req.params;
  try {
    const standings = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: { standings: true },
    });
    res.json(standings);
  } catch (e: any) {
    console.error(e);
    res.json({ error: e.message });
  }
});

app.listen(port, host, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
