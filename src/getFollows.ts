type Status =
  | "NOT_RUNNING"
  | "GET_HANDLE"
  | "GET_FOLLOWING_COUNT"
  | "GET_FOLLOWING";

function crawlUserHandle(): string {
  const profileButton: HTMLAnchorElement = document
    .querySelector('nav[aria-label="Primary"]')
    .querySelector('a[aria-label="Profile"]');
  const handle_href = profileButton.href.split("/");
  return handle_href.pop();
}

function crawlUserFollowsCount(handle: string): number {
  let a = document.querySelector(`a[href="/${handle}/following"]`);
  console.log(a);
  let b = a.querySelector("span");
  console.log(b);
  let user_following_count = b.innerText;
  // filter only numbers
  user_following_count = user_following_count.replace(/[^0-9]/g, "");
  return parseInt(user_following_count);
}

function getProfile() {
  updateStatus(`Getting your handle...`);
  const handle = crawlUserHandle();
  location.href = `https://twitter.com/${handle}?running=true&handle=${handle}`;
}

function getFollowingCount(handle: string) {
  updateStatus(`Getting your follows count...`);
  const user_following_count = crawlUserFollowsCount(handle);
  location.href = `https://twitter.com/${handle}/following?running=true&handle=${handle}&followingCount=${user_following_count}`;
}

export type StatusAndData =
  | { status: "NOT_RUNNING" }
  | { status: "GET_HANDLE" }
  | { status: "GET_FOLLOWING_COUNT"; handle: string }
  | { status: "GET_FOLLOWING"; handle: string; followingCount: number };

export function getStatus(): StatusAndData {
  const url = new URL(location.href);
  const running = url.searchParams.get("running");
  const handle = url.searchParams.get("handle");
  const followingCount = url.searchParams.get("followingCount");
  if (!running) {
    return { status: "NOT_RUNNING" };
  } else {
    if (!handle) {
      return { status: "GET_HANDLE" };
    } else {
      if (!followingCount) {
        return { status: "GET_FOLLOWING_COUNT", handle: handle };
      } else {
        return {
          status: "GET_FOLLOWING",
          handle: handle,
          followingCount: parseInt(followingCount),
        };
      }
    }
  }
}

export function start() {
  location.href = "https://twitter.com/home?running=true";
}
function updateStatus(str: string) {
  const statusIndicator = document.getElementById("get-following-status-value");
  if (statusIndicator) statusIndicator.innerText = str;
}
export function onNavigate() {
  const statusAndData = getStatus();
  let didStartGetFollowing = false;
  if (statusAndData.status === "NOT_RUNNING") return;
  const callback = () => {
    switch (statusAndData.status) {
      case "GET_HANDLE":
        getProfile();
        break;
      case "GET_FOLLOWING_COUNT":
        getFollowingCount(statusAndData.handle);
        break;
      case "GET_FOLLOWING":
        if (!didStartGetFollowing) {
          getFollowing(statusAndData.handle, statusAndData.followingCount);
          didStartGetFollowing = true;
        }
        break;
    }
  };
  // repeat callback every 1s
  const interval = setInterval(callback, 1000);
}

export function getFollowing(handle: string, count: number) {
  updateStatus(`Getting your follows...`);
  // Scroll to bottom until first XHR request is caught
  const interval = setInterval(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, 1000);
  const identifier = (Math.random() * 1000).toString(16);
  var open = XMLHttpRequest.prototype.open;
  const all_following_entries: any[] = [];
  XMLHttpRequest.prototype.open = function (method: string, url: string | URL) {
    const href = url.toString();
    if (
      href.indexOf("https://twitter.com/i/api/graphql") === 0 &&
      href.includes("Following")
    ) {
      const xhr = this as XMLHttpRequest;
      const send = xhr.send;
      xhr.send = function () {
        this.addEventListener("load", function () {
          const response = JSON.parse(xhr.responseText);
          const instructions: any[] =
            response?.["data"]?.["user"]?.["result"]?.["timeline"]?.[
              "timeline"
            ]?.["instructions"];
          let entries = instructions
            ?.map((i) => i?.["entries"])
            .filter((i) => i)
            .flat()
            .filter((i) => {
              return (
                i?.["content"]?.["itemContent"]?.["itemType"] === "TimelineUser"
              );
            });
          all_following_entries.push(...entries);
          updateStatus(
            `Getting your follows... ${all_following_entries.length}/${count}`
          );
          if (entries.length < 100 || all_following_entries.length >= count) {
            updateStatus(
              `Done! Some users may not show up.`
            );
            clearInterval(interval);
            const all_users = all_following_entries
              .map((e: any[]) => {
                return e?.["content"]?.["itemContent"]?.["user_results"]?.[
                  "result"
                ];
              })
              .filter((e: any[]) => e);
            const json = JSON.stringify(all_users);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${handle}.json`;
            a.click();
          }
        });
        send.apply(xhr, arguments);
      };
      open.apply(this as XMLHttpRequest, [
        method,
        `${href.replace(
          "count%22%3A20%2C%22",
          "count%22%3A100%2C%22"
        )}&${identifier}`,
      ]);
    } else {
      open.apply(this as XMLHttpRequest, arguments);
    }
  };
}
