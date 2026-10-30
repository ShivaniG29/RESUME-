import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ScoreCard from "./ScoreCard";

describe("ScoreCard", () => {
  it("shows the score, explanation, and accessible progress", () => {
    render(<ScoreCard score={72} breakdown={{ skills_relevance: 80, resume_structure: 60, experience_presentation: 70, education_information: 90, ats_readability: 55, explanation: "Weighted guidance only." }} />);
    expect(screen.getByLabelText("Score 72 out of 100")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "72");
    expect(screen.getByText("Weighted guidance only.")).toBeInTheDocument();
  });
});
