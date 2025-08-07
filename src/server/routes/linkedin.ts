import { z } from "zod";
import { protectedProcedure, publicProcedure, createTRPCRouter } from "@/lib/trpc/init";
import { db } from "@/lib/db";
import { candidates } from "@/lib/db/schema";
import { nanoid } from "nanoid";

// LinkedIn URL validation
const linkedInUrlSchema = z.object({
	linkedinUrl: z.string().url().refine(
		(url) => url.includes("linkedin.com"),
		"URL must be a valid LinkedIn profile"
	),
	userId: z.string().optional(),
});

// LinkedIn data parsing
const linkedInDataSchema = z.object({
	linkedinData: z.string().min(10, "LinkedIn data must be at least 10 characters"),
	userId: z.string().optional(),
});

export const linkedInRouter = createTRPCRouter({
	// Parse LinkedIn URL (manual data input)
	parseUrl: publicProcedure
		.input(linkedInUrlSchema)
		.mutation(async ({ input }) => {
			try {
				// For now, we'll use manual data input
				// In the future, this could integrate with scraping services
				return {
					success: true,
					message: "LinkedIn URL received. Please provide profile data manually.",
					url: input.linkedinUrl,
				};
			} catch (error) {
				throw new Error(`Failed to parse LinkedIn URL: ${error}`);
			}
		}),

	// Parse LinkedIn data (manual input)
	parseData: publicProcedure
		.input(linkedInDataSchema)
		.mutation(async ({ input }) => {
			try {
				// Parse the LinkedIn data
				const parsedData = parseLinkedInData(input.linkedinData);
				
				// Save to database
				const candidateId = nanoid();
				const newCandidate = await db.insert(candidates).values({
					id: candidateId,
					name: parsedData.name,
					title: parsedData.title,
					company: parsedData.company,
					skills: parsedData.skills,
					// Add other fields as needed
					createdAt: new Date(),
					updatedAt: new Date(),
				});

				return {
					success: true,
					candidate: {
						id: candidateId,
						...parsedData,
					},
				};
			} catch (error) {
				throw new Error(`Failed to parse LinkedIn data: ${error}`);
			}
		}),

	// Get parsed candidates
	getCandidates: protectedProcedure
		.query(async () => {
			try {
				const allCandidates = await db.select().from(candidates);
				return {
					success: true,
					candidates: allCandidates,
				};
			} catch (error) {
				throw new Error(`Failed to fetch candidates: ${error}`);
			}
		}),
});

// LinkedIn data parsing function
function parseLinkedInData(data: string) {
	// Simple parsing logic - can be enhanced
	const lines = data.split('\n').map(line => line.trim()).filter(line => line);
	
	let name = '';
	let title = '';
	let company = '';
	let skills: string[] = [];
	
	// Basic parsing logic
	for (const line of lines) {
		if (!name && line.length > 0 && !line.includes(' at ') && !line.includes('@')) {
			name = line;
		} else if (!title && line.includes(' at ')) {
			const parts = line.split(' at ');
			title = parts[0];
			company = parts[1] || '';
		} else if (line.includes('Skills:') || line.includes('Expertise:')) {
			skills = line.replace(/Skills:|Expertise:/, '').split(',').map(s => s.trim());
		}
	}

	return {
		name: name || 'Unknown',
		title: title || 'Unknown',
		company: company || 'Unknown',
		skills: skills.length > 0 ? skills : ['Unknown'],
	};
}
