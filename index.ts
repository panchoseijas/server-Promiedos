import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import prisma from "./prisma/client";
import cors from "cors";
import competitionRoutes from "./routes/competitionRoutes";
import authRoutes from "./routes/authRoutes";
import matchRoutes from "./routes/matchRoutes";
import teamRoutes from "./routes/teamsRoutes";
import followingRoutes from "./routes/followingRoutes";
import userRoutes from "./routes/userRoutes";

import { getMatchesByDate } from "./prisma/repositories/matches";
import authMiddleware from "./middleware/authMiddleware";

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

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/auth/register" || req.path === "/auth/login") {
    next();
    return;
  }
  return authMiddleware(req, res, next);
});

app.use("/competition", competitionRoutes);
app.use("/auth", authRoutes);
app.use("/matches", matchRoutes);
app.use("/team", teamRoutes);
app.use("/user", userRoutes);
app.use("/follow", followingRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Promiedos!!!");
});

app.get("/matches", async (req: Request, res: Response) => {
  const { date } = req.query;

  try {
    const matches = await getMatchesByDate(date as string);

    const formattedMatchDetails = matches.map((match) => {
      return {
        id: match.id,
        start_time: match.start_time,
        scoreHome: match.scoreHome,
        scoreAway: match.scoreAway,
        status: match.status,
        competition: {
          id: match.competition.id,
          name: match.competition.name,
          country: match.competition.country,
          logo: match.competition.logo,
        },
        homeTeam: {
          id: match.homeTeamId,
          name: match.homeTeam.name,
          logo: match.homeTeam.logo,
        },
        awayTeam: {
          id: match.awayTeamId,
          name: match.awayTeam.name,
          logo: match.awayTeam.logo,
        },
      };
    });

    const groupedByCompetition = formattedMatchDetails.reduce(
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

    res.json(groupedByCompetition);
  } catch (e: any) {
    console.error(e);
    res.json({ error: e.message });
  }
});

app.get("/teams/:teamIdsArray", async (req: Request, res: Response) => {
  const { teamIdsArray } = req.params;

  try {
    const teams = await prisma.team.findMany({
      where: {
        id: {
          in: JSON.parse(teamIdsArray),
        },
      },
      include: {
        jerseys: true,
      },
    });

    const response = teams.map((team) => {
      const { jerseys, ...teamInfo } = team;
      return {
        ...teamInfo,
        primary_color: jerseys.filter((jersey) => jersey.type === "home")[0]
          .baseColor,
        secondary_color: jerseys.filter((jersey) => jersey.type === "away")[0]
          .baseColor,
        number_color: jerseys.filter((jersey) => jersey.type === "home")[0]
          .numberColor,
      };
    });

    res.json(response);
  } catch (e: any) {
    console.error(e);
    res.json({ error: e.message });
  }
});

app.get(
  "/competitions/:competitionsIdsArray",
  async (req: Request, res: Response) => {
    const { competitionsIdsArray } = req.params;
    try {
      const competitions = await prisma.competition.findMany({
        where: {
          id: {
            in: JSON.parse(competitionsIdsArray),
          },
        },
      });

      res.json(competitions);
    } catch (e: any) {
      console.error(e);
      res.json({ error: e.message });
    }
  }
);

app.get("/search", async (req: Request, res: Response) => {
  const { filters, query } = req.query;
  // if (!query) {
  //   res.json({ error: "Query is required" });
  //   return;
  // }
  const queryArray = query as string;
  const filterArray = filters ? (filters as string).split(",") : [];

  try {
    if (filterArray.includes("teams")) {
      const teams = await prisma.team.findMany({
        where: {
          name: {
            contains: query as string,
          },
        },
      });
      const teamsResponse = teams.map((team) => {
        return {
          id: team.id,
          name: team.name,
          logo: team.logo,
          country: team.country,
        };
      });
      res.json({ teams: teamsResponse, competitions: [] });
      return;
    }

    if (filterArray.includes("competitions")) {
      const competitions = await prisma.competition.findMany({
        where: {
          name: {
            contains: query as string,
          },
        },
      });
      res.json({ teams: [], competitions });
      return;
    }

    const teams = await prisma.team.findMany({
      where: {
        name: {
          contains: query as string,
        },
      },
    });

    const competitions = await prisma.competition.findMany({
      where: {
        name: {
          contains: query as string,
        },
      },
    });

    const teamsResponse = teams.map((team) => {
      return {
        id: team.id,
        name: team.name,
        logo: team.logo,
        country: team.country,
      };
    });

    res.json({ teams: teamsResponse, competitions });
  } catch (e: any) {
    console.error(e);
    res.json({ error: e.message });
  }
});

app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
