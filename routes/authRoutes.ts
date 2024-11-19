import { Router, Request, Response } from "express";
import prisma from "../prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  try {
    const userExists = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { name: username }],
      },
    });
    if (userExists) {
      res
        .status(409)
        .json({ message: "User already exists", field: "username" });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: username,
        password: bcrypt.hashSync(password, 10),
      },
    });
    res.json(user);
  } catch (e: any) {
    console.error(e);
    res.json({ error: e.message });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findFirst({
      where: {
        email,
      },
      include: {
        followedTeams: {
          select: { id: true },
        },
        folllowedCompetitions: { select: { id: true } },
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ message: "Invalid password" });
      return;
    }

    const { password: _, ...userWithoutPassword } = user;

    const token = jwt.sign(userWithoutPassword, process.env.JWT_SECRET!, {
      expiresIn: "2w",
    });

    res.json({ token });
  } catch (e: any) {
    console.error(e);
    res.json({ error: e.message });
  }
});

export default router;
