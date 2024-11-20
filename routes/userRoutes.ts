import { Router, Request, Response } from "express";
import prisma from "../prisma/client";
import { fetchData } from "../prisma/fillDB";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = Router();

router.put("/follow/team/:teamId", async (req: Request, res: Response) => {
  const { teamId } = req.params;
  const { userId } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        followedTeams: {
          connect: { id: teamId },
        },
      },
      include: {
        followedTeams: {
          select: { id: true },
        },
        folllowedCompetitions: { select: { id: true } },
      },
    });
    const { password, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.post(
  "/follow/competition/:competitionId",
  async (req: Request, res: Response) => {
    const { competitionId } = req.params;
    const { userId } = req.body;
    try {
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          folllowedCompetitions: {
            connect: { id: competitionId },
          },
        },
        include: {
          followedTeams: {
            select: { id: true },
          },
          folllowedCompetitions: { select: { id: true } },
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

router.post(
  "/unfollow/competition/:competitionId",
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
          folllowedCompetitions: {
            disconnect: { id: competitionId },
          },
        },
        include: {
          followedTeams: {
            select: { id: true },
          },
          folllowedCompetitions: { select: { id: true } },
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

router.post("/unfollow/team/:teamId", async (req: Request, res: Response) => {
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
        folllowedCompetitions: { select: { id: true } },
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/update", async (req: Request, res: Response) => {
  const {
    id: userId,
    email,
    name,
    followedTeams,
    folllowedCompetitions,
  } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        email,
        name,
        followedTeams: {
          set: followedTeams.map(({ id }: { id: string }) => ({
            id: id,
          })), // Replace existing relations
        },
        folllowedCompetitions: {
          set: folllowedCompetitions.map(({ id }: { id: string }) => ({
            id: id,
          })),
        },
      },
      include: {
        followedTeams: {
          select: { id: true },
        },
        folllowedCompetitions: {
          select: { id: true },
        },
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;

    const token = jwt.sign(userWithoutPassword, process.env.JWT_SECRET!, {
      expiresIn: "2w",
    });

    // res.json({ token });
    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/update/profile", async (req: Request, res: Response) => {
  const { id: userId, email, name, password } = req.body;
  console.log(req.body);
  try {
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      await prisma.user.update({
        where: { id: parseInt(userId) },
        data: {
          password: hashedPassword,
        },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        email,
        name,
      },
      include: {
        followedTeams: {
          select: { id: true },
        },
        folllowedCompetitions: {
          select: { id: true },
        },
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
