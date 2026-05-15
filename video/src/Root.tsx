import React from "react";
import { Composition } from "remotion";
import { ChartVideo } from "./ChartVideo";

export function RemotionRoot() {
  return (
    <Composition
      id="ChartVideo"
      component={ChartVideo}
      durationInFrames={150}
      fps={30}
      width={1280}
      height={720}
    />
  );
}
