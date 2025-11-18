import {autoSync, userChanged } from "./user.js"
import { kudosRecommendation, giveKudos, viewKudosModal, checkGiveawayKudos } from "./kudos.js"
import { leaderboard } from "./leaderboard.js";
import { shop } from "./shop.js";

export default function registerListeners(app) {
  //user
  autoSync(app);
  userChanged(app);

  //kudos
  giveKudos(app);
  kudosRecommendation(app);
  viewKudosModal(app);
  checkGiveawayKudos(app);

  //Leaderboard
  leaderboard(app);

  //Shop
  shop(app);
}
