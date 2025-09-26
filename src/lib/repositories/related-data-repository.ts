// ============================================================================
// REPOSITORY: Related Data Database Operations
// ============================================================================
// Purpose: Handle related data database operations - database layer only
// Input: Mapped related data
// Output: Database operation results

import { pool } from "../database";
import type {
  MappedCertification,
  MappedEducation,
  MappedLanguage,
  MappedVerification,
  MappedWorkExperience,
} from "../types";

export interface RelatedDataRepositoryResult {
  success: boolean;
  error?: string;
  metadata: {
    educationInserted: number;
    workExperienceInserted: number;
    verificationInserted: number;
    languagesInserted: number;
    certificationsInserted: number;
    processedAt: string;
  };
}

export class RelatedDataRepository {
  async insertEducation(
    candidateId: string,
    educationData: MappedEducation[],
  ): Promise<number> {
    if (!educationData || educationData.length === 0) return 0;

    try {
      let insertedCount = 0;
      for (const edu of educationData) {
        // Skip records with empty required fields
        if (!edu.degreeTitle || !edu.institution || edu.startYear === 0) {
          continue;
        }

        // Check if record already exists
        const existingRecord = await pool.query(
          `SELECT id FROM candidates_education 
           WHERE candidate_id = $1 AND degree_title = $2 AND institution = $3 AND start_year = $4`,
          [candidateId, edu.degreeTitle, edu.institution, edu.startYear],
        );

        if (existingRecord.rows.length > 0) {
          // Update existing record
          await pool.query(
            `UPDATE candidates_education 
             SET end_year = $1, location = $2
             WHERE id = $3`,
            [
              edu.endYear || edu.startYear,
              edu.location,
              existingRecord.rows[0].id,
            ],
          );
          console.log(
            `🔄 [RELATED-DATA] Updated existing education record: ${edu.degreeTitle} at ${edu.institution}`,
          );
        } else {
          // Insert new record
          await pool.query(
            `INSERT INTO candidates_education (
              candidate_id, degree_title, start_year, end_year, institution, location
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              candidateId,
              edu.degreeTitle,
              edu.startYear,
              edu.endYear || edu.startYear, // Use start year if end year is 0
              edu.institution,
              edu.location,
            ],
          );
          console.log(
            `➕ [RELATED-DATA] Inserted new education record: ${edu.degreeTitle} at ${edu.institution}`,
          );
        }
        insertedCount++;
      }
      return insertedCount;
    } catch (error) {
      console.error("❌ [RELATED-DATA] Error inserting education:", error);
      return 0;
    }
  }

  async insertVerification(
    candidateId: string,
    verificationData: MappedVerification[],
  ): Promise<number> {
    if (!verificationData || verificationData.length === 0) return 0;

    try {
      let insertedCount = 0;
      for (const ver of verificationData) {
        // Skip records with empty required fields
        if (
          !ver.jobTitle ||
          !ver.companyName ||
          ver.startYear === undefined ||
          ver.startYear === null
        ) {
          continue;
        }

        // Check if record already exists
        const existingRecord = await pool.query(
          `SELECT id FROM candidates_verification 
           WHERE candidate_id = $1 AND job_title = $2 AND company_name = $3 AND start_year = $4`,
          [candidateId, ver.jobTitle, ver.companyName, ver.startYear],
        );

        if (existingRecord.rows.length > 0) {
          // Update existing record
          await pool.query(
            `UPDATE candidates_verification 
             SET end_year = $1, description = $2, "order" = $3
             WHERE id = $4`,
            [
              ver.endYear || ver.startYear,
              ver.description ? [ver.description] : [],
              ver.order,
              existingRecord.rows[0].id,
            ],
          );
          console.log(
            `🔄 [RELATED-DATA] Updated existing verification record: ${ver.jobTitle} at ${ver.companyName}`,
          );
        } else {
          // Insert new record
          await pool.query(
            `INSERT INTO candidates_verification (
              candidate_id, job_title, company_name, start_year, end_year, description, "order"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              candidateId,
              ver.jobTitle,
              ver.companyName,
              ver.startYear,
              ver.endYear || ver.startYear, // Use start year if end year is 0
              ver.description ? [ver.description] : [], // Convert to text array
              ver.order, // Use the actual order from the data
            ],
          );
          console.log(
            `➕ [RELATED-DATA] Inserted new verification record: ${ver.jobTitle} at ${ver.companyName}`,
          );
        }
        insertedCount++;
      }
      return insertedCount;
    } catch (error) {
      console.error("❌ [RELATED-DATA] Error inserting verification:", error);
      return 0;
    }
  }

  async insertLanguages(
    candidateId: string,
    languagesData: MappedLanguage[],
  ): Promise<number> {
    if (!languagesData || languagesData.length === 0) return 0;

    try {
      let insertedCount = 0;
      for (const lang of languagesData) {
        // Skip records with empty required fields
        if (!lang.language) {
          continue;
        }

        // Check if record already exists
        const existingRecord = await pool.query(
          `SELECT id FROM candidates_languages 
           WHERE candidate_id = $1 AND language = $2`,
          [candidateId, lang.language],
        );

        if (existingRecord.rows.length > 0) {
          // Update existing record
          await pool.query(
            `UPDATE candidates_languages 
             SET proficiency = $1
             WHERE id = $2`,
            [lang.proficiency, existingRecord.rows[0].id],
          );
          console.log(
            `🔄 [RELATED-DATA] Updated existing language record: ${lang.language}`,
          );
        } else {
          // Insert new record
          await pool.query(
            `INSERT INTO candidates_languages (
              candidate_id, language, proficiency
            ) VALUES ($1, $2, $3)`,
            [candidateId, lang.language, lang.proficiency],
          );
          console.log(
            `➕ [RELATED-DATA] Inserted new language record: ${lang.language}`,
          );
        }
        insertedCount++;
      }
      return insertedCount;
    } catch (error) {
      console.error("❌ [RELATED-DATA] Error inserting languages:", error);
      return 0;
    }
  }

