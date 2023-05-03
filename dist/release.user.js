// ==UserScript==
// @name        get-bird-follows
// @description Crawl follows from your Birdapp profile.
// @namespace   github.com/heartade
// @require     https://unpkg.com/react@18/umd/react.development.js
// @require     https://unpkg.com/react-dom@18/umd/react-dom.development.js
// @match       https://twitter.com/*
// @version     1.0.0
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
    function start() {
        location.href = "https://twitter.com/home?running=true";
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
                        getFollowing(statusAndData.handle, statusAndData.followingCount);
                        didStartGetFollowing = true;
                    }
                    break;
            }
        };
        // repeat callback every 1s
        setInterval(callback, 1000);
    }
    function getFollowing(handle, count) {
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
                        updateStatus(`Getting your follows... ${all_following_entries.length}/${count}`);
                        if (entries.length < 100 || all_following_entries.length >= count) {
                            updateStatus(`Done! Some users may not show up.`);
                            clearInterval(interval);
                            const all_users = all_following_entries
                                .map((e) => {
                                return e?.["content"]?.["itemContent"]?.["user_results"]?.["result"];
                            })
                                .filter((e) => e);
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
        return (React__namespace.createElement("button", { style: ButtonStyle, disabled: !enabled, onClick: () => {
                if (enabled) {
                    start();
                }
            } }, "Start"));
    }
    function Overlay() {
        const status = getStatus().status;
        return (React__namespace.createElement("div", { style: {
                zIndex: 99999,
                position: "fixed",
                right: 0,
                top: 0,
                display: "flex",
                padding: "10px",
                gap: "4px",
            } }, status === "NOT_RUNNING" ? (React__namespace.createElement(Button, { enabled: true })) : (React__namespace.createElement("div", { id: "get-following-status", style: IndicatorStyle },
            React__namespace.createElement("span", { id: "get-following-status-value" })))));
    }

    const element = document.createElement("div");
    element.id = "get-follows-overlay";
    document.body.appendChild(element);
    ReactDOM__namespace.render( /*#__PURE__*/React.createElement(Overlay, null), element);
    onNavigate();

})(ReactDOM, React);
