import * as React from "react";
import { getFollowing, getStatus, start } from "./getFollows";

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
      id="get-following-start-btn"
      onClick={() => {
        if (enabled) {
          const handle = location.href
            .split("twitter.com/")[1]
            .split("/following")[0];
          document.getElementById("get-following-start-btn").style.display =
            "none";
          // document.getElementById("get-bsky-handle").style.display = "none";
          // document.getElementById("get-bsky-pw").style.display = "none";
          // const bsky_handle = (document.getElementById("get-bsky-handle") as HTMLInputElement).value
          // const pw = (document.getElementById("get-bsky-pw") as HTMLInputElement).value
          getFollowing(handle);
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
      id="get-following-status-start"
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
      {status === "NOT_RUNNING" && location.href.includes("/following") ? (
        <>
          {/* <input type="text" id="get-bsky-handle" placeholder="your.bsky.handle" />
          <input type="password" id="get-bsky-pw" placeholder="********" /> */}
          <Button enabled={true} />
          <div id="get-following-status" style={IndicatorStyle}>
            <span id="get-following-status-value"></span>
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}
