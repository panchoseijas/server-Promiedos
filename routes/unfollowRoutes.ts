import { Router, Request, Response } from "express";
import prisma from "../prisma/client";

const router = Router();

router.post(
  "/competition/:competitionId",
  async (req: Request, res: Response) => {
    const { competitionId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    try {
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          followedCompetitions: {
            disconnect: { id: competitionId },
          },
        },
        include: {
          followedTeams: {
            select: { id: true },
          },
          followedCompetitions: { select: { id: true } },
        },
      });

      const { password, ...userWithoutPassword } = updatedUser;

      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

router.post("/team/:teamId", async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { userId } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        followedTeams: {
          disconnect: { id: teamId },
        },
      },
      include: {
        followedTeams: {
          select: { id: true },
        },
        followedCompetitions: { select: { id: true } },
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
