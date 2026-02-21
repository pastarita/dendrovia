/**
 * OnboardingModal — First-time user onboarding overlay.
 */

import React from "react";

export interface OnboardingModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onDismiss,
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "rgba(15, 12, 8, 0.95)",
          border: "1px solid rgba(199,123,63,0.4)",
          borderRadius: 16,
          padding: 32,
          maxWidth: 480,
        }}
      >
        <h2>Welcome to Ornithicus</h2>
        <p style={{ opacity: 0.7, marginTop: 8 }}>
          Navigate your codebase in 3D. Use WASD to move, mouse to look around.
        </p>
        <button
          onClick={onDismiss}
          style={{
            marginTop: 16,
            padding: "8px 24px",
            background: "#c77b3f",
            border: "none",
            borderRadius: 8,
            color: "#0a0806",
            cursor: "pointer",
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};
