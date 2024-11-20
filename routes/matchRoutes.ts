import { Router, Request, Response } from "express";
import prisma from "../prisma/client";
import { fetchData } from "../prisma/fillDB";
const router = Router();

router.get("/:matchId", async (req: Request, res: Response) => {
  const { matchId } = req.params;
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        stadium: true,
        competition: true,
      },
    });
    res.json(match);
  } catch (e: any) {
    console.error(e);
    res.json({ error: e.message });
  }
});

router.get("/:matchId/h2h", async (req: Request, res: Response) => {
  const { matchId } = req.params;
  try {
    const teamsIds = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        homeTeamId: true,
        awayTeamId: true,
      },
    });

    if (!teamsIds) {
      res.status(404).json({ error: "Match not found" });
      return;
    }

    const { homeTeamId, awayTeamId } = teamsIds;

    const teams = await prisma.team.findMany({
      where: {
        OR: [{ id: homeTeamId }, { id: awayTeamId }],
      },
      include: {
        jerseys: true,
      },
    });

    const [homeTeam, awayTeam] = teams.map(({ jerseys, ...team }) => ({
      ...team,
      primary_color: jerseys.filter((jersey) => jersey.type === "home")[0]
        .baseColor,
      secondary_color: jerseys.filter((jersey) => jersey.type === "away")[0]
        .baseColor,
      number_color: jerseys.filter((jersey) => jersey.type === "home")[0]
        .numberColor,
    }));

    const data = await fetchData(
      `/competitors/${homeTeamId}/versus/${awayTeamId}/summaries`,
      {}
    );
    const h2h = {
      homeTeam,
      awayTeam,
      lastMatches: data.last_meetings.map((match: any) => ({
        id: match.sport_event.id,
        competition: match.sport_event.sport_event_context.competition.name,
        start_time: match.sport_event.start_time,
        home_team: match.sport_event.competitors[0],
        away_team: match.sport_event.competitors[1],
        scoreHome: match.sport_event_status.period_scores[1].home_score,
        scoreAway: match.sport_event_status.period_scores[1].away_score,
      })),
    };

    res.json(h2h);
  } catch (e: any) {
    console.error(e);
    res.json({ error: e.message });
  }
});

router.get("/:matchId/info", async (req: Request, res: Response) => {
  const { matchId } = req.params;
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        competition: true,
        stadium: true,
      },
    });
    res.json(match);
  } catch (e: any) {
    console.error(e);
    res.json({ error: e.message });
  }
});

export default router;
