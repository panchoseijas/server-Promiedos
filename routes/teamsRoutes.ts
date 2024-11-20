import { Router, Request, Response } from "express";
import prisma from "../prisma/client";
import { fetchData } from "../prisma/fillDB";
const router = Router();

// router.get("/:teamId", async (req: Request, res: Response) => {
//   const { teamId } = req.params;
//   try {
//     const team = await prisma.team.findUnique({
//       where: { id: teamId },
//       include: {
//         jerseys: true,
//         players: true,
//         competition: true,
//       },
//     });
//     res.json(team);
//   } catch (e: any) {
//     console.error(e);
//     res.json({ error: e.message });
//   }
// });

router.get("/:teamId/form", async (req: Request, res: Response) => {
  const { teamId } = req.params;
  try {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: "closed",
      },
      include: {
        homeTeam: {
          select: { logo: true, name: true },
        },
        awayTeam: { select: { logo: true, name: true } },
      },
      orderBy: {
        start_time: "desc",
      },
      take: 5,
    });
    res.json(matches);
  } catch (e: any) {
    console.error(e);
    res.json({ error: e.message });
  }
});

export default router;
