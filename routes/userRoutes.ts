import { Router, Request, Response } from "express";
import prisma from "../prisma/client";
import { fetchData } from "../prisma/fillDB";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const router = Router();

router.put("/update", async (req: Request, res: Response) => {
  const {
    id: userId,
    email,
    username,
    followedTeams,
    followedCompetitions,
  } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        email,
        username,
        followedTeams: {
          set: followedTeams.map(({ id }: { id: string }) => ({
            id: id,
          })),
        },
        followedCompetitions: {
          set: followedCompetitions.map(({ id }: { id: string }) => ({
            id: id,
          })),
        },
      },
      include: {
        followedTeams: {
          select: { id: true },
        },
        followedCompetitions: {
          select: { id: true },
        },
      },
    });

    const { password, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.put("/update/profile", async (req: Request, res: Response) => {
  const { id: userId, email, username, password } = req.body;
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
        username,
      },
      include: {
        followedTeams: {
          select: { id: true },
        },
        followedCompetitions: {
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
