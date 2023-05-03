// ==UserScript==
// @name        get-bird-follows
// @description Crawl follows from your Birdapp profile.
// @namespace   github.com/heartade
// @require     https://unpkg.com/react@18/umd/react.development.js
// @require     https://unpkg.com/react-dom@18/umd/react-dom.development.js
// @match       https://twitter.com/*
// @version     1.0.1
// @homepage    https://github.com/heartade/get-bird-follows
// @author      Daniel S. Park
// @license     MIT
// @grant       GM.getValue
// ==/UserScript==

/*
MIT License

Copyright (c) 2020 cvzi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/* globals React, ReactDOM */
(function (ReactDOM, React$1) {
    'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n.default = e;
        return Object.freeze(n);
    }

    var ReactDOM__namespace = /*#__PURE__*/_interopNamespaceDefault(ReactDOM);
    var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React$1);

    function listBskyUsers(handle, listTwitterUsers, bsky_handle = "", bsky_pw = "") {
        const url_identifiers = [
            "bsky",
            "🦋",
            "bluesky",
            "BSKY",
            "BlueSky",
            "BLUESKY",
        ];
        const bskyCandidates = listTwitterUsers
            .map((i) => {
            const rest_id = i?.["rest_id"];
            const legacy = i?.["legacy"];
            const name = legacy?.["name"];
            const screen_name = legacy?.["screen_name"];
            const description = legacy?.["description"];
            const entities = legacy?.["entities"];
            const description_urls = entities?.["description"]?.["urls"];
            const url_urls = entities?.["url"]?.["urls"];
            const bsky_url_candidates = [];
            if (name) {
                const regex1 = new RegExp(`@[ ]?[a-zA-Z0-9\-]+\.bsky\.[a-zA-Z0-9\-]+`, "g");
                const regex2 = new RegExp(`🦋[ ]?[a-zA-Z0-9\.\-^\\s]+`, "g");
                const matches1 = name.matchAll(regex1);
                const matches2 = name.matchAll(regex2);
                for (const match of matches1) {
                    const url = match[0].split("@")[1].trim();
                    bsky_url_candidates.push(url);
                }
                for (const match of matches2) {
                    const url = match[0].split("🦋")[1].trim();
                    bsky_url_candidates.push(url);
                }
            }
            if (description) {
                url_identifiers.forEach((word) => {
                    const regex = new RegExp(`${word}.{0,6}https?:\\/\\/t.co[^\\s]+`, "g");
                    const matches = description.matchAll(regex);
                    for (const match of matches) {
                        const url = match[0].split("https://t.co/")[1];
                        const full_url = `https://t.co/${url}`;
                        const expanded_url = description_urls.find((i) => {
                            return i.url === full_url;
                        })?.expanded_url;
                        if (expanded_url) {
                            bsky_url_candidates.push(expanded_url);
                        }
                    }
                });
            }
            if (url_urls) {
                url_urls.forEach((i) => {
                    const expanded_url = i?.["expanded_url"];
                    if (expanded_url && expanded_url.includes("bsky")) {
                        bsky_url_candidates.push(expanded_url);
                    }
                });
            }
            const bsky_url_normalized = bsky_url_candidates
                .map((i) => (i.includes("/profile/") ? i.split("/profile/")[1] : i))
                .map((i) => i.replace("https://", "").replace("http://", ""))
                .map((i) => (i.split(".").length === 1 ? `${i}.bsky.social` : i));
            const bsky_url = new Set(bsky_url_normalized);
            return { rest_id, name, screen_name, bsky_url };
        })
            .filter((v) => {
            return v.bsky_url.size > 0;
        });
        console.log(bskyCandidates);
        const json = JSON.stringify(bskyCandidates);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${handle}_bsky_candidates.json`;
        a.click();
        // (async () => {
        //   const agent = new BskyAgent({
        //     service: "https://bsky.social",
        //   });
        //   await agent.login({ identifier: bsky_handle, password: bsky_pw });
        //   bskyCandidates.forEach(async (v) => {
        //     console.log(`following ${v.name} @${v.screen_name}...`);
        //     console.log(`handle is @${v.bsky_url}...`);
        //     v.bsky_url.forEach(async (bsky_url) => {
        //       try {
        //         const did = await agent.resolveHandle({ handle: bsky_url });
        //         console.log(`did is ${did}...`);
        //         const follow = await agent.follow(did.data.did);
        //         console.log(`followed...`);
        //       } catch (e) {
        //         console.log(e);
        //       }
        //     });
        //   });
        // })();
    }

    function crawlUserHandle() {
        const profileButton = document
            .querySelector('nav[aria-label="Primary"]')
            .querySelector('a[aria-label="Profile"]');
        const handle_href = profileButton.href.split("/");
        return handle_href.pop();
    }
    function crawlUserFollowsCount(handle) {
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
    function getFollowingCount(handle) {
        updateStatus(`Getting your follows count...`);
        const user_following_count = crawlUserFollowsCount(handle);
        location.href = `https://twitter.com/${handle}/following?running=true&handle=${handle}&followingCount=${user_following_count}`;
    }
    function getStatus() {
        const url = new URL(location.href);
        const running = url.searchParams.get("running");
        const handle = url.searchParams.get("handle");
        const followingCount = url.searchParams.get("followingCount");
        if (!running) {
            return { status: "NOT_RUNNING" };
        }
        else {
            if (!handle) {
                return { status: "GET_HANDLE" };
            }
            else {
                if (!followingCount) {
                    return { status: "GET_FOLLOWING_COUNT", handle: handle };
                }
                else {
                    return {
                        status: "GET_FOLLOWING",
                        handle: handle,
                        followingCount: parseInt(followingCount),
                    };
                }
            }
        }
    }
    function updateStatus(str) {
        const statusIndicator = document.getElementById("get-following-status-value");
        if (statusIndicator)
            statusIndicator.innerText = str;
    }
    function onNavigate() {
        const statusAndData = getStatus();
        let didStartGetFollowing = false;
        if (statusAndData.status === "NOT_RUNNING")
            return;
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
                        getFollowing(statusAndData.handle);
                        didStartGetFollowing = true;
                    }
                    break;
            }
        };
        // repeat callback every 1s
        setInterval(callback, 1000);
    }
    function getFollowing(handle, bsky_handle = "", bsky_pw = "") {
        updateStatus(`Getting your follows...`);
        // Scroll to bottom until first XHR request is caught
        const interval = setInterval(() => {
            window.scrollTo(0, document.body.scrollHeight);
        }, 1000);
        const identifier = (Math.random() * 1000).toString(16);
        var open = XMLHttpRequest.prototype.open;
        const all_following_entries = [];
        XMLHttpRequest.prototype.open = function (method, url) {
            const href = url.toString();
            if (href.indexOf("https://twitter.com/i/api/graphql") === 0 &&
                href.includes("Following")) {
                const xhr = this;
                const send = xhr.send;
                xhr.send = function () {
                    this.addEventListener("load", function () {
                        const response = JSON.parse(xhr.responseText);
                        const instructions = response?.["data"]?.["user"]?.["result"]?.["timeline"]?.["timeline"]?.["instructions"];
                        let entries = instructions
                            ?.map((i) => i?.["entries"])
                            .filter((i) => i)
                            .flat()
                            .filter((i) => {
                            return (i?.["content"]?.["itemContent"]?.["itemType"] === "TimelineUser");
                        });
                        all_following_entries.push(...entries);
                        updateStatus(`Getting your follows... ${all_following_entries.length}`);
                        if (entries.length < 100) {
                            updateStatus(`Done! Some users may not show up.`);
                            clearInterval(interval);
                            const all_users = all_following_entries
                                .map((e) => {
                                return e?.["content"]?.["itemContent"]?.["user_results"]?.["result"];
                            })
                                .filter((e) => e);
                            listBskyUsers(handle, all_users, bsky_handle, bsky_pw);
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
                open.apply(this, [
                    method,
                    `${href.replace("count%22%3A20%2C%22", "count%22%3A100%2C%22")}&${identifier}`,
                ]);
            }
            else {
                open.apply(this, arguments);
            }
        };
    }

    const ButtonStyle = {
        backgroundColor: "blue",
        color: "white",
        border: "none",
        borderRadius: "5px",
        fontSize: "12px",
        padding: "6px",
        boxShadow: "0 0 5px 0 rgba(0, 0, 0, 0.5)",
    };
    const IndicatorStyle = {
        backgroundColor: "white",
        border: "none",
        borderRadius: "5px",
        fontSize: "12px",
        padding: "6px",
        boxShadow: "0 0 5px 0 rgba(0, 0, 0, 0.5)",
    };
    function Button({ enabled }) {
        return (React__namespace.createElement("button", { style: ButtonStyle, disabled: !enabled, id: "get-following-start-btn", onClick: () => {
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
            } }, "Start"));
    }
    function Overlay() {
        const status = getStatus().status;
        return (React__namespace.createElement("div", { id: "get-following-status-start", style: {
                zIndex: 99999,
                position: "fixed",
                right: 0,
                top: 0,
                display: "flex",
                padding: "10px",
                gap: "4px",
            } }, status === "NOT_RUNNING" && location.href.includes("/following") ? (React__namespace.createElement(React__namespace.Fragment, null,
            React__namespace.createElement(Button, { enabled: true }),
            React__namespace.createElement("div", { id: "get-following-status", style: IndicatorStyle },
                React__namespace.createElement("span", { id: "get-following-status-value" })))) : (React__namespace.createElement(React__namespace.Fragment, null))));
    }

    const element = document.createElement("div");
    element.id = "get-follows-overlay";
    document.body.appendChild(element);
    ReactDOM__namespace.render( /*#__PURE__*/React.createElement(Overlay, null), element);
    onNavigate();

})(ReactDOM, React);
//# sourceMappingURL=bundle.user.js.map
