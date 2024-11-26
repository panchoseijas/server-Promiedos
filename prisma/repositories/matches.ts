import prisma from "../client";

export async function getMatchesByDate(date: string, teamIds?: string[]) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  return await prisma.match.findMany({
    where: {
      start_time: {
        gte: startDate,
        lte: endDate,
      },
      ...(teamIds?.length && {
        OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
      }),
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
}
