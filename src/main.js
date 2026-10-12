import "./styles.css";
import "./production.css";
import "./loading.css";
import { initLoadingScreen } from "./lib/loading.js";
import { initPage } from "./lib/page.js";
import { initPolish } from "./lib/polish.js";

const loading = initLoadingScreen();
initPage({ onLoadingStage: loading.stage });
initPolish();
