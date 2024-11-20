import dotenv from "dotenv";
import express, { Request, Response } from "express";
import prisma from "./prisma/client";
import cors from "cors";
import competitionRoutes from "./routes/competitionRoutes";
import authRoutes from "./routes/authRoutes";
import matchRoutes from "./routes/matchRoutes";
import teamRoutes from "./routes/teamsRoutes";
import followingRoutes from "./routes/followingRoutes";

dotenv.config();
const app = express();
const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "localhost";

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.urlencoded({ extended: true }));

app.use("/competition", competitionRoutes);
app.use("/auth", authRoutes);
app.use("/matches", matchRoutes);
app.use("/team", teamRoutes);
app.use("/following", followingRoutes)

app.get("/", (req: Request, res: Response) => {
  res.send("Promiedos!!!");
});

app.get("/matches", async (req: Request, res: Response) => {
  const { date } = req.query;

  try {
    const startDate = new Date(date as string);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date as string);
    endDate.setHours(23, 59, 59, 999);

    const matchesByCompetition = await prisma.match.findMany({
      where: {
        start_time: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        competition: true,
        homeTeam: {
          select: {
            name: true,
            logo: true,
          },
        },
        awayTeam: {
          select: {
            name: true,
            logo: true,
          },
        },
      },
      orderBy: {
        start_time: "asc",
      },
    });

    const groupedByCompetition = matchesByCompetition.reduce(
      (acc: any, match) => {
        const competitionId = match.competition.id;
        const index = acc.findIndex(
          (item: any) => item.competitionId === competitionId
        );
        if (index === -1) {
          acc.push({
            competitionId,
            competition: match.competition,
            matches: [match],
          });
        } else {
          acc[index].matches.push(match);
        }
        return acc;
      },
      []
    );
    console.log(groupedByCompetition);

    res.json(groupedByCompetition);
  } catch (e: any) {
    console.error(e);
    res.json({ error: e.message });
  }
});

app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
