import * as React from "react";
import { getStatus, start } from "./getFollows";

const ButtonStyle: React.CSSProperties = {
  backgroundColor: "blue",
  color: "white",
  border: "none",
  borderRadius: "5px",
  fontSize: "12px",
  padding: "6px",
  boxShadow: "0 0 5px 0 rgba(0, 0, 0, 0.5)",
};

const IndicatorStyle: React.CSSProperties = {
  backgroundColor: "white",
  border: "none",
  borderRadius: "5px",
  fontSize: "12px",
  padding: "6px",
  boxShadow: "0 0 5px 0 rgba(0, 0, 0, 0.5)",
};

function Button({ enabled }: { enabled: boolean }): JSX.Element {
  return (
    <button
      style={ButtonStyle}
      disabled={!enabled}
      onClick={() => {
        if (enabled) {
          start();
        }
      }}
    >
      Start
    </button>
  );
}

export function Overlay(): JSX.Element {
  const status = getStatus().status;
  return (
    <div
      style={{
        zIndex: 99999,
        position: "fixed",
        right: 0,
        top: 0,
        display: "flex",
        padding: "10px",
        gap: "4px",
      }}
    >
      {status === "NOT_RUNNING" ? (
        <Button enabled={true} />
      ) : (
        <div id="get-following-status" style={IndicatorStyle}>
          <span id="get-following-status-value"></span>
        </div>
      )}
    </div>
  );
}
