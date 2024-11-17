import { Router, Request, Response } from "express";
import prisma from "../prisma/client";
const router = Router();

router.get("/:competitionId", async (req: Request, res: Response) => {
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

export default router;