  async insertCertifications(
    candidateId: string,
    certificationsData: MappedCertification[],
  ): Promise<number> {
    if (!certificationsData || certificationsData.length === 0) return 0;

    try {
      let insertedCount = 0;
      for (const cert of certificationsData) {
        // Skip records with empty required fields
        if (!cert.title || cert.startYear === 0) {
          continue;
        }

        // Check if record already exists
        const existingRecord = await pool.query(
          `SELECT id FROM candidates_certifications 
           WHERE candidate_id = $1 AND title = $2 AND start_year = $3`,
          [candidateId, cert.title, cert.startYear],
        );

        if (existingRecord.rows.length > 0) {
          // Update existing record
          await pool.query(
            `UPDATE candidates_certifications 
             SET end_year = $1
             WHERE id = $2`,
            [cert.endYear || cert.startYear, existingRecord.rows[0].id],
          );
          console.log(
            `🔄 [RELATED-DATA] Updated existing certification record: ${cert.title}`,
          );
        } else {
          // Insert new record
          await pool.query(
            `INSERT INTO candidates_certifications (
              candidate_id, title, start_year, end_year
            ) VALUES ($1, $2, $3, $4)`,
            [
              candidateId,
              cert.title,
              cert.startYear,
              cert.endYear || cert.startYear, // Use start year if end year is 0
            ],
          );
          console.log(
            `➕ [RELATED-DATA] Inserted new certification record: ${cert.title}`,
          );
        }
        insertedCount++;
      }
      return insertedCount;
    } catch (error) {
      console.error("❌ [RELATED-DATA] Error inserting certifications:", error);
      return 0;
    }
  }

  async insertWorkExperience(
    candidateId: string,
    workExperienceData: MappedWorkExperience[],
  ): Promise<number> {
    if (!workExperienceData || workExperienceData.length === 0) return 0;

    try {
      let insertedCount = 0;
      for (const exp of workExperienceData) {
        // Skip records with empty required fields
        if (!exp.jobTitle || !exp.companyName || exp.startYear === 0) {
          continue;
        }

        // Check if record already exists to prevent duplicates
        const existingRecord = await pool.query(
          `SELECT id FROM candidate_work_experience 
           WHERE candidate_id = $1 AND job_title = $2 AND company_name = $3 AND start_year = $4`,
          [candidateId, exp.jobTitle, exp.companyName, exp.startYear],
        );

        if (existingRecord.rows.length > 0) {
          // Update existing record
          await pool.query(
            `UPDATE candidate_work_experience 
             SET end_year = $1, description = $2, "order" = $3
             WHERE id = $4`,
            [
              exp.endYear || exp.startYear,
              exp.description,
              exp.order,
              existingRecord.rows[0].id,
            ],
          );
          console.log(
            `🔄 [RELATED-DATA] Updated existing work experience: ${exp.jobTitle} at ${exp.companyName}`,
          );
        } else {
          // Insert new record
          await pool.query(
            `INSERT INTO candidate_work_experience (
              candidate_id, job_title, company_name, start_year, end_year, description, "order"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              candidateId,
              exp.jobTitle,
              exp.companyName,
              exp.startYear,
              exp.endYear || exp.startYear,
              exp.description,
              exp.order,
            ],
          );
          console.log(
            `➕ [RELATED-DATA] Inserted new work experience: ${exp.jobTitle} at ${exp.companyName}`,
          );
        }
        insertedCount++;
      }
      return insertedCount;
    } catch (error) {
      console.error(
        "❌ [RELATED-DATA] Error inserting work experience:",
        error,
      );
      return 0;
    }
  }

  async processRelatedDataForDatabase(
    candidateId: string,
    candidateData: {
      education: MappedEducation[];
      workExperience: MappedWorkExperience[];
      verification: MappedVerification[];
      languages: MappedLanguage[];
      certifications: MappedCertification[];
    },
  ): Promise<RelatedDataRepositoryResult> {
    try {
      console.log(
        `🔄 [RELATED-DATA-REPO] Starting related data database operations for candidate: ${candidateId}`,
      );

      // Insert all related data
      const educationInserted = await this.insertEducation(
        candidateId,
        candidateData.education,
      );
      const workExperienceInserted = await this.insertWorkExperience(
        candidateId,
        candidateData.workExperience,
      );
      const verificationInserted = await this.insertVerification(
        candidateId,
        candidateData.verification,
      );
      const languagesInserted = await this.insertLanguages(
        candidateId,
        candidateData.languages,
      );
      const certificationsInserted = await this.insertCertifications(
        candidateId,
        candidateData.certifications,
      );

      console.log(
        `✅ [RELATED-DATA-REPO] Related data operations completed: ${educationInserted} education, ${workExperienceInserted} work experience, ${verificationInserted} verification, ${languagesInserted} languages, ${certificationsInserted} certifications`,
      );

      return {
        success: true,
        metadata: {
          educationInserted,
          workExperienceInserted,
          verificationInserted,
          languagesInserted,
          certificationsInserted,
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(
        `❌ [RELATED-DATA-REPO] Error in related data database operations:`,
        error,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          educationInserted: 0,
          workExperienceInserted: 0,
          verificationInserted: 0,
          languagesInserted: 0,
          certificationsInserted: 0,
          processedAt: new Date().toISOString(),
        },
      };
    }
  }
}
