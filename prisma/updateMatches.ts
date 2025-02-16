import prisma from "./client";
import { Prisma, Match } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.SPORTSRADAR_API_KEY;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchData = async (endpoint: String, params: any) => {
  const options = {
    method: "GET",
    headers: { accept: "application/json" },
  };
  try {
    const response = await fetch(
      `https://api.sportradar.com/soccer/trial/v4/en${endpoint}.json?api_key=${API_KEY}`,
      options
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error(err);
  }
};

const fetchWithRetry = async (
  url: string,
  options: any,
  retries = 3,
  baseDelay = 5000
) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to fetch ${url} (attempt ${i + 1}/${retries})`);
      const response = await fetchData(url, options);
      if (!response?.schedules) {
        console.error("Invalid response format:", response);
        throw new Error("Invalid API response format");
      }
      return response;
    } catch (error: any) {
      console.error(`Fetch error (attempt ${i + 1}):`, error);
      if (error.status === 429 && i < retries - 1) {
        const waitTime = baseDelay * Math.pow(2, i);
        console.log(
          `Rate limited. Waiting ${waitTime / 1000} seconds before retry ${
            i + 1
          }`
        );
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
};

const isMatchIncomplete = (match: any) => {
  return (
    match.sport_event_status.status !== "closed" ||
    match.sport_event_status.home_score === null ||
    match.sport_event_status.away_score === null
  );
};

const updateMatches = async () => {
  try {
    const seasons = await prisma.competition.findMany({
      select: { id: true },
    });
    console.log(`Found ${seasons.length} seasons to process`);

    const matches: Match[][] = [];
    for (const { id } of seasons) {
      console.log(`\n--- Processing season ${id} ---`);
      await delay(3000);

      console.log(`Fetching schedules for season ${id}...`);
      const response = await fetchWithRetry(`/seasons/${id}/schedules`, {});
      if (!response?.schedules) {
        console.error(`No schedules found for season ${id}`);
        continue;
      }

      // Filter incomplete matches
      const incompleteMatches = response.schedules.filter(isMatchIncomplete);
      console.log(
        `Found ${incompleteMatches.length} incomplete matches out of ${response.schedules.length} total matches for season ${id}`
      );

      const matchPromises: Promise<Match>[] = [];
      for (const match of incompleteMatches) {
        await delay(2000);
        console.log(`Processing incomplete match ${match.sport_event.id}`);

        try {
          const matchData = {
            id: match.sport_event.id,
            competitionId: match.sport_event.sport_event_context.season.id,
            homeTeamId: match.sport_event.competitors[0].id,
            awayTeamId: match.sport_event.competitors[1].id,
            start_time: match.sport_event.start_time,
            round: match.sport_event.sport_event_context.round.number,
            scoreHome: match.sport_event_status.home_score,
            scoreAway: match.sport_event_status.away_score,
            status: match.sport_event_status.status,
            venue: match.sport_event.venue,
          };

          const existingMatch = await prisma.match.findUnique({
            where: { id: matchData.id },
          });

          if (existingMatch?.status === "closed") {
            console.log(`Match ${matchData.id} is already completed, skipping`);
            continue;
          }

          console.log(
            `Updating match ${matchData.id} (${
              existingMatch ? "existing" : "new"
            })`
          );

          const matchPromise = existingMatch
            ? prisma.match.update({
                where: { id: matchData.id },
                data: {
                  scoreHome: matchData.scoreHome,
                  scoreAway: matchData.scoreAway,
                  status: matchData.status,
                },
              })
            : prisma.match.create({
                data: {
                  id: matchData.id,
                  start_time: matchData.start_time,
                  round: matchData.round,
                  scoreHome: matchData.scoreHome,
                  scoreAway: matchData.scoreAway,
                  status: matchData.status,
                  homeTeam: { connect: { id: matchData.homeTeamId } },
                  awayTeam: { connect: { id: matchData.awayTeamId } },
                  stadium: {
                    connect: {
                      id: matchData.venue
                        ? matchData.venue.id
                        : "sr:venue:1009",
                    },
                  },
                  competition: { connect: { id: matchData.competitionId } },
                },
              });

          matchPromises.push(matchPromise);
        } catch (error) {
          console.error(
            `Error processing match ${match.sport_event?.id}:`,
            error
          );
          continue; // Skip this match but continue with others
        }
      }

      console.log(
        `Processing ${matchPromises.length} matches for season ${id}...`
      );
      const seasonMatches = await Promise.all(matchPromises);
      console.log(`Completed processing season ${id}`);
      matches.push(seasonMatches);
    }

    console.log("\n=== Final Summary ===");
    console.log(`Total seasons processed: ${matches.length}`);
    console.log(`Total incomplete matches updated: ${matches.flat().length}`);
  } catch (error) {
    console.error("Fatal error in updateMatches:", error);
    throw error;
  }
};

// Add error handling for the main execution
updateMatches().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
