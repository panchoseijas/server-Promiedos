import { Router, Request, Response } from "express";
import prisma from "../prisma/client";
import { Jersey } from "@prisma/client";

const router = Router();

// could be competition or team id
router.post("/:type/:id", async (req: Request, res: Response) => {
    const { type, id } = req.params; // type puede ser "team" o "competition"
    const { userId } = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: (() => {
                if (type === "team") {
                    return {
                        followedTeams: {
                            connect: { id: id },
                        },
                    };
                } else if (type === "competition") {
                    return {
                        followedCompetitions: {
                            connect: { id: id },
                        },
                    };
                } else {
                    throw new Error("Invalid type");
                }
            }),
        });
    
        res.json(updatedUser);
        } 
        catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
        }
});

router.get("/:teamId", async (req: Request, res: Response) => {
    const { teamId } = req.params

    try {
        const team = await prisma.team.findUnique({
            where: { id: teamId },
            include: { jerseys: true }
        })
        
        const formattedTeam = {
            primary_color: team?.jerseys?.baseColor,
        };
        
        res.json(formattedTeam)
        
    } 
    catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
})

export default router;
