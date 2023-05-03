import { BskyAgent } from "@atproto/api";

export function listBskyUsers(
  handle: string,
  listTwitterUsers: any[],
  bsky_handle: string = "",
  bsky_pw: string = ""
) {
  const url_identifiers = [
    "bsky",
    "🦋",
    "bluesky",
    "BSKY",
    "BlueSky",
    "BLUESKY",
  ];
  const handle_identifiers = ["@", "🦋"];
  const bskyCandidates = listTwitterUsers
    .map((i) => {
      const rest_id = i?.["rest_id"];
      const legacy = i?.["legacy"];
      const name: string = legacy?.["name"];
      const screen_name = legacy?.["screen_name"];
      const description: string = legacy?.["description"];
      const entities = legacy?.["entities"];
      const description_urls: { expanded_url: string; url: string }[] =
        entities?.["description"]?.["urls"];
      const url_urls = entities?.["url"]?.["urls"];
      const bsky_url_candidates = [];
      if (name) {
        const regex1 = new RegExp(
          `@[ ]?[a-zA-Z0-9\-]+\.bsky\.[a-zA-Z0-9\-]+`,
          "g"
        );
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
          const regex = new RegExp(
            `${word}.{0,6}https?:\\/\\/t.co[^\\s]+`,
            "g"
          );
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
