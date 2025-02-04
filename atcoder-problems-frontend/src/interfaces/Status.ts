import { caseInsensitiveUserId, isAccepted } from "../utils";
import Submission from "./Submission";
export type ContestId = string;
export type ProblemId = string;
export type UserId = string;

export enum StatusLabel {
  Success,
  Failed,
  Warning,
  None,
}

export const successStatus = (
  firstAcceptedEpochSecond: number,
  lastAcceptedEpochSecond: number,
  solvedLanguages: Set<string>,
  rejectedEpochSeconds: number[]
): {
  label: StatusLabel.Success;
  epoch: number;
  lastAcceptedEpochSecond: number;
  solvedLanguages: Set<string>;
  rejectedEpochSeconds: number[];
} => ({
  label: StatusLabel.Success as typeof StatusLabel.Success,
  epoch: firstAcceptedEpochSecond,
  lastAcceptedEpochSecond,
  solvedLanguages,
  rejectedEpochSeconds,
});
export const failedStatus = (
  solvedRivals: Set<string>,
  rejectedEpochSeconds: number[]
): {
  label: StatusLabel.Failed;
  solvedRivals: Set<string>;
  rejectedEpochSeconds: number[];
} => ({
  label: StatusLabel.Failed as typeof StatusLabel.Failed,
  solvedRivals,
  rejectedEpochSeconds,
});
export const warningStatus = (
  result: string,
  epoch: number,
  rejectedEpochSeconds: number[],
  submittedLanguages: Set<string>
): {
  label: StatusLabel.Warning;
  result: string;
  epoch: number;
  submittedLanguages: Set<string>;
  rejectedEpochSeconds: number[];
} => ({
  label: StatusLabel.Warning,
  result,
  epoch,
  submittedLanguages,
  rejectedEpochSeconds,
});
export const noneStatus = (): {
  label: StatusLabel.None;
} => ({
  label: StatusLabel.None,
});
export type ProblemStatus =
  | ReturnType<typeof successStatus>
  | ReturnType<typeof failedStatus>
  | ReturnType<typeof warningStatus>
  | ReturnType<typeof noneStatus>;

export const constructStatusLabelMap = (
  submissions: Submission[],
  userId: string
): Map<string, ProblemStatus> => {
  const submissionMap = new Map<ProblemId, Submission[]>();
  submissions.forEach((submission) => {
    const array = submissionMap.get(submission.problem_id) ?? [];
    array.push(submission);
    submissionMap.set(submission.problem_id, array);
  });

  const statusLabelMap = new Map<ProblemId, ProblemStatus>();
  Array.from(submissionMap.keys()).forEach((problemId) => {
    const list = submissionMap.get(problemId) ?? [];
    const userAccepted = list
      .filter((s) => caseInsensitiveUserId(s.user_id) === userId)
      .filter((s) => isAccepted(s.result));
    const userRejected = list
      .filter((s) => caseInsensitiveUserId(s.user_id) === userId)
      .filter((s) => !isAccepted(s.result));
    const rivalAccepted = list
      .filter((s) => caseInsensitiveUserId(s.user_id) !== userId)
      .filter((s) => isAccepted(s.result));

    const rejectedEpochSeconds = userRejected.map(
      (submission) => submission.epoch_second
    );

    if (userAccepted.length > 0) {
      const languageSet = new Set(userAccepted.map((s) => s.language));
      const firstSolvedEpochSecond = userAccepted
        .map((s) => s.epoch_second)
        .reduceRight((a, b) => Math.min(a, b));
      const lastSolvedEpochSecond = userAccepted
        .map((s) => s.epoch_second)
        .reduceRight((a, b) => Math.max(a, b));

      statusLabelMap.set(
        problemId,
        successStatus(
          firstSolvedEpochSecond,
          lastSolvedEpochSecond,
          languageSet,
          rejectedEpochSeconds.filter((epoch) => epoch < firstSolvedEpochSecond)
        )
      );
    } else if (rivalAccepted.length > 0) {
      const rivalSet = new Set(rivalAccepted.map((s) => s.user_id));
      statusLabelMap.set(
        problemId,
        failedStatus(rivalSet, rejectedEpochSeconds)
      );
    } else if (userRejected.length > 0) {
      userRejected.sort((a, b) => b.id - a.id);
      const last = userRejected[userRejected.length - 1];
      const languageSet = new Set(userRejected.map((s) => s.language));
      statusLabelMap.set(
        problemId,
        warningStatus(
          last.result,
          last.epoch_second,
          rejectedEpochSeconds,
          languageSet
        )
      );
    } else {
      statusLabelMap.set(problemId, noneStatus());
    }
  });

  return statusLabelMap;
};
