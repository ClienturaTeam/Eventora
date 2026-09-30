import { JudgeRepository } from "../repositories/judges.repository";

export class JudgeService {
  static async getJudges(tenantId: string) {
    return JudgeRepository.getEvaluationStats(tenantId);
  }

  static async getJudge(tenantId: string, id: string) {
    const judge = await JudgeRepository.findById(tenantId, id);
    if (!judge) throw { status: 404, code: "NOT_FOUND", message: "Judge not found." };
    return judge;
  }

  static async getJudgeByUserId(tenantId: string, userId: string) {
    const judge = await JudgeRepository.findByUserId(tenantId, userId);
    if (!judge) throw { status: 404, code: "NOT_FOUND", message: "Judge not found for this user." };
    
    // Also include competitions in the return
    const judgeWithCompetitions = await JudgeRepository.findById(tenantId, judge.id);
    return judgeWithCompetitions;
  }

  static async createJudge(tenantId: string, data: { name: string; email: string; expertise?: string; bio?: string }) {
    try {
      return await JudgeRepository.create(tenantId, data);
    } catch (err: any) {
      if (err.code === "P2002") {
        throw { status: 409, code: "CONFLICT", message: "This user is already registered as a judge in this organization." };
      }
      throw err;
    }
  }

  static async updateJudge(tenantId: string, id: string, data: { expertise?: string; bio?: string }) {
    const judge = await JudgeRepository.update(tenantId, id, data);
    if (!judge) throw { status: 404, code: "NOT_FOUND", message: "Judge not found." };
    return judge;
  }

  static async deleteJudge(tenantId: string, id: string) {
    const judge = await JudgeRepository.delete(tenantId, id);
    if (!judge) throw { status: 404, code: "NOT_FOUND", message: "Judge not found." };
    return true;
  }

  static async assignCompetition(tenantId: string, judgeId: string, competitionId: string) {
    try {
      return await JudgeRepository.assignCompetition(tenantId, judgeId, competitionId);
    } catch (err: any) {
      if (err.code === "P2002") {
        throw { status: 409, code: "CONFLICT", message: "Judge is already assigned to this competition." };
      }
      throw err;
    }
  }

  static async removeCompetition(tenantId: string, judgeId: string, competitionId: string) {
    return JudgeRepository.removeCompetition(tenantId, judgeId, competitionId);
  }
}
