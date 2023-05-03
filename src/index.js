import * as ReactDOM from "react-dom";

import { Overlay} from "./Overlay.js";
import { onNavigate } from "./getFollows.ts";

const element = document.createElement("div");
element.id="get-follows-overlay";
document.body.appendChild(element);
ReactDOM.render(<Overlay />, element);

onNavigate();