// import giveKudos from "./giveKudos.js";
import {getUser, registerAccount, sync, autoSync } from "./user.js"
import { kudosRecommendation, giveKudos, viewKudosModal, checkGiveawayKudos } from "./kudos.js"
import { leaderboard } from "./leaderboard.js";

export default function registerListeners(app) {
  //user
  getUser(app);
  registerAccount(app);
  sync(app);
  autoSync(app);

  //kudos
  giveKudos(app);
  kudosRecommendation(app);
  viewKudosModal(app);
  checkGiveawayKudos(app);

  //Leaderboard
  leaderboard(app);
}
