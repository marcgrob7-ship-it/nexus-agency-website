import React from "react";
import { Composition } from "remotion";
import { ChartCounter } from "./ChartCounter";

export const Root: React.FC = () => {
  return (
    <Composition
      id="ChartCounter"
      component={ChartCounter}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
